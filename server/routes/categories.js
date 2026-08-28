// routes/categories.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function loadCategories() {
  return (await db.read('categories')) || [];
}
async function saveCategories(categories) {
  return db.write('categories', categories);
}

// ---------- PÚBLICO ----------
router.get('/categories', async (req, res) => {
  res.json((await loadCategories()).filter(c => c.activo !== false));
});

// ---------- ADMIN ----------
router.get('/admin/categories', requireAuth, async (req, res) => {
  res.json(await loadCategories());
});

router.post('/admin/categories', requireAuth, async (req, res) => {
  const categories = await loadCategories();
  const id = (req.body.nombre || 'categoria')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

  const newCategory = {
    id,
    nombre: req.body.nombre || 'Nueva categoría',
    descripcion: req.body.descripcion || '',
    imagen: req.body.imagen || '',
    activo: req.body.activo !== false,
    esTemporada: !!req.body.esTemporada,
    colorTema: req.body.colorTema || '',
    fechaFin: req.body.fechaFin || ''
  };
  categories.push(newCategory);
  await saveCategories(categories);
  res.status(201).json(newCategory);
});

router.put('/admin/categories/:id', requireAuth, async (req, res) => {
  const categories = await loadCategories();
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Categoría no encontrada' });
  categories[idx] = { ...categories[idx], ...req.body, id: categories[idx].id };
  await saveCategories(categories);
  res.json(categories[idx]);
});

router.delete('/admin/categories/:id', requireAuth, async (req, res) => {
  const categories = await loadCategories();
  const idx = categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Categoría no encontrada' });
  categories.splice(idx, 1);
  await saveCategories(categories);
  res.json({ ok: true });
});

module.exports = router;
