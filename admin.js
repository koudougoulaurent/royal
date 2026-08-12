/* ===== ROYAL ORBITECH — ADMIN v2 (via API) ===== */
document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  const fmt = n => (Number(n) || 0).toLocaleString('fr-FR') + ' FCFA';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let PRODUCTS = [], CATEGORIES = [], SETTINGS = {}, ORDERS = [], PROMOS = [], STATS = null;

  const netErr = e => (location.protocol === 'file:')
    ? "⚠️ Ouvrez l'admin via http://localhost:3000/admin.html (n'ouvrez pas le fichier par double-clic)."
    : ((e && e.message === 'Failed to fetch')
        ? "Serveur injoignable. Lancez « Démarrer-le-site.command », puis ouvrez http://localhost:3000/admin.html."
        : (e && e.message) || 'Erreur');

  let toastT;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); };
  const catOf = k => CATEGORIES.find(c => c.key === k);
  const thumb = img => img ? `<span class="tthumb"><img src="${API.srcFor(img)}" alt="" onerror="this.remove()"></span>` : `<span class="tthumb">📦</span>`;
  const payLabel = p => ({ whatsapp: 'WhatsApp', cash: 'À la livraison', online: 'En ligne' }[p] || p || '—');

  /* ===== LOGIN ===== */
  const loadData = async () => { const d = await API.catalog(); PRODUCTS = d.products; CATEGORIES = d.categories; SETTINGS = d.settings || {}; };
  const showApp = async () => {
    try { await loadData(); } catch (e) { $('#loginErr').textContent = netErr(e); return; }
    $('#login').style.display = 'none'; $('#app').classList.add('show'); renderAll();
  };
  const tryLogin = async () => {
    const v = $('#passInput').value; if (!v) return; $('#loginErr').textContent = '';
    try { const r = await API.login(v); API.setToken(r.token); await showApp(); }
    catch (e) { $('#loginErr').textContent = netErr(e); }
  };
  $('#loginBtn').addEventListener('click', tryLogin);
  $('#passInput').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  $('#logoutBtn').addEventListener('click', () => { API.clearToken(); location.reload(); });
  if (location.protocol === 'file:') $('#loginErr').textContent = netErr();
  if (API.getToken()) showApp(); else setTimeout(() => $('#passInput').focus(), 100);

  /* ===== NAVIGATION ===== */
  const go = view => {
    $$('#sideNav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.remove('show'));
    $('#view-' + view).classList.add('show');
    if (view === 'settings') fillSettings();
    if (view === 'orders') loadOrders();
    if (view === 'promos') loadPromos();
    if (view === 'dash') loadDash();
  };
  $$('#sideNav button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => go(b.dataset.goto)));

  /* ===== DASHBOARD ===== */
  const loadDash = async () => {
    try { STATS = await API.stats(); } catch (e) { STATS = null; }
    const s = STATS || { revenue: 0, orders: 0, pending: 0, nbProducts: PRODUCTS.length, catalogValue: 0, byDay: [], top: [], low: [] };
    $('#statCards').innerHTML = `
      <div class="scard"><div class="ico">💰</div><b style="font-size:1.2rem">${fmt(s.revenue)}</b><span>Chiffre d'affaires</span></div>
      <div class="scard"><div class="ico">🧾</div><b>${s.orders}</b><span>Commandes</span></div>
      <div class="scard"><div class="ico">⏳</div><b>${s.pending}</b><span>En attente</span></div>
      <div class="scard"><div class="ico">📦</div><b>${s.nbProducts}</b><span>Produits</span></div>`;
    drawChart(s.byDay || []);
    $('#lowStock').innerHTML = (s.low || []).map(p => `<tr><td class="tname">${esc(p.name_fr)}</td><td style="text-align:right"><span class="pill ${p.stock <= 0 ? 'promo' : 'top'}">${p.stock <= 0 ? 'Épuisé' : p.stock + ' rest.'}</span></td></tr>`).join('') || '<tr><td class="hint">Aucune alerte de stock.</td></tr>';
    $('#topProducts').innerHTML = (s.top || []).map(p => `<tr><td class="tname">${esc(p.name_fr)}</td><td style="text-align:right">${p.sold} vendus</td></tr>`).join('') || '<tr><td class="hint">—</td></tr>';
    $('#dashRecent').innerHTML = PRODUCTS.slice(-5).reverse().map(x => `<tr><td><div class="tprod">${thumb(x.img)}<div><div class="tname">${esc(x.name.fr)}</div><div class="tcat">${fmt(x.price)}</div></div></div></td></tr>`).join('') || '<tr><td>Aucun produit.</td></tr>';
  };

  const drawChart = data => {
    const cv = $('#salesChart'); if (!cv) return;
    const empty = !data.length;
    $('#salesEmpty').style.display = empty ? 'block' : 'none';
    cv.style.display = empty ? 'none' : 'block';
    if (empty) return;
    const ctx = cv.getContext('2d');
    const W = cv.width = cv.clientWidth * 2, H = cv.height = 150 * 2; ctx.scale(1, 1);
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data.map(d => d.rev), 1);
    const pad = 30 * 2, bw = (W - pad) / data.length;
    ctx.fillStyle = '#ff6a00';
    data.forEach((d, i) => {
      const h = (d.rev / max) * (H - 50 * 2);
      const x = pad + i * bw + bw * 0.15, y = H - 30 * 2 - h, w = bw * 0.7;
      ctx.fillStyle = '#ff6a00'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#9aa3b2'; ctx.font = '20px Inter'; ctx.textAlign = 'center';
      ctx.fillText((d.d || '').slice(5), x + w / 2, H - 8 * 2);
    });
  };

  /* ===== PRODUITS ===== */
  let prodFilter = '';
  const renderProducts = () => {
    let list = PRODUCTS.slice();
    if (prodFilter) { const q = prodFilter.toLowerCase(); list = list.filter(x => (x.name.fr + ' ' + x.name.en + ' ' + (x.brand || '') + ' ' + (x.sku || '')).toLowerCase().includes(q)); }
    $('#prodCount').textContent = `${list.length} produit${list.length > 1 ? 's' : ''}`;
    $('#prodRows').innerHTML = list.map(x => {
      const c = catOf(x.cat);
      const badge = x.badge ? `<span class="pill ${x.badge}">${x.badge}</span>` : `<span class="pill none">—</span>`;
      const stock = x.stock == null ? '' : (x.stock <= 0 ? ' · <span style="color:var(--red)">Épuisé</span>' : ` · Stock ${x.stock}`);
      return `<tr>
        <td><div class="tprod">${thumb(x.img)}<div><div class="tname">${esc(x.name.fr)}</div><div class="tcat hide-sm">${esc(x.brand || x.name.en)}${stock}</div></div></div></td>
        <td class="hide-sm">${c?.emoji || ''} ${esc(c?.fr || x.cat)}</td>
        <td class="tprice">${fmt(x.price)}${x.old ? `<div class="tcat" style="text-decoration:line-through">${fmt(x.old)}</div>` : ''}</td>
        <td class="hide-sm">${badge}</td>
        <td class="hide-sm">⭐ ${x.rating || '-'}</td>
        <td><div class="tact">
          <button class="iconbtn" data-edit="${x.id}" title="Modifier">✏️</button>
          <button class="iconbtn del" data-del="${x.id}" title="Supprimer">🗑️</button>
        </div></td></tr>`;
    }).join('') || '<tr><td colspan="6">Aucun produit trouvé.</td></tr>';
    $$('[data-edit]').forEach(b => b.onclick = () => openProd(+b.dataset.edit));
    $$('[data-del]').forEach(b => b.onclick = () => delProd(+b.dataset.del));
  };
  $('#prodSearch').addEventListener('input', e => { prodFilter = e.target.value; renderProducts(); });

  const delProd = async id => {
    const p = PRODUCTS.find(x => x.id === id);
    if (!confirm(`Supprimer « ${p.name.fr} » ? Action irréversible.`)) return;
    try { await API.deleteProduct(id); await loadData(); renderAll(); toast('Produit supprimé.'); }
    catch (e) { toast('Erreur : ' + e.message); }
  };

  /* --- Modal produit --- */
  const pm = $('#prodModal');
  let pfImg = '', pfGalleryArr = [];
  const fillCatSelect = () => { $('#pfCat').innerHTML = CATEGORIES.map(c => `<option value="${c.key}">${c.emoji} ${c.fr}</option>`).join(''); };
  const setPreview = img => { $('#pfPreview').innerHTML = img ? `<img src="${API.srcFor(img)}" alt="" onerror="this.parentNode.textContent='🖼️'">` : '🖼️'; };
  const renderGallery = () => {
    $('#pfGallery').innerHTML = pfGalleryArr.map((g, i) =>
      `<span class="img-preview" style="width:56px;height:56px;position:relative"><img src="${API.srcFor(g)}" alt="" onerror="this.remove()">
      <button type="button" data-grm="${i}" style="position:absolute;top:-6px;right:-6px;background:var(--red);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:12px;cursor:pointer">×</button></span>`).join('');
    $$('#pfGallery [data-grm]').forEach(b => b.onclick = () => { pfGalleryArr.splice(+b.dataset.grm, 1); renderGallery(); });
  };

  const openProd = id => {
    fillCatSelect();
    const p = id ? PRODUCTS.find(x => x.id === id) : null;
    $('#prodModalTitle').textContent = p ? 'Modifier le produit' : 'Ajouter un produit';
    $('#pfId').value = p ? p.id : '';
    $('#pfNameFr').value = p ? p.name.fr : '';
    $('#pfNameEn').value = p ? p.name.en : '';
    $('#pfCat').value = p ? p.cat : ($('#pfCat').options[0]?.value || '');
    $('#pfPrice').value = p ? p.price : '';
    $('#pfOld').value = p ? (p.old || '') : '';
    $('#pfBadge').value = p ? (p.badge || '') : '';
    $('#pfRating').value = p ? p.rating : '4.6';
    $('#pfSold').value = p ? p.sold : '0';
    $('#pfStock').value = p && p.stock != null ? p.stock : '';
    $('#pfBrand').value = p ? (p.brand || '') : '';
    $('#pfSku').value = p ? (p.sku || '') : '';
    $('#pfDescFr').value = p ? (p.desc?.fr || '') : '';
    $('#pfDescEn').value = p ? (p.desc?.en || '') : '';
    pfImg = p ? p.img : '';
    pfGalleryArr = p && Array.isArray(p.gallery) ? p.gallery.slice() : [];
    $('#pfImgFile').value = ''; $('#pfImgUrl').value = ''; $('#pfGalleryFile').value = '';
    setPreview(pfImg); renderGallery();
    pm.classList.add('show');
  };
  const closeProd = () => pm.classList.remove('show');
  $('#pfCancel').onclick = closeProd;
  $('#addProductBtn').onclick = () => openProd(null);

  $('#pfImgFile').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return; toast('Envoi de l\'image…');
    try { const r = await API.uploadImage(file); pfImg = r.img; setPreview(pfImg); toast('Image envoyée ✓'); }
    catch (err) { toast('Échec de l\'envoi : ' + err.message); }
  });
  $('#pfGalleryFile').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return; toast('Envoi…');
    try { const r = await API.uploadImage(file); pfGalleryArr.push(r.img); renderGallery(); $('#pfGalleryFile').value = ''; toast('Photo ajoutée ✓'); }
    catch (err) { toast('Échec : ' + err.message); }
  });
  $('#pfImgUrlBtn').onclick = () => {
    const u = $('#pfImgUrl').value.trim();
    if (!/^https?:\/\//i.test(u)) { toast('Le lien doit commencer par http(s)://'); return; }
    pfImg = u; setPreview(pfImg); $('#pfImgUrl').value = ''; toast('Image ajoutée par lien ✓');
  };
  $('#pfImgClear').onclick = () => { pfImg = ''; $('#pfImgFile').value = ''; setPreview(''); };

  $('#pfSave').onclick = async () => {
    const nameFr = $('#pfNameFr').value.trim(), price = +$('#pfPrice').value;
    if (!nameFr) { toast('Le nom (FR) est obligatoire.'); return; }
    if (!price || price <= 0) { toast('Indiquez un prix valide.'); return; }
    const stockVal = $('#pfStock').value.trim();
    const obj = {
      cat: $('#pfCat').value, img: pfImg || '',
      price, old: +$('#pfOld').value || 0, badge: $('#pfBadge').value,
      rating: Math.min(5, Math.max(0, +$('#pfRating').value || 0)), sold: +$('#pfSold').value || 0,
      stock: stockVal === '' ? '' : (+stockVal || 0), brand: $('#pfBrand').value.trim(), sku: $('#pfSku').value.trim(),
      gallery: pfGalleryArr,
      name: { fr: nameFr, en: $('#pfNameEn').value.trim() || nameFr },
      desc: { fr: $('#pfDescFr').value.trim(), en: $('#pfDescEn').value.trim() }
    };
    const id = $('#pfId').value;
    try {
      if (id) await API.updateProduct(+id, obj); else await API.createProduct(obj);
      await loadData(); closeProd(); renderAll(); toast('Produit enregistré ✓');
    } catch (e) { toast('Erreur : ' + e.message); }
  };

  /* ===== CATÉGORIES ===== */
  const renderCats = () => {
    $('#catRows').innerHTML = CATEGORIES.map(c => {
      const count = PRODUCTS.filter(p => p.cat === c.key).length;
      return `<tr>
        <td style="font-size:22px">${c.emoji || ''}</td>
        <td class="tname">${esc(c.fr)}</td><td>${esc(c.en)}</td>
        <td class="hide-sm"><code style="font-size:12px;color:var(--muted)">${esc(c.key)}</code></td>
        <td class="hide-sm">${count}</td>
        <td><div class="tact"><button class="iconbtn" data-cedit="${c.key}">✏️</button><button class="iconbtn del" data-cdel="${c.key}">🗑️</button></div></td></tr>`;
    }).join('') || '<tr><td colspan="6">Aucune catégorie.</td></tr>';
    $$('[data-cedit]').forEach(b => b.onclick = () => openCat(b.dataset.cedit));
    $$('[data-cdel]').forEach(b => b.onclick = () => delCat(b.dataset.cdel));
  };
  const cm = $('#catModal');
  let catEditKey = '';
  const openCat = key => {
    const c = key ? CATEGORIES.find(x => x.key === key) : null; catEditKey = key || '';
    $('#catModalTitle').textContent = c ? 'Modifier la catégorie' : 'Ajouter une catégorie';
    $('#cfKey').value = c ? c.key : ''; $('#cfEmoji').value = c ? c.emoji : '';
    $('#cfFr').value = c ? c.fr : ''; $('#cfEn').value = c ? c.en : '';
    cm.classList.add('show');
  };
  $('#cfCancel').onclick = () => cm.classList.remove('show');
  $('#addCatBtn').onclick = () => openCat(null);
  const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  $('#cfSave').onclick = async () => {
    const fr = $('#cfFr').value.trim(); if (!fr) { toast('Le nom (FR) est obligatoire.'); return; }
    const body = { emoji: $('#cfEmoji').value.trim() || '📦', fr, en: $('#cfEn').value.trim() || fr };
    try {
      if (catEditKey) await API.updateCategory(catEditKey, body);
      else await API.createCategory(Object.assign({ key: slug(fr) || ('cat' + Date.now()) }, body));
      await loadData(); cm.classList.remove('show'); renderAll(); toast('Catégorie enregistrée ✓');
    } catch (e) { toast('Erreur : ' + e.message); }
  };
  const delCat = async key => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try { await API.deleteCategory(key); await loadData(); renderAll(); toast('Catégorie supprimée.'); }
    catch (e) { toast(e.message); }
  };

  /* ===== COMMANDES ===== */
  const STATUS = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', done: 'Terminée', cancelled: 'Annulée' };
  const loadOrders = async () => {
    try { ORDERS = await API.orders(); } catch (e) { ORDERS = []; }
    $('#orderRows').innerHTML = ORDERS.map(o => {
      const items = (o.items || []).map(i => `${esc(i.name)} ×${i.qty}`).join(', ');
      const sel = Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('');
      return `<tr>
        <td>#${o.id}</td>
        <td class="hide-sm">${new Date(o.created_at).toLocaleString('fr-FR')}</td>
        <td><div class="tname">${esc(o.customer_name) || '—'}</div><div class="tcat">${esc(o.phone) || ''}${o.address ? ' · ' + esc(o.address) : ''}</div><div class="tcat hide-sm">${items}</div></td>
        <td class="hide-sm">${payLabel(o.payment)}</td>
        <td class="tprice">${fmt(o.total)}${o.discount ? `<div class="tcat">remise ${fmt(o.discount)}</div>` : ''}</td>
        <td><select class="sort" data-ostatus="${o.id}">${sel}</select></td>
        <td><button class="iconbtn del" data-odel="${o.id}" title="Supprimer">🗑️</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="7">Aucune commande pour le moment.</td></tr>';
    $$('[data-ostatus]').forEach(s => s.onchange = async () => { try { await API.updateOrder(+s.dataset.ostatus, s.value); toast('Statut mis à jour ✓'); } catch (e) { toast(e.message); } });
    $$('[data-odel]').forEach(b => b.onclick = async () => { if (!confirm('Supprimer cette commande ?')) return; try { await API.deleteOrder(+b.dataset.odel); loadOrders(); toast('Commande supprimée.'); } catch (e) { toast(e.message); } });
  };
  $('#refreshOrders').onclick = loadOrders;
  $('#exportOrders').onclick = () => {
    const head = ['#', 'Date', 'Client', 'Téléphone', 'Adresse', 'Articles', 'Sous-total', 'Livraison', 'Remise', 'Total', 'Paiement', 'Statut'];
    const rows = [head].concat(ORDERS.map(o => [o.id, o.created_at, o.customer_name, o.phone, o.address,
      (o.items || []).map(i => i.name + ' x' + i.qty).join(' | '), o.subtotal, o.delivery_fee, o.discount, o.total, payLabel(o.payment), STATUS[o.status] || o.status]));
    const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'commandes-royal-orbitech-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('Export téléchargé ✓');
  };

  /* ===== PROMOS ===== */
  const loadPromos = async () => {
    try { PROMOS = await API.promos(); } catch (e) { PROMOS = []; }
    $('#promoRows').innerHTML = PROMOS.map(p => `<tr>
      <td class="tname">${esc(p.code)}</td>
      <td>${p.type === 'fixed' ? 'Montant fixe' : 'Pourcentage'}</td>
      <td>${p.type === 'fixed' ? fmt(p.value) : p.value + ' %'}</td>
      <td class="hide-sm">${p.minTotal ? fmt(p.minTotal) : '—'}</td>
      <td>${p.active ? '<span class="pill new">Actif</span>' : '<span class="pill none">Inactif</span>'}</td>
      <td><div class="tact"><button class="iconbtn" data-pedit="${esc(p.code)}">✏️</button><button class="iconbtn del" data-pdel="${esc(p.code)}">🗑️</button></div></td></tr>`).join('') || '<tr><td colspan="6">Aucun code promo.</td></tr>';
    $$('[data-pedit]').forEach(b => b.onclick = () => openPromo(b.dataset.pedit));
    $$('[data-pdel]').forEach(b => b.onclick = async () => { if (!confirm('Supprimer ce code ?')) return; try { await API.deletePromo(b.dataset.pdel); loadPromos(); toast('Code supprimé.'); } catch (e) { toast(e.message); } });
  };
  const prm = $('#promoModal');
  const openPromo = code => {
    const p = code ? PROMOS.find(x => x.code === code) : null;
    $('#prEdit').value = p ? p.code : '';
    $('#prCode').value = p ? p.code : ''; $('#prCode').disabled = !!p;
    $('#prType').value = p ? p.type : 'percent';
    $('#prValue').value = p ? p.value : '';
    $('#prMin').value = p ? (p.minTotal || '') : '';
    $('#prActive').checked = p ? p.active : true;
    prm.classList.add('show');
  };
  $('#addPromoBtn').onclick = () => openPromo(null);
  $('#prCancel').onclick = () => prm.classList.remove('show');
  $('#prSave').onclick = async () => {
    const code = $('#prCode').value.trim().toUpperCase();
    if (!code) { toast('Code requis.'); return; }
    const body = { code, type: $('#prType').value, value: +$('#prValue').value || 0, minTotal: +$('#prMin').value || 0, active: $('#prActive').checked };
    try { await API.savePromo(body); prm.classList.remove('show'); loadPromos(); toast('Code enregistré ✓'); }
    catch (e) { toast('Erreur : ' + e.message); }
  };

  /* ===== RÉGLAGES ===== */
  const fillSettings = () => {
    const s = SETTINGS;
    $('#setWhatsapp').value = s.whatsapp || '';
    $('#setPhone').value = s.phone && s.phone !== '+XXX XX XX XX XX' ? s.phone : '';
    $('#setEmail').value = s.email && s.email !== 'votre-email@royalorbitech.com' ? s.email : '';
    $('#setCity').value = s.city && s.city !== 'Votre ville, Votre pays' ? s.city : '';
    $('#setDelivery').value = s.deliveryFee || '';
    $('#setFreeShip').value = s.freeShipThreshold || '';
    $('#setPayProvider').value = s.payProvider || '';
    $('#setPayKey').value = s.payPublicKey || '';
    $('#setPayActive').checked = !!s.payActive;
  };
  $('#saveSettingsBtn').onclick = async () => {
    try {
      SETTINGS = await API.saveSettings({
        whatsapp: $('#setWhatsapp').value.replace(/[^0-9]/g, ''),
        phone: $('#setPhone').value.trim() || '+XXX XX XX XX XX',
        email: $('#setEmail').value.trim() || 'votre-email@royalorbitech.com',
        city: $('#setCity').value.trim() || 'Votre ville, Votre pays'
      });
      toast('Coordonnées enregistrées ✓');
    } catch (e) { toast('Erreur : ' + e.message); }
  };
  $('#savePayBtn').onclick = async () => {
    try {
      SETTINGS = await API.saveSettings({
        deliveryFee: +$('#setDelivery').value || 0,
        freeShipThreshold: +$('#setFreeShip').value || 0,
        payProvider: $('#setPayProvider').value,
        payPublicKey: $('#setPayKey').value.trim(),
        payActive: $('#setPayActive').checked
      });
      toast('Livraison & paiement enregistrés ✓');
    } catch (e) { toast('Erreur : ' + e.message); }
  };
  $('#savePassBtn').onclick = async () => {
    const a = $('#setPass').value, b = $('#setPass2').value;
    if (!a || a.length < 4) { toast('Mot de passe trop court (min 4).'); return; }
    if (a !== b) { toast('Les mots de passe ne correspondent pas.'); return; }
    try { await API.updatePassword(a); $('#setPass').value = ''; $('#setPass2').value = ''; toast('Mot de passe modifié ✓'); }
    catch (e) { toast('Erreur : ' + e.message); }
  };

  /* ===== EXPORT CATALOGUE ===== */
  $('#exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify({ products: PRODUCTS, categories: CATEGORIES, settings: SETTINGS }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'royal-orbitech-export-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); URL.revokeObjectURL(a.href); toast('Export téléchargé ✓');
  };

  /* ===== MODALES ===== */
  [pm, cm, prm].forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { pm.classList.remove('show'); cm.classList.remove('show'); prm.classList.remove('show'); } });

  function renderAll() { loadDash(); renderProducts(); renderCats(); }
});
