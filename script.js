/* ===== ROYAL ORBITECH — SCRIPT ===== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- Numéro WhatsApp central : remplacez XXXXXXXXXXX partout ---- */
  const WHATSAPP = 'XXXXXXXXXXX'; // ex: 22961234567 (indicatif pays + numéro, sans + ni espaces)

  /* ===== LANGUE FR / EN ===== */
  let lang = 'fr';
  const applyLang = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-fr]').forEach(el => {
      const val = el.getAttribute('data-' + lang);
      if (val !== null) el.textContent = val;
    });
    document.querySelectorAll('[data-ph-fr]').forEach(el => {
      el.setAttribute('placeholder', el.getAttribute('data-ph-' + lang));
    });
    document.getElementById('langToggle').textContent = lang === 'fr' ? 'FR / EN' : 'EN / FR';
  };
  document.getElementById('langToggle').addEventListener('click', () => {
    lang = lang === 'fr' ? 'en' : 'fr';
    applyLang();
  });

  /* ===== NAV scroll + burger ===== */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 30));
  const navLinks = document.getElementById('navLinks');
  document.getElementById('burger').addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ===== ANNÉE ===== */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ===== COMPTEURS ANIMÉS ===== */
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    let start = 0;
    const dur = 1600, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(eased * target);
      el.textContent = prefix + val.toLocaleString('fr-FR') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toLocaleString('fr-FR') + suffix;
    };
    requestAnimationFrame(step);
  };

  /* ===== REVEAL + trigger compteurs ===== */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(c => {
          if (!c.dataset.done) { c.dataset.done = '1'; animateCount(c); }
        });
        io.unobserve(e.target);
      }
    });
  }, { threshold: .15 });
  document.querySelectorAll('.section, .hero-stats, .stat-grid, .card, .review, .trust').forEach(el => {
    el.classList.add('reveal'); io.observe(el);
  });
  // compteurs du hero (visibles d'emblée)
  document.querySelectorAll('.hero-stats [data-count]').forEach(c => { c.dataset.done = '1'; animateCount(c); });

  /* ===== COMPTE À REBOURS (fin dans 3 jours glissants) ===== */
  const KEY = 'ro_deadline';
  let deadline = localStorage.getItem(KEY);
  if (!deadline || +deadline < Date.now()) {
    deadline = Date.now() + 3 * 864e5; // 3 jours
    localStorage.setItem(KEY, deadline);
  }
  deadline = +deadline;
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    let diff = Math.max(0, deadline - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = pad(v); };
    set('cdD', d); set('cdH', h); set('cdM', m); set('cdS', s);
  };
  tick(); setInterval(tick, 1000);

  /* ===== FORMULAIRE → WHATSAPP ===== */
  const form = document.getElementById('leadForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const f = new FormData(form);
    const L = lang === 'fr'
      ? { h: 'Nouvelle demande — ROYAL ORBITECH', n: 'Nom', p: 'Téléphone', e: 'Email', s: 'Service', m: 'Message' }
      : { h: 'New request — ROYAL ORBITECH', n: 'Name', p: 'Phone', e: 'Email', s: 'Service', m: 'Message' };
    const msg = `*${L.h}*%0A%0A${L.n}: ${f.get('name')}%0A${L.p}: ${f.get('phone')}%0A${L.e}: ${f.get('email') || '-'}%0A${L.s}: ${f.get('service')}%0A${L.m}: ${f.get('message') || '-'}`;
    document.getElementById('formOk').classList.add('show');
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');
  });

  /* ===== POP-UP INTELLIGENT (au scroll ou après 15s, une fois par session) ===== */
  const popup = document.getElementById('popup');
  let shown = sessionStorage.getItem('ro_popup');
  const showPopup = () => {
    if (shown) return;
    shown = '1'; sessionStorage.setItem('ro_popup', '1');
    popup.classList.add('show');
  };
  const closePopup = () => popup.classList.remove('show');
  document.getElementById('popupClose').addEventListener('click', closePopup);
  document.getElementById('popupCta').addEventListener('click', closePopup);
  popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });
  setTimeout(showPopup, 15000);
  window.addEventListener('scroll', function once() {
    if (window.scrollY > document.body.scrollHeight * 0.4) { showPopup(); window.removeEventListener('scroll', once); }
  });

  /* ===== ANIMATION RÉSEAU NEURONAL (hero) ===== */
  const canvas = document.getElementById('neuralCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, nodes;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const init = () => {
      w = canvas.width = canvas.offsetWidth * DPR;
      h = canvas.height = canvas.offsetHeight * DPR;
      const count = Math.min(70, Math.floor(w * h / 26000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .35 * DPR, vy: (Math.random() - .5) * .35 * DPR
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j], dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130 * DPR) {
            ctx.strokeStyle = `rgba(90,130,240,${(1 - dist / (130 * DPR)) * .35})`;
            ctx.lineWidth = DPR;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(230,180,34,.8)';
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.6 * DPR, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    init(); draw();
    window.addEventListener('resize', init);
  }

  applyLang(); // init
});
