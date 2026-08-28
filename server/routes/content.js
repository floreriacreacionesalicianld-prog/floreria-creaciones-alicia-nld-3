// routes/content.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- PÚBLICO ----------
router.get('/site-content', async (req, res) => {
  res.json((await db.read('site-content')) || {});
});

// ---------- ADMIN ----------
router.get('/admin/site-content', requireAuth, async (req, res) => {
  res.json((await db.read('site-content')) || {});
});

router.put('/admin/site-content', requireAuth, async (req, res) => {
  const current = (await db.read('site-content')) || {};
  const updated = { ...current, ...req.body };
  await db.write('site-content', updated);
  res.json(updated);
});

module.exports = router;
