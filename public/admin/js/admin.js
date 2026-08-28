/* admin.js — lógica completa del panel administrativo (vanilla JS, sin frameworks) */

const API = '/api';
let productos = [];
let categorias = [];

/* ---------------- Autenticación ---------------- */
async function verificarSesion() {
  const res = await fetch(`${API}/me`);
  const data = await res.json();
  if (!data.loggedIn) {
    location.href = '/admin/login.html';
    return false;
  }
  return true;
}

document.querySelector('#btn-cerrar-sesion').addEventListener('click', async () => {
  await fetch(`${API}/logout`, { method: 'POST' });
  location.href = '/admin/login.html';
});

/* ---------------- Navegación entre vistas ---------------- */
const vistas = ['dashboard', 'productos', 'categorias', 'ofertas', 'temporadas', 'tiktok', 'contenido', 'mensajes', 'eventos', 'cuenta'];
const titulos = {
  dashboard: 'Resumen', productos: 'Productos', categorias: 'Categorías',
  ofertas: 'Ofertas y destacados', temporadas: 'Temporadas y campañas', tiktok: 'TikTok viral',
  contenido: 'Contenido del sitio',
  mensajes: 'Mensajes de contacto', eventos: 'Cotizaciones de eventos',
  cuenta: 'Mi cuenta'
};

function mostrarVista(nombre) {
  vistas.forEach(v => {
    document.querySelector(`#vista-${v}`).style.display = v === nombre ? 'block' : 'none';
  });
  document.querySelectorAll('.admin-nav button').forEach(b => b.classList.toggle('activo', b.dataset.vista === nombre));
  document.querySelector('#titulo-vista').textContent = titulos[nombre];
  document.querySelector('#sidebar').classList.remove('abierta');

  if (nombre === 'dashboard') renderDashboard();
  if (nombre === 'productos') renderProductos();
  if (nombre === 'categorias') renderCategorias();
  if (nombre === 'ofertas') renderOfertas();
  if (nombre === 'temporadas') renderTemporadas();
  if (nombre === 'tiktok') renderTiktok();
  if (nombre === 'contenido') renderContenido();
  if (nombre === 'mensajes') renderMensajes();
  if (nombre === 'eventos') renderEventos();
  if (nombre === 'cuenta') renderCuenta();
}

document.querySelector('#admin-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-vista]');
  if (btn) mostrarVista(btn.dataset.vista);
});
document.querySelector('#btn-menu-toggle').addEventListener('click', () => {
  document.querySelector('#sidebar').classList.toggle('abierta');
});

/* ---------------- Utilidades ---------------- */
async function cargarDatos() {
  const [pRes, cRes] = await Promise.all([
    fetch(`${API}/admin/products`),
    fetch(`${API}/admin/categories`)
  ]);
  productos = await pRes.json();
  categorias = await cRes.json();
}

function nombreCategoria(id) {
  const c = categorias.find(c => c.id === id);
  return c ? c.nombre : id;
}

// Las fotos originales del catálogo son rutas locales ("images/productos/x.jpg")
// y las fotos subidas desde el panel son URLs completas de Cloudinary
// ("https://res.cloudinary.com/..."). Esta función arma el src correcto para ambos casos.
function urlFoto(ruta) {
  if (!ruta) return '';
  return ruta.startsWith('http') ? ruta : '/' + ruta;
}

function abrirModal(html) {
  document.querySelector('#modal-contenido').innerHTML = html;
  document.querySelector('#modal-fondo').classList.add('abierto');
}
function cerrarModal() {
  document.querySelector('#modal-fondo').classList.remove('abierto');
  document.querySelector('#modal-contenido').innerHTML = '';
}
document.querySelector('#modal-fondo').addEventListener('click', (e) => {
  if (e.target.id === 'modal-fondo') cerrarModal();
});

/* ================================================================
   DASHBOARD
   ================================================================ */
async function renderDashboard() {
  const cont = document.querySelector('#vista-dashboard');
  cont.innerHTML = '<div class="spinner"></div>';
  const [mensajesRes, eventosRes] = await Promise.all([
    fetch(`${API}/admin/mensajes-contacto`),
    fetch(`${API}/admin/cotizaciones-eventos`)
  ]);
  const mensajes = await mensajesRes.json();
  const eventos = await eventosRes.json();

  const activos = productos.filter(p => p.activo).length;
  const enOferta = productos.filter(p => p.enOferta).length;
  const sinLeer = mensajes.filter(m => !m.leido).length + eventos.filter(e => !e.leido).length;

  cont.innerHTML = `
    <div class="admin-stats">
      <div class="admin-stat"><strong>${productos.length}</strong><span>Productos totales</span></div>
      <div class="admin-stat"><strong>${activos}</strong><span>Productos activos</span></div>
      <div class="admin-stat"><strong>${enOferta}</strong><span>En oferta</span></div>
      <div class="admin-stat"><strong>${sinLeer}</strong><span>Mensajes sin leer</span></div>
    </div>
    <div class="admin-card">
      <h3 style="margin-top:0;">Bienvenida a tu panel</h3>
      <p>Desde aquí puedes agregar y editar productos, fotografías, categorías, ofertas y todo el contenido del sitio sin tocar código. Los cambios se reflejan de inmediato en la página pública.</p>
    </div>
  `;
}

/* ================================================================
   PRODUCTOS
   ================================================================ */
