# Florería Creaciones Alicia — Sitio web + Panel administrativo

Sitio web y panel administrativo para **Florería Creaciones Alicia** (Nuevo
Laredo, Tamaulipas). Incluye:

- Sitio público (catálogo, ocasiones, producto, sobre nosotros, contacto, políticas)
- Panel administrativo privado en `/admin` (productos, categorías, ofertas, contenido, mensajes)
- Servidor Node.js + Express
- **MongoDB Atlas** para guardar todos los datos (productos, categorías, textos) de forma permanente y gratuita
- **Cloudinary** para guardar las fotos que se suban desde el panel de forma permanente y gratuita

## 1. Arquitectura (cómo se conecta todo)

```
Panel administrativo (/admin)
        │  (login con sesión protegida)
        ▼
   API (Express, /api/...)
        │
        ├──► MongoDB Atlas (productos, categorías, textos, usuarios, mensajes)
        │
        └──► Cloudinary (fotos subidas desde el panel)
        │
        ▼
   API pública (/api/products, /api/categories, /api/site-content)
        │
        ▼
 Sitio público (index.html, ocasiones.html, producto.html, ...)
```

Los cambios que haces desde el panel se guardan en MongoDB Atlas y
Cloudinary — servicios en la nube independientes del servidor que hospeda
el sitio (Koyeb, Render, etc.). Así, aunque ese servidor se reinicie o se
duerma, **tus datos y fotos nunca se pierden**.

Las 58 fotos originales del catálogo siguen viviendo dentro del propio
proyecto (`public/images/productos`) porque forman parte del código en
GitHub y nunca se borran. Cloudinary se usa solo para las fotos NUEVAS que
subas desde el panel de aquí en adelante.

## 2. Cuentas gratuitas que necesitas crear (una sola vez)

### a) MongoDB Atlas (base de datos)

1. Entra a **mongodb.com/cloud/atlas/register** y crea una cuenta gratis.
2. Crea un clúster gratuito ("M0 Free").
3. En "Database Access", crea un usuario de base de datos con usuario y contraseña (guárdalos).
4. En "Network Access", agrega la IP `0.0.0.0/0` (permite conexión desde cualquier lugar — necesario porque tu hosting no tiene una IP fija).
5. Haz clic en "Connect" → "Drivers" y copia la cadena de conexión, que se ve así:
   ```
   mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/
   ```
   Esa cadena completa es tu `MONGODB_URI`.

### b) Cloudinary (fotos)

1. Entra a **cloudinary.com** y crea una cuenta gratis.
2. En tu Dashboard vas a ver de inmediato tres datos que necesitas:
   - `Cloud name`
   - `API Key`
   - `API Secret`
   Esos son tus `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

### c) Koyeb (o Render) — donde vive el sitio

Sigue las instrucciones de tu proveedor para crear un "Web Service" nuevo
conectado a tu repositorio de GitHub, con:

- **Build command:** `npm install`
- **Start command:** `npm start`

Y agrega estas **variables de entorno** (Environment Variables):

| Variable | Valor |
|---|---|
| `MONGODB_URI` | la cadena de conexión de MongoDB Atlas |
| `CLOUDINARY_CLOUD_NAME` | de tu dashboard de Cloudinary |
| `CLOUDINARY_API_KEY` | de tu dashboard de Cloudinary |
| `CLOUDINARY_API_SECRET` | de tu dashboard de Cloudinary |
| `SESSION_SECRET` | cualquier texto largo y secreto que tú inventes |

Una vez desplegado, entra a `https://tu-sitio.tu-hosting.app/admin` con el
usuario de prueba (ver abajo) y cámbialo de inmediato desde "Mi cuenta".

