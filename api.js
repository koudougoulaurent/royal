/* ===== ROYAL ORBITECH — CLIENT API (front) ===== */
window.API = (function () {
  const TK = 'ro_token';
  const getToken = () => localStorage.getItem(TK);
  const setToken = t => localStorage.setItem(TK, t);
  const clearToken = () => localStorage.removeItem(TK);

  async function req(url, opts = {}, auth = false) {
    opts.headers = Object.assign({}, opts.headers);
    if (opts.body && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
    if (auth) { const t = getToken(); if (t) opts.headers.Authorization = 'Bearer ' + t; }
    const r = await fetch(url, opts);
    if (r.status === 204) return null;
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || ('Erreur ' + r.status));
    return data;
  }

  const srcFor = img => /^(data:|https?:|\/)/.test(img || '') ? img : 'images/products/' + img;

  return {
    getToken, setToken, clearToken,
    // Public
    catalog:    () => req('/api/catalog'),
    products:   () => req('/api/products'),
    categories: () => req('/api/categories'),
    settings:   () => req('/api/settings'),
    createOrder:(o) => req('/api/orders', { method: 'POST', body: JSON.stringify(o) }),
    validatePromo:(code, subtotal) => req('/api/promo/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
    // Auth
    login:    (password) => req('/api/login', { method: 'POST', body: JSON.stringify({ password }) }),
    // Admin (auth)
    createProduct: (p)      => req('/api/products', { method: 'POST', body: JSON.stringify(p) }, true),
    updateProduct: (id, p)  => req('/api/products/' + id, { method: 'PUT', body: JSON.stringify(p) }, true),
    deleteProduct: (id)     => req('/api/products/' + id, { method: 'DELETE' }, true),
    createCategory:(c)      => req('/api/categories', { method: 'POST', body: JSON.stringify(c) }, true),
    updateCategory:(key, c) => req('/api/categories/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify(c) }, true),
    deleteCategory:(key)    => req('/api/categories/' + encodeURIComponent(key), { method: 'DELETE' }, true),
    saveSettings:  (s)      => req('/api/settings', { method: 'PUT', body: JSON.stringify(s) }, true),
    updatePassword:(password) => req('/api/password', { method: 'PUT', body: JSON.stringify({ password }) }, true),
    orders:      ()         => req('/api/orders', {}, true),
    updateOrder: (id, status) => req('/api/orders/' + id, { method: 'PUT', body: JSON.stringify({ status }) }, true),
    deleteOrder: (id)       => req('/api/orders/' + id, { method: 'DELETE' }, true),
    stats:       ()         => req('/api/stats', {}, true),
    promos:      ()         => req('/api/promos', {}, true),
    savePromo:   (p)        => req('/api/promos', { method: 'POST', body: JSON.stringify(p) }, true),
    deletePromo: (code)     => req('/api/promos/' + encodeURIComponent(code), { method: 'DELETE' }, true),
    uploadImage: (file)     => { const fd = new FormData(); fd.append('image', file); return req('/api/upload', { method: 'POST', body: fd }, true); },
    srcFor,
    /* Applique réglages (WhatsApp/tel/email/ville) au document */
    applySettings(s) {
      if (!s) return;
      if (s.whatsapp) document.querySelectorAll('a[href*="XXXXXXXXXXX"]').forEach(a => a.href = a.href.replace(/XXXXXXXXXXX/g, s.whatsapp));
      document.querySelectorAll('a[href^="tel:"]').forEach(a => { if (s.phone) a.href = 'tel:' + s.phone.replace(/[^0-9+]/g, ''); });
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => { if (s.email) a.href = 'mailto:' + s.email; });
      const map = {
        '+XXX XX XX XX XX': s.phone,
        'votre-email@royalorbitech.com': s.email,
        'Votre ville, Votre pays': s.city, 'Your city, Your country': s.city
      };
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => { let t = n.nodeValue, ch = false; for (const [k, v] of Object.entries(map)) { if (v && v !== k && t.includes(k)) { t = t.split(k).join(v); ch = true; } } if (ch) n.nodeValue = t; });
    }
  };
})();
