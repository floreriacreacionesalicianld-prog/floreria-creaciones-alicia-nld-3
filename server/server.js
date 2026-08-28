// server.js
// Servidor principal de Florería Creaciones Alicia.
//
// Estructura:
//   /public            -> sitio público (HTML/CSS/JS) + panel /public/admin
//   /server/data        -> archivos "semilla" (el catálogo real, se usa solo
//                           la primera vez para llenar la base de datos)
//   /server/routes        -> API (productos, categorías, contenido, login, formularios)
//   MongoDB Atlas           -> guarda todos los datos de forma permanente
//   Cloudinary                -> guarda las fotos que se suban desde el panel
//
// Flujo de datos:
//   Panel administrativo → API (Express) → MongoDB Atlas → API → Sitio público
// Cualquier cambio guardado desde el panel se escribe en MongoDB y el sitio
// público lo refleja de inmediato, sin depender del disco del servidor.

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');
const messageRoutes = require('./routes/messages');
const tiktokRoutes = require('./routes/tiktok');
const { requireAuth } = require('./middleware/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: falta la variable de entorno MONGODB_URI. Revisa el README para configurarla.');
    process.exit(1);
  }

  await db.connect();

  // Asegura que exista un usuario administrador la primera vez que se corre el servidor
  const existingAdmins = await db.read('admin-users');
  if (!existingAdmins) {
    const bcrypt = require('bcryptjs');
    await db.write('admin-users', [
      { username: 'admin', passwordHash: bcrypt.hashSync('admin1234', 10) }
    ]);
    console.log('Usuario administrador creado por defecto -> usuario: admin / contraseña: admin1234');
    console.log('IMPORTANTE: entra al panel -> "Mi cuenta" y cámbialo cuanto antes.');
  }

  app.use(session({
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      dbName: process.env.MONGODB_DB || 'floreria_alicia',
      collectionName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'floreria-creaciones-alicia-cambia-este-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      httpOnly: true
    }
  }));

  // API
  app.use('/api', authRoutes);
  app.use('/api', productRoutes);
  app.use('/api', categoryRoutes);
  app.use('/api', contentRoutes);
  app.use('/api', uploadRoutes);
  app.use('/api', messageRoutes);
  app.use('/api', tiktokRoutes);

  // Protege el HTML del panel (no solo la API) para que un visitante normal
  // no pueda ver la interfaz administrativa aunque adivine la URL.
  app.get('/admin/index.html', requireAuth, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html'));
  });
  app.get('/admin/', requireAuth, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html'));
  });
  app.get('/admin', requireAuth, (req, res) => {
    res.redirect('/admin/');
  });

  // Archivos estáticos (sitio público + panel una vez autenticado)
  app.use(express.static(PUBLIC_DIR));

  app.use((req, res) => {
    res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'), err => {
      if (err) res.status(404).send('Página no encontrada');
    });
  });

  app.listen(PORT, () => {
    console.log(`Florería Creaciones Alicia escuchando en el puerto ${PORT}`);
    console.log('Panel administrativo disponible en /admin');
  });
}

start().catch(err => {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});
