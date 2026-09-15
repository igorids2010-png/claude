const form = document.getElementById('search-form');
const button = document.getElementById('search-button');
const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const resultsEl = document.getElementById('results');

const ramoInput = document.getElementById('ramo');
const nichoChips = document.querySelectorAll('#nicho-chips .chip');
const estadoSelect = document.getElementById('estado');
const cidadeInput = document.getElementById('cidade');

const geoButton = document.getElementById('geo-button');
const geoPanel = document.getElementById('geo-panel');
const raioSelect = document.getElementById('raio');
const geoStatusEl = document.getElementById('geo-status');

let coordsAtuais = null;

/* ---------- nicho ---------- */

function marcarChipAtivo() {
  const valorAtual = ramoInput.value.trim().toLowerCase();
  nichoChips.forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.nicho.toLowerCase() === valorAtual);
  });
}

nichoChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    ramoInput.value = chip.dataset.nicho;
    marcarChipAtivo();
    ramoInput.focus();
  });
});

ramoInput.addEventListener('input', marcarChipAtivo);

/* ---------- geolocalização ---------- */

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
  estadoSelect.disabled = true;
  cidadeInput.disabled = true;
  cidadeInput.placeholder = 'Usando sua localização atual';
  geoPanel.hidden = false;
  geoButton.textContent = '✕ Remover localização atual';
  geoButton.classList.add('active');
  showGeoStatus('📍 Localização atual ativada — a busca vai usar o raio selecionado acima.');
}

function desativarLocalizacaoAtual() {
  coordsAtuais = null;
  estadoSelect.disabled = false;
  cidadeInput.disabled = false;
  cidadeInput.placeholder = 'ex: Curitiba';
  geoPanel.hidden = true;
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
    showGeoStatus('Seu navegador não suporta geolocalização. Escolha estado e cidade manualmente.', true);
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
        1: 'Permissão de localização negada. Permita o acesso ou escolha estado e cidade manualmente.',
        2: 'Não foi possível determinar sua localização agora.',
        3: 'Tempo esgotado ao tentar obter sua localização.',
      };
      showGeoStatus(mensagens[err.code] || 'Não foi possível obter sua localização.', true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

/* ---------- busca ---------- */

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.querySelector('.btn-label').textContent = isLoading ? 'Buscando...' : 'Buscar';
}

function showStatus(message, isError = false) {
  statusEl.hidden = false;
  statusEl.classList.toggle('error', isError);
  const marcador = isError ? '<span class="bullet">▸</span>' : '<span class="spinner"></span>';
  statusEl.innerHTML = `${marcador}${message}`;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.innerHTML = '';
}

function renderSummary(query, total, encontrados) {
  summaryEl.hidden = false;
  summaryEl.innerHTML = `<span class="bullet">▸</span>Busca por <b>"${escapeHtml(query)}"</b>: ${total} lugares analisados, <span class="found">${encontrados} sem site</span> cadastrado.`;
}

function renderResults(lugares) {
  resultsEl.innerHTML = '';

  if (lugares.length === 0) {
    resultsEl.innerHTML =
      '<div class="empty-state">Nenhum lugar sem site foi encontrado para essa busca. Tente outro nicho, outra cidade ou aumente o raio.</div>';
    return;
  }

  lugares.forEach((lugar, index) => {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.style.animationDelay = `${index * 40}ms`;

    const avaliacao =
      lugar.avaliacao != null
        ? `<span class="place-rating">★ ${lugar.avaliacao}</span> · ${lugar.totalAvaliacoes ?? 0} avaliações`
        : 'Sem avaliações';

    card.innerHTML = `
      <div class="pin">${index + 1}</div>
      <div class="place-info">
        <h3>${escapeHtml(lugar.nome)}</h3>
        <p class="addr">${escapeHtml(lugar.endereco)}</p>
        <div class="meta">
          ${avaliacao}
          <span>${lugar.telefone ? escapeHtml(lugar.telefone) : 'Telefone não informado'}</span>
          <span class="no-site-badge">SEM SITE</span>
        </div>
      </div>
      ${lugar.linkMaps ? `<a class="maps-link" href="${lugar.linkMaps}" target="_blank" rel="noopener">Ver no Maps ↗</a>` : ''}
    `;

    resultsEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function montarLocal() {
  const cidade = cidadeInput.value.trim();
  const estadoOption = estadoSelect.options[estadoSelect.selectedIndex];
  const estadoNome = estadoSelect.value ? estadoOption.textContent : '';

  if (cidade && estadoNome) return `${cidade}, ${estadoNome}`;
  return cidade || estadoNome;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ramo = ramoInput.value.trim();
  if (!ramo) return;

  resultsEl.innerHTML = '';
  summaryEl.hidden = true;
  setLoading(true);
  showStatus(coordsAtuais ? 'Buscando lugares perto de você no Google Maps...' : 'Buscando lugares no Google Maps...');

  try {
    const params = new URLSearchParams({ ramo });

    if (coordsAtuais) {
      params.set('lat', coordsAtuais.lat);
      params.set('lng', coordsAtuais.lng);
      params.set('raio', raioSelect.value);
    } else {
      const local = montarLocal();
      if (!local) throw new Error('Escolha um estado/cidade ou use sua localização atual.');
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
