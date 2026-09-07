const form = document.getElementById('search-form');
const button = document.getElementById('search-button');
const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const resultsEl = document.getElementById('results');
const localInput = document.getElementById('local');
const geoButton = document.getElementById('geo-button');
const raioSelect = document.getElementById('raio');
const geoStatusEl = document.getElementById('geo-status');

let coordsAtuais = null;

function showGeoStatus(message, isError = false) {
  geoStatusEl.hidden = false;
  geoStatusEl.classList.toggle('error', isError);
  geoStatusEl.textContent = message;
}

function clearGeoStatus() {
  geoStatusEl.hidden = true;
  geoStatusEl.textContent = '';
}

function ativarLocalizacaoAtual(coords) {
  coordsAtuais = coords;
  localInput.value = '';
  localInput.disabled = true;
  localInput.placeholder = 'Usando sua localização atual';
  raioSelect.hidden = false;
  geoButton.textContent = '✕ Remover localização atual';
  geoButton.classList.add('active');
  showGeoStatus('📍 Localização atual ativada — a busca vai usar o raio selecionado ao lado.');
}

function desativarLocalizacaoAtual() {
  coordsAtuais = null;
  localInput.disabled = false;
  localInput.placeholder = 'ex: São Paulo, SP';
  raioSelect.hidden = true;
  geoButton.textContent = '📍 Usar minha localização atual';
  geoButton.classList.remove('active');
  clearGeoStatus();
}

geoButton.addEventListener('click', () => {
  if (coordsAtuais) {
    desativarLocalizacaoAtual();
    return;
  }

  if (!('geolocation' in navigator)) {
    showGeoStatus('Seu navegador não suporta geolocalização. Digite a localização manualmente.', true);
    return;
  }

  geoButton.disabled = true;
  showGeoStatus('Obtendo sua localização...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      geoButton.disabled = false;
      ativarLocalizacaoAtual({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (err) => {
      geoButton.disabled = false;
      const mensagens = {
        1: 'Permissão de localização negada. Permita o acesso ou digite a localização manualmente.',
        2: 'Não foi possível determinar sua localização agora.',
        3: 'Tempo esgotado ao tentar obter sua localização.',
      };
      showGeoStatus(mensagens[err.code] || 'Não foi possível obter sua localização.', true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.querySelector('.btn-label').textContent = isLoading ? 'Buscando...' : 'Buscar';
}

function showStatus(message, isError = false) {
  statusEl.hidden = false;
  statusEl.classList.toggle('error', isError);
  statusEl.innerHTML = isError ? message : `<span class="spinner"></span>${message}`;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.innerHTML = '';
}

function renderSummary(query, total, encontrados) {
  summaryEl.hidden = false;
  summaryEl.textContent = `Busca por "${query}": ${total} lugares analisados, ${encontrados} sem site cadastrado.`;
}

function renderResults(lugares) {
  resultsEl.innerHTML = '';

  if (lugares.length === 0) {
    resultsEl.innerHTML = '<div class="empty-state">Nenhum lugar sem site foi encontrado para essa busca.</div>';
    return;
  }

  for (const lugar of lugares) {
    const card = document.createElement('div');
    card.className = 'place-card';

    const avaliacao =
      lugar.avaliacao != null
        ? `<span class="place-rating">★ ${lugar.avaliacao}</span> (${lugar.totalAvaliacoes ?? 0} avaliações)`
        : 'Sem avaliações';

    card.innerHTML = `
      <div class="place-info">
        <h3>${escapeHtml(lugar.nome)}</h3>
        <p>${escapeHtml(lugar.endereco)}</p>
        <p>${lugar.telefone ? escapeHtml(lugar.telefone) : 'Telefone não informado'}</p>
        <p>${avaliacao}</p>
        <span class="no-site-badge">SEM SITE</span>
      </div>
      ${lugar.linkMaps ? `<a class="maps-link" href="${lugar.linkMaps}" target="_blank" rel="noopener">Ver no Maps</a>` : ''}
    `;

    resultsEl.appendChild(card);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ramo = document.getElementById('ramo').value.trim();
  const local = localInput.value.trim();

  if (!ramo) return;

  resultsEl.innerHTML = '';
  summaryEl.hidden = true;
  setLoading(true);
  showStatus(
    coordsAtuais ? 'Buscando lugares perto de você no Google Maps...' : 'Buscando lugares no Google Maps...'
  );

  try {
    const params = new URLSearchParams({ ramo });

    if (coordsAtuais) {
      params.set('lat', coordsAtuais.lat);
      params.set('lng', coordsAtuais.lng);
      params.set('raio', raioSelect.value);
    } else {
      params.set('local', local);
    }

    const response = await fetch(`/api/search?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao buscar lugares.');
    }

    clearStatus();
    renderSummary(data.query, data.total, data.semSite.length);
    renderResults(data.semSite);
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    setLoading(false);
  }
});
