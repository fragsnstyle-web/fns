/* ═══════════════════════════════════════════════════════════
   DB.JS — Base de datos en la nube con JSONBin.io
   
   CÓMO FUNCIONA:
   - Los productos se guardan en JSONBin.io (gratis, en internet)
   - El admin escribe, la tienda pública solo lee
   - No se necesita tocar ningún archivo
═══════════════════════════════════════════════════════════ */

const DB = {
  // ─── CONFIGURACIÓN ─────────────────────────────────────
  // Estas claves se guardan AUTOMÁTICAMENTE cuando el admin
  // completa el proceso de configuración inicial.
  // El operador NUNCA necesita editar este archivo.
  // ────────────────────────────────────────────────────────

  get cfg() {
    const c = localStorage.getItem('fye_dbconfig');
    return c ? JSON.parse(c) : null;
  },

  isConfigured() {
    const c = this.cfg;
    return !!(c && c.binId && c.masterKey);
  },

  saveConfig(binId, masterKey) {
    localStorage.setItem('fye_dbconfig', JSON.stringify({ binId, masterKey }));
  },

  // ─── LEER productos (público, sin clave) ───────────────
  async getProducts() {
    // 1. Intentar desde JSONBin si está configurado
    const c = this.cfg;
    if (c && c.binId) {
      try {
        const headers = { 'X-Access-Key': c.masterKey };
        const res = await fetch(`https://api.jsonbin.io/v3/b/${c.binId}/latest`, { headers });
        if (res.ok) {
          const data = await res.json();
          return data.record.productos || [];
        }
      } catch(e) { /* fallback */ }
    }
    // 2. Fallback: archivo local
    try {
      const res = await fetch('../data/productos.json');
      return await res.json();
    } catch(e) { return []; }
  },

  // ─── GUARDAR productos (admin, requiere clave) ──────────
  async saveProducts(productos) {
    const c = this.cfg;
    if (!c || !c.binId) throw new Error('NO_CONFIG');

    const res = await fetch(`https://api.jsonbin.io/v3/b/${c.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': c.masterKey
      },
      body: JSON.stringify({ productos })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error ${res.status}`);
    }
    return true;
  },

  // ─── CREAR BIN por primera vez ──────────────────────────
  async createBin(masterKey, productosIniciales = []) {
    const res = await fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': masterKey,
        'X-Bin-Name': 'fragancia-estilo-productos',
        'X-Bin-Private': 'false'
      },
      body: JSON.stringify({ productos: productosIniciales })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error ${res.status} — revisa tu API Key`);
    }
    const data = await res.json();
    return data.metadata.id;
  }
};

window.DB = DB;
