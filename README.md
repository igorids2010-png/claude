# Radar Sem Site

Ferramenta de prospecção com duas abas:

- **Buscar leads** — você escolhe uma **cidade**, até **5 nichos** e **quantos leads** quer (10, 25, 50, 100 ou 200). O bot varre o mapa e traz só empresas que **não têm site** (ou que só têm Instagram/Facebook/WhatsApp), com telefone, endereço e link prontos para copiar.
- **Meus leads** — as empresas que você já contatou. Na busca, o botão **"Mandei mensagem"** salva a empresa aqui; depois você acompanha o status (Mensagem enviada, Respondeu, Negociando, Fechado, Sem interesse), escreve anotações e baixa tudo em CSV. Os leads ficam salvos no navegador e não entram de novo na contagem das próximas buscas.

## Fontes de dados

| Fonte | Custo | Quando é usada |
| --- | --- | --- |
| **OpenStreetMap** (Nominatim + Overpass) | Grátis, sem chave | Sempre que não houver uma chave do Google funcionando |
| **Google Maps** (Places API New) | Pago (exige faturamento ativo no Google Cloud) | Automaticamente, quando `GOOGLE_MAPS_API_KEY` está definida e o Google aceita a chave |

Se a chave do Google existir mas for recusada (faturamento inativo, API desativada, chave inválida), o bot cai sozinho no OpenStreetMap. O OpenStreetMap tem menos empresas que o Google e nem sempre registra o site de quem tem um. Por isso, os resultados dessa fonte trazem o botão **"Conferir no Google Maps"** para confirmar antes de entrar em contato.

## Como funciona

1. **Cidade, nichos e quantidade** — a cidade pode ser qualquer uma do Brasil (capitais e cidades grandes aparecem como sugestão). Os nichos vêm de um catálogo agrupado (saúde, beleza, alimentação, automotivo, casa, comércio, serviços, educação), e dá para adicionar um nicho digitado.
2. **Varredura com progresso de 0 a 100%** — o servidor localiza a cidade, divide a área em 9 regiões e busca todos os nichos em cada uma. A tela mostra o mapa das regiões sendo varridas e os leads aparecendo. A busca para assim que cada nicho tiver sua parte da meta, e o resultado é equilibrado entre os nichos.
3. **Resultado** — cada card tem nicho, telefone (com atalho para WhatsApp quando é celular), endereço, link do mapa, **Copiar dados** e **Mandei mensagem**. O bloco copiado fica assim:

   ```
   Empresa: Lanchonete do Zé
   Nicho: Lanchonete
   Telefone: (41) 99876-1234
   Endereço: R. Mateus Leme, 812 - São Francisco, Curitiba - PR
   Avaliação: 4,6 (312 avaliações)
   Google Maps: https://maps.google.com/?cid=...
   ```

   Também dá para **Copiar todas** ou **Baixar CSV** (abre direto no Excel).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `app/api/search/route.ts` — rota que responde em streaming NDJSON (`progress` → `result` | `error`) e escolhe a fonte
- `lib/google.ts` — integração com a **Google Places API (New)** (`places:searchText`)
- `lib/osm.ts` — integração com o **OpenStreetMap** (Nominatim para achar a cidade, Overpass para as empresas; todos os nichos vão numa consulta só por região)
- `lib/nichos.ts` — catálogo de nichos e o filtro do OpenStreetMap de cada um
- `lib/leads.ts` — "Meus leads", salvo no `localStorage` do navegador

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Sem nenhuma configuração, o bot já funciona com o OpenStreetMap.

Para usar o Google Maps: habilite a **Places API (New)** no [Google Cloud Console](https://console.cloud.google.com/), ative o faturamento, crie uma chave e coloque em `.env.local` (`cp .env.example .env.local`).

## Deploy na Vercel

Importe o repositório na Vercel (o framework Next.js é detectado sozinho). Opcionalmente, adicione `GOOGLE_MAPS_API_KEY` em **Settings → Environment Variables**.

## Custos

- **OpenStreetMap:** grátis. Os servidores públicos pedem uso moderado; o bot faz 1 consulta ao Nominatim + até 9 ao Overpass por busca (uma por região, divididas entre 3 servidores).
- **Google:** cada busca faz 1 consulta para localizar a cidade + até 27 consultas de Text Search por nicho (9 regiões × 3 páginas), parando antes quando a meta de leads é atingida. Como o app pede telefone e site, as consultas entram na faixa "Enterprise" da Places API. Acompanhe o uso no Google Cloud e, se quiser, defina uma cota diária na chave.
