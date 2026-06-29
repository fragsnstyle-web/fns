/* ═══════════════════════════════════════════════════════════
   PAYMENT.JS — Integración de pasarelas de pago
   Fragancia & Estilo

   INSTRUCCIONES RÁPIDAS:
   1. Elige tu pasarela (Stripe, PayPal o Mercado Pago)
   2. Pega tus claves donde dice ← TU CLAVE AQUÍ
   3. Sube a GitHub y listo

   COMISIONES (México, 2024):
   • Stripe:       3.6% + $3 MXN por venta
   • PayPal:       3.95% + tarifa fija
   • Mercado Pago: 3.29% + IVA (tarjeta) / 3.69% OXXO
═══════════════════════════════════════════════════════════ */

const PAYMENT_CONFIG = {

  // ─── STRIPE ────────────────────────────────────────────
  // Obtén tu clave en: stripe.com → Desarrolladores → Claves de API
  // Empieza con pk_live_ (producción) o pk_test_ (pruebas)
  stripe_public_key: 'pk_test_TU_CLAVE_PUBLICA_STRIPE',   // ← CAMBIA ESTO

  // ─── PAYPAL ────────────────────────────────────────────
  // Obtén tu Client ID en: developer.paypal.com → Apps & Credentials
  paypal_client_id:  'TU_CLIENT_ID_PAYPAL',               // ← CAMBIA ESTO

  // ─── MERCADO PAGO ──────────────────────────────────────
  // Obtén tu Public Key en: mercadopago.com.mx → Tu negocio → Credenciales
  mp_public_key:     'APP_USR-TU_PUBLIC_KEY_MERCADOPAGO', // ← CAMBIA ESTO

  // ─── TRANSFERENCIA BANCARIA / SPEI ─────────────────────
  // Llena con los datos de tu cuenta bancaria
  bank: {
    nombre_banco:  'HSBC México',             // ← Tu banco
    titular:       'Fragancia y Estilo',       // ← Nombre de tu cuenta
    clabe:         '021180012345678901',       // ← Tu CLABE (18 dígitos)
    cuenta:        '1234567890',              // ← Tu número de cuenta
    email_compras: 'hola@fraganciayestilo.mx' // ← Tu correo para comprobantes
  },

  // ─── MONEDA ────────────────────────────────────────────
  currency: 'MXN',  // MXN = Pesos mexicanos / USD = Dólares
  currency_symbol: '$'
};

/* ─────────────────────────────────────────────────────────
   FUNCIONES DE PAGO — No necesitas editar nada de aquí
───────────────────────────────────────────────────────── */

// Detecta qué pasarelas están configuradas
const PaymentGateways = {
  hasStripe()  { return PAYMENT_CONFIG.stripe_public_key.startsWith('pk_'); },
  hasPayPal()  { return !PAYMENT_CONFIG.paypal_client_id.includes('TU_CLIENT'); },
  hasMercadoPago() { return PAYMENT_CONFIG.mp_public_key.startsWith('APP_USR-') && !PAYMENT_CONFIG.mp_public_key.includes('TU_PUBLIC'); },
  hasBank()    { return PAYMENT_CONFIG.bank.clabe.length === 18 && !PAYMENT_CONFIG.bank.clabe.includes('0123456789'); }
};

// Inicializar Stripe Elements cuando se elige esa opción
async function initStripe(amount) {
  if (!PaymentGateways.hasStripe()) return;

  // Cargar Stripe.js dinámicamente
  if (!window.Stripe) {
    await loadScript('https://js.stripe.com/v3/');
  }

  const stripe   = Stripe(PAYMENT_CONFIG.stripe_public_key);
  const elements = stripe.elements();

  const cardEl = elements.create('card', {
    style: {
      base: {
        color: '#f5f0e8',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '15px',
        fontWeight: '300',
        letterSpacing: '0.04em',
        '::placeholder': { color: '#555555' },
        iconColor: '#c9a84c'
      },
      invalid: { color: '#e07070', iconColor: '#e07070' }
    },
    hidePostalCode: true
  });

  // Montar en el div #stripe-card-element del checkout
  const mountEl = document.getElementById('stripe-card-element');
  if (mountEl) {
    cardEl.mount('#stripe-card-element');
    cardEl.on('change', (e) => {
      const errEl = document.getElementById('stripe-card-error');
      if (errEl) errEl.textContent = e.error ? e.error.message : '';
    });
  }

  return { stripe, cardEl };
}