function renderProductos() {
  const cont = document.querySelector('#vista-productos');
  cont.innerHTML = `
    <div class="admin-toolbar">
      <input type="text" id="buscar-producto" placeholder="Buscar por nombre o número..." style="padding:10px 14px;border:1.5px solid var(--gris-borde);border-radius:10px;min-width:240px;">
      <button class="btn btn--primario btn--chico" id="btn-nuevo-producto">+ Agregar producto</button>
    </div>
    <div class="admin-card admin-tabla-wrap">
      <table class="admin-tabla">
        <thead><tr><th>Foto</th><th>#</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Etiquetas</th><th>Acciones</th></tr></thead>
        <tbody id="tabla-productos"></tbody>
      </table>
    </div>
  `;

  function pintar(lista) {
    document.querySelector('#tabla-productos').innerHTML = lista.map(p => `
      <tr>
        <td><img src="${urlFoto((p.fotos && p.fotos[0]) || '')}" alt=""></td>
        <td>#${p.numero}</td>
        <td>${p.nombre}</td>
        <td>${(p.categorias || []).map(nombreCategoria).join(', ')}</td>
        <td>${p.enOferta ? `$${p.precioOferta || '—'}` : (p.precio ? `$${p.precio}` : 'Sin precio')}</td>
        <td>${p.activo ? '<span class="pastilla pastilla--verde">Activo</span>' : '<span class="pastilla pastilla--gris">Inactivo</span>'}</td>
        <td>
          ${p.esNuevo ? '<span class="pastilla pastilla--dorada">Nuevo</span> ' : ''}
          ${p.masVendido ? '<span class="pastilla pastilla--dorada">Más vendido</span> ' : ''}
          ${p.enOferta ? '<span class="pastilla pastilla--roja">Oferta</span>' : ''}
        </td>
        <td>
          <div class="acciones-fila">
            <button class="icon-btn" title="Editar" data-editar="${p.id}">✏️</button>
            <button class="icon-btn" title="${p.activo ? 'Desactivar' : 'Activar'}" data-toggle="${p.id}">${p.activo ? '🙈' : '👁️'}</button>
            <button class="icon-btn icon-btn--peligro" title="Eliminar" data-eliminar="${p.id}">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8">No hay productos todavía.</td></tr>';
  }
  pintar(productos);

  document.querySelector('#buscar-producto').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    pintar(productos.filter(p => p.nombre.toLowerCase().includes(q) || String(p.numero).includes(q)));
  });

  document.querySelector('#btn-nuevo-producto').addEventListener('click', () => abrirFormularioProducto(null));

  document.querySelector('#tabla-productos').addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-editar]')?.dataset.editar;
    const toggleId = e.target.closest('[data-toggle]')?.dataset.toggle;
    const delId = e.target.closest('[data-eliminar]')?.dataset.eliminar;

    if (editId) abrirFormularioProducto(productos.find(p => p.id === editId));

    if (toggleId) {
      const p = productos.find(p => p.id === toggleId);
      await fetch(`${API}/admin/products/${toggleId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !p.activo })
      });
      await cargarDatos();
      renderProductos();
    }

    if (delId) {
      if (!confirm('¿Eliminar este producto de forma permanente?')) return;
      await fetch(`${API}/admin/products/${delId}`, { method: 'DELETE' });
      await cargarDatos();
      renderProductos();
    }
  });
}

