// routes/products.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function loadProducts() {
  return (await db.read('products')) || [];
}
async function saveProducts(products) {
  return db.write('products', products);
}

// ---------- PÚBLICO ----------
router.get('/products', async (req, res) => {
  const products = (await loadProducts()).filter(p => p.activo);
  res.json(products);
});

router.get('/products/:id', async (req, res) => {
  const product = (await loadProducts()).find(p => p.id === req.params.id && p.activo);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

// ---------- ADMIN ----------
router.get('/admin/products', requireAuth, async (req, res) => {
  res.json(await loadProducts());
});

router.post('/admin/products', requireAuth, async (req, res) => {
  const products = await loadProducts();
  const nextNumero = Math.max(0, ...products.map(p => p.numero || 0)) + 1;
  const newProduct = {
    id: 'p' + Date.now(),
    numero: req.body.numero || nextNumero,
    nombre: req.body.nombre || 'Nuevo producto',
    categorias: req.body.categorias || [],
    precio: req.body.precio ?? null,
    precioOferta: req.body.precioOferta ?? null,
    enOferta: !!req.body.enOferta,
    ofertaInicio: req.body.ofertaInicio || null,
    ofertaFin: req.body.ofertaFin || null,
    descripcion: req.body.descripcion || '',
    incluye: req.body.incluye || [],
    tamano: req.body.tamano || '',
    disponible: req.body.disponible !== false,
    activo: req.body.activo !== false,
    esNuevo: !!req.body.esNuevo,
    masVendido: !!req.body.masVendido,
    fotos: req.body.fotos || [],
    videos: req.body.videos || [],
    colores: req.body.colores || [],
    iconoColor: req.body.iconoColor || 'rosa',
    creadoEn: new Date().toISOString().slice(0, 10)
  };
  products.push(newProduct);
  await saveProducts(products);
  res.status(201).json(newProduct);
});

router.put('/admin/products/:id', requireAuth, async (req, res) => {
  const products = await loadProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  await saveProducts(products);
  res.json(products[idx]);
});

router.delete('/admin/products/:id', requireAuth, async (req, res) => {
  const products = await loadProducts();
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  products.splice(idx, 1);
  await saveProducts(products);
  res.json({ ok: true });
});

module.exports = router;
