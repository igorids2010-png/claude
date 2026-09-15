# Radar Sem Site

Bot com visual moderno (tema escuro estilo console de radar) que varre o Google Maps por **nicho** e **cidade** e mostra apenas os estabelecimentos que **não possuem site cadastrado** — ótimo para prospecção de clientes que precisam de um site.

## Como funciona

1. Você escolhe o **nicho** — digitando livremente (ex: "lanchonetes", "clínicas odontológicas") ou clicando em um dos atalhos prontos (lanchonetes, restaurantes, clínicas odontológicas, bares, mercados, salões de beleza, petshops, academias, padarias, farmácias, oficinas mecânicas, comércio local).
2. Você escolhe onde buscar:
   - selecionando **Estado** + **Cidade**; ou
   - clicando em **"Usar minha localização atual"** (o navegador pede permissão de geolocalização e você escolhe o raio de busca: 1 a 20 km).
3. O servidor consulta a Google Places API — **Nearby Search** quando é usada a localização atual, ou **Text Search** quando é escolhido estado/cidade.
4. Para cada lugar encontrado, ele busca os detalhes na mesma API e verifica o campo `website`.
5. Só são exibidos os lugares **sem site**, com nome, endereço, telefone, avaliação e link para o Google Maps.

O Google Maps (Places API) é a única fonte de dados: é ele quem decide se um estabelecimento existe, onde fica e se tem site cadastrado.

> A geolocalização do navegador só funciona em contexto seguro (HTTPS ou `localhost`) — funciona tanto rodando local quanto no deploy da Vercel.

## Pré-requisitos

- Node.js 18 ou superior.
- Uma chave de API do Google Cloud com as APIs **Places API** habilitadas (e faturamento ativo na conta do Google Cloud — o Google exige isso mesmo dentro da cota gratuita).

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente e cole sua chave:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` e defina:

   ```
   GOOGLE_MAPS_API_KEY=sua_chave_aqui
   ```

3. Inicie o servidor:

   ```bash
   npm start
   ```

4. Acesse `http://localhost:3000` no navegador.

## Deploy na Vercel

O projeto já está estruturado para rodar na Vercel sem configuração extra:

- `public/` é servido como site estático (é onde ficam `index.html`, `style.css` e `script.js`).
- `api/search.js` vira automaticamente uma Serverless Function em `/api/search`.
- `lib/places.js` tem a lógica de busca compartilhada entre o servidor local (`server.js`) e a função da Vercel.

### Passo a passo

1. Instale a CLI da Vercel (se ainda não tiver):

   ```bash
   npm install -g vercel
   ```

2. Rode o deploy a partir da raiz do projeto e siga as instruções (login, nome do projeto, etc.):

   ```bash
   vercel
   ```

3. Configure a variável de ambiente com sua chave da API (pode ser feito pela CLI ou pelo painel do projeto em vercel.com → Settings → Environment Variables):

   ```bash
   vercel env add GOOGLE_MAPS_API_KEY
   ```

4. Faça o deploy de produção:

   ```bash
   vercel --prod
   ```

Alternativa: conecte o repositório do GitHub diretamente pelo painel da Vercel ("Add New Project" → selecione o repositório) e adicione a variável `GOOGLE_MAPS_API_KEY` em Settings → Environment Variables antes do primeiro deploy.

## Observações

- A API do Google Places retorna no máximo 60 resultados por busca (3 páginas de 20), então buscas muito amplas (ex: "restaurantes" sem localização, em uma cidade grande) mostrarão apenas os 60 primeiros lugares retornados pelo Google.
- Cada busca faz uma chamada de "Text Search" + uma chamada de "Place Details" por lugar encontrado — fique atento aos custos/cotas da sua chave no Google Cloud.
- Lugares marcados como permanentemente fechados são ignorados automaticamente.
