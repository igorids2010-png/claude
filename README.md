# Radar Sem Site

Ferramenta de prospecção: você escolhe uma **cidade** e um **nicho**, o radar varre o mapa e mostra só as empresas que **não têm site** (ou que só têm Instagram/Facebook/WhatsApp), com telefone, endereço e link prontos para copiar.

## Fontes de dados

| Fonte | Custo | Quando é usada |
| --- | --- | --- |
| **OpenStreetMap** (Nominatim + Overpass) | Grátis, sem chave | Sempre que não houver uma chave do Google funcionando |
| **Google Maps** (Places API New) | Pago (exige faturamento ativo no Google Cloud) | Automaticamente, quando `GOOGLE_MAPS_API_KEY` está definida e o Google aceita a chave |

Se a chave do Google existir mas for recusada (faturamento inativo, API desativada, chave inválida), o bot cai sozinho no OpenStreetMap. O OpenStreetMap tem menos empresas que o Google e nem sempre registra o site de quem tem um. Por isso, os resultados dessa fonte trazem o botão **"Conferir no Google Maps"** para confirmar antes de entrar em contato.

## Como funciona

1. **Cidade + nicho** — a cidade pode ser qualquer uma do Brasil (as capitais e cidades grandes aparecem como sugestão); o nicho pode ser escolhido da lista ou digitado livremente.
2. **Varredura com progresso de 0 a 100%** — o servidor localiza a cidade, divide a área dela em uma grade de 3×3 regiões e busca o nicho em cada região. O progresso é enviado ao navegador em tempo real. No OpenStreetMap, cada nicho é traduzido para as categorias do mapa (ex: "Clínicas odontológicas" → `amenity=dentist`); nichos fora da lista são buscados pelo nome do estabelecimento.
3. **Resultado** — só aparecem empresas abertas sem site próprio (no Google, ordenadas pelo número de avaliações; no OpenStreetMap, quem tem telefone aparece primeiro). Cada card tem telefone (com atalho para WhatsApp quando é celular), endereço, avaliação, link do Google Maps e o botão **Copiar dados**, que gera um bloco pronto para colar:

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
- `app/api/search/route.ts` — rota que responde em streaming NDJSON (`progress` → `result` | `error`) e escolhe a fonte
- `lib/google.ts` — integração com a **Google Places API (New)** (`places:searchText`)
- `lib/osm.ts` — integração com o **OpenStreetMap** (Nominatim para achar a cidade, Overpass para as empresas)

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

- **OpenStreetMap:** grátis. Os servidores públicos pedem uso moderado; o bot faz 1 consulta ao Nominatim + 9 ao Overpass por busca, uma de cada vez.
- **Google:** cada busca faz 1 consulta para localizar a cidade + até 27 consultas de Text Search (9 regiões × 3 páginas). Como o app pede telefone e site, as consultas entram na faixa "Enterprise" da Places API. Acompanhe o uso no Google Cloud e, se quiser, defina uma cota diária na chave.
