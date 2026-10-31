# Atendente de IA no WhatsApp para clínicas

Sistema multi-clínica: o mesmo servidor atende várias clínicas, cada uma com seu número
de WhatsApp (WhatsApp Cloud API oficial da Meta), sua configuração e sua agenda.

> **Status: Fases 1, 2 e 3 concluídas** (webhook, fila, atendente com IA e agendamento com
> Google Calendar). Próximas fases: transferência para humano, lembretes e o painel da clínica.

## Como funciona

```
Meta ──POST /webhook──▶ valida X-Hub-Signature-256 ──▶ grava mensagem (UNIQUE wa_message_id)
                                                       + cria/adia job da conversa
                        ◀────────── 200 (≈10 ms) ──────┘
worker (mesmo processo) ──▶ pega job (FOR UPDATE SKIP LOCKED, um por conversa por vez)
                       ──▶ marca como lida ──▶ envia respostas ──▶ marca mensagens como tratadas
```

- **Assinatura**: toda requisição POST precisa de `X-Hub-Signature-256` válida (HMAC-SHA256 do
  corpo bruto com o App Secret). Sem ela: `401`.
- **Resposta rápida**: o webhook só grava no banco e responde. Quem fala com a Meta é o worker.
  Se o banco falhar, o webhook responde `500` e a Meta reenvia mais tarde.
- **Idempotência**: `messages.wa_message_id` é único. A Meta reenvia eventos; duplicados são ignorados.
- **Fila durável no Postgres**: sobrevive a deploys e quedas. Jobs travados por um worker que caiu
  voltam sozinhos para a fila. Falhas temporárias são repetidas com backoff exponencial (5 s, 10 s, 20 s...).
- **Mensagens seguidas** ("oi" / "queria marcar" / "pra amanhã") viram uma resposta só (debounce de
  4 s, no máximo 15 s).
- **Sem envio duplicado**: cada resposta tem uma chave (`dedupe_key`); numa nova tentativa, o que já
  saiu não é reenviado.
- **Áudio, imagem, figurinha, vídeo, documento**: resposta educada dizendo que, por enquanto, só lemos texto.
- **LGPD**: a primeira resposta avisa que o atendimento é automatizado e que o paciente pode pedir a
  exclusão dos dados. Os logs não têm telefone nem conteúdo de mensagem, só IDs internos.
- **Multi-clínica**: o `phone_number_id` do webhook identifica a clínica; cada clínica envia com o
  próprio token (guardado criptografado com AES-256-GCM).

### Atendente com IA (Fase 2)

O worker monta a resposta com o **Claude** (`claude-fable-5-1` por padrão, configurável em `AI_MODEL`):

- **Prompt de sistema por clínica**, montado do arquivo de configuração: nome, endereço, serviços,
  preços, duração, horários, convênios, formas de pagamento e política de cancelamento. É
  determinístico, então a API reaproveita o cache de prompt entre mensagens.
- **Data e hora** (no fuso da clínica) vão numa mensagem de sistema no fim da conversa, para a IA
  saber se a clínica está aberta sem quebrar o cache.
- **Histórico** das últimas 40 mensagens (até 20 mil caracteres), cortando as mais antigas.
- **Regras obrigatórias** no prompt: sem diagnóstico, sem orientação médica ou remédio, sem inventar
  preço/horário/serviço, emergência → SAMU 192 (risco de suicídio → CVV 188), "vou confirmar com a
  equipe" quando não souber, pedido de atendente → avisa o responsável.
- **Ferramentas** (tool use): `notify_team` (alerta para a recepção: emergência, pedido de atendente,
  dúvida sem resposta, agendamento, reclamação) e `request_data_deletion` (LGPD).
- **Rede de segurança de emergência** sem depender da IA: se a mensagem tem sinais claros de
  emergência e a resposta não cita o 192 (ou a IA está fora do ar), o sistema envia a orientação do
  SAMU e alerta a equipe.
- **IA fora do ar**: o paciente recebe uma mensagem padrão e a equipe é avisada.
- **Recusa do modelo**: com `AI_SERVER_FALLBACKS=true`, a própria API refaz o pedido em outro modelo;
  se ainda assim recusar, o paciente ouve que a equipe vai confirmar.
- **Limites de uso**: por conversa (30 chamadas/hora) e por clínica (3.000/dia).
- **Uso de tokens** gravado por chamada em `ai_usage`; a view `clinic_monthly_ai_usage` soma por
  clínica e mês, para calcular custo e mensalidade.
- **Alertas para a equipe** vão por WhatsApp para `team.alert_whatsapp`, num job próprio com
  retentativas. Fora da janela de 24h da recepção, usa o template `team.alert_template` (se houver).

### Agendamento (Fase 3)

Com profissionais cadastrados, o atendente consulta, marca, remarca e cancela horários:

