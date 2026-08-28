// routes/tiktok.js
// Cuando la administradora pega el link de un video de TikTok en el panel,
// esta ruta le pide a TikTok (con su servicio público "oEmbed") la miniatura
// y el título del video, para no tener que subirlos a mano. El número de
// vistas SÍ lo escribe ella manualmente, porque TikTok no lo comparte por
// este medio público.
const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/admin/tiktok-info', requireAuth, async (req, res) => {
  const { url } = req.body || {};
  if (!url || !/tiktok\.com/.test(url)) {
    return res.status(400).json({ error: 'Pega un link válido de TikTok.' });
  }
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const respuesta = await fetch(oembedUrl);
    if (!respuesta.ok) throw new Error('TikTok no devolvió información para ese link.');
    const data = await respuesta.json();
    res.json({
      ok: true,
      titulo: data.title || '',
      miniatura: data.thumbnail_url || '',
      autor: data.author_name || ''
    });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo obtener información de ese video. Verifica que el link sea público y correcto.' });
  }
});

module.exports = router;
