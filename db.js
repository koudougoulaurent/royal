/* ===== ROYAL ORBITECH — BASE DE DONNÉES (PostgreSQL / Neon) ===== */
const { Pool } = require('pg');
const crypto = require('crypto');
const seed = require('./seed-data');

const CONN = process.env.DATABASE_URL || '';
if (!CONN) console.warn('⚠️  DATABASE_URL non défini — impossible de se connecter à la base.');
const isLocal = /localhost|127\.0\.0\.1|::1/.test(CONN);
const pool = new Pool({
  connectionString: CONN,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5
});

/* ---------- Helpers d'accès ---------- */
const q   = async (sql, p = []) => (await pool.query(sql, p)).rows;
const one = async (sql, p = []) => (await pool.query(sql, p)).rows[0];
const run = async (sql, p = []) => pool.query(sql, p);

/* ---------- Mot de passe ---------- */
function hashPass(pw) { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(pw, s, 64).toString('hex'); }
function verifyPass(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [s, h] = stored.split(':');
  const t = crypto.scryptSync(pw, s, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(t, 'hex'));
}

/* ---------- Schéma + seed (appelé au démarrage) ---------- */
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      key TEXT PRIMARY KEY, emoji TEXT, fr TEXT, en TEXT, position INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      cat TEXT, img TEXT, price INTEGER, old INTEGER DEFAULT 0,
      badge TEXT DEFAULT '', rating REAL DEFAULT 0, sold INTEGER DEFAULT 0,
      name_fr TEXT, name_en TEXT, desc_fr TEXT, desc_en TEXT,
      stock INTEGER, brand TEXT DEFAULT '', sku TEXT DEFAULT '', gallery TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      whatsapp TEXT DEFAULT '', phone TEXT, email TEXT, city TEXT, shopname TEXT,
      delivery_fee INTEGER DEFAULT 0, free_ship_threshold INTEGER DEFAULT 0,
      pay_provider TEXT DEFAULT '', pay_public_key TEXT DEFAULT '', pay_active INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin ( id INTEGER PRIMARY KEY CHECK (id = 1), pass TEXT );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      created_at TEXT, customer_name TEXT, phone TEXT, email TEXT,
      items TEXT, total INTEGER, status TEXT DEFAULT 'pending', payment TEXT DEFAULT 'whatsapp',
      address TEXT DEFAULT '', subtotal INTEGER DEFAULT 0, delivery_fee INTEGER DEFAULT 0,
      discount INTEGER DEFAULT 0, promo_code TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS promos (
      code TEXT PRIMARY KEY, type TEXT DEFAULT 'percent', value INTEGER DEFAULT 0,
      min_total INTEGER DEFAULT 0, active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS uploads (
      name TEXT PRIMARY KEY, mime TEXT, data BYTEA, created_at TEXT
    );
  `);

  /* Migrations idempotentes (si d'anciennes tables existaient sans ces colonnes) */
  const alters = [
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT ''",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT ''",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery TEXT DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS free_ship_threshold INTEGER DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS pay_provider TEXT DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS pay_public_key TEXT DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS pay_active INTEGER DEFAULT 0"
  ];
  for (const a of alters) { try { await pool.query(a); } catch (e) { /* ignore */ } }

  await seedIfEmpty();
}

async function seedIfEmpty() {
  if (!(await one('SELECT COUNT(*)::int c FROM categories')).c) {
    for (let i = 0; i < seed.categories.length; i++) {
      const c = seed.categories[i];
      await run('INSERT INTO categories(key,emoji,fr,en,position) VALUES($1,$2,$3,$4,$5)', [c.key, c.emoji, c.fr, c.en, i]);
    }
  }
  if (!(await one('SELECT COUNT(*)::int c FROM products')).c) {
    for (const p of seed.products) {
      await run(`INSERT INTO products(cat,img,price,old,badge,rating,sold,name_fr,name_en,desc_fr,desc_en,stock)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [p.cat, p.img, p.price, p.old, p.badge, p.rating, p.sold, p.name_fr, p.name_en, p.desc_fr, p.desc_en, null]);
    }
  }
  if (!(await one('SELECT COUNT(*)::int c FROM settings')).c) {
    await run('INSERT INTO settings(id,whatsapp,phone,email,city,shopname) VALUES(1,$1,$2,$3,$4,$5)',
      ['', '+XXX XX XX XX XX', 'votre-email@royalorbitech.com', 'Votre ville, Votre pays', 'ROYAL ORBITECH']);
  }
  if (!(await one('SELECT COUNT(*)::int c FROM admin')).c) {
    await run('INSERT INTO admin(id,pass) VALUES(1,$1)', [hashPass('admin')]);
  }
}

/* ---------- Helpers ---------- */
const numOrNull = v => (v === '' || v === null || v === undefined) ? null : (v | 0);
const parseArr = s => { try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };

