/* ═══════════════════════════════════════════
   CARRITO DE COMPRA — cart.js
   Se usa en todas las páginas
═══════════════════════════════════════════ */

let cart = JSON.parse(localStorage.getItem('fye_cart') || '[]');

function saveCart() {
  localStorage.setItem('fye_cart', JSON.stringify(cart));
}

function addToCart(product) {
  /* product = { id, name, brand, size, price, image } */
  const existing = cart.find(i => i.id === product.id && i.size === product.size);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showCartNotification(product.name);
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count === 0 ? 'none' : 'flex';
  });

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (footerEl) footerEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img" style="background:var(--black3)">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--gold-dk);font-size:1.5rem">✦</div>`
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">${item.brand} · ${item.size}${item.qty > 1 ? ` × ${item.qty}` : ''}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}','${item.size}')">✕</button>
    </div>
  `).join('');

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)} USD`;
}

function toggleCart() {
  const panel = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  if (!panel) return;
  panel.classList.toggle('active');
  overlay.classList.toggle('active');
  document.body.style.overflow = panel.classList.contains('active') ? 'hidden' : '';
}

function showCartNotification(name) {
  let notif = document.getElementById('cartNotif');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'cartNotif';
    notif.style.cssText = `
      position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
      background:var(--black2); border:1px solid var(--gold);
      padding:14px 28px; z-index:2000; font-size:.78rem; letter-spacing:.08em;
      color:var(--cream); white-space:nowrap; transition:opacity .3s ease;
    `;
    document.body.appendChild(notif);
  }
  notif.textContent = `✦ ${name} añadido al carrito`;
  notif.style.opacity = '1';
  clearTimeout(notif._timer);
  notif._timer = setTimeout(() => { notif.style.opacity = '0'; }, 2500);
}

/* Exportar para uso en páginas de producto */
window.CartAPI = { addToCart, removeFromCart, toggleCart, cart };

/* Inicializar al cargar */
document.addEventListener('DOMContentLoaded', updateCartUI);
