/* ═══════════════════════════════════════════════════════════
   DB.JS — Módulo de base de datos en la nube
   Fragancia & Estilo v3.1

   ARQUITECTURA:
   ┌─────────────────────────────────────────────────────┐
   │  Admin (admin/index.html)                           │
   │   → Guarda binId en localStorage Y en config.js    │
   │   → Guarda/lee productos con Master Key            │
   ├─────────────────────────────────────────────────────┤
   │  Tienda pública (tienda.html, mujer.html, etc.)    │
   │   → Lee binId desde window.FYE_CONFIG.binId        │
   │     (inyectado por data/config.js que carga ANTES) │
   │   → Lee productos de JSONBin SIN autenticación     │
   │     (el bin es público para lectura)               │
   └─────────────────────────────────────────────────────┘
═══════════════════════════════════════════════════════════ */

const DB = {

  // ── Obtener binId con fallback completo ────────────────
  getBinId() {
    // 1. Desde config.js (hardcodeado en el archivo — funciona para TODOS)
    if (window.FYE_CONFIG && window.FYE_CONFIG.binId && window.FYE_CONFIG.binId.length > 5) {
      return window.FYE_CONFIG.binId;
    }
    // 2. Desde localStorage (respaldo para el admin en su propio navegador)
    const c = localStorage.getItem('fye_dbconfig');
    if (c) {
      try { return JSON.parse(c).binId || ''; } catch(e) {}
    }
    return '';
  },

  getMasterKey() {
    const c = localStorage.getItem('fye_dbconfig');
    if (c) {
      try { return JSON.parse(c).masterKey || ''; } catch(e) {}
    }
    return '';
  },

  isConfigured() {
    return this.getBinId().length > 5;
  },

  // ── Guardar configuración (admin) ──────────────────────
  saveConfig(binId, masterKey) {
    localStorage.setItem('fye_dbconfig', JSON.stringify({ binId, masterKey }));
    // También actualiza la variable global para esta sesión
    if (window.FYE_CONFIG) window.FYE_CONFIG.binId = binId;
  },

  // ── Leer productos — funciona para TODOS los visitantes ─
  async getProducts() {
    const binId = this.getBinId();

    if (binId) {
      try {
        // Lee el bin de JSONBin. Si el bin es público no necesita header.
        // Si el bin es privado, se incluye la master key desde localStorage.
        const headers = {};
        const mk = this.getMasterKey();
        if (mk) headers['X-Master-Key'] = mk;

        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${binId}/latest`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          return data.record.productos || [];
        }
        console.warn('JSONBin respuesta:', res.status);
      } catch(e) {
        console.warn('JSONBin no disponible, usando datos locales', e);
      }
    }

    // Fallback: productos de ejemplo del archivo local
    try {
      // Detectar si estamos en /pages/ o en raíz
      const isInPages = location.pathname.includes('/pages/');
      const path = isInPages ? '../data/productos.json' : 'data/productos.json';
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch(e) {}

    return [];
  },

  // ── Guardar productos (solo admin) ─────────────────────
  async saveProducts(productos) {
    const binId = this.getBinId();
    const masterKey = this.getMasterKey();

    if (!binId)     throw new Error('NO_CONFIG: Completa la configuración inicial primero.');
    if (!masterKey) throw new Error('NO_KEY: No se encontró la Master Key. Reconfigura el panel.');

    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': masterKey
      },
      body: JSON.stringify({ productos })
    });

    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try { const err = await res.json(); msg = err.message || msg; } catch(e) {}
      throw new Error(msg);
    }

    // ── CRÍTICO: actualizar config.js con el binId ────────
    // Esto hace que TODOS los visitantes puedan leer los productos.
    // El admin debe descargar el config.js actualizado y subirlo a GitHub.
    DB._pendingBinId = binId;

    return true;
  },

  // ── Crear bin por primera vez (wizard) ────────────────
  async createBin(masterKey, productosIniciales = []) {
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': masterKey,
        'X-Bin-Name': 'fragancia-estilo-productos',
        'X-Bin-Private': 'false'   // BIN PÚBLICO → cualquiera puede leer
      },
      body: JSON.stringify({ productos: productosIniciales })
    });

    if (!res.ok) {
      let msg = `Error ${res.status}`;
      try { const err = await res.json(); msg = err.message || msg; } catch(e) {}
      throw new Error(msg + ' — Verifica que tu API Key sea correcta.');
    }

    const data = await res.json();
    return data.metadata.id;
  },

  // ── Generar config.js actualizado para descarga ────────
  generateConfigFile(binId) {
    return `/* ═══════════════════════════════════════════════════════
   CONFIG.JS — Configuración pública de la tienda
   Generado automáticamente el ${new Date().toLocaleString('es-MX')}
   NO edites este archivo manualmente.
═══════════════════════════════════════════════════════ */

window.FYE_CONFIG = {
  binId: '${binId}',
  v: '3.1'
};
`;
  },

  // ── Descargar config.js actualizado ───────────────────
  downloadConfigFile(binId) {
    const content = this.generateConfigFile(binId);
    const blob = new Blob([content], { type: 'application/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'config.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

window.DB = DB;
