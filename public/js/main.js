/* main.js — lógica compartida por todas las páginas públicas */

const API = '/api';

/* ---------- Menú móvil ---------- */
function initMenuMovil() {
  const btnAbrir = document.querySelector('.header__hamburguesa');
  const menu = document.querySelector('.menu-movil');
  const btnCerrar = document.querySelector('.menu-movil__cerrar');
  if (!btnAbrir || !menu) return;

  btnAbrir.addEventListener('click', () => menu.classList.add('abierto'));
  btnCerrar?.addEventListener('click', () => menu.classList.remove('abierto'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('abierto')));
}

/* ---------- Acordeón (políticas / preguntas) ---------- */
function initAcordeon() {
  document.querySelectorAll('.acordeon__pregunta').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.acordeon').classList.toggle('abierto');
    });
  });
}

/* ---------- Utilidad: número de WhatsApp limpio ---------- */
function linkWhatsApp(numero, mensaje) {
  const limpio = (numero || '').replace(/\D/g, '');
  const texto = encodeURIComponent(mensaje || 'Hola, me gustaría más información.');
  return `https://wa.me/${limpio}?text=${texto}`;
}

/* ---------- Carga el contenido editable del sitio y lo aplica ---------- */
let siteContentCache = null;
async function getSiteContent() {
  if (siteContentCache) return siteContentCache;
  try {
    const res = await fetch(`${API}/site-content`);
    siteContentCache = await res.json();
  } catch (e) {
    siteContentCache = {};
  }
  return siteContentCache;
}

async function aplicarContenidoSitio() {
  const content = await getSiteContent();
  const contacto = content.contacto || {};

  // Botón flotante de WhatsApp
  const flotante = document.querySelector('.whatsapp-flotante');
  if (flotante) {
    flotante.href = linkWhatsApp(contacto.whatsapp, 'Hola, vi su página web y me gustaría más información.');
  }

  // Cualquier elemento con data-whatsapp-cta usa el número real
  document.querySelectorAll('[data-whatsapp-cta]').forEach(el => {
    const mensaje = el.getAttribute('data-whatsapp-mensaje') || 'Hola, me gustaría más información.';
    el.href = linkWhatsApp(contacto.whatsapp, mensaje);
  });

  // Textos dinámicos: data-content="contacto.whatsappDisplay" etc.
  document.querySelectorAll('[data-content]').forEach(el => {
    const ruta = el.getAttribute('data-content').split('.');
    let valor = content;
    for (const key of ruta) valor = valor?.[key];
    if (valor) el.textContent = valor;
  });

  // href dinámicos: data-content-href="contacto.facebook"
  document.querySelectorAll('[data-content-href]').forEach(el => {
    const ruta = el.getAttribute('data-content-href').split('.');
    let valor = content;
    for (const key of ruta) valor = valor?.[key];
    if (valor) el.href = valor;
  });

  return content;
}

/* ---------- Marca el enlace activo del menú ---------- */
function marcarNavActivo() {
  const actual = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav a, .menu-movil__enlaces a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === actual) a.classList.add('activo');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMenuMovil();
  initAcordeon();
  aplicarContenidoSitio();
  marcarNavActivo();
});