const toProduct = r => r && ({
  id: r.id, cat: r.cat, img: r.img, price: r.price, old: r.old,
  badge: r.badge, rating: r.rating, sold: r.sold,
  stock: (r.stock === null || r.stock === undefined) ? null : r.stock,
  brand: r.brand || '', sku: r.sku || '', gallery: parseArr(r.gallery),
  name: { fr: r.name_fr, en: r.name_en }, desc: { fr: r.desc_fr, en: r.desc_en }
});

/* ---------- Produits ---------- */
const listProducts = async () => (await q('SELECT * FROM products ORDER BY id')).map(toProduct);
const getProduct = async id => toProduct(await one('SELECT * FROM products WHERE id=$1', [id]));
async function createProduct(p) {
  const r = await one(`INSERT INTO products(cat,img,price,old,badge,rating,sold,name_fr,name_en,desc_fr,desc_en,stock,brand,sku,gallery)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [p.cat, p.img || '', p.price | 0, p.old | 0, p.badge || '', +p.rating || 0, p.sold | 0,
     p.name?.fr || '', p.name?.en || '', p.desc?.fr || '', p.desc?.en || '',
     numOrNull(p.stock), p.brand || '', p.sku || '', JSON.stringify(p.gallery || [])]);
  return getProduct(r.id);
}
async function updateProduct(id, p) {
  await run(`UPDATE products SET cat=$1,img=$2,price=$3,old=$4,badge=$5,rating=$6,sold=$7,name_fr=$8,name_en=$9,desc_fr=$10,desc_en=$11,stock=$12,brand=$13,sku=$14,gallery=$15 WHERE id=$16`,
    [p.cat, p.img || '', p.price | 0, p.old | 0, p.badge || '', +p.rating || 0, p.sold | 0,
     p.name?.fr || '', p.name?.en || '', p.desc?.fr || '', p.desc?.en || '',
     numOrNull(p.stock), p.brand || '', p.sku || '', JSON.stringify(p.gallery || []), id]);
  return getProduct(id);
}
const deleteProduct = id => run('DELETE FROM products WHERE id=$1', [id]);

/* ---------- Catégories ---------- */
const listCategories = async () => (await q('SELECT * FROM categories ORDER BY position, key'))
  .map(c => ({ key: c.key, emoji: c.emoji, fr: c.fr, en: c.en }));
async function createCategory(c) {
  const pos = (await one('SELECT COALESCE(MAX(position),0)+1 p FROM categories')).p;
  await run('INSERT INTO categories(key,emoji,fr,en,position) VALUES($1,$2,$3,$4,$5)', [c.key, c.emoji || '📦', c.fr, c.en || c.fr, pos]);
  return { key: c.key, emoji: c.emoji, fr: c.fr, en: c.en };
}
async function updateCategory(key, c) {
  await run('UPDATE categories SET emoji=$1,fr=$2,en=$3 WHERE key=$4', [c.emoji || '📦', c.fr, c.en || c.fr, key]);
  return { key, emoji: c.emoji, fr: c.fr, en: c.en };
}
const categoryUsage = async key => (await one('SELECT COUNT(*)::int c FROM products WHERE cat=$1', [key])).c;
const deleteCategory = key => run('DELETE FROM categories WHERE key=$1', [key]);

/* ---------- Réglages ---------- */
const getSettings = async () => {
  const s = (await one('SELECT * FROM settings WHERE id=1')) || {};
  return {
    whatsapp: s.whatsapp || '', phone: s.phone || '', email: s.email || '', city: s.city || '',
    shopName: s.shopname || 'ROYAL ORBITECH',
    deliveryFee: s.delivery_fee || 0, freeShipThreshold: s.free_ship_threshold || 0,
    payProvider: s.pay_provider || '', payPublicKey: s.pay_public_key || '', payActive: !!s.pay_active
  };
};
const getPublicSettings = getSettings;
async function saveSettings(s) {
  const cur = await getSettings();
  await run(`UPDATE settings SET whatsapp=$1,phone=$2,email=$3,city=$4,shopname=$5,delivery_fee=$6,free_ship_threshold=$7,pay_provider=$8,pay_public_key=$9,pay_active=$10 WHERE id=1`,
    [s.whatsapp ?? cur.whatsapp, s.phone ?? cur.phone, s.email ?? cur.email, s.city ?? cur.city,
     s.shopName ?? cur.shopName, (s.deliveryFee ?? cur.deliveryFee) | 0, (s.freeShipThreshold ?? cur.freeShipThreshold) | 0,
     s.payProvider ?? cur.payProvider, s.payPublicKey ?? cur.payPublicKey, (s.payActive ?? cur.payActive) ? 1 : 0]);
  return getSettings();
}

/* ---------- Admin ---------- */
const checkPass = async pw => verifyPass(pw, ((await one('SELECT pass FROM admin WHERE id=1')) || {}).pass);
const setPass = pw => run('UPDATE admin SET pass=$1 WHERE id=1', [hashPass(pw)]);

/* ---------- Promos ---------- */
const listPromos = async () => (await q('SELECT * FROM promos ORDER BY code'))
  .map(p => ({ code: p.code, type: p.type, value: p.value, minTotal: p.min_total, active: !!p.active }));
async function savePromo(p) {
  const code = String(p.code || '').trim().toUpperCase();
  if (!code) throw new Error('Code requis');
  await run(`INSERT INTO promos(code,type,value,min_total,active) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(code) DO UPDATE SET type=excluded.type,value=excluded.value,min_total=excluded.min_total,active=excluded.active`,
    [code, p.type === 'fixed' ? 'fixed' : 'percent', p.value | 0, p.minTotal | 0, p.active === false ? 0 : 1]);
  return { code, type: p.type, value: p.value | 0, minTotal: p.minTotal | 0, active: p.active !== false };
}
const deletePromo = code => run('DELETE FROM promos WHERE code=$1', [String(code).toUpperCase()]);
async function computeDiscount(code, subtotal) {
  if (!code) return { discount: 0, code: '' };
  const p = await one('SELECT * FROM promos WHERE code=$1 AND active=1', [String(code).trim().toUpperCase()]);
  if (!p) return { discount: 0, code: '', error: 'Code invalide' };
  if (subtotal < (p.min_total || 0)) return { discount: 0, code: '', error: 'Montant minimum non atteint' };
  const d = p.type === 'fixed' ? p.value : Math.round(subtotal * p.value / 100);
  return { discount: Math.min(d, subtotal), code: p.code };
}

/* ---------- Commandes ---------- */
async function createOrder(o) {
  const items = [];
  for (const it of (o.items || [])) {
    const p = await getProduct(it.id);
    if (p) items.push({ id: p.id, name: p.name.fr, price: p.price, qty: Math.max(1, it.qty | 0) });
  }
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const st = await getSettings();
  let delivery = st.deliveryFee || 0;
  if (st.freeShipThreshold > 0 && subtotal >= st.freeShipThreshold) delivery = 0;
  const promo = await computeDiscount(o.promo, subtotal);
  const total = Math.max(0, subtotal + delivery - promo.discount);
  for (const it of items) {
    const row = await one('SELECT stock FROM products WHERE id=$1', [it.id]);
    if (row && row.stock !== null && row.stock !== undefined)
      await run('UPDATE products SET stock=GREATEST(0, stock-$1) WHERE id=$2', [it.qty, it.id]);
    await run('UPDATE products SET sold=sold+$1 WHERE id=$2', [it.qty, it.id]);
  }
  const r = await one(`INSERT INTO orders(created_at,customer_name,phone,email,address,items,subtotal,delivery_fee,discount,promo_code,total,status,payment)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [new Date().toISOString(), o.customer?.name || '', o.customer?.phone || '', o.customer?.email || '', o.customer?.address || '',
     JSON.stringify(items), subtotal, delivery, promo.discount, promo.code, total, 'pending', o.payment || 'whatsapp']);
  return { id: r.id, subtotal, delivery, discount: promo.discount, total, items };
}
const listOrders = async () => (await q('SELECT * FROM orders ORDER BY id DESC')).map(o => ({ ...o, items: parseArr(o.items) }));
const setOrderStatus = (id, status) => run('UPDATE orders SET status=$1 WHERE id=$2', [status, id]);
const deleteOrder = id => run('DELETE FROM orders WHERE id=$1', [id]);