- **Horários livres** respeitam o horário da clínica e de cada profissional, a duração de cada
  serviço, o intervalo de preparo depois do atendimento, feriados (nacionais automáticos, inclusive
  a Sexta-feira Santa, mais os da clínica), bloqueios, antecedência mínima e limite de dias à frente.
- **Google Calendar por profissional** (conta de serviço): compromissos na agenda do profissional
  bloqueiam horários, e cada agendamento vira um evento na agenda dele (apagado ao cancelar ou
  remarcar). Se o Google estiver fora do ar, o atendente não oferece horários incertos: avisa
  que a equipe confirma.
- **Confirmação em duas etapas**: `propose_booking` reserva o horário por 20 minutos e devolve o
  resumo; `confirm_pending_action` só funciona a partir de uma mensagem do paciente posterior à
  proposta. A IA não consegue marcar sem o "sim" do paciente, nem por engano.
- **Sem conflito de horário**: além da checagem na consulta, uma *exclusion constraint* do Postgres
  recusa dois horários sobrepostos do mesmo profissional, mesmo com dois pacientes marcando no mesmo
  instante. Na confirmação, a agenda do Google é consultada de novo.
- **Remarcação atômica**: cancela o antigo e cria o novo na mesma transação.
- Cada paciente só vê e altera os próprios agendamentos (pelo número de WhatsApp).

## Estrutura

```
src/
  server.ts              ponto de entrada: HTTP + worker + desligamento gracioso
  app.ts                 Fastify: /health e rotas do webhook
  config/env.ts          variáveis de ambiente validadas com Zod
  http/webhook.ts        GET de verificação e POST de recebimento
  ai/                    prompt, histórico, ferramentas, rede de segurança, responder do Claude
  scheduling/            horários livres, feriados, agendamentos, Google Calendar
  team/                  alertas para a equipe da clínica
  whatsapp/              assinatura, schema do payload, cliente da Graph API (retry/backoff)
  conversations/         ingest (gravação idempotente), processor (respostas), textos
  queue/                 fila no Postgres (jobs.ts) e worker
  clinics/               lookup por número e cadastro a partir de YAML
  db/                    conexão Postgres e runner de migrations
  cli/                   comandos: migrate e clinic:upsert
supabase/migrations/     SQL (mesmo formato do Supabase CLI)
clinics/                 arquivos de configuração das clínicas (sem segredos)
tests/                   unitários e integração (Postgres real via PGlite)
evals/                   suíte de conversas difíceis contra a API real do Claude
```

## Rodando localmente

Requisitos: Node.js 22+ e um banco Postgres (o do Supabase, ou um local).

```bash
npm install
cp .env.example .env      # preencha os valores
npm run db:migrate        # cria as tabelas
npm run clinic:upsert -- clinics/exemplo-fisio.yaml
npm run dev
```

Para a Meta alcançar o webhook na sua máquina, exponha a porta com um túnel HTTPS
(ex.: `cloudflared tunnel --url http://localhost:3000` ou `ngrok http 3000`) e use a URL
gerada + `/webhook` no painel da Meta.

## Testes

```bash
npm test          # unitários + integração; não precisa de banco, internet nem chave de API
npm run typecheck
```

Os testes de integração rodam as migrations reais num Postgres em memória (PGlite), com uma
Graph API e um Claude simulados. Cobrem: assinatura, verificação do webhook, idempotência,
debounce, mídias, retry sem duplicar envio, janela de 24h, job travado, concorrência, isolamento
entre clínicas, montagem da requisição ao Claude, loop de ferramentas, alertas, emergência, falha e
recusa da IA, limites de uso, registro de tokens, regras de agenda (expediente, almoço, duração,
intervalo, feriados, bloqueios, antecedência), conflito de horário (inclusive simultâneo),
confirmação em duas etapas, expiração de reserva, remarcação, cancelamento e Google Calendar.

### Suíte de conversas difíceis (Claude de verdade)

```bash
npm run eval:conversations                                   # todos os casos
npm run eval:conversations -- --only emergencia-medica --repeat 3
```

Precisa de `ANTHROPIC_API_KEY` (custa alguns centavos por rodada). Os casos estão em
`evals/conversations.yaml`: pergunta de preço, preço não divulgado, serviço inexistente, pedido de
diagnóstico e remédio, emergência, risco de suicídio, paciente irritado, pedido de atendente,
remarcação, agendamento com confirmação, dia fechado, fora do horário, erros de digitação, mensagens confusas, tentativa de manipulação,
convênio não aceito, exclusão de dados e emergência veterinária. Cada caso tem verificações
objetivas (ex.: "contém 192", "criou alerta de emergência") e um critério avaliado por um segundo
modelo (`EVAL_JUDGE_MODEL`, padrão `claude-opus-5-5`). Rode sempre que mudar o prompt ou o modelo.

## Configurando a Meta (WhatsApp Cloud API)