function abrirFormularioProducto(producto) {
  const esNuevo = !producto;
  const p = producto || {
    numero: '', nombre: '', categorias: [], precio: '', precioOferta: '', enOferta: false,
    descripcion: '', incluye: [], tamano: '', disponible: true, activo: true,
    esNuevo: false, masVendido: false, fotos: []
  };

  abrirModal(`
    <div class="modal__header">
      <h2>${esNuevo ? 'Agregar producto' : 'Editar producto'}</h2>
      <button class="modal__cerrar" id="cerrar-modal-producto">&times;</button>
    </div>
    <form id="form-producto" class="formulario formulario--2col">
      <div class="campo"><label>Número de arreglo</label><input type="number" name="numero" value="${p.numero}"></div>
      <div class="campo"><label>Nombre</label><input type="text" name="nombre" value="${p.nombre}" required></div>

      <div class="campo campo--ancho">
        <label>Categorías</label>
        <div class="checkbox-grupo">
          ${categorias.map(c => `
            <label class="checkbox-fila">
              <input type="checkbox" name="categorias" value="${c.id}" ${p.categorias.includes(c.id) ? 'checked' : ''}>
              ${c.nombre}
            </label>`).join('')}
        </div>
      </div>

      <div class="campo"><label>Precio regular (MXN)</label><input type="number" name="precio" value="${p.precio ?? ''}" placeholder="Vacío = Consultar precio"></div>
      <div class="campo"><label>Precio de oferta (MXN)</label><input type="number" name="precioOferta" value="${p.precioOferta ?? ''}"></div>

      <div class="campo"><label>Tamaño (opcional)</label><input type="text" name="tamano" value="${p.tamano || ''}"></div>
      <div class="campo">
        <label>Disponibilidad</label>
        <select name="disponible">
          <option value="true" ${p.disponible ? 'selected' : ''}>Disponible</option>
          <option value="false" ${!p.disponible ? 'selected' : ''}>Sobre pedido</option>
        </select>
      </div>

      <div class="campo campo--ancho"><label>Descripción / notas</label><textarea name="descripcion">${p.descripcion || ''}</textarea></div>
      <div class="campo campo--ancho"><label>Incluye (una línea por elemento)</label><textarea name="incluye">${(p.incluye || []).join('\n')}</textarea></div>

      <div class="campo campo--ancho">
        <label>Fotografías</label>
        <div class="fotos-grid" id="fotos-grid">
          ${(p.fotos || []).map(f => `<div class="foto-mini"><img src="${urlFoto(f)}"><button type="button" data-quitar-foto="${f}">&times;</button></div>`).join('')}
          <label class="foto-subir">+
            <input type="file" id="input-fotos" multiple accept="image/*" style="display:none;">
          </label>
        </div>
      </div>

      <div class="campo campo--ancho">
        <label>Videos del producto (opcional)</label>
        <div class="fotos-grid" id="videos-grid">
          ${(p.videos || []).map(v => `<div class="foto-mini"><video src="${v}" muted style="width:100%;height:100%;object-fit:cover;"></video><button type="button" data-quitar-video="${v}">&times;</button></div>`).join('')}
          <label class="foto-subir">+
            <input type="file" id="input-videos" multiple accept="video/*" style="display:none;">
          </label>
        </div>
        <p style="font-size:.8rem;color:var(--gris-texto);margin-top:4px;">Videos hasta 60MB cada uno.</p>
      </div>

      <div class="campo campo--ancho">
        <label>Icono de flor para los colores</label>
        <select name="iconoColor" id="select-icono-color">
          <option value="rosa" ${p.iconoColor === 'rosa' || !p.iconoColor ? 'selected' : ''}>Rosa</option>
          <option value="gerbera" ${p.iconoColor === 'gerbera' ? 'selected' : ''}>Gerbera</option>
          <option value="tulipan" ${p.iconoColor === 'tulipan' ? 'selected' : ''}>Tulipán</option>
          <option value="lirio" ${p.iconoColor === 'lirio' ? 'selected' : ''}>Lirio</option>
          <option value="solido" ${p.iconoColor === 'solido' ? 'selected' : ''}>Sólido (círculo)</option>
        </select>
      </div>

      <div class="campo campo--ancho">
        <label>Colores disponibles de este arreglo</label>
        <div class="checkbox-grupo" id="grupo-colores">
          ${['amarillo','blanco','rojo','rosa','azul','verde','naranja'].map(color => `
            <label class="checkbox-fila">
              <input type="checkbox" name="colores" value="${color}" ${(p.colores || []).includes(color) ? 'checked' : ''}>
              ${color.charAt(0).toUpperCase() + color.slice(1)}
            </label>`).join('')}
        </div>
      </div>

      <div class="campo--ancho checkbox-grupo">
        <label class="checkbox-fila"><input type="checkbox" name="esNuevo" ${p.esNuevo ? 'checked' : ''}> Marcar como Nuevo</label>
        <label class="checkbox-fila"><input type="checkbox" name="masVendido" ${p.masVendido ? 'checked' : ''}> Marcar como Más vendido</label>
        <label class="checkbox-fila"><input type="checkbox" name="enOferta" ${p.enOferta ? 'checked' : ''}> Activar oferta</label>
        <label class="checkbox-fila"><input type="checkbox" name="activo" ${p.activo !== false ? 'checked' : ''}> Producto activo (visible en el sitio)</label>
      </div>

      <div class="campo--ancho" style="display:flex;gap:12px;">
        <button type="submit" class="btn btn--primario">Guardar producto</button>
        <button type="button" class="btn btn--secundario" id="cancelar-modal-producto">Cancelar</button>
      </div>
    </form>
  `);

  let fotosActuales = [...(p.fotos || [])];
  let videosActuales = [...(p.videos || [])];

  document.querySelector('#cerrar-modal-producto').addEventListener('click', cerrarModal);
  document.querySelector('#cancelar-modal-producto').addEventListener('click', cerrarModal);

  document.querySelector('#fotos-grid').addEventListener('click', (e) => {
    const quitar = e.target.closest('[data-quitar-foto]');
    if (quitar) {
      fotosActuales = fotosActuales.filter(f => f !== quitar.dataset.quitarFoto);
      quitar.closest('.foto-mini').remove();
    }
  });

  document.querySelector('#videos-grid').addEventListener('click', (e) => {
    const quitar = e.target.closest('[data-quitar-video]');
    if (quitar) {
      videosActuales = videosActuales.filter(v => v !== quitar.dataset.quitarVideo);
      quitar.closest('.foto-mini').remove();
    }
  });

  document.querySelector('#input-videos').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (const f of files) formData.append('videos', f);
    const grid = document.querySelector('#videos-grid');
    const subirBtn = grid.querySelector('.foto-subir');
    const cargando = document.createElement('div');
    cargando.textContent = 'Subiendo...';
    cargando.style.cssText = 'font-size:.75rem;color:var(--gris-texto);';
    grid.insertBefore(cargando, subirBtn);
    try {
      const res = await fetch(`${API}/admin/upload-video`, { method: 'POST', body: formData });
      const data = await res.json();
      cargando.remove();
      if (data.rutas) {
        videosActuales.push(...data.rutas);
        data.rutas.forEach(ruta => {
          const div = document.createElement('div');
          div.className = 'foto-mini';
          div.innerHTML = `<video src="${ruta}" muted style="width:100%;height:100%;object-fit:cover;"><\/video><button type="button" data-quitar-video="${ruta}">&times;</button>`;
          grid.insertBefore(div, subirBtn);
        });
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      cargando.remove();
      alert('No se pudo subir el video.');
    }
  });

  document.querySelector('#input-fotos').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (const f of files) formData.append('fotos', f);
    const res = await fetch(`${API}/admin/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.rutas) {
      fotosActuales.push(...data.rutas);
      const grid = document.querySelector('#fotos-grid');
      const subirBtn = grid.querySelector('.foto-subir');
      data.rutas.forEach(ruta => {
        const div = document.createElement('div');
        div.className = 'foto-mini';
        div.innerHTML = `<img src="${urlFoto(ruta)}"><button type="button" data-quitar-foto="${ruta}">&times;</button>`;
        grid.insertBefore(div, subirBtn);
      });
    }
  });

  document.querySelector('#form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const body = {
      numero: Number(fd.get('numero')) || 0,
      nombre: fd.get('nombre'),
      categorias: fd.getAll('categorias'),
      precio: fd.get('precio') ? Number(fd.get('precio')) : null,
      precioOferta: fd.get('precioOferta') ? Number(fd.get('precioOferta')) : null,
      tamano: fd.get('tamano'),
      disponible: fd.get('disponible') === 'true',
      descripcion: fd.get('descripcion'),
      incluye: fd.get('incluye').split('\n').map(s => s.trim()).filter(Boolean),
      esNuevo: fd.get('esNuevo') === 'on',
      masVendido: fd.get('masVendido') === 'on',
      enOferta: fd.get('enOferta') === 'on',
      activo: fd.get('activo') === 'on',
      fotos: fotosActuales,
      videos: videosActuales,
      colores: fd.getAll('colores'),
      iconoColor: fd.get('iconoColor') || 'rosa'
    };

    if (esNuevo) {
      await fetch(`${API}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/admin/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    cerrarModal();
    await cargarDatos();
    renderProductos();
  });
}

/* ================================================================
   CATEGORÍAS
   ================================================================ */
