/* ═══════════════════════════════════════════════════════
   PRODUCTS.JS — Carga y renderiza productos desde la nube
   Usado por: tienda.html, mujer.html, hombre.html, etc.
═══════════════════════════════════════════════════════ */

async function loadProducts(categoria) {
  const todos = await DB.getProducts();
  const activos = todos.filter(p => p.disponible !== false);
  if (!categoria || categoria === 'todos') return activos;
  return activos.filter(p => p.categoria === categoria || p.temporada === categoria);
}

function renderProduct(p) {
  const precioPrev = p.precio_anterior
    ? `<span class="product-price-old">$${Number(p.precio_anterior).toFixed(2)}</span>` : '';
  const badge = p.oferta ? `<span class="product-badge">Oferta</span>` : '';
  const imgHtml = p.imagen
    ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
       <div class="product-img-placeholder" style="display:none">✦</div>`
    : `<div class="product-img-placeholder">✦</div>`;

  const addData = JSON.stringify({
    id: p.id, name: p.nombre, brand: p.marca,
    size: p.ml + 'ml', price: p.precio, image: p.imagen || ''
  }).replace(/'/g, '&#39;');

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">${imgHtml}</div>
      ${badge}
      <div class="product-info">
        <span class="product-brand">${p.marca}</span>
        <h3 class="product-name">${p.nombre}</h3>
        <span class="product-size">${p.ml}ml</span>
        <div class="product-price-row">
          <span class="product-price">$${Number(p.precio).toFixed(2)}</span>
          ${precioPrev}
        </div>
        <button class="product-add-btn" onclick='CartAPI.addToCart(${addData})'>
          Añadir al carrito
        </button>
      </div>
    </div>`;
}

async function renderProductGrid(containerId, categoria) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 0">
    <p style="color:var(--gray-lt);font-size:.8rem;letter-spacing:.1em">Cargando colección…</p>
  </div>`;
  const productos = await loadProducts(categoria);
  if (!productos.length) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 0">
      <p style="color:var(--gray-lt);font-size:.8rem;letter-spacing:.1em">
        No hay productos disponibles en esta colección aún.
      </p>
    </div>`;
    return;
  }
  container.innerHTML = productos.map(renderProduct).join('');
}
