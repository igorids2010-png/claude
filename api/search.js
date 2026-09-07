const { searchSemSite } = require('../lib/places');

module.exports = async (req, res) => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!API_KEY) {
    res.status(500).json({
      error: 'Chave da API do Google Maps não configurada. Defina GOOGLE_MAPS_API_KEY nas variáveis de ambiente do projeto na Vercel.',
    });
    return;
  }

  const ramo = (req.query.ramo || '').toString().trim();
  const local = (req.query.local || '').toString().trim();
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
  const raio = req.query.raio !== undefined ? Number(req.query.raio) : undefined;

  if (!ramo) {
    res.status(400).json({ error: 'Informe o ramo de negócio que deseja buscar.' });
    return;
  }

  try {
    const result = await searchSemSite(API_KEY, { ramo, local, lat, lng, raio });
    res.status(200).json(result);
  } catch (err) {
    const status = err.status === 'REQUEST_DENIED' ? 401 : 502;
    res.status(status).json({ error: err.message || 'Falha ao consultar o Google Maps.' });
  }
};
