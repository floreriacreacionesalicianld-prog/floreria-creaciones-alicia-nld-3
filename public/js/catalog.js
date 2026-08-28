/* catalog.js — lógica de productos, categorías, filtros y página de detalle */

let productosCache = null;
let categoriasCache = null;

async function fetchProductos() {
  if (productosCache) return productosCache;
  const res = await fetch(`${API}/products`);
  productosCache = await res.json();
  return productosCache;
}

async function fetchCategorias() {
  if (categoriasCache) return categoriasCache;
  const res = await fetch(`${API}/categories`);
  categoriasCache = await res.json();
  return categoriasCache;
}

function formatearPrecio(producto) {
  return '💬 Pedir cotización por WhatsApp';
}

function nombreCategoria(id, categorias) {
  const cat = categorias.find(c => c.id === id);
  return cat ? cat.nombre : id;
}

function tarjetaProductoHTML(p, categorias) {
  const foto = (p.fotos && p.fotos[0]) || 'images/site/placeholder.jpg';
  const catPrincipal = p.categorias && p.categorias[0] ? nombreCategoria(p.categorias[0], categorias) : '';
  let etiqueta = '';
  if (p.enOferta) etiqueta = '<span class="etiqueta etiqueta--oferta">Oferta</span>';
  else if (p.esNuevo) etiqueta = '<span class="etiqueta">Nuevo</span>';
  else if (p.masVendido) etiqueta = '<span class="etiqueta">Más vendido</span>';

  return `
    <a class="producto-card" href="producto.html?id=${p.id}">
      <div class="producto-card__imagen">
        <img src="${foto}" alt="${p.nombre}" loading="lazy">
        ${etiqueta}
      </div>
      <div class="producto-card__cuerpo">
        <div class="producto-card__categoria">${catPrincipal}</div>
        <div class="producto-card__nombre">${p.nombre} <span style="color:#b39a97;font-weight:400;">#${p.numero}</span></div>
        <div class="producto-card__precio">${formatearPrecio(p)}</div>
        <span class="btn btn--secundario btn--chico btn--bloque">Ver detalles</span>
      </div>
    </a>`;
}

/* ---------- Iconos de flor para variantes de color ---------- */
const PALETA_COLORES = {
  amarillo: '#f4c430', blanco: '#ffffff', rojo: '#c62828',
  rosa: '#ec6ea6', azul: '#3f7fd1', verde: '#4caf50', naranja: '#f28c28'
};

