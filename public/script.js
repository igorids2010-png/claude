const form = document.getElementById('search-form');
const button = document.getElementById('search-button');
const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const resultsEl = document.getElementById('results');

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
  const local = document.getElementById('local').value.trim();

  if (!ramo) return;

  resultsEl.innerHTML = '';
  summaryEl.hidden = true;
  setLoading(true);
  showStatus('Buscando lugares no Google Maps...');

  try {
    const params = new URLSearchParams({ ramo, local });
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