## 3. Instalación en tu propia computadora (opcional, para probar antes)

Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
cd floreria-alicia
npm install
```

Crea un archivo llamado `.env` en la raíz del proyecto con este contenido
(usando tus propios datos de MongoDB y Cloudinary):

```
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.xxxxx.mongodb.net/
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
SESSION_SECRET=una-frase-secreta-larga
```

```bash
npm start
```

Abre en tu navegador:
- Sitio público: http://localhost:3000
- Panel administrativo: http://localhost:3000/admin

## 4. Usuario administrador

La primera vez que el servidor arranca (y todavía no hay ningún usuario
guardado en MongoDB), se crea automáticamente uno de prueba:

- **Usuario:** `admin`
- **Contraseña:** `admin1234`

**Entra al panel y cámbialo de inmediato** desde el menú **"🔑 Mi cuenta"**
— no necesitas terminal ni comandos para esto.

## 5. Qué puedes hacer desde el panel (sin tocar código)

- Agregar, editar, activar/desactivar y eliminar productos.
- Subir varias fotografías por producto (se guardan en Cloudinary, para siempre).
- Crear, editar y eliminar categorías (con imagen propia).
- Marcar productos como "Nuevo", "Más vendido" o en "Oferta", y definir su precio de oferta.
- Editar todos los textos del sitio: portada, "nuestro objetivo", historia,
  información de contacto, redes sociales, envíos, métodos de pago y políticas.
- Ver los mensajes del formulario de contacto y las solicitudes de cotización de eventos.
- Cambiar tu usuario y contraseña del panel.

## 6. Datos reales ya cargados

Se cargaron **58 productos reales** extraídos directamente del catálogo
"SIN PRECIO" proporcionado (número de arreglo, contenido y estilo de
envoltorio, tal cual aparecen ahí), con sus fotografías reales. La primera
vez que el servidor se conecta a tu base de datos vacía, este catálogo se
copia automáticamente ahí — después de eso, todos los cambios se guardan
en MongoDB, no en estos archivos.

Como el catálogo no incluye precios, todos los productos muestran
"Consultar precio" con botón directo a WhatsApp hasta que tú los definas
desde el panel.

## 7. Estructura de carpetas

```
floreria-alicia/
├── package.json
├── README.md
├── server/
│   ├── server.js           <- servidor principal
│   ├── db.js                <- conexión y lectura/escritura en MongoDB Atlas
│   ├── create-admin.js       <- script de emergencia para crear/cambiar el admin
│   ├── middleware/auth.js    <- protección de rutas privadas
│   ├── routes/                 <- endpoints de la API
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── content.js
│   │   ├── upload.js           <- sube fotos a Cloudinary
│   │   └── messages.js
│   └── data/                    <- catálogo "semilla" real (solo se usa una vez)
│       ├── products.json
│       ├── categories.json
│       └── site-content.json
└── public/
    ├── index.html, ocasiones.html, producto.html, ...
    ├── css/styles.css
    ├── js/ (main.js, catalog.js, footer.js)
    ├── images/
    │   ├── productos/   <- fotos reales del catálogo (no se borran nunca)
    │   └── site/        <- logo
    └── admin/
        ├── index.html, login.html
        ├── css/admin.css
        └── js/admin.js
```

## 8. Novedades: Temporadas, TikTok viral, entregas, videos y colores de producto

- **Temporadas y campañas** (menú "🍂 Temporadas y campañas"): cada campaña
  (Flores Amarillas, San Valentín, Día de las Madres) tiene un interruptor
  de encendido/apagado. Al encenderla aparece automáticamente una sección
  especial en el inicio, con su propio color de tema. Ya viene cargada la
  campaña **Flores Amarillas** con 52 productos reales (precios reales del
  catálogo, aunque no se muestran en el sitio — ver punto siguiente) y
  **encendida**. San Valentín y Día de las Madres están creadas pero
  **apagadas**, listas para encenderlas cuando llegue la fecha.
- **Sin precios visibles**: todo el catálogo (los 58 originales y los 52 de
  Flores Amarillas) muestra "Pedir cotización por WhatsApp" en vez de un
  precio. Los precios siguen guardados internamente por si los necesitas de
  referencia, pero no se muestran al público.
- **TikTok viral** (menú "🎵 TikTok viral"): agrega el link de un video y el
  número de vistas (lo escribes tú, TikTok no lo comparte automáticamente);
  la miniatura y el título se obtienen solos. Aparece en el inicio, y al
  tocar un video se abre TikTok directamente.
- **Entregas a domicilio**: dentro de "Contenido del sitio", sube fotos y
  videos de clientes recibiendo sus arreglos. Aparecen en una sección de
  confianza en el inicio.
- **Videos y colores por producto**: al editar un producto puedes subir
  videos (hasta 60MB c/u) además de fotos, y marcar qué colores existen
  para ese diseño (amarillo, blanco, rojo, rosa, azul, verde, naranja) con
  un ícono de flor editable (rosa, gerbera, tulipán, lirio o sólido).

## 9. Próximos pasos sugeridos

- Definir precios reales por producto desde el panel.
- Revisar y ajustar la categoría de cada producto si lo deseas.
- Agregar productos para las categorías que aún no tienen ("Arreglos de
  simpatía", "Arreglos funerarios", "Ramos de novia", "Ramos de
  quinceañera", "Decoración para eventos").
- Completar horarios de atención y correo electrónico en la sección de
  Contenido del sitio.
- Cuando el negocio esté listo para pagos en línea, se puede agregar un
  carrito y checkout sin rediseñar el sitio, ya que la estructura de datos
  (productos, precios) ya está preparada para eso.