1. Crie uma conta em <https://developers.facebook.com> e um app do tipo **Business**.
2. Adicione o produto **WhatsApp**. A Meta cria um **número de teste** e uma conta WhatsApp
   Business de teste. Com o número de teste dá para desenvolver **sem verificação do Business**,
   enviando para até 5 números cadastrados em "Para".
3. Em **WhatsApp > Configuração da API**, anote o **Phone number ID** e o **WhatsApp Business
   Account ID**; coloque no `clinics/<clinica>.yaml`.
4. Token: o temporário do painel expira em 24h. Para algo durável, crie um **System User** em
   Configurações do negócio > Usuários do sistema, dê acesso ao app e à conta do WhatsApp e gere um
   token com as permissões `whatsapp_business_messaging` e `whatsapp_business_management`.
   Coloque o token na variável indicada em `access_token_env` e rode `npm run clinic:upsert`.
5. **App Secret**: Configurações do app > Básico > Chave secreta → `META_APP_SECRET`.
6. **Webhook**: WhatsApp > Configuração > Webhook > Editar.
   - URL de callback: `https://SEU_DOMINIO/webhook`
   - Token de verificação: o mesmo valor de `META_VERIFY_TOKEN`
   - Depois de verificar, **assine o campo `messages`**.
7. Mande uma mensagem do seu celular (cadastrado como destinatário de teste) para o número de teste.

Para atender pacientes reais (número próprio da clínica, sem limite de destinatários) é preciso
**verificar o Business** na Meta e adicionar o número da clínica. Os detalhes entram no checklist
final do projeto.

## Configurando o Google Calendar (conta de serviço)

1. Em <https://console.cloud.google.com>, crie um projeto (ex.: "atendente-whatsapp").
2. Em **APIs e serviços > Biblioteca**, ative a **Google Calendar API**.
3. Em **IAM e administrador > Contas de serviço**, crie uma conta (ex.: `agenda`). Não precisa
   dar papéis no projeto.
4. Na conta criada, aba **Chaves > Adicionar chave > JSON**. Guarde o arquivo baixado com cuidado:
   ele dá acesso às agendas compartilhadas.
5. Coloque o conteúdo em `GOOGLE_SERVICE_ACCOUNT_JSON` (pode ser em base64: `base64 -w0 chave.json`).
6. Para cada profissional: no Google Calendar dele, **Configurações da agenda > Compartilhar com
   pessoas específicas**, adicione o e-mail da conta de serviço (`agenda@<projeto>.iam.gserviceaccount.com`)
   com a permissão **Fazer alterações nos eventos**. O ID da agenda (geralmente o e-mail do
   profissional) vai em `google_calendar_id` no YAML da clínica.

Uma única conta de serviço atende todas as clínicas: cada profissional só compartilha a própria agenda.

## Cadastrando uma clínica

Copie `clinics/exemplo-fisio.yaml`, ajuste e rode:

```bash
npm run clinic:upsert -- clinics/minha-clinica.yaml
```

O comando é idempotente (rodar de novo atualiza). O token da Meta nunca fica no arquivo: ele é
lido da variável de ambiente indicada em `whatsapp.access_token_env` e salvo criptografado.

O arquivo de exemplo documenta todos os campos: serviços (`price` em reais; sem `price`, o
atendente diz que a equipe informa), horários por dia (`mon` ... `sun`, vários intervalos),
convênios, políticas, informações extras, o WhatsApp da recepção para alertas e a agenda:
profissionais (serviços que atendem, horário próprio, agenda do Google), grade de horários,
antecedência, feriados e bloqueios. Campos com nome
errado são recusados, para um erro de digitação não passar despercebido.

## Custos da IA

- Claude Fable 5.1: US$ 10 por milhão de tokens de entrada e US$ 50 por milhão de saída; leitura
  de cache a US$ 0,25 por milhão. O consumo real por mensagem depende do tamanho da configuração
  da clínica, do histórico e do raciocínio do modelo: meça com a suíte de conversas (ela mostra os
  tokens no final) e acompanhe em produção pela view abaixo.
- Para reduzir custo: `AI_EFFORT=medium`, ou `AI_MODEL=claude-opus-5-5` (US$ 4 / US$ 20). Rode a
  suíte de conversas antes de trocar, para confirmar que a qualidade se mantém.
- Consulte o consumo por clínica:
  `select * from clinic_monthly_ai_usage order by month desc;`
- O Fable 5.1 exige retenção de dados de 30 dias na organização da Anthropic (não funciona com
  "zero data retention"). Vale mencionar isso no contrato com as clínicas (LGPD).

## Deploy (Railway ou Render)

- Build: `npm ci && npm run build` · Start: `npm start` · Pre-deploy: `npm run db:migrate:prod`
- Health check: `GET /health`
- Mantenha **uma instância sempre ligada** (sem "sleep"): o webhook precisa responder a qualquer hora.
- Configure as variáveis do `.env.example` no painel do serviço.
