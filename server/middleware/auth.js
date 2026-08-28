// middleware/auth.js
// Protege las rutas privadas del panel administrativo.
// Si no hay una sesión de administrador activa, responde 401 (para la API)
// o redirige a la pantalla de login (para páginas HTML).

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión de nuevo.' });
  }
  return res.redirect('/admin/login.html');
}

module.exports = { requireAuth };
