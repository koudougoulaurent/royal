/* ===== ROYAL ORBITECH — BOUTIQUE DYNAMIQUE (via API) ===== */
document.addEventListener('DOMContentLoaded', async () => {
  const $  = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ===== ICÔNES SVG (remplacent les emojis) ===== */
  const S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
  const ICONS = {
    all:        S + '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
    phones:     S + '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/></svg>',
    computers:  S + '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2.5 20h19"/></svg>',
    audio:      S + '<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="3" y="13" width="4.2" height="6.5" rx="1.6"/><rect x="16.8" y="13" width="4.2" height="6.5" rx="1.6"/></svg>',
    accessories:S + '<path d="M9 2.5v5M15 2.5v5"/><path d="M6.5 7.5h11V11a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.5v5"/></svg>',
    smart:      S + '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><rect x="10" y="14" width="4" height="6"/></svg>',
    gaming:     S + '<rect x="2.5" y="7.5" width="19" height="9.5" rx="4.5"/><line x1="7.5" y1="11" x2="7.5" y2="14"/><line x1="6" y1="12.5" x2="9" y2="12.5"/><circle cx="15.5" cy="11.8" r="1"/><circle cx="18" cy="13.8" r="1"/></svg>',
    appliances: S + '<path d="M5 9h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M3.5 9h17"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
    network:    S + '<path d="M5 12a10 10 0 0 1 14 0"/><path d="M8 15a6 6 0 0 1 8 0"/><circle cx="12" cy="18" r="1.1"/></svg>',
    box:        S + '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>'
  };
  const catIcon = c => ICONS[c.key] || `<span class="emoji-fallback">${c.emoji || ''}</span>`;

  /* ===== ÉTAT ===== */
  let lang = localStorage.getItem('ro_lang') || 'fr';
  let cart = JSON.parse(localStorage.getItem('ro_cart') || '[]');
  let state = { cat: 'all', search: '', sort: 'pop' };
  let PRODUCTS = [], CATEGORIES = [], SETTINGS = {};
  let WHATSAPP = 'XXXXXXXXXXX';

  const fmt = n => (Number(n) || 0).toLocaleString('fr-FR') + ' FCFA';
  const allCat = () => ({ key: 'all', emoji: '🛍️', fr: 'Tous les produits', en: 'All products' });
  const cats = () => [allCat(), ...CATEGORIES];
  const catObj = k => cats().find(c => c.key === k) || allCat();
  const catLabel = k => catObj(k)[lang];
  const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
  const imgTag = (img) => img
    ? `<img src="${API.srcFor(img)}" alt="" style="position:absolute;inset:0" onerror="this.remove()"><span class="ph">${ICONS.box}</span>`
    : `<span class="ph">${ICONS.box}</span>`;

  /* ===== CHARGEMENT DES DONNÉES ===== */
  try {
    const data = await API.catalog();
    PRODUCTS = data.products; CATEGORIES = data.categories; SETTINGS = data.settings || {};
    WHATSAPP = SETTINGS.whatsapp || 'XXXXXXXXXXX';
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      `<div style="background:#fdece9;color:#a12312;padding:14px;text-align:center;font-family:Inter,sans-serif;font-size:14px">
       ⚠️ Impossible de charger la boutique. Assurez-vous que le serveur est démarré (npm start) puis ouvrez
       <b>http://localhost:3000</b>.</div>`);
    return;
  }

  /* ===== LANGUE ===== */
  const applyLang = () => {
    document.documentElement.lang = lang;
    $$('[data-fr]').forEach(el => { const v = el.getAttribute('data-' + lang); if (v !== null) el.textContent = v; });
    $$('[data-ph-fr]').forEach(el => el.setAttribute('placeholder', el.getAttribute('data-ph-' + lang)));
    $('#langToggle').textContent = lang === 'fr' ? 'FR / EN' : 'EN / FR';
  };
  $('#langToggle').addEventListener('click', () => {
    lang = lang === 'fr' ? 'en' : 'fr'; localStorage.setItem('ro_lang', lang);
    applyLang(); buildCategories(); renderAll(); renderCart(); API.applySettings(SETTINGS);
  });

  /* ===== CATÉGORIES ===== */
  const buildCategories = () => {
    $('#catSidebar').innerHTML = cats().map(c =>
      `<li><button class="cat-row ${c.key === state.cat ? 'active' : ''}" data-cat="${c.key}">
        <span class="cr-ico">${catIcon(c)}</span>${c[lang]}<span class="cr-arrow">›</span></button></li>`).join('');
    $$('#catSidebar .cat-row').forEach(b => b.addEventListener('click', () => {
      state.cat = b.dataset.cat; state.search = ''; $('#searchInput').value = '';
      renderAll(); document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
    }));
    $('#catTiles').innerHTML = CATEGORIES.map(c =>
      `<div class="cat-tile" data-cat="${c.key}"><div class="ct-ico">${catIcon(c)}</div><span>${c[lang]}</span></div>`).join('');
    $$('#catTiles .cat-tile').forEach(t => t.addEventListener('click', () => {
      state.cat = t.dataset.cat; renderAll(); document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
    }));
    $('#searchCat').innerHTML = cats().map(c => `<option value="${c.key}">${c[lang]}</option>`).join('');
    $('#searchCat').value = state.cat;
  };

  /* ===== CARTE PRODUIT ===== */
  const card = p => {
    const c = catObj(p.cat);
    const badge = p.badge ? `<span class="pbadge ${p.badge}">${
      p.badge === 'promo' ? (lang === 'fr' ? 'PROMO' : 'SALE') :
      p.badge === 'new' ? (lang === 'fr' ? 'NOUVEAU' : 'NEW') :
      (lang === 'fr' ? 'TOP VENTE' : 'BEST')}</span>` : '';
    const old = p.old ? `<s>${fmt(p.old)}</s>` : '';
    const inCart = cart.some(i => i.id === p.id);
    const out = p.stock != null && p.stock <= 0;
    const low = p.stock != null && p.stock > 0 && p.stock <= 5;
    const stockHtml = out
      ? `<div class="pstock out">${lang === 'fr' ? '● Épuisé' : '● Sold out'}</div>`
      : (low ? `<div class="pstock low">${lang === 'fr' ? 'Plus que ' + p.stock + ' en stock' : 'Only ' + p.stock + ' left'}</div>` : '');
    const btn = out
      ? `<button class="padd" data-add="${p.id}" disabled>${lang === 'fr' ? 'Indisponible' : 'Unavailable'}</button>`
      : `<button class="padd ${inCart ? 'added' : ''}" data-add="${p.id}">${inCart ? (lang === 'fr' ? '✓ Ajouté' : '✓ Added') : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}</button>`;
    return `<article class="pcard ${out ? 'soldout' : ''}" data-id="${p.id}">
      <div class="pcard-img" data-view="${p.id}">${badge}${imgTag(p.img, c.emoji)}</div>
      <div class="pcard-body">
        <div class="pcat">${c[lang]}</div>
        <div class="pname" data-view="${p.id}">${p.name[lang] || p.name.fr}</div>
        <div class="prate"><span class="stars">${stars(p.rating)}</span> ${p.rating} · ${(p.sold||0).toLocaleString('fr-FR')} ${lang === 'fr' ? 'vendus' : 'sold'}</div>
        <div class="pprice"><b>${fmt(p.price)}</b>${old}</div>
        ${stockHtml}
        ${btn}
      </div></article>`;
  };

  /* ===== RENDU ===== */
  const filtered = () => {
    let list = PRODUCTS.slice();
    if (state.cat !== 'all') list = list.filter(p => p.cat === state.cat);
    if (state.search) { const q = state.search.toLowerCase();
      list = list.filter(p => ((p.name.fr || '') + ' ' + (p.name.en || '') + ' ' + catLabel(p.cat)).toLowerCase().includes(q)); }
    if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
    else if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
    else if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => (b.sold||0) - (a.sold||0));
    return list;
  };

  const renderAll = () => {
    buildCategories();
    $('#dealsGrid').innerHTML = PRODUCTS.filter(p => p.badge === 'promo').slice(0, 4).map(card).join('')
      || `<p style="color:var(--muted)">${lang==='fr'?'Aucune promotion pour le moment.':'No deals right now.'}</p>`;
    const list = filtered();
    $('#productGrid').innerHTML = list.map(card).join('');
    $('#emptyMsg').style.display = list.length ? 'none' : 'block';
    $('#resultCount').textContent = `${list.length} ${lang === 'fr' ? 'produit(s)' : 'product(s)'}`;
    $('#catalogueTitle').textContent = state.search ? `« ${state.search} »` : catLabel(state.cat);
    bindCards(); $('#searchCat').value = state.cat;
  };

  const bindCards = () => {
    $$('[data-add]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); addToCart(+b.dataset.add); }));
    $$('[data-view]').forEach(el => el.addEventListener('click', () => openModal(+el.dataset.view)));
  };

  /* ===== RECHERCHE / TRI ===== */
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault(); state.search = $('#searchInput').value.trim(); state.cat = $('#searchCat').value;
    renderAll(); document.getElementById('catalogue').scrollIntoView({ behavior: 'smooth' });
  });
  $('#searchInput').addEventListener('input', () => { state.search = $('#searchInput').value.trim(); renderAll(); });
  $('#searchCat').addEventListener('change', () => { state.cat = $('#searchCat').value; renderAll(); });
  $('#sortSelect').addEventListener('change', () => { state.sort = $('#sortSelect').value; renderAll(); });

  /* ===== PANIER ===== */
  const saveCart = () => localStorage.setItem('ro_cart', JSON.stringify(cart));
  const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => cart.reduce((s, i) => { const p = PRODUCTS.find(x => x.id === i.id); return s + (p ? p.price * i.qty : 0); }, 0);
  const addToCart = (id, qty = 1) => {
    const it = cart.find(i => i.id === id); if (it) it.qty += qty; else cart.push({ id, qty });
    saveCart(); updateCount(); renderCart(); renderAll();
    const p = PRODUCTS.find(x => x.id === id); toast((lang === 'fr' ? 'Ajouté : ' : 'Added: ') + (p.name[lang] || p.name.fr));
  };
  const setQty = (id, q) => { const it = cart.find(i => i.id === id); if (!it) return; it.qty = q; if (it.qty <= 0) cart = cart.filter(i => i.id !== id); saveCart(); updateCount(); renderCart(); renderAll(); };
  const removeItem = id => { cart = cart.filter(i => i.id !== id); saveCart(); updateCount(); renderCart(); renderAll(); };
  const updateCount = () => { $('#cartCount').textContent = cartCount(); };

  const renderCart = () => {
    const empty = cart.length === 0;
    $('#cartEmpty').style.display = empty ? 'flex' : 'none';
    $('#cartFoot').style.display = empty ? 'none' : 'block';
    $('#cartItems').innerHTML = cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.id); if (!p) return '';
      const c = catObj(p.cat);
      return `<div class="citem">
        <div class="citem-img">${imgTag(p.img, c.emoji)}</div>
        <div class="citem-info">
          <div class="citem-name">${p.name[lang] || p.name.fr}</div>
          <div class="citem-price">${fmt(p.price)}</div>
          <div class="citem-ctrl">
            <div class="qty"><button data-dec="${p.id}">−</button><span>${i.qty}</span><button data-inc="${p.id}">+</button></div>
            <button class="citem-remove" data-rm="${p.id}">${lang === 'fr' ? 'Retirer' : 'Remove'}</button>
          </div>
        </div></div>`;
    }).join('');
    $('#cartTotal').textContent = fmt(cartTotal());
    $$('[data-inc]').forEach(b => b.onclick = () => setQty(+b.dataset.inc, cart.find(i => i.id === +b.dataset.inc).qty + 1));
    $$('[data-dec]').forEach(b => b.onclick = () => setQty(+b.dataset.dec, cart.find(i => i.id === +b.dataset.dec).qty - 1));
    $$('[data-rm]').forEach(b => b.onclick = () => removeItem(+b.dataset.rm));
  };

  const openCart = () => { $('#cartDrawer').classList.add('open'); $('#drawerOverlay').classList.add('show'); };
  const closeCart = () => { $('#cartDrawer').classList.remove('open'); $('#drawerOverlay').classList.remove('show'); };
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#drawerOverlay').addEventListener('click', closeCart);

  /* ===== TUNNEL DE COMMANDE ===== */
  let appliedPromo = { code: '', discount: 0 };
  const deliveryFee = () => {
    const sub = cartTotal(); let d = +(SETTINGS.deliveryFee || 0);
    if ((SETTINGS.freeShipThreshold || 0) > 0 && sub >= SETTINGS.freeShipThreshold) d = 0;
    return d;
  };
  const renderSummary = () => {
    const sub = cartTotal(), del = deliveryFee(), dis = appliedPromo.discount || 0;
    const total = Math.max(0, sub + del - dis);
    const delTxt = del === 0 ? (lang === 'fr' ? 'Gratuite' : 'Free') : fmt(del);
    $('#coSummary').innerHTML =
      `<div class="row"><span>${lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span><span>${fmt(sub)}</span></div>
       <div class="row"><span>${lang === 'fr' ? 'Livraison' : 'Delivery'}</span><span>${delTxt}</span></div>
       ${dis ? `<div class="row"><span>${lang === 'fr' ? 'Remise' : 'Discount'} (${appliedPromo.code})</span><span>-${fmt(dis)}</span></div>` : ''}
       <div class="row total"><span>${lang === 'fr' ? 'Total' : 'Total'}</span><b>${fmt(total)}</b></div>`;
  };
  const openCheckout = () => {
    if (!cart.length) return;
    appliedPromo = { code: '', discount: 0 };
    $('#coPromo').value = ''; $('#coPromoMsg').textContent = ''; $('#coPromoMsg').className = 'co-msg';
    $('#coOnlineOpt').style.display = SETTINGS.payActive ? 'flex' : 'none';
    renderSummary();
    closeCart();
    $('#checkoutModal').classList.add('show');
  };
  const closeCheckout = () => $('#checkoutModal').classList.remove('show');
  $('#checkoutBtn').addEventListener('click', openCheckout);
  $('#coClose').addEventListener('click', closeCheckout);
  $('#checkoutModal').addEventListener('click', e => { if (e.target === $('#checkoutModal')) closeCheckout(); });

  $('#coPromoBtn').addEventListener('click', async () => {
    const code = $('#coPromo').value.trim(); const msg = $('#coPromoMsg');
    if (!code) return;
    try {
      const r = await API.validatePromo(code, cartTotal());
      if (r.discount > 0) { appliedPromo = { code: r.code, discount: r.discount }; msg.textContent = (lang === 'fr' ? 'Code appliqué : -' : 'Applied: -') + fmt(r.discount); msg.className = 'co-msg ok'; }
      else { appliedPromo = { code: '', discount: 0 }; msg.textContent = r.error || (lang === 'fr' ? 'Code invalide.' : 'Invalid code.'); msg.className = 'co-msg err'; }
    } catch (e) { msg.textContent = e.message; msg.className = 'co-msg err'; }
    renderSummary();
  });

  $('#coConfirm').addEventListener('click', async () => {
    const name = $('#coName').value.trim(), phone = $('#coPhone').value.trim(), address = $('#coAddress').value.trim();
    if (!name || !phone) { toast(lang === 'fr' ? 'Indiquez votre nom et téléphone.' : 'Enter your name and phone.'); return; }
    const payment = (document.querySelector('input[name="paym"]:checked') || {}).value || 'whatsapp';
    let order;
    try {
      order = await API.createOrder({ customer: { name, phone, address }, items: cart.map(i => ({ id: i.id, qty: i.qty })), promo: appliedPromo.code, payment });
    } catch (e) { toast(lang === 'fr' ? 'Erreur, réessayez.' : 'Error, try again.'); return; }
    const lines = cart.map(i => { const p = PRODUCTS.find(x => x.id === i.id); return `• ${p.name[lang] || p.name.fr} x${i.qty} — ${fmt(p.price * i.qty)}`; });
    cart = []; saveCart(); updateCount(); renderCart(); renderAll(); closeCheckout();
    if (payment === 'whatsapp') {
      const head = lang === 'fr' ? '*Nouvelle commande — ROYAL ORBITECH*' : '*New order — ROYAL ORBITECH*';
      const info = `${lang === 'fr' ? 'Client' : 'Customer'}: ${name}%0A${lang === 'fr' ? 'Tél' : 'Phone'}: ${phone}${address ? '%0A' + (lang === 'fr' ? 'Adresse' : 'Address') + ': ' + address : ''}`;
      const msg = `${head}%0A%0A${info}%0A%0A${lines.join('%0A')}%0A%0A${appliedPromo.discount ? (lang === 'fr' ? 'Remise' : 'Discount') + ': -' + fmt(appliedPromo.discount) + '%0A' : ''}${(lang === 'fr' ? 'Livraison' : 'Delivery')}: ${fmt(deliveryFee())}%0A*TOTAL : ${fmt(order.total)}*`;
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');
    } else if (payment === 'online') {
      toast(lang === 'fr' ? 'Paiement en ligne : bientôt disponible. Commande enregistrée ✓' : 'Online payment coming soon. Order saved ✓');
    }
    toast(lang === 'fr' ? '✓ Commande enregistrée ! Nous vous contactons.' : '✓ Order saved! We will contact you.');
  });

  /* ===== QUICK VIEW ===== */
  const openModal = id => {
    const p = PRODUCTS.find(x => x.id === id); if (!p) return;
    const c = catObj(p.cat); const old = p.old ? `<s>${fmt(p.old)}</s>` : '';
    const imgs = [p.img, ...(p.gallery || [])].filter(Boolean);
    const thumbs = imgs.length > 1
      ? `<div class="mv-thumbs">${imgs.map((g, i) => `<button class="mvt ${i === 0 ? 'on' : ''}" data-src="${API.srcFor(g)}"><img src="${API.srcFor(g)}" onerror="this.remove()"></button>`).join('')}</div>` : '';
    const out = p.stock != null && p.stock <= 0;
    const stockLine = p.stock == null ? '' : (out
      ? `<div class="mv-stock out">${lang === 'fr' ? 'Épuisé' : 'Sold out'}</div>`
      : `<div class="mv-stock ok">${lang === 'fr' ? 'En stock' : 'In stock'}${p.stock <= 5 ? ' · ' + (lang === 'fr' ? 'plus que ' + p.stock : 'only ' + p.stock) : ''}</div>`);
    const brand = p.brand ? ` · ${esc(p.brand)}` : '';
    $('#modalBox').innerHTML = `
      <button class="mv-close" id="mvClose">×</button>
      <div class="mv">
        <div class="mv-imgcol">
          <div class="mv-img" id="mvMain">${imgTag(imgs[0], c.emoji)}</div>
          ${thumbs}
        </div>
        <div class="mv-info">
          <div class="mv-cat">${c[lang]}${brand}</div>
          <h3>${p.name[lang] || p.name.fr}</h3>
          <div class="mv-rate"><span class="stars">${stars(p.rating)}</span> ${p.rating}/5 · ${(p.sold||0).toLocaleString('fr-FR')} ${lang === 'fr' ? 'vendus' : 'sold'}</div>
          ${stockLine}
          <p class="mv-desc">${(p.desc && p.desc[lang]) || (p.desc && p.desc.fr) || ''}</p>
          ${p.sku ? `<p class="mv-sku">${lang === 'fr' ? 'Réf' : 'Ref'}: ${esc(p.sku)}</p>` : ''}
          <div class="mv-price"><b>${fmt(p.price)}</b>${old}</div>
          <div class="mv-actions">
            <button class="btn btn-royal" id="mvAdd" ${out ? 'disabled' : ''}>${out ? (lang === 'fr' ? 'Indisponible' : 'Unavailable') : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}</button>
            <a class="btn btn-whatsapp" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent((lang === 'fr' ? 'Bonjour, je suis intéressé par : ' : 'Hello, I am interested in: ') + (p.name[lang] || p.name.fr) + ' (' + fmt(p.price) + ')')}" target="_blank" rel="noopener">${lang === 'fr' ? 'Commander maintenant' : 'Order now'}</a>
          </div>
        </div>
      </div>`;
    $('#modal').classList.add('show');
    $('#mvClose').onclick = closeModal;
    const mvAdd = $('#mvAdd'); if (mvAdd && !out) mvAdd.onclick = () => { addToCart(id); closeModal(); openCart(); };
    $$('#modalBox [data-src]').forEach(b => b.onclick = () => {
      $('#mvMain').innerHTML = `<img src="${b.dataset.src}" alt="" style="position:absolute;inset:0" onerror="this.remove()">`;
      $$('#modalBox .mvt').forEach(t => t.classList.remove('on')); b.classList.add('on');
    });
  };
  const closeModal = () => $('#modal').classList.remove('show');
  $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });

  /* ===== TOAST ===== */
  let toastT;
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); };

  /* ===== DIVERS ===== */
  $('#year').textContent = new Date().getFullYear();
  $('#burger').addEventListener('click', () => document.getElementById('catTiles').scrollIntoView({ behavior: 'smooth' }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCart(); closeCheckout(); } });

  /* ===== INIT ===== */
  applyLang(); buildCategories(); renderAll(); renderCart(); updateCount(); API.applySettings(SETTINGS);
});