function renderCategorias() {
  const cont = document.querySelector('#vista-categorias');
  cont.innerHTML = `
    <div class="admin-toolbar">
      <span></span>
      <button class="btn btn--primario btn--chico" id="btn-nueva-categoria">+ Agregar categoría</button>
    </div>
    <div class="admin-card admin-tabla-wrap">
      <table class="admin-tabla">
        <thead><tr><th>Imagen</th><th>Nombre</th><th>Descripción</th><th>Productos</th><th>Visible</th><th>Acciones</th></tr></thead>
        <tbody id="tabla-categorias"></tbody>
      </table>
    </div>
  `;

  const listaCategorias = categorias.filter(c => !c.esTemporada);

  function pintar() {
    document.querySelector('#tabla-categorias').innerHTML = listaCategorias.map(c => `
      <tr>
        <td>${c.imagen ? `<img src="${urlFoto(c.imagen)}">` : '—'}</td>
        <td>${c.nombre}</td>
        <td>${c.descripcion || ''}</td>
        <td>${productos.filter(p => p.categorias.includes(c.id)).length}</td>
        <td><label class="checkbox-fila"><input type="checkbox" data-toggle-cat="${c.id}" ${c.activo !== false ? 'checked' : ''}></label></td>
        <td>
          <div class="acciones-fila">
            <button class="icon-btn" data-editar-cat="${c.id}">✏️</button>
            <button class="icon-btn icon-btn--peligro" data-eliminar-cat="${c.id}">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  pintar();

  document.querySelector('#btn-nueva-categoria').addEventListener('click', () => abrirFormularioCategoria(null));

  document.querySelector('#tabla-categorias').addEventListener('change', async (e) => {
    const toggle = e.target.closest('[data-toggle-cat]');
    if (!toggle) return;
    await fetch(`${API}/admin/categories/${toggle.dataset.toggleCat}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: toggle.checked })
    });
    await cargarDatos();
  });

  document.querySelector('#tabla-categorias').addEventListener('click', async (e) => {
    const editId = e.target.closest('[data-editar-cat]')?.dataset.editarCat;
    const delId = e.target.closest('[data-eliminar-cat]')?.dataset.eliminarCat;
    if (editId) abrirFormularioCategoria(categorias.find(c => c.id === editId));
    if (delId) {
      if (!confirm('¿Eliminar esta categoría? Los productos no se eliminarán, pero quedarán sin esta categoría.')) return;
      await fetch(`${API}/admin/categories/${delId}`, { method: 'DELETE' });
      await cargarDatos();
      renderCategorias();
    }
  });
}

function abrirFormularioCategoria(categoria) {
  const esNueva = !categoria;
  const c = categoria || { nombre: '', descripcion: '', imagen: '' };

  abrirModal(`
    <div class="modal__header">
      <h2>${esNueva ? 'Agregar categoría' : 'Editar categoría'}</h2>
      <button class="modal__cerrar" id="cerrar-modal-cat">&times;</button>
    </div>
    <form id="form-categoria" class="formulario">
      <div class="campo"><label>Nombre</label><input type="text" name="nombre" value="${c.nombre}" required></div>
      <div class="campo"><label>Descripción</label><input type="text" name="descripcion" value="${c.descripcion || ''}"></div>
      <div class="campo">
        <label>Imagen representativa</label>
        <div class="fotos-grid" id="cat-fotos-grid">
          ${c.imagen ? `<div class="foto-mini"><img src="${urlFoto(c.imagen)}"></div>` : ''}
          <label class="foto-subir">+<input type="file" id="cat-input-foto" accept="image/*" style="display:none;"></label>
        </div>
      </div>
      <div style="display:flex;gap:12px;">
        <button type="submit" class="btn btn--primario">Guardar categoría</button>
        <button type="button" class="btn btn--secundario" id="cancelar-modal-cat">Cancelar</button>
      </div>
    </form>
  `);

  let imagenActual = c.imagen || '';

  document.querySelector('#cerrar-modal-cat').addEventListener('click', cerrarModal);
  document.querySelector('#cancelar-modal-cat').addEventListener('click', cerrarModal);

  document.querySelector('#cat-input-foto').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    formData.append('fotos', files[0]);
    const res = await fetch(`${API}/admin/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.rutas && data.rutas[0]) {
      imagenActual = data.rutas[0];
      const grid = document.querySelector('#cat-fotos-grid');
      const subirBtn = grid.querySelector('.foto-subir');
      const div = document.createElement('div');
      div.className = 'foto-mini';
      div.innerHTML = `<img src="${urlFoto(imagenActual)}">`;
      grid.insertBefore(div, subirBtn);
    }
  });

  document.querySelector('#form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { nombre: fd.get('nombre'), descripcion: fd.get('descripcion'), imagen: imagenActual };
    if (esNueva) {
      await fetch(`${API}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/admin/categories/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    cerrarModal();
    await cargarDatos();
    renderCategorias();
  });
}

/* ================================================================
   OFERTAS Y DESTACADOS (edición rápida sin abrir el modal completo)
   ================================================================ */
