# Atendente de IA no WhatsApp para clínicas

Sistema multi-clínica: o mesmo servidor atende várias clínicas, cada uma com seu número
de WhatsApp (WhatsApp Cloud API oficial da Meta), sua configuração e sua agenda.

> **Status: Fase 1 concluída** (webhook, fila, idempotência, envio de texto).
> As próximas fases adicionam o atendente com IA (Claude), agendamento com Google Calendar,
> transferência para humano, lembretes e o painel da clínica.

## Como funciona (Fase 1)

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

## Estrutura

```
src/
  server.ts              ponto de entrada: HTTP + worker + desligamento gracioso
  app.ts                 Fastify: /health e rotas do webhook
  config/env.ts          variáveis de ambiente validadas com Zod
  http/webhook.ts        GET de verificação e POST de recebimento
  whatsapp/              assinatura, schema do payload, cliente da Graph API (retry/backoff)
  conversations/         ingest (gravação idempotente), processor (respostas), textos
  queue/                 fila no Postgres (jobs.ts) e worker
  clinics/               lookup por número e cadastro a partir de YAML
  db/                    conexão Postgres e runner de migrations
  cli/                   comandos: migrate e clinic:upsert
supabase/migrations/     SQL (mesmo formato do Supabase CLI)
clinics/                 arquivos de configuração das clínicas (sem segredos)
tests/                   unitários e integração (Postgres real via PGlite)
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
npm test          # unitários + integração; não precisa de banco nem de internet
npm run typecheck
```

Os testes de integração rodam as migrations reais num Postgres em memória (PGlite) e usam uma
Graph API falsa. Cobrem: assinatura, verificação do webhook, idempotência, debounce, mídias,
retry sem duplicar envio, erro permanente (janela de 24h), job travado, concorrência na mesma
conversa e isolamento entre clínicas.

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

## Cadastrando uma clínica

Copie `clinics/exemplo-fisio.yaml`, ajuste e rode:

```bash
npm run clinic:upsert -- clinics/minha-clinica.yaml
```

O comando é idempotente (rodar de novo atualiza). O token da Meta nunca fica no arquivo: ele é
lido da variável de ambiente indicada em `whatsapp.access_token_env` e salvo criptografado.

## Deploy (Railway ou Render)

- Build: `npm ci && npm run build` · Start: `npm start` · Pre-deploy: `npm run db:migrate:prod`
- Health check: `GET /health`
- Mantenha **uma instância sempre ligada** (sem "sleep"): o webhook precisa responder a qualquer hora.
- Configure as variáveis do `.env.example` no painel do serviço.
