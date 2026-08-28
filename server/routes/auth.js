// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  const users = (await db.read('admin-users')) || [];
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ ok: true, username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  res.json({ loggedIn: false });
});

// Permite cambiar usuario/contraseña desde el propio panel, sin necesitar
// acceso a una terminal (útil en hostings gratuitos sin consola, como Koyeb
// o el plan free de Render).
router.post('/change-password', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión de nuevo.' });
  }
  const { passwordActual, nuevoUsuario, nuevaPassword } = req.body || {};
  if (!passwordActual || !nuevaPassword) {
    return res.status(400).json({ error: 'Completa tu contraseña actual y la nueva.' });
  }
  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  const users = (await db.read('admin-users')) || [];
  const user = users.find(u => u.username === req.session.username);
  if (!user || !bcrypt.compareSync(passwordActual, user.passwordHash)) {
    return res.status(401).json({ error: 'Tu contraseña actual no es correcta.' });
  }

  user.passwordHash = bcrypt.hashSync(nuevaPassword, 10);
  if (nuevoUsuario && nuevoUsuario.trim()) {
    user.username = nuevoUsuario.trim();
  }
  await db.write('admin-users', users);

  req.session.username = user.username;
  res.json({ ok: true, username: user.username });
});

module.exports = router;