/* ---------- Statistiques ---------- */
async function stats() {
  const paid = await one("SELECT COUNT(*)::int n, COALESCE(SUM(total),0)::int rev FROM orders WHERE status!='cancelled'");
  const pending = (await one("SELECT COUNT(*)::int n FROM orders WHERE status='pending'")).n;
  const byDay = (await q(`SELECT substr(created_at,1,10) d, COALESCE(SUM(total),0)::int rev, COUNT(*)::int n
    FROM orders WHERE status!='cancelled' GROUP BY d ORDER BY d DESC LIMIT 14`)).reverse();
  const top = await q('SELECT name_fr, sold, price FROM products ORDER BY sold DESC LIMIT 5');
  const low = await q('SELECT id,name_fr,stock FROM products WHERE stock IS NOT NULL AND stock<=5 ORDER BY stock ASC');
  const nbProducts = (await one('SELECT COUNT(*)::int c FROM products')).c;
  const catalogValue = (await one('SELECT COALESCE(SUM(price),0)::int v FROM products')).v;
  return { revenue: paid.rev, orders: paid.n, pending, byDay, top, low, nbProducts, catalogValue };
}

/* ---------- Images (stockées en base pour persister) ---------- */
async function saveUpload(name, mime, buf) {
  await run(`INSERT INTO uploads(name,mime,data,created_at) VALUES($1,$2,$3,$4)
    ON CONFLICT(name) DO UPDATE SET mime=excluded.mime, data=excluded.data`,
    [name, mime, buf, new Date().toISOString()]);
  return name;
}
const getUpload = name => one('SELECT mime, data FROM uploads WHERE name=$1', [name]);

module.exports = {
  init,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  listCategories, createCategory, updateCategory, categoryUsage, deleteCategory,
  getSettings, getPublicSettings, saveSettings, checkPass, setPass,
  listPromos, savePromo, deletePromo, computeDiscount,
  createOrder, listOrders, setOrderStatus, deleteOrder, stats,
  saveUpload, getUpload
};
