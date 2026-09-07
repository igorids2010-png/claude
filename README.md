# Sem Site Bot

Bot com visual moderno e simples que busca no Google Maps lugares de um determinado ramo (ex: "dentistas em Curitiba") e mostra apenas os que **não possuem site cadastrado** — ótimo para prospecção de clientes que precisam de um site.

## Como funciona

1. Você digita o **ramo** (ex: "restaurantes", "salões de beleza") e opcionalmente a **localização** (ex: "Belo Horizonte, MG").
2. O servidor consulta a Google Places API (Text Search) para listar os lugares.
3. Para cada lugar encontrado, ele busca os detalhes e verifica o campo `website`.
4. Só são exibidos os lugares **sem site**, com nome, endereço, telefone, avaliação e link para o Google Maps.

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

## Observações

- A API do Google Places retorna no máximo 60 resultados por busca (3 páginas de 20), então buscas muito amplas (ex: "restaurantes" sem localização, em uma cidade grande) mostrarão apenas os 60 primeiros lugares retornados pelo Google.
- Cada busca faz uma chamada de "Text Search" + uma chamada de "Place Details" por lugar encontrado — fique atento aos custos/cotas da sua chave no Google Cloud.
- Lugares marcados como permanentemente fechados são ignorados automaticamente.
