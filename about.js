/* ===== ROYAL ORBITECH — PAGE À PROPOS ===== */
document.addEventListener('DOMContentLoaded', async () => {
  const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
  let SETTINGS = {}, WHATSAPP = 'XXXXXXXXXXX';
  try { SETTINGS = await API.settings(); WHATSAPP = SETTINGS.whatsapp || 'XXXXXXXXXXX'; } catch (e) {}

  /* LANGUE */
  let lang = localStorage.getItem('ro_lang') || 'fr';
  const applyLang = () => {
    document.documentElement.lang = lang;
    $$('[data-fr]').forEach(el => { const v = el.getAttribute('data-'+lang); if (v!==null) el.textContent = v; });
    $$('[data-ph-fr]').forEach(el => el.setAttribute('placeholder', el.getAttribute('data-ph-'+lang)));
    $('#langToggle').textContent = lang==='fr' ? 'FR / EN' : 'EN / FR';
  };
  $('#langToggle').addEventListener('click', () => {
    lang = lang==='fr' ? 'en' : 'fr'; localStorage.setItem('ro_lang', lang); applyLang();
    API.applySettings(SETTINGS);
  });

  /* ANNÉE */
  $('#year').textContent = new Date().getFullYear();

  /* MENU MOBILE */
  const burger = $('#burger'), links = $('#navLinks');
  if (burger) burger.addEventListener('click', () => links.scrollIntoView({behavior:'smooth'}));

  /* COMPTEURS */
  const animate = el => {
    const target = +el.dataset.count, prefix = el.dataset.prefix||'', suffix = el.dataset.suffix||'';
    const dur = 1600, t0 = performance.now();
    const step = now => {
      const p = Math.min((now-t0)/dur, 1), eased = 1-Math.pow(1-p,3);
      el.textContent = prefix + Math.floor(eased*target).toLocaleString('fr-FR') + suffix;
      if (p<1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toLocaleString('fr-FR') + suffix;
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.querySelectorAll('[data-count]').forEach(c => { if(!c.dataset.done){c.dataset.done='1';animate(c);} }); io.unobserve(e.target); }
  }), { threshold:.3 });
  $$('.stats').forEach(el => io.observe(el));

  /* FORMULAIRE → WHATSAPP */
  const form = $('#leadForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const f = new FormData(form);
    const L = lang==='fr'
      ? { h:'Nouveau message — ROYAL ORBITECH', n:'Nom', p:'Téléphone', e:'Email', m:'Message' }
      : { h:'New message — ROYAL ORBITECH', n:'Name', p:'Phone', e:'Email', m:'Message' };
    const msg = `*${L.h}*%0A%0A${L.n}: ${f.get('name')}%0A${L.p}: ${f.get('phone')}%0A${L.e}: ${f.get('email')||'-'}%0A${L.m}: ${f.get('message')||'-'}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');
  });

  applyLang();
  API.applySettings(SETTINGS);
});
