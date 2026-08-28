// routes/messages.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function loadList(name) {
  return (await db.read(name)) || [];
}

// ---------- PÚBLICO: recibir formularios ----------
router.post('/contacto', async (req, res) => {
  const { nombre, telefono, correo, motivo, mensaje } = req.body || {};
  if (!nombre || !telefono || !mensaje) {
    return res.status(400).json({ error: 'Nombre, teléfono y mensaje son requeridos.' });
  }
  const mensajes = await loadList('mensajes-contacto');
  mensajes.unshift({
    id: 'm' + Date.now(),
    nombre, telefono, correo: correo || '', motivo: motivo || '', mensaje,
    fecha: new Date().toISOString(),
    leido: false
  });
  await db.write('mensajes-contacto', mensajes);
  res.status(201).json({ ok: true });
});

router.post('/cotizacion-evento', async (req, res) => {
  const body = req.body || {};
  if (!body.nombre || !body.telefono || !body.fechaEvento) {
    return res.status(400).json({ error: 'Nombre, teléfono y fecha del evento son requeridos.' });
  }
  const cotizaciones = await loadList('cotizaciones-eventos');
  cotizaciones.unshift({
    id: 'c' + Date.now(),
    ...body,
    fechaEnvio: new Date().toISOString(),
    leido: false
  });
  await db.write('cotizaciones-eventos', cotizaciones);
  res.status(201).json({ ok: true });
});

// ---------- ADMIN: consultar formularios recibidos ----------
router.get('/admin/mensajes-contacto', requireAuth, async (req, res) => {
  res.json(await loadList('mensajes-contacto'));
});

router.get('/admin/cotizaciones-eventos', requireAuth, async (req, res) => {
  res.json(await loadList('cotizaciones-eventos'));
});

router.put('/admin/mensajes-contacto/:id/leido', requireAuth, async (req, res) => {
  const list = await loadList('mensajes-contacto');
  const item = list.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  item.leido = true;
  await db.write('mensajes-contacto', list);
  res.json({ ok: true });
});

router.put('/admin/cotizaciones-eventos/:id/leido', requireAuth, async (req, res) => {
  const list = await loadList('cotizaciones-eventos');
  const item = list.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  item.leido = true;
  await db.write('cotizaciones-eventos', list);
  res.json({ ok: true });
});

module.exports = router;