// Inicializar botón de PayPal
async function initPayPal(amount, containerId = 'paypal-button-container') {
  if (!PaymentGateways.hasPayPal()) return;

  const scriptSrc = `https://www.paypal.com/sdk/js?client-id=${PAYMENT_CONFIG.paypal_client_id}&currency=${PAYMENT_CONFIG.currency}&intent=capture`;

  if (!window.paypal) {
    await loadScript(scriptSrc);
  }

  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  paypal.Buttons({
    style: {
      layout:  'vertical',
      color:   'gold',
      shape:   'rect',
      label:   'paypal',
      height:  48
    },
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value:         (amount).toFixed(2),
            currency_code: PAYMENT_CONFIG.currency
          },
          description: 'Fragancia & Estilo — Pedido'
        }]
      });
    },
    onApprove: async (data, actions) => {
      const order = await actions.order.capture();
      handlePaymentSuccess('paypal', order.id, order);
    },
    onError: (err) => {
      console.error('PayPal error:', err);
      handlePaymentError('paypal', 'Error al procesar el pago con PayPal.');
    },
    onCancel: () => {
      showPaymentMessage('Cancelaste el pago. Puedes intentarlo de nuevo cuando quieras.', 'info');
    }
  }).render('#' + containerId);
}

// Inicializar Mercado Pago
async function initMercadoPago(amount) {
  if (!PaymentGateways.hasMercadoPago()) return;

  if (!window.MercadoPago) {
    await loadScript('https://sdk.mercadopago.com/js/v2');
  }

  const mp = new MercadoPago(PAYMENT_CONFIG.mp_public_key, { locale: 'es-MX' });

  const bricksBuilder = mp.bricks();
  await bricksBuilder.create('cardPayment', 'mp-card-element', {
    initialization: {
      amount: amount,
      payer: {
        email: document.getElementById('email')?.value || ''
      }
    },
    customization: {
      visual: {
        style: {
          theme: 'dark',
          customVariables: {
            baseColor:       '#c9a84c',
            baseColorFirstVariant:  '#e4c97e',
            baseColorSecondVariant: '#9e7a2a',
            errorColor:      '#e07070',
            successColor:    '#68c19a',
            textPrimaryColor:'#f5f0e8',
            inputBackgroundColor: '#181818',
            formBackgroundColor:  '#101010',
            borderRadius:    '0px'
          }
        }
      },
      paymentMethods: {
        creditCard:  'all',
        debitCard:   'all',
        ticket:      ['oxxo'],
        bankTransfer:['pix']
      }
    },
    callbacks: {
      onReady: () => { console.log('Mercado Pago listo'); },
      onSubmit: async ({ selectedPaymentMethod, formData }) => {
        // En producción aquí llamas a tu backend para procesar
        console.log('MP pago enviado:', formData);
        handlePaymentSuccess('mercadopago', 'MP-' + Date.now(), formData);
      },
      onError: (error) => {
        handlePaymentError('mercadopago', error.message);
      }
    }
  });
}

// Manejar pago exitoso
function handlePaymentSuccess(method, orderId, details) {
  // Limpiar el carrito
  localStorage.removeItem('fye_cart');

  // Guardar orden para confirmación
  localStorage.setItem('fye_last_order', JSON.stringify({
    orderId, method, details,
    timestamp: new Date().toISOString()
  }));

  // Redirigir a página de confirmación
  window.location.href = 'confirmacion.html?order=' + orderId + '&method=' + method;
}

// Manejar error de pago
function handlePaymentError(method, message) {
  showPaymentMessage('Error: ' + message, 'error');
}

function showPaymentMessage(msg, type = 'info') {
  const el = document.getElementById('payment-message');
  if (!el) return;
  el.textContent = msg;
  el.className = 'payment-msg payment-msg-' + type;
  el.style.display = 'block';
}

// Helper para cargar scripts externos
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Mostrar info de transferencia bancaria
function getBankInfo() {
  const b = PAYMENT_CONFIG.bank;
  return {
    banco:   b.nombre_banco,
    titular: b.titular,
    clabe:   b.clabe,
    cuenta:  b.cuenta,
    email:   b.email_compras
  };
}

window.PaymentConfig   = PAYMENT_CONFIG;
window.PaymentGateways = PaymentGateways;
window.initStripe      = initStripe;
window.initPayPal      = initPayPal;
window.initMercadoPago = initMercadoPago;
window.getBankInfo     = getBankInfo;
