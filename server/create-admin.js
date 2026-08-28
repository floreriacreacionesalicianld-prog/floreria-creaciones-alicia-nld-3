// create-admin.js
// Script de línea de comandos para crear o actualizar el usuario del panel
// administrativo directamente en MongoDB Atlas. Se ejecuta con:
//
//   npm run create-admin -- usuario contraseña
//
// Nota: normalmente NO necesitas este script, porque el panel ya tiene una
// sección "Mi cuenta" para cambiar tu usuario/contraseña sin usar la
// terminal. Este script es útil solo si alguna vez pierdes el acceso.
//
// Requiere que la variable de entorno MONGODB_URI esté configurada
// (por ejemplo corriendo este comando en tu propia computadora con un
// archivo .env, o desde la consola del hosting si la ofrece).

const bcrypt = require('bcryptjs');
const db = require('./db');

const args = process.argv.slice(2);
const username = args[0] || 'admin';
const password = args[1] || 'admin1234';

(async () => {
  try {
    const hash = bcrypt.hashSync(password, 10);
    await db.write('admin-users', [{ username, passwordHash: hash }]);
    console.log('----------------------------------------------------');
    console.log('Usuario administrador guardado correctamente en MongoDB.');
    console.log('Usuario:    ', username);
    console.log('Contraseña: ', password === 'admin1234' ? '(usaste la de ejemplo: admin1234, cámbiala en "Mi cuenta")' : '(la que definiste)');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('No se pudo guardar el usuario administrador:', err.message);
    process.exit(1);
  }
})();
