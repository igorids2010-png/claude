require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

const MAX_PAGES = 3; // a API do Google retorna no máximo 20 resultados por página, até 3 páginas (60 no total)
const DETAILS_BATCH_SIZE = 5; // quantidade de chamadas de detalhes feitas em paralelo por vez

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTextSearchPage(query, pageToken) {
  const url = new URL(TEXT_SEARCH_URL);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('language', 'pt-BR');
  if (pageToken) {
    url.searchParams.set('pagetoken', pageToken);
  } else {
    url.searchParams.set('query', query);
  }

  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function fetchAllPlaces(query) {
  let places = [];
  let pageToken = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (page > 0) {
      if (!pageToken) break;
      // o Google exige um pequeno atraso antes que o next_page_token fique válido
      await sleep(2000);
    }

    const data = await fetchTextSearchPage(query, pageToken);

    if (data.status === 'ZERO_RESULTS') break;

    if (data.status && data.status !== 'OK') {
      const error = new Error(data.error_message || `Erro na busca do Google Maps: ${data.status}`);
      error.status = data.status;
      throw error;
    }

    places = places.concat(data.results || []);
    pageToken = data.next_page_token || null;

    if (!pageToken) break;
  }

  return places;
}

async function fetchPlaceDetails(placeId) {
  const url = new URL(DETAILS_URL);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set(
    'fields',
    ['name', 'website', 'formatted_address', 'formatted_phone_number', 'rating', 'user_ratings_total', 'url', 'business_status'].join(',')
  );

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') return null;
  return data.result;
}

async function fetchDetailsInBatches(placeIds) {
  const details = [];

  for (let i = 0; i < placeIds.length; i += DETAILS_BATCH_SIZE) {
    const batch = placeIds.slice(i, i + DETAILS_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((id) => fetchPlaceDetails(id).catch(() => null)));
    details.push(...batchResults);
  }

  return details;
}

app.get('/api/search', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'Chave da API do Google Maps não configurada. Defina GOOGLE_MAPS_API_KEY no arquivo .env.',
    });
  }

  const ramo = (req.query.ramo || '').toString().trim();
  const local = (req.query.local || '').toString().trim();

  if (!ramo) {
    return res.status(400).json({ error: 'Informe o ramo de negócio que deseja buscar.' });
  }

  const query = local ? `${ramo} em ${local}` : ramo;

  try {
    const places = await fetchAllPlaces(query);

    if (places.length === 0) {
      return res.json({ query, total: 0, semSite: [] });
    }

    const placeIds = places.map((p) => p.place_id).filter(Boolean);
    const details = await fetchDetailsInBatches(placeIds);

    const semSite = details
      .filter((d) => d && !d.website && d.business_status !== 'CLOSED_PERMANENTLY')
      .map((d) => ({
        nome: d.name,
        endereco: d.formatted_address || '',
        telefone: d.formatted_phone_number || '',
        avaliacao: d.rating ?? null,
        totalAvaliacoes: d.user_ratings_total ?? null,
        linkMaps: d.url || null,
      }));

    return res.json({ query, total: places.length, semSite });
  } catch (err) {
    const status = err.status === 'REQUEST_DENIED' ? 401 : 502;
    return res.status(status).json({ error: err.message || 'Falha ao consultar o Google Maps.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
