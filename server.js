require('dotenv').config();
const path = require('path');
const express = require('express');
const { searchSemSite } = require('./lib/places');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'Chave da API do Google Maps não configurada. Defina GOOGLE_MAPS_API_KEY no arquivo .env.',
    });
  }

  const ramo = (req.query.ramo || '').toString().trim();
  const local = (req.query.local || '').toString().trim();
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
  const raio = req.query.raio !== undefined ? Number(req.query.raio) : undefined;

  if (!ramo) {
    return res.status(400).json({ error: 'Informe o ramo de negócio que deseja buscar.' });
  }

  try {
    const result = await searchSemSite(API_KEY, { ramo, local, lat, lng, raio });
    return res.json(result);
  } catch (err) {
    const status = err.status === 'REQUEST_DENIED' ? 401 : 502;
    return res.status(status).json({ error: err.message || 'Falha ao consultar o Google Maps.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
