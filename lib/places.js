const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const NEARBY_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

const MAX_PAGES = 3; // a API do Google retorna no máximo 20 resultados por página, até 3 páginas (60 no total)
const DETAILS_BATCH_SIZE = 5; // quantidade de chamadas de detalhes feitas em paralelo por vez
const DEFAULT_RADIUS = 5000; // metros
const MAX_RADIUS = 50000; // limite aceito pela Nearby Search

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSearchPage(apiKey, baseUrl, baseParams, pageToken) {
  const url = new URL(baseUrl);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('language', 'pt-BR');

  if (pageToken) {
    url.searchParams.set('pagetoken', pageToken);
  } else {
    for (const [k, v] of Object.entries(baseParams)) {
      url.searchParams.set(k, v);
    }
  }

  const response = await fetch(url);
  return response.json();
}

async function fetchAllPlaces(apiKey, baseUrl, baseParams) {
  let places = [];
  let pageToken = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    if (page > 0) {
      if (!pageToken) break;
      // o Google exige um pequeno atraso antes que o next_page_token fique válido
      await sleep(2000);
    }

    const data = await fetchSearchPage(apiKey, baseUrl, baseParams, pageToken);

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

async function fetchPlaceDetails(apiKey, placeId) {
  const url = new URL(DETAILS_URL);
  url.searchParams.set('key', apiKey);
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

async function fetchDetailsInBatches(apiKey, placeIds) {
  const details = [];

  for (let i = 0; i < placeIds.length; i += DETAILS_BATCH_SIZE) {
    const batch = placeIds.slice(i, i + DETAILS_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((id) => fetchPlaceDetails(apiKey, id).catch(() => null)));
    details.push(...batchResults);
  }

  return details;
}

function buildSearchRequest({ ramo, local, lat, lng, raio }) {
  const temCoordenadas = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  if (temCoordenadas) {
    const radius = Math.min(Math.max(Number(raio) || DEFAULT_RADIUS, 100), MAX_RADIUS);
    return {
      baseUrl: NEARBY_SEARCH_URL,
      baseParams: {
        location: `${lat},${lng}`,
        radius,
        keyword: ramo,
      },
      query: `${ramo} num raio de ${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)}km da sua localização`,
    };
  }

  const query = local ? `${ramo} em ${local}` : ramo;
  return {
    baseUrl: TEXT_SEARCH_URL,
    baseParams: { query },
    query,
  };
}

async function searchSemSite(apiKey, { ramo, local, lat, lng, raio }) {
  const { baseUrl, baseParams, query } = buildSearchRequest({ ramo, local, lat, lng, raio });

  const places = await fetchAllPlaces(apiKey, baseUrl, baseParams);

  if (places.length === 0) {
    return { query, total: 0, semSite: [] };
  }

  const placeIds = places.map((p) => p.place_id).filter(Boolean);
  const details = await fetchDetailsInBatches(apiKey, placeIds);

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

  return { query, total: places.length, semSite };
}

module.exports = { searchSemSite };
