/* =========================================================
   ROYAL ORBITECH — COUCHE DONNÉES (localStorage)
   Sert de "base de données" locale partagée entre la boutique
   et le tableau de bord admin.
   À charger APRÈS products.js et AVANT shop.js / about.js.
   ========================================================= */
(function () {
  const PKEY = 'ro_products_v1';
  const CKEY = 'ro_categories_v1';
  const SKEY = 'ro_settings_v1';
  const AKEY = 'ro_admin_pass';

  const DEFAULT_SETTINGS = {
    whatsapp: '',                                   // ex : 22961234567
    phone:   '+XXX XX XX XX XX',
    email:   'votre-email@royalorbitech.com',
    city:    'Votre ville, Votre pays',
    shopName:'ROYAL ORBITECH'
  };

  /* --- Appliquer les données enregistrées sur les tableaux par défaut --- */
  try {
    const p = localStorage.getItem(PKEY);
    if (p && typeof PRODUCTS !== 'undefined') { const a = JSON.parse(p); PRODUCTS.length = 0; a.forEach(x => PRODUCTS.push(x)); }
  } catch (e) {}
  try {
    const c = localStorage.getItem(CKEY);
    if (c && typeof CATEGORIES !== 'undefined') { const a = JSON.parse(c); CATEGORIES.length = 0; a.forEach(x => CATEGORIES.push(x)); }
  } catch (e) {}

  const getProducts = () => {
    try { const s = localStorage.getItem(PKEY); if (s) return JSON.parse(s); } catch (e) {}
    return (typeof PRODUCTS !== 'undefined') ? PRODUCTS.slice() : [];
  };
  const saveProducts = list => localStorage.setItem(PKEY, JSON.stringify(list));

  const getCategories = () => {
    try { const s = localStorage.getItem(CKEY); if (s) return JSON.parse(s); } catch (e) {}
    return (typeof CATEGORIES !== 'undefined') ? CATEGORIES.slice() : [];
  };
  const saveCategories = list => localStorage.setItem(CKEY, JSON.stringify(list));

  const getSettings = () => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS, s);
  };
  const saveSettings = o => localStorage.setItem(SKEY, JSON.stringify(o));

  const getPass = () => localStorage.getItem(AKEY) || 'admin';
  const setPass = p => localStorage.setItem(AKEY, p);

  const nextId = () => getProducts().reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;

  const resetData = () => { [PKEY, CKEY, SKEY].forEach(k => localStorage.removeItem(k)); };

  const exportJSON = () => JSON.stringify({
    products: getProducts(), categories: getCategories(), settings: getSettings()
  }, null, 2);

  const importJSON = str => {
    const o = JSON.parse(str);
    if (o.products)   saveProducts(o.products);
    if (o.categories) saveCategories(o.categories);
    if (o.settings)   saveSettings(o.settings);
  };

  /* Chemin d'image : data-URL / URL absolue = tel quel, sinon dossier produits */
  const srcFor = img => /^(data:|https?:|\/)/.test(img || '') ? img : 'images/products/' + img;

  /* Applique les réglages (WhatsApp, tél, email…) au document courant */
  const applySettings = () => {
    const s = getSettings();
    if (s.whatsapp) {
      document.querySelectorAll('a[href*="XXXXXXXXXXX"]').forEach(a => {
        a.href = a.href.replace(/XXXXXXXXXXX/g, s.whatsapp);
      });
    }
    document.querySelectorAll('a[href^="tel:"]').forEach(a => { if (s.phone) a.href = 'tel:' + s.phone.replace(/[^0-9+]/g, ''); });
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => { if (s.email) a.href = 'mailto:' + s.email; });
    // Remplacement des textes indicatifs
    const map = {
      '+XXX XX XX XX XX': s.phone,
      'votre-email@royalorbitech.com': s.email,
      'Votre ville, Votre pays': s.city, 'Your city, Your country': s.city
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      let t = n.nodeValue, changed = false;
      for (const [k, v] of Object.entries(map)) { if (v && v !== k && t.includes(k)) { t = t.split(k).join(v); changed = true; } }
      if (changed) n.nodeValue = t;
    });
  };

  window.RO_STORE = {
    getProducts, saveProducts, getCategories, saveCategories,
    getSettings, saveSettings, getPass, setPass,
    nextId, resetData, exportJSON, importJSON, srcFor, applySettings,
    keys: { PKEY, CKEY, SKEY, AKEY }
  };
})();
