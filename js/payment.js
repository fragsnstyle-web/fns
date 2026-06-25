/* ═══════════════════════════════════════════════════════
   PAYMENT.JS — Integración de Pasarela de Pago
   Fragancia & Estilo
   
   INSTRUCCIONES:
   1. Crea una cuenta en https://stripe.com (México disponible)
   2. Ve a Dashboard → Developers → API Keys
   3. Copia tu "Publishable key" (empieza con pk_live_)
   4. Reemplaza STRIPE_KEY abajo con tu clave real
   5. Para cobros reales necesitas también un backend (ver README)
═══════════════════════════════════════════════════════ */

const STRIPE_KEY = 'pk_test_TU_CLAVE_PUBLICA_AQUI'; // ← CAMBIA ESTO

// ── Inicializar Stripe ──────────────────────────────
// Descomenta estas líneas cuando tengas tu clave real:
/*
const stripe = Stripe(STRIPE_KEY);
const elements = stripe.elements();

const cardElement = elements.create('card', {
  style: {
    base: {
      color: '#f5f0e8',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#555555' }
    }
  }
});

// Montar el elemento de tarjeta en el formulario de checkout
// cardElement.mount('#stripe-card-element');

async function processStripePayment(amount, currency = 'usd') {
  // 1. Llamar a tu backend para crear un PaymentIntent
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency })
  });
  const { clientSecret } = await response.json();

  // 2. Confirmar el pago con Stripe
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: document.getElementById('cardName')?.value,
        email: document.getElementById('email')?.value
      }
    }
  });

  if (error) {
    console.error('Error de pago:', error.message);
    return { success: false, error: error.message };
  }
  
  return { success: true, paymentIntent };
}
*/

// ── PayPal ──────────────────────────────────────────
// Para PayPal, añade este script en checkout.html:
// <script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=USD"></script>
/*
function initPayPal(amount) {
  paypal.Buttons({
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{ amount: { value: amount.toFixed(2) } }]
      });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(details => {
        console.log('Pago aprobado:', details);
        // Redirigir a página de confirmación
      });
    },
    onError: (err) => console.error('Error PayPal:', err)
  }).render('#paypal-button-container');
}
*/

// ── Función de pago activa (demo) ───────────────────
// Esta función simula el pago. Reemplázala con la real de Stripe o PayPal.
async function processPayment(cart, customerInfo) {
  console.log('🔔 Procesando pago (modo demo):', { cart, customerInfo });
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // En producción: llamar a processStripePayment() o initPayPal()
  return { success: true, orderId: 'ORD-' + Date.now() };
}

// ── SPEI / Transferencia bancaria ───────────────────
const BANK_INFO = {
  banco:   'HSBC México',          // ← Cambia por tu banco
  cuenta:  '1234567890',           // ← Tu número de cuenta
  clabe:   '021180012345678901',   // ← Tu CLABE interbancaria
  titular: 'Fragancia y Estilo SA de CV'
};

function showBankInfo() {
  return `
    Banco: ${BANK_INFO.banco}
    Titular: ${BANK_INFO.titular}
    Cuenta: ${BANK_INFO.cuenta}
    CLABE: ${BANK_INFO.clabe}
    
    Envía tu comprobante a: hola@fraganciayestilo.mx
  `;
}

window.PaymentAPI = { processPayment, showBankInfo, BANK_INFO };
