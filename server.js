/* ===== ROYAL ORBITECH — SERVEUR (Express + PostgreSQL) ===== */
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', true);
app.use(express.json({ limit: '3mb' }));

/* petit wrapper pour capturer les erreurs des routes asynchrones */
const A = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---- En-têtes de sécurité ---- */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

/* ---- Sécurité : bloquer l'accès direct aux fichiers sensibles ---- */
const BLOCK = [/^\/data(\/|$)/i, /^\/node_modules(\/|$)/i];
const BLOCK_FILES = ['/db.js', '/server.js', '/seed-data.js', '/package.json', '/package-lock.json'];
app.use((req, res, next) => {
  const p = decodeURIComponent(req.path);
  if (BLOCK.some(r => r.test(p)) || BLOCK_FILES.includes(p)) return res.status(403).send('Forbidden');
  next();
});

/* ---- Authentification par jeton (en mémoire) ---- */
const tokens = new Map(); // token -> expiration (ms)
const TTL = 12 * 3600 * 1000;
function issueToken() { const t = crypto.randomBytes(24).toString('hex'); tokens.set(t, Date.now() + TTL); return t; }
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const exp = tokens.get(t);
  if (!exp || exp < Date.now()) { if (t) tokens.delete(t); return res.status(401).json({ error: 'Non autorisé' }); }
  next();
}

/* ---- Upload d'images : en mémoire puis stockage en base (persistant) ---- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});
function uploadName(originalname) {
  const ext = (path.extname(originalname) || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '');
  const base = path.basename(originalname, path.extname(originalname))
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'produit';
  return `${base}-${Date.now()}${ext || '.jpg'}`;
}

/* ---- Service des images stockées en base ---- */
app.get('/u/:name', A(async (req, res) => {
  const row = await db.getUpload(req.params.name);
  if (!row || !row.data) return res.status(404).send('Image introuvable');
  res.setHeader('Content-Type', row.mime || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(row.data);
}));

/* ===================== API PUBLIQUE ===================== */
app.get('/api/catalog', A(async (req, res) => {
  res.json({ products: await db.listProducts(), categories: await db.listCategories(), settings: await db.getSettings() });
}));
app.get('/api/products', A(async (req, res) => res.json(await db.listProducts())));
app.get('/api/categories', A(async (req, res) => res.json(await db.listCategories())));
app.get('/api/settings', A(async (req, res) => res.json(await db.getSettings())));

app.post('/api/orders', A(async (req, res) => {
  const o = req.body || {};
  if (!o.items || !o.items.length) return res.status(400).json({ error: 'Panier vide' });
  res.json(await db.createOrder(o));
}));
app.post('/api/promo/validate', A(async (req, res) => {
  const { code, subtotal } = req.body || {};
  res.json(await db.computeDiscount(code, subtotal | 0));
}));

/* ===================== AUTH ===================== */
const loginAttempts = new Map(); // ip -> { count, first }
const MAX_TRIES = 8, WINDOW = 15 * 60 * 1000;
app.post('/api/login', A(async (req, res) => {
  const ip = req.ip || 'x';
  const now = Date.now();
  let a = loginAttempts.get(ip);
  if (a && now - a.first > WINDOW) { loginAttempts.delete(ip); a = null; }
  if (a && a.count >= MAX_TRIES) return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  const pw = (req.body || {}).password || '';
  if (await db.checkPass(pw)) { loginAttempts.delete(ip); return res.json({ token: issueToken() }); }
  loginAttempts.set(ip, { count: (a ? a.count : 0) + 1, first: a ? a.first : now });
  res.status(401).json({ error: 'Mot de passe incorrect' });
}));
app.post('/api/logout', requireAuth, (req, res) => {
  const t = (req.headers.authorization || '').slice(7); tokens.delete(t); res.json({ ok: true });
});

/* ===================== API ADMIN (protégée) ===================== */
app.post('/api/products', requireAuth, A(async (req, res) => res.json(await db.createProduct(req.body))));
app.put('/api/products/:id', requireAuth, A(async (req, res) => res.json(await db.updateProduct(+req.params.id, req.body))));
app.delete('/api/products/:id', requireAuth, A(async (req, res) => { await db.deleteProduct(+req.params.id); res.status(204).end(); }));

app.post('/api/categories', requireAuth, A(async (req, res) => res.json(await db.createCategory(req.body))));
app.put('/api/categories/:key', requireAuth, A(async (req, res) => res.json(await db.updateCategory(req.params.key, req.body))));
app.delete('/api/categories/:key', requireAuth, A(async (req, res) => {
  if (await db.categoryUsage(req.params.key) > 0) return res.status(409).json({ error: 'Catégorie utilisée par des produits' });
  await db.deleteCategory(req.params.key); res.status(204).end();
}));

app.put('/api/settings', requireAuth, A(async (req, res) => res.json(await db.saveSettings(req.body))));
app.put('/api/password', requireAuth, A(async (req, res) => {
  const pw = (req.body || {}).password || '';
  if (pw.length < 4) return res.status(400).json({ error: 'Mot de passe trop court' });
  await db.setPass(pw); res.json({ ok: true });
}));

app.get('/api/orders', requireAuth, A(async (req, res) => res.json(await db.listOrders())));
app.put('/api/orders/:id', requireAuth, A(async (req, res) => { await db.setOrderStatus(+req.params.id, (req.body || {}).status || 'pending'); res.json({ ok: true }); }));
app.delete('/api/orders/:id', requireAuth, A(async (req, res) => { await db.deleteOrder(+req.params.id); res.status(204).end(); }));

app.get('/api/stats', requireAuth, A(async (req, res) => res.json(await db.stats())));
app.get('/api/promos', requireAuth, A(async (req, res) => res.json(await db.listPromos())));
app.post('/api/promos', requireAuth, A(async (req, res) => { try { res.json(await db.savePromo(req.body)); } catch (e) { res.status(400).json({ error: e.message }); } }));
app.delete('/api/promos/:code', requireAuth, A(async (req, res) => { await db.deletePromo(req.params.code); res.status(204).end(); }));

app.post('/api/upload', requireAuth, upload.single('image'), A(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucune image' });
  const name = uploadName(req.file.originalname);
  await db.saveUpload(name, req.file.mimetype, req.file.buffer);
  res.json({ img: '/u/' + name });
}));

/* ===================== FICHIERS STATIQUES ===================== */
app.use(express.static(__dirname, { extensions: ['html'] }));

/* ===================== PAGE 404 ===================== */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Ressource introuvable' });
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

/* ===================== GESTION DES ERREURS ===================== */
app.use((err, req, res, next) => {
  console.error('Erreur:', err.message);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Erreur serveur' });
  res.status(500).send('Erreur serveur');
});

/* ===================== DÉMARRAGE ===================== */
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  ✅ ROYAL ORBITECH est en ligne :  http://localhost:${PORT}\n`);
      console.log(`     Boutique : http://localhost:${PORT}/`);
      console.log(`     Admin    : http://localhost:${PORT}/admin.html   (mot de passe par défaut : admin)\n`);
    });
  })
  .catch(err => {
    console.error('❌ Impossible d\'initialiser la base de données :', err.message);
    console.error('   Vérifiez la variable DATABASE_URL.');
    process.exit(1);
  });
