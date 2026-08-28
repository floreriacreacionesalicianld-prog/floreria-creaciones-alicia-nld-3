/* footer.js — construye el footer con datos reales de contacto (editable desde el panel) */

async function renderFooter() {
  const cont = document.querySelector('#footer');
  if (!cont) return;
  const content = await getSiteContent();
  const c = content.contacto || {};
  const waLink = linkWhatsApp(c.whatsapp, 'Hola, vi su página web y me gustaría más información.');

  cont.innerHTML = `
    <div class="contenedor">
      <div class="footer__grid">
        <div class="footer__col">
          <div class="footer__marca">Florería Creaciones Alicia</div>
          <p>Flores para cada momento que merece ser inolvidable.</p>
          <p class="footer__cobertura">📍 Nuevo Laredo, Tamaulipas y Laredo, Texas</p>
          <div class="footer__redes">
            ${c.facebook ? `<a href="${c.facebook}" target="_blank" rel="noopener" aria-label="Facebook">f</a>` : ''}
            ${c.instagram ? `<a href="${c.instagram}" target="_blank" rel="noopener" aria-label="Instagram">ig</a>` : ''}
            ${c.tiktok ? `<a href="${c.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">tt</a>` : ''}
          </div>
        </div>
        <div class="footer__col">
          <h4>Navegación</h4>
          <a href="index.html">Inicio</a>
          <a href="ocasiones.html">Ocasiones</a>
          <a href="sobre-nosotros.html">Sobre nosotros</a>
          <a href="contacto.html">Contacto</a>
        </div>
        <div class="footer__col">
          <h4>Información</h4>
          <a href="politicas.html">Políticas y restricciones</a>
          <a href="politicas.html#cambios">Cambios y cancelaciones</a>
          <a href="politicas.html#pagos">Métodos de pago</a>
          <a href="politicas.html#envios">Envíos y entregas</a>
        </div>
        <div class="footer__col">
          <h4>Contacto</h4>
          <a href="${waLink}" target="_blank" rel="noopener">WhatsApp: ${c.whatsappDisplay || c.whatsapp || ''}</a>
          ${c.correo ? `<a href="mailto:${c.correo}">${c.correo}</a>` : ''}
          <p>${c.direccion || ''}</p>
        </div>
      </div>
      <div class="footer__legal">
        © ${new Date().getFullYear()} Florería Creaciones Alicia. Todos los derechos reservados.
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', renderFooter);