function renderOfertas() {
  const cont = document.querySelector('#vista-ofertas');
  cont.innerHTML = `
    <div class="admin-card">
      <p>Activa o desactiva rápidamente las etiquetas de <strong>Nuevo</strong>, <strong>Más vendido</strong> y <strong>Oferta</strong> de cada producto. Para cambiar el precio de oferta, edita el producto completo desde la sección Productos.</p>
    </div>
    <div class="admin-card admin-tabla-wrap">
      <table class="admin-tabla">
        <thead><tr><th>Foto</th><th>#</th><th>Nombre</th><th>Precio</th><th>Precio oferta</th><th>Nuevo</th><th>Más vendido</th><th>Oferta</th></tr></thead>
        <tbody id="tabla-ofertas"></tbody>
      </table>
    </div>
  `;

  function pintar() {
    document.querySelector('#tabla-ofertas').innerHTML = productos.map(p => `
      <tr>
        <td><img src="${urlFoto((p.fotos && p.fotos[0]) || '')}" alt=""></td>
        <td>#${p.numero}</td>
        <td>${p.nombre}</td>
        <td>${p.precio ? '$' + p.precio : '—'}</td>
        <td>${p.precioOferta ? '$' + p.precioOferta : '—'}</td>
        <td><input type="checkbox" data-toggle-flag="esNuevo" data-id="${p.id}" ${p.esNuevo ? 'checked' : ''}></td>
        <td><input type="checkbox" data-toggle-flag="masVendido" data-id="${p.id}" ${p.masVendido ? 'checked' : ''}></td>
        <td><input type="checkbox" data-toggle-flag="enOferta" data-id="${p.id}" ${p.enOferta ? 'checked' : ''}></td>
      </tr>
    `).join('');
  }
  pintar();

  document.querySelector('#tabla-ofertas').addEventListener('change', async (e) => {
    const input = e.target.closest('[data-toggle-flag]');
    if (!input) return;
    const id = input.dataset.id;
    const flag = input.dataset.toggleFlag;
    await fetch(`${API}/admin/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [flag]: input.checked })
    });
    await cargarDatos();
  });
}

/* ================================================================
   TEMPORADAS Y CAMPAÑAS (Flores Amarillas, San Valentín, Día de las Madres...)
   ================================================================ */
function renderTemporadas() {
  const cont = document.querySelector('#vista-temporadas');
  const temporadas = categorias.filter(c => c.esTemporada);

  cont.innerHTML = `
    <div class="admin-card">
      <p>Cada campaña de temporada tiene su propio interruptor. Cuando la <strong>enciendes</strong>, aparece automáticamente una sección especial en la página de inicio (con su color de tema) y sus productos se pueden filtrar en Ocasiones. Cuando la <strong>apagas</strong>, desaparece del sitio público de inmediato — los productos y fotos no se borran, solo se ocultan.</p>
    </div>
    <div class="admin-toolbar">
      <span></span>
      <button class="btn btn--primario btn--chico" id="btn-nueva-temporada">+ Agregar campaña de temporada</button>
    </div>
    <div id="tarjetas-temporadas" style="display:grid;gap:16px;grid-template-columns:1fr;"></div>
  `;

  function pintar() {
    document.querySelector('#tarjetas-temporadas').innerHTML = temporadas.map(t => `
      <div class="admin-card" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;border-left:6px solid ${t.colorTema || '#ccc'};">
        ${t.imagen ? `<img src="${urlFoto(t.imagen)}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;">` : `<div style="width:64px;height:64px;border-radius:10px;background:${t.colorTema || '#eee'};"></div>`}
        <div style="flex:1;min-width:180px;">
          <strong style="font-size:1.05rem;">${t.nombre}</strong>
          <p style="margin:2px 0 0;font-size:.85rem;">${productos.filter(p => p.categorias.includes(t.id)).length} productos · ${t.fechaFin ? `hasta ${t.fechaFin}` : 'sin fecha límite'}</p>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer;">
          <input type="checkbox" data-toggle-temporada="${t.id}" ${t.activo ? 'checked' : ''} style="width:20px;height:20px;">
          ${t.activo ? 'Encendida' : 'Apagada'}
        </label>
        <button class="icon-btn" data-editar-temporada="${t.id}">✏️</button>
      </div>
    `).join('') || '<p class="estado-vacio">Aún no hay campañas de temporada.</p>';
  }
  pintar();

  document.querySelector('#btn-nueva-temporada').addEventListener('click', () => abrirFormularioTemporada(null));

  document.querySelector('#tarjetas-temporadas').addEventListener('change', async (e) => {
    const toggle = e.target.closest('[data-toggle-temporada]');
    if (!toggle) return;
    await fetch(`${API}/admin/categories/${toggle.dataset.toggleTemporada}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: toggle.checked })
    });
    await cargarDatos();
    renderTemporadas();
  });

  document.querySelector('#tarjetas-temporadas').addEventListener('click', (e) => {
    const editId = e.target.closest('[data-editar-temporada]')?.dataset.editarTemporada;
    if (editId) abrirFormularioTemporada(categorias.find(c => c.id === editId));
  });
}

function abrirFormularioTemporada(temporada) {
  const esNueva = !temporada;
  const t = temporada || { nombre: '', descripcion: '', imagen: '', colorTema: '#f2c744', fechaFin: '', activo: false };

  abrirModal(`
    <div class="modal__header">
      <h2>${esNueva ? 'Nueva campaña de temporada' : 'Editar campaña'}</h2>
      <button class="modal__cerrar" id="cerrar-modal-temp">&times;</button>
    </div>
    <form id="form-temporada" class="formulario">
      <div class="campo"><label>Nombre (ej. Flores Amarillas)</label><input type="text" name="nombre" value="${t.nombre}" required></div>
      <div class="campo"><label>Descripción corta</label><input type="text" name="descripcion" value="${t.descripcion || ''}"></div>
      <div class="campo"><label>Color de tema</label><input type="color" name="colorTema" value="${t.colorTema || '#f2c744'}" style="height:44px;"></div>
      <div class="campo"><label>Fecha límite (opcional, solo informativa)</label><input type="date" name="fechaFin" value="${t.fechaFin || ''}"></div>
      <div class="campo">
        <label>Imagen representativa</label>
        <div class="fotos-grid" id="temp-fotos-grid">
          ${t.imagen ? `<div class="foto-mini"><img src="${urlFoto(t.imagen)}"></div>` : ''}
          <label class="foto-subir">+<input type="file" id="temp-input-foto" accept="image/*" style="display:none;"></label>
        </div>
      </div>
      <label class="checkbox-fila"><input type="checkbox" name="activo" ${t.activo ? 'checked' : ''}> Encendida (visible en el sitio)</label>
      <div style="display:flex;gap:12px;">
        <button type="submit" class="btn btn--primario">Guardar campaña</button>
        <button type="button" class="btn btn--secundario" id="cancelar-modal-temp">Cancelar</button>
      </div>
    </form>
  `);

  let imagenActual = t.imagen || '';

  document.querySelector('#cerrar-modal-temp').addEventListener('click', cerrarModal);
  document.querySelector('#cancelar-modal-temp').addEventListener('click', cerrarModal);

  document.querySelector('#temp-input-foto').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    formData.append('fotos', files[0]);
    const res = await fetch(`${API}/admin/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.rutas && data.rutas[0]) {
      imagenActual = data.rutas[0];
      const grid = document.querySelector('#temp-fotos-grid');
      const subirBtn = grid.querySelector('.foto-subir');
      const div = document.createElement('div');
      div.className = 'foto-mini';
      div.innerHTML = `<img src="${urlFoto(imagenActual)}">`;
      grid.insertBefore(div, subirBtn);
    }
  });

  document.querySelector('#form-temporada').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion'),
      colorTema: fd.get('colorTema'),
      fechaFin: fd.get('fechaFin'),
      activo: fd.get('activo') === 'on',
      imagen: imagenActual,
      esTemporada: true
    };
    if (esNueva) {
      await fetch(`${API}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/admin/categories/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    cerrarModal();
    await cargarDatos();
    renderTemporadas();
  });
}

