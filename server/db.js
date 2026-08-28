// db.js
// Capa de "base de datos" respaldada por MongoDB Atlas (gratis y permanente).
//
// Guarda cada colección (productos, categorías, contenido del sitio, usuarios
// admin, mensajes, etc.) como UN documento dentro de la colección "store",
// identificado por su nombre (_id). Esto mantiene la misma forma sencilla
// que tenía la versión basada en archivos JSON, pero ahora los datos
// sobreviven aunque el servidor (Koyeb/Render) se reinicie o se duerma.
//
// La PRIMERA vez que se pide una colección y no existe todavía en MongoDB,
// se "siembra" automáticamente con el archivo JSON correspondiente en
// /server/data (ahí es donde vive el catálogo real de 58 productos que
// ya cargamos). De ahí en adelante, todos los cambios se guardan en
// MongoDB, no en esos archivos.

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const SEED_DIR = path.join(__dirname, 'data');
let client;
let dbInstance;

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connect() {
  if (dbInstance) return dbInstance;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Falta la variable de entorno MONGODB_URI. Configúrala con la cadena de conexión de tu clúster de MongoDB Atlas.'
    );
  }

  // La conexión inicial a MongoDB Atlas a veces falla por un problema pasajero
  // de red/TLS (muy común en el primer intento desde algunos hostings) aunque
  // la cadena de conexión y las credenciales estén perfectamente bien.
  // En vez de tronar de inmediato, reintenta varias veces antes de rendirse.
  const maxIntentos = 6;
  let ultimoError;
  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
      await client.connect();
      dbInstance = client.db(process.env.MONGODB_DB || 'floreria_alicia');
      return dbInstance;
    } catch (err) {
      ultimoError = err;
      console.log(`Intento ${intento}/${maxIntentos} de conexión a MongoDB falló, reintentando en 5 segundos...`);
      await esperar(5000);
    }
  }
  throw ultimoError;
}

function seedPath(name) {
  return path.join(SEED_DIR, `${name}.json`);
}

async function read(name) {
  const database = await connect();
  const doc = await database.collection('store').findOne({ _id: name });
  if (doc) return doc.value;

  // No existe todavía en MongoDB: si hay un archivo semilla local, lo usamos
  // para sembrar la colección la primera vez (ej. el catálogo real de productos).
  const seedFile = seedPath(name);
  if (fs.existsSync(seedFile)) {
    const seedValue = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
    await write(name, seedValue);
    return seedValue;
  }
  return null;
}

async function write(name, data) {
  const database = await connect();
  await database.collection('store').updateOne(
    { _id: name },
    { $set: { value: data } },
    { upsert: true }
  );
  return data;
}

module.exports = { read, write, connect };
