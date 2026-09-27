# Radar Sem Site

Ferramenta de prospecção: você escolhe uma **cidade** e um **nicho**, o radar varre o Google Maps e mostra só as empresas que **não têm site** (ou que só têm Instagram/Facebook/WhatsApp), com telefone, endereço e link prontos para copiar.

## Como funciona

1. **Cidade + nicho** — a cidade pode ser qualquer uma do Brasil (as capitais e cidades grandes aparecem como sugestão); o nicho pode ser escolhido da lista ou digitado livremente.
2. **Varredura com progresso de 0 a 100%** — o servidor localiza a cidade no Google Maps, divide a área dela em uma grade de 3×3 regiões e busca o nicho em cada região (até 60 resultados por região). Isso traz bem mais empresas do que uma busca única (limitada a 60). O progresso é enviado ao navegador em tempo real.
3. **Resultado** — só aparecem empresas abertas sem site próprio, ordenadas pelo número de avaliações. Cada card tem telefone (com atalho para WhatsApp quando é celular), endereço, avaliação, link do Google Maps e o botão **Copiar dados**, que gera um bloco pronto para colar:

   ```
   Empresa: Lanchonete do Zé
   Nicho: Lanchonetes
   Telefone: (41) 99876-1234
   Endereço: R. Mateus Leme, 812 - São Francisco, Curitiba - PR
   Avaliação: 4,6 (312 avaliações)
   Google Maps: https://maps.google.com/?cid=...
   ```

   Também dá para **Copiar todas** ou **Baixar CSV** (abre direto no Excel).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `app/api/search/route.ts` — rota que responde em streaming NDJSON (`progress` → `result` | `error`)
- `lib/places.ts` — integração com a **Google Places API (New)** (`places:searchText`)

## Configuração

1. No [Google Cloud Console](https://console.cloud.google.com/), habilite a **Places API (New)** e crie uma chave de API (a conta precisa ter faturamento ativo).
2. Instale e configure:

   ```bash
   npm install
   cp .env.example .env.local   # e coloque sua chave em GOOGLE_MAPS_API_KEY
   npm run dev
   ```

3. Acesse `http://localhost:3000`.

## Deploy na Vercel

Importe o repositório na Vercel (o framework Next.js é detectado sozinho) e adicione a variável de ambiente `GOOGLE_MAPS_API_KEY` em **Settings → Environment Variables**.

## Custos

Cada busca faz 1 consulta para localizar a cidade + até 27 consultas de Text Search (9 regiões × 3 páginas). Como o app pede telefone e site, as consultas entram na faixa "Enterprise" da Places API — acompanhe o uso no Google Cloud e, se quiser, defina uma cota diária na chave.