/* ================================================================
   TIKTOK VIRAL
   ================================================================ */
async function renderTiktok() {
  const cont = document.querySelector('#vista-tiktok');
  cont.innerHTML = '<div class="spinner"></div>';
  const res = await fetch(`${API}/admin/site-content`);
  const content = await res.json();
  let tiktoks = content.tiktoks || [];

  function pintar() {
    cont.innerHTML = `
      <div class="admin-card">
        <p>Pega el link del video de TikTok y escribe cuántas vistas tiene (tú lo ves en tu propia cuenta de TikTok — no hay forma automática de traerlo). La miniatura y el título se obtienen solos.</p>
        <form id="form-tiktok" class="formulario formulario--2col">
          <div class="campo campo--ancho"><label>Link del video de TikTok</label><input type="url" name="url" placeholder="https://www.tiktok.com/@usuario/video/..." required></div>
          <div class="campo"><label>Vistas (texto libre, ej. "128K vistas")</label><input type="text" name="vistasTexto" required></div>
          <div class="campo--ancho">
            <button type="submit" class="btn btn--primario btn--chico">+ Agregar video</button>
            <div class="mensaje-envio" id="feedback-tiktok"></div>
          </div>
        </form>
      </div>
      <div class="tiktok-grid" style="margin-top:10px;">
        ${tiktoks.map((t, i) => `
          <div class="tiktok-card">
            ${t.miniatura ? `<img src="${t.miniatura}" alt="">` : ''}
            <div class="tiktok-card__overlay">
              <span class="tiktok-card__vistas">👁️ ${t.vistasTexto}</span>
            </div>
            <button type="button" class="icon-btn icon-btn--peligro" data-quitar-tiktok="${i}" style="position:absolute;top:8px;right:8px;">🗑️</button>
          </div>
        `).join('') || '<p class="estado-vacio">Aún no has agregado videos.</p>'}
      </div>
    `;

    document.querySelector('#form-tiktok').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const url = fd.get('url');
      const vistasTexto = fd.get('vistasTexto');
      const feedback = document.querySelector('#feedback-tiktok');
      feedback.textContent = 'Obteniendo información del video...';
      feedback.className = 'mensaje-envio ok';
      try {
        const infoRes = await fetch(`${API}/admin/tiktok-info`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
        });
        const info = await infoRes.json();
        if (!infoRes.ok) throw new Error(info.error);
        tiktoks = [...tiktoks, { url, vistasTexto, titulo: info.titulo, miniatura: info.miniatura }];
        await fetch(`${API}/admin/site-content`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tiktoks }) });
        pintar();
      } catch (err) {
        feedback.textContent = err.message || 'No se pudo agregar el video.';
        feedback.className = 'mensaje-envio error';
      }
    });

    cont.querySelectorAll('[data-quitar-tiktok]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.quitarTiktok);
        tiktoks = tiktoks.filter((_, i) => i !== idx);
        await fetch(`${API}/admin/site-content`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tiktoks }) });
        pintar();
      });
    });
  }
  pintar();
}

/* ================================================================
   CONTENIDO DEL SITIO
   ================================================================ */
