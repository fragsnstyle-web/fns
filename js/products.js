/* ═══════════════════════════════════════════
   PRODUCTS.JS — Carga productos desde JSON
   y los renderiza en la página
═══════════════════════════════════════════ */

async function loadProducts(categoria) {
  try {
    const res = await fetch('../data/productos.json');
    const all = await res.json();
    return categoria ? all.filter(p => p.categoria === categoria || p.categoria === 'todos') : all;
  } catch(e) {
    console.error('Error cargando productos:', e);
    return [];
  }
}

function renderProduct(p) {
  const precioPrev = p.precio_anterior
    ? `<span class="product-price-old">$${Number(p.precio_anterior).toFixed(2)}</span>`
    : '';
  const badge = p.oferta ? `<span class="product-badge">Oferta</span>` : '';
  const imgHtml = p.imagen
    ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy"/>`
    : `<div class="product-img-placeholder">✦</div>`;

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
        <button class="product-add-btn"
          onclick='window.CartAPI.addToCart({
            id:"${p.id}",
            name:"${p.nombre}",
            brand:"${p.marca}",
            size:"${p.ml}ml",
            price:${p.precio},
            image:"${p.imagen||""}"
          })'>
          Añadir al carrito
        </button>
      </div>
    </div>`;
}

async function renderProductGrid(containerId, categoria) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<p style="color:var(--gray-lt);font-size:.8rem;letter-spacing:.1em;text-align:center;padding:60px">Cargando colección...</p>`;

  const productos = await loadProducts(categoria);

  if (productos.length === 0) {
    container.innerHTML = `<p style="color:var(--gray-lt);font-size:.8rem;letter-spacing:.1em;text-align:center;padding:60px">No hay productos disponibles aún. Añade productos desde el panel de administración.</p>`;
    return;
  }

  container.innerHTML = productos.map(renderProduct).join('');
}
