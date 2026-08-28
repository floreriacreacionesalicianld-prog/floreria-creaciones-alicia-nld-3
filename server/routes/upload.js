// routes/upload.js
// Sube fotos y videos que la administradora agrega desde el panel a
// Cloudinary (almacenamiento permanente y gratuito), en vez de guardarlos
// en el disco del servidor (que se puede borrar al reiniciar).
//
// Las fotos originales de los catálogos siguen viviendo dentro del propio
// proyecto (public/images/...) porque son parte del código fuente en
// GitHub y nunca se pierden. Cloudinary se usa para todo lo que se suba
// DESPUÉS, desde el panel (fotos nuevas, videos de producto, videos/fotos
// de entregas a domicilio).

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storageFotos = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'floreria-alicia/productos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }]
  }
});

const storageVideos = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'floreria-alicia/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm']
  }
});

const uploadFotos = multer({ storage: storageFotos, limits: { fileSize: 8 * 1024 * 1024 } });
const uploadVideos = multer({ storage: storageVideos, limits: { fileSize: 60 * 1024 * 1024 } }); // 60MB por video

function sinCloudinary(res) {
  return res.status(500).json({
    error: 'Cloudinary no está configurado. Faltan las variables de entorno CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.'
  });
}

// Fotos (hasta 10 a la vez)
router.post('/admin/upload', requireAuth, (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return sinCloudinary(res);
  uploadFotos.array('fotos', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const rutas = (req.files || []).map(f => f.path);
    res.json({ ok: true, rutas });
  });
});

// Videos (hasta 5 a la vez, archivos más pesados)
router.post('/admin/upload-video', requireAuth, (req, res) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return sinCloudinary(res);
  uploadVideos.array('videos', 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const rutas = (req.files || []).map(f => f.path);
    res.json({ ok: true, rutas });
  });
});

module.exports = router;