async function renderContenido() {
  const cont = document.querySelector('#vista-contenido');
  cont.innerHTML = '<div class="spinner"></div>';
  const res = await fetch(`${API}/admin/site-content`);
  const content = await res.json();

  cont.innerHTML = `
    <form id="form-contenido">
      <div class="admin-card">
        <h3>Portada (hero)</h3>
        <div class="formulario">
          <div class="campo"><label>Título principal</label><input type="text" name="hero.titulo" value="${content.hero?.titulo || ''}"></div>
          <div class="campo"><label>Texto secundario</label><textarea name="hero.subtitulo">${content.hero?.subtitulo || ''}</textarea></div>
          <div class="campo"><label>Texto de cobertura</label><input type="text" name="hero.coberturaTexto" value="${content.hero?.coberturaTexto || ''}"></div>
        </div>
      </div>

      <div class="admin-card">
        <h3>Nuestro objetivo / Historia</h3>
        <div class="formulario">
          <div class="campo"><label>Título de objetivo</label><input type="text" name="objetivo.titulo" value="${content.objetivo?.titulo || ''}"></div>
          <div class="campo"><label>Texto de objetivo</label><textarea name="objetivo.texto">${content.objetivo?.texto || ''}</textarea></div>
          <div class="campo"><label>Historia de la empresa</label><textarea name="historia.texto">${content.historia?.texto || ''}</textarea></div>
        </div>
      </div>

      <div class="admin-card">
        <h3>Contacto</h3>
        <div class="formulario formulario--2col">
          <div class="campo"><label>WhatsApp (solo números, con código de país)</label><input type="text" name="contacto.whatsapp" value="${content.contacto?.whatsapp || ''}"></div>
          <div class="campo"><label>WhatsApp (texto a mostrar)</label><input type="text" name="contacto.whatsappDisplay" value="${content.contacto?.whatsappDisplay || ''}"></div>
          <div class="campo"><label>Teléfono</label><input type="text" name="contacto.telefono" value="${content.contacto?.telefono || ''}"></div>
          <div class="campo"><label>Correo electrónico</label><input type="email" name="contacto.correo" value="${content.contacto?.correo || ''}"></div>
          <div class="campo campo--ancho"><label>Dirección</label><input type="text" name="contacto.direccion" value="${content.contacto?.direccion || ''}"></div>
          <div class="campo campo--ancho"><label>Horarios</label><input type="text" name="contacto.horarios" value="${content.contacto?.horarios || ''}"></div>
          <div class="campo"><label>Facebook (URL)</label><input type="text" name="contacto.facebook" value="${content.contacto?.facebook || ''}"></div>
          <div class="campo"><label>Instagram (URL)</label><input type="text" name="contacto.instagram" value="${content.contacto?.instagram || ''}"></div>
          <div class="campo"><label>TikTok (URL)</label><input type="text" name="contacto.tiktok" value="${content.contacto?.tiktok || ''}"></div>
        </div>
      </div>

      <div class="admin-card">
        <h3>Envíos y entregas</h3>
        <div class="formulario">
          <div class="campo"><label>Título</label><input type="text" name="envios.titulo" value="${content.envios?.titulo || ''}"></div>
          <div class="campo"><label>Texto</label><textarea name="envios.texto">${content.envios?.texto || ''}</textarea></div>
        </div>
      </div>

      <div class="admin-card">
        <h3>Métodos de pago</h3>
        <div class="formulario">
          <div class="campo"><label>Título</label><input type="text" name="pagos.titulo" value="${content.pagos?.titulo || ''}"></div>
          <div class="campo"><label>Texto (anticipo, condiciones)</label><textarea name="pagos.texto">${content.pagos?.texto || ''}</textarea></div>
          <div class="campo"><label>Métodos disponibles (uno por línea)</label><textarea name="pagos.metodos">${(content.pagos?.metodos || []).join('\n')}</textarea></div>
        </div>
      </div>

      <div class="admin-card">
        <h3>Políticas y restricciones</h3>
        <div class="formulario">
          <div class="campo"><label>Disponibilidad de flores y materiales</label><textarea name="politicas.disponibilidad">${content.politicas?.disponibilidad || ''}</textarea></div>
          <div class="campo"><label>Tiempo de anticipación</label><textarea name="politicas.anticipacion">${content.politicas?.anticipacion || ''}</textarea></div>
          <div class="campo"><label>Pedidos personalizados</label><textarea name="politicas.personalizados">${content.politicas?.personalizados || ''}</textarea></div>
          <div class="campo"><label>Cancelaciones</label><textarea name="politicas.cancelaciones">${content.politicas?.cancelaciones || ''}</textarea></div>
        </div>
      </div>

      <div class="admin-card">
        <h3>Cambios y cancelaciones</h3>
        <div class="campo"><textarea name="cambiosYCancelaciones.texto">${content.cambiosYCancelaciones?.texto || ''}</textarea></div>
      </div>

      <button type="submit" class="btn btn--primario">Guardar todos los cambios</button>
      <div class="mensaje-envio" id="feedback-contenido"></div>
    </form>

    <div class="admin-card" style="margin-top:24px;">
      <h3>Entregas a domicilio (fotos y videos de confianza)</h3>
      <p>Estas fotos y videos aparecen en la sección "Entregamos con cariño" del inicio.</p>
      <div class="formulario">
        <div class="campo"><label>Título de la sección</label><input type="text" id="entregas-titulo" value="${content.entregas?.titulo || ''}"></div>
        <div class="campo"><label>Texto</label><textarea id="entregas-texto">${content.entregas?.texto || ''}</textarea></div>
      </div>
      <div class="fotos-grid" id="entregas-grid" style="margin-top:14px;"></div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <label class="btn btn--secundario btn--chico">+ Foto<input type="file" id="entregas-input-foto" accept="image/*" multiple style="display:none;"></label>
        <label class="btn btn--secundario btn--chico">+ Video<input type="file" id="entregas-input-video" accept="video/*" multiple style="display:none;"></label>
        <button type="button" class="btn btn--primario btn--chico" id="btn-guardar-entregas">Guardar sección de entregas</button>
      </div>
      <div class="mensaje-envio" id="feedback-entregas"></div>
    </div>
  `;

  document.querySelector('#form-contenido').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    for (const [key, value] of fd.entries()) {
      const [seccion, campo] = key.split('.');
      body[seccion] = body[seccion] || {};
      if (key === 'pagos.metodos') {
        body[seccion][campo] = value.split('\n').map(s => s.trim()).filter(Boolean);
      } else {
        body[seccion][campo] = value;
      }
    }
    await fetch(`${API}/admin/site-content`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const feedback = document.querySelector('#feedback-contenido');
    feedback.textContent = 'Cambios guardados correctamente.';
    feedback.className = 'mensaje-envio ok';
  });

  // ---- Entregas a domicilio: fotos y videos ----
  let entregasMedios = [...((content.entregas && content.entregas.medios) || [])];

  function pintarEntregas() {
    const grid = document.querySelector('#entregas-grid');
    grid.innerHTML = entregasMedios.map((m, i) => `
      <div class="foto-mini">
        ${m.tipo === 'video' ? `<video src="${m.url}" muted style="width:100%;height:100%;object-fit:cover;"></video>` : `<img src="${m.url}">`}
        <button type="button" data-quitar-entrega="${i}">&times;</button>
      </div>
    `).join('');
    grid.querySelectorAll('[data-quitar-entrega]').forEach(btn => {
      btn.addEventListener('click', () => {
        entregasMedios.splice(Number(btn.dataset.quitarEntrega), 1);
        pintarEntregas();
      });
    });
  }
  pintarEntregas();

  document.querySelector('#entregas-input-foto').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (const f of files) formData.append('fotos', f);
    const res = await fetch(`${API}/admin/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.rutas) {
      data.rutas.forEach(url => entregasMedios.push({ tipo: 'foto', url }));
      pintarEntregas();
    }
  });

  document.querySelector('#entregas-input-video').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    for (const f of files) formData.append('videos', f);
    const res = await fetch(`${API}/admin/upload-video`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.rutas) {
      data.rutas.forEach(url => entregasMedios.push({ tipo: 'video', url }));
      pintarEntregas();
    } else if (data.error) {
      alert(data.error);
    }
  });

  document.querySelector('#btn-guardar-entregas').addEventListener('click', async () => {
    const feedback = document.querySelector('#feedback-entregas');
    await fetch(`${API}/admin/site-content`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entregas: {
          titulo: document.querySelector('#entregas-titulo').value,
          texto: document.querySelector('#entregas-texto').value,
          medios: entregasMedios
        }
      })
    });
    feedback.textContent = 'Sección de entregas guardada correctamente.';
    feedback.className = 'mensaje-envio ok';
  });
}

/* ================================================================
   MENSAJES DE CONTACTO
   ================================================================ */
async function renderMensajes() {
  const cont = document.querySelector('#vista-mensajes');
  cont.innerHTML = '<div class="spinner"></div>';
  const res = await fetch(`${API}/admin/mensajes-contacto`);
  const mensajes = await res.json();

  cont.innerHTML = `
    <div class="admin-card admin-tabla-wrap">
      <table class="admin-tabla">
        <thead><tr><th>Fecha</th><th>Nombre</th><th>Teléfono</th><th>Motivo</th><th>Mensaje</th><th>Estado</th></tr></thead>
        <tbody>
          ${mensajes.map(m => `
            <tr>
              <td>${new Date(m.fecha).toLocaleString('es-MX')}</td>
              <td>${m.nombre}</td>
              <td>${m.telefono}</td>
              <td>${m.motivo}</td>
              <td style="max-width:280px;">${m.mensaje}</td>
              <td>${m.leido ? '<span class="pastilla pastilla--gris">Leído</span>' : `<button class="btn btn--chico btn--secundario" data-marcar-leido="${m.id}">Marcar leído</button>`}</td>
            </tr>
          `).join('') || '<tr><td colspan="6">Aún no has recibido mensajes.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  cont.addEventListener('click', async (e) => {
    const id = e.target.closest('[data-marcar-leido]')?.dataset.marcarLeido;
    if (!id) return;
    await fetch(`${API}/admin/mensajes-contacto/${id}/leido`, { method: 'PUT' });
    renderMensajes();
  });
}