function iconoFlorSVG(tipo, colorHex, size) {
  size = size || 22;
  const color = colorHex || '#8a1f2c';
  const borde = color.toLowerCase() === '#ffffff' ? '#e2d6d4' : 'none';
  if (tipo === 'solido' || !tipo) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><circle cx="12" cy="12" r="10" fill="${color}" stroke="${borde}" stroke-width="1"/></svg>`;
  }
  if (tipo === 'tulipan') {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">
      <path d="M12 2c-3.2 3-5.2 6.2-5.2 9.2a5.2 5.2 0 0010.4 0C17.2 8.2 15.2 5 12 2z" fill="${color}" stroke="${borde}" stroke-width=".6"/>
      <rect x="11" y="15" width="2" height="7" rx="1" fill="#4c8a56"/>
    </svg>`;
  }
  const specs = {
    rosa: { n: 6, w: 6, len: 7 },
    gerbera: { n: 12, w: 3, len: 7.5 },
    lirio: { n: 6, w: 4, len: 10 }
  };
  const s = specs[tipo] || specs.rosa;
  let petalos = '';
  for (let i = 0; i < s.n; i++) {
    const angle = (360 / s.n) * i;
    petalos += `<ellipse cx="12" cy="${12 - s.len / 2 - 2}" rx="${s.w / 2}" ry="${s.len / 2}" fill="${color}" stroke="${borde}" stroke-width=".4" transform="rotate(${angle} 12 12)"/>`;
  }
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${petalos}<circle cx="12" cy="12" r="2.3" fill="#7a5b1e"/></svg>`;
}


async function initInicio() {
  const contNuevos = document.querySelector('#grid-nuevos');
  const contFavoritos = document.querySelector('#grid-favoritos');
  const contOfertas = document.querySelector('#grid-ofertas');
  const contCategorias = document.querySelector('#grid-categorias');
  const contTemporadas = document.querySelector('#temporadas-activas');
  const contTiktok = document.querySelector('#grid-tiktok');
  const contEntregas = document.querySelector('#grid-entregas');
  if (!contNuevos && !contFavoritos && !contOfertas && !contCategorias && !contTemporadas) return;

  const [productos, categorias, content] = await Promise.all([fetchProductos(), fetchCategorias(), getSiteContent()]);

  // ---- Secciones de temporada activas (Flores Amarillas, San Valentín, etc.) ----
  if (contTemporadas) {
    const activas = categorias.filter(c => c.esTemporada && c.activo);
    contTemporadas.innerHTML = activas.map(cat => {
      const productosTemporada = productos.filter(p => p.categorias.includes(cat.id)).slice(0, 8);
      if (!productosTemporada.length) return '';
      return `
        <section class="seccion-temporada" style="background-color:${cat.colorTema}22;">
          <div class="contenedor">
            <div class="temporada-encabezado">
              <span class="temporada-pastilla" style="background:${cat.colorTema};">Temporada especial</span>
              <h2 style="color:${cat.colorTema};">${cat.nombre}</h2>
              <p>${cat.descripcion || ''}</p>
            </div>
            <div class="productos-grid">
              ${productosTemporada.map(p => tarjetaProductoHTML(p, categorias)).join('')}
            </div>
            <p class="centro" style="margin-top:24px;">
              <a href="ocasiones.html?categoria=${cat.id}" class="btn btn--primario" style="background:${cat.colorTema};">Ver toda la colección</a>
            </p>
          </div>
        </section>`;
    }).join('');
  }

  // ---- Arreglos virales de TikTok ----
  if (contTiktok) {
    const tiktoks = (content.tiktoks || []).filter(t => t.url);
    contTiktok.innerHTML = tiktoks.length ? tiktoks.map(t => `
      <a class="tiktok-card" href="${t.url}" target="_blank" rel="noopener">
        ${t.miniatura ? `<img src="${t.miniatura}" alt="${t.titulo || 'Video de TikTok'}" loading="lazy">` : ''}
        <span class="tiktok-card__play">▶</span>
        <div class="tiktok-card__overlay">
          <span class="tiktok-card__vistas">👁️ ${t.vistasTexto || ''}</span>
        </div>
      </a>
    `).join('') : '<p class="estado-vacio">Muy pronto compartiremos nuestros videos de TikTok aquí.</p>';
  }

  // ---- Entregas a domicilio (fotos/videos de confianza) ----
  if (contEntregas) {
    const medios = (content.entregas && content.entregas.medios) || [];
    contEntregas.innerHTML = medios.length ? medios.map(m => `
      <div class="entregas-card">
        ${m.tipo === 'video'
          ? `<video src="${m.url}" muted loop autoplay playsinline></video>`
          : `<img src="${m.url}" alt="Entrega a domicilio Creaciones Alicia" loading="lazy">`}
      </div>
    `).join('') : '<p class="estado-vacio">Muy pronto compartiremos fotos y videos de nuestras entregas aquí.</p>';
  }

  if (contCategorias) {
    contCategorias.innerHTML = categorias.filter(c => !c.esTemporada).map(c => {
      if (!c.imagen) {
        return `<a class="categoria-card categoria-card--vacia" href="ocasiones.html?categoria=${c.id}"><span>${c.nombre}<br>(próximamente)</span></a>`;
      }
      return `
        <a class="categoria-card" href="ocasiones.html?categoria=${c.id}">
          <img src="${c.imagen}" alt="${c.nombre}" loading="lazy">
          <div class="categoria-card__overlay"><span>${c.nombre}</span></div>
        </a>`;
    }).join('');
  }

  if (contNuevos) {
    const nuevos = productos.filter(p => p.esNuevo).slice(0, 8);
    contNuevos.innerHTML = nuevos.length
      ? nuevos.map(p => tarjetaProductoHTML(p, categorias)).join('')
      : '<p class="estado-vacio">Pronto agregaremos nuevos diseños aquí.</p>';
  }

  if (contFavoritos) {
    const favoritos = productos.filter(p => p.masVendido).slice(0, 8);
    contFavoritos.innerHTML = favoritos.length
      ? favoritos.map(p => tarjetaProductoHTML(p, categorias)).join('')
      : '<p class="estado-vacio">Muy pronto verás aquí a nuestros favoritos.</p>';
  }

  if (contOfertas) {
    const ofertas = productos.filter(p => p.enOferta).slice(0, 6);
    contOfertas.innerHTML = ofertas.length
      ? ofertas.map(p => tarjetaProductoHTML(p, categorias)).join('')
      : '<p class="estado-vacio">No hay ofertas activas por el momento. ¡Vuelve pronto!</p>';
  }
}

/* =========================================================
   PÁGINA DE OCASIONES (catálogo completo con filtros)
   ========================================================= */
async function initOcasiones() {
  const grid = document.querySelector('#grid-ocasiones');
  if (!grid) return;

  const [productos, categorias] = await Promise.all([fetchProductos(), fetchCategorias()]);
  const params = new URLSearchParams(location.search);
  let filtroCategoria = params.get('categoria') || 'todos';
  let textoBusqueda = '';

  const contChips = document.querySelector('#chips-categorias');
  const inputBuscar = document.querySelector('#input-buscar');

  function chipsHTML() {
    const todos = [{ id: 'todos', nombre: 'Todos' }, ...categorias.filter(c => !c.esTemporada)];
    return todos.map(c =>
      `<button class="chip ${filtroCategoria === c.id ? 'activo' : ''}" data-cat="${c.id}">${c.nombre}</button>`
    ).join('');
  }

  function render() {
    let lista = productos;
    if (filtroCategoria !== 'todos') {
      lista = lista.filter(p => p.categorias.includes(filtroCategoria));
    }
    if (textoBusqueda.trim()) {
      const q = textoBusqueda.trim().toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        String(p.numero).includes(q) ||
        (p.incluye || []).some(i => i.toLowerCase().includes(q))
      );
    }
    grid.innerHTML = lista.length
      ? lista.map(p => tarjetaProductoHTML(p, categorias)).join('')
      : '<p class="estado-vacio">No encontramos arreglos con ese criterio. Intenta con otra categoría o palabra.</p>';

    if (contChips) contChips.innerHTML = chipsHTML();
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        filtroCategoria = chip.getAttribute('data-cat');
        render();
      });
    });
  }

  inputBuscar?.addEventListener('input', e => {
    textoBusqueda = e.target.value;
    render();
  });

  render();
}

/* =========================================================
   PÁGINA DE DETALLE DE PRODUCTO
   ========================================================= */
async function initDetalleProducto() {
  const cont = document.querySelector('#detalle-producto');
  if (!cont) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const [productos, categorias, content] = await Promise.all([fetchProductos(), fetchCategorias(), getSiteContent()]);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    cont.innerHTML = '<p class="estado-vacio">No encontramos este arreglo. <a href="ocasiones.html">Ver todos los arreglos</a></p>';
    return;
  }

  document.title = `${producto.nombre} — Florería Creaciones Alicia`;
  const fotos = producto.fotos && producto.fotos.length ? producto.fotos : ['images/site/placeholder.jpg'];
  const videos = producto.videos || [];
  const catNombres = producto.categorias.map(id => nombreCategoria(id, categorias)).join(' · ');
  const whatsappTexto = `Hola, me interesa el arreglo "${producto.nombre}" (#${producto.numero}) que vi en su página web. ¿Me pueden dar más información?`;
  const linkWa = linkWhatsApp((content.contacto || {}).whatsapp, whatsappTexto);
  const colores = producto.colores || [];

  cont.innerHTML = `
    <div>
      <div class="galeria__principal" id="galeria-principal">
        <img id="foto-principal" src="${fotos[0]}" alt="${producto.nombre}">
      </div>
      ${(fotos.length + videos.length) > 1 ? `
        <div class="galeria__miniaturas">
          ${fotos.map((f, i) => `<img src="${f}" class="${i === 0 ? 'activa' : ''}" data-tipo="foto" data-src="${f}">`).join('')}
          ${videos.map((v) => `<div class="miniatura-video" data-tipo="video" data-src="${v}">▶</div>`).join('')}
        </div>` : ''}
    </div>
    <div>
      <div class="detalle__categoria">${catNombres}</div>
      <h1 style="margin-top:.2em;">${producto.nombre}</h1>
      <p style="color:#b39a97;font-weight:600;margin-top:-10px;">Arreglo #${producto.numero}</p>
      <div class="detalle__precio">💬 Pedir cotización por WhatsApp</div>
      ${colores.length ? `
        <div>
          <strong>Colores disponibles:</strong>
          <div class="color-swatches">
            ${colores.map(c => `<span class="color-swatch" title="${c}">${iconoFlorSVG(producto.iconoColor, PALETA_COLORES[c] || c)}</span>`).join('')}
          </div>
        </div>` : ''}
      ${producto.descripcion ? `<p>${producto.descripcion}</p>` : ''}
      ${producto.incluye && producto.incluye.length ? `<strong>Incluye:</strong><ul class="detalle__lista">${producto.incluye.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
      <div class="detalle__meta">
        ${producto.tamano ? `<span>Tamaño: ${producto.tamano}</span>` : ''}
        <span>${producto.disponible ? 'Disponible' : 'Sobre pedido'}</span>
      </div>
      <div class="detalle__botones">
        <a class="btn btn--whatsapp" href="${linkWa}" target="_blank" rel="noopener">Solicitar por WhatsApp</a>
        <a class="btn btn--primario" href="${linkWa}" target="_blank" rel="noopener">Hacer mi pedido</a>
      </div>
    </div>
  `;

  document.querySelectorAll('.galeria__miniaturas [data-src]').forEach(el => {
    el.addEventListener('click', () => {
      const galeria = document.querySelector('#galeria-principal');
      if (el.getAttribute('data-tipo') === 'video') {
        galeria.innerHTML = `<video src="${el.getAttribute('data-src')}" controls autoplay style="width:100%;height:100%;object-fit:cover;"></video>`;
      } else {
        galeria.innerHTML = `<img id="foto-principal" src="${el.getAttribute('data-src')}" alt="${producto.nombre}">`;
      }
      document.querySelectorAll('.galeria__miniaturas [data-src]').forEach(i => i.classList.remove('activa'));
      el.classList.add('activa');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initInicio();
  initOcasiones();
  initDetalleProducto();
});