/* ================================================================
   COTIZACIONES DE EVENTOS
   ================================================================ */
async function renderEventos() {
  const cont = document.querySelector('#vista-eventos');
  cont.innerHTML = '<div class="spinner"></div>';
  const res = await fetch(`${API}/admin/cotizaciones-eventos`);
  const eventos = await res.json();

  cont.innerHTML = `
    <div class="admin-card admin-tabla-wrap">
      <table class="admin-tabla">
        <thead><tr><th>Enviado</th><th>Nombre</th><th>Teléfono</th><th>Fecha evento</th><th>Tipo</th><th>Invitados</th><th>Estado</th></tr></thead>
        <tbody>
          ${eventos.map(ev => `
            <tr>
              <td>${new Date(ev.fechaEnvio).toLocaleString('es-MX')}</td>
              <td>${ev.nombre}</td>
              <td>${ev.telefono}</td>
              <td>${ev.fechaEvento || ''}</td>
              <td>${ev.tipoEvento || ''}</td>
              <td>${ev.invitados || ''}</td>
              <td>${ev.leido ? '<span class="pastilla pastilla--gris">Leído</span>' : `<button class="btn btn--chico btn--secundario" data-marcar-leido-evento="${ev.id}">Marcar leído</button>`}</td>
            </tr>
          `).join('') || '<tr><td colspan="7">Aún no has recibido cotizaciones de eventos.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  cont.addEventListener('click', async (e) => {
    const id = e.target.closest('[data-marcar-leido-evento]')?.dataset.marcarLeidoEvento;
    if (!id) return;
    await fetch(`${API}/admin/cotizaciones-eventos/${id}/leido`, { method: 'PUT' });
    renderEventos();
  });
}

/* ================================================================
   MI CUENTA (cambiar usuario / contraseña sin necesitar terminal)
   ================================================================ */
async function renderCuenta() {
  const cont = document.querySelector('#vista-cuenta');
  const meRes = await fetch(`${API}/me`);
  const me = await meRes.json();

  cont.innerHTML = `
    <div class="admin-card" style="max-width:480px;">
      <h3 style="margin-top:0;">Cambiar usuario y contraseña</h3>
      <p>Usuario actual: <strong>${me.username}</strong></p>
      <form id="form-cuenta" class="formulario">
        <div class="campo">
          <label>Contraseña actual</label>
          <input type="password" name="passwordActual" required>
        </div>
        <div class="campo">
          <label>Nuevo usuario (déjalo vacío si no quieres cambiarlo)</label>
          <input type="text" name="nuevoUsuario">
        </div>
        <div class="campo">
          <label>Nueva contraseña (mínimo 6 caracteres)</label>
          <input type="password" name="nuevaPassword" required minlength="6">
        </div>
        <button type="submit" class="btn btn--primario">Guardar cambios</button>
        <div class="mensaje-envio" id="feedback-cuenta"></div>
      </form>
    </div>
  `;

  document.querySelector('#form-cuenta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    const feedback = document.querySelector('#feedback-cuenta');
    try {
      const res = await fetch(`${API}/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar.');
      feedback.textContent = 'Datos actualizados correctamente. Úsalos la próxima vez que inicies sesión.';
      feedback.className = 'mensaje-envio ok';
      e.target.reset();
    } catch (err) {
      feedback.textContent = err.message;
      feedback.className = 'mensaje-envio error';
    }
  });
}

/* ---------------- Arranque ---------------- */
(async function init() {
  const ok = await verificarSesion();
  if (!ok) return;
  await cargarDatos();
  mostrarVista('dashboard');
})();
