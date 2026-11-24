// Capone's Italian Eatery — Penfield, NY
// Built by Real Easy Sites (getrealeasysites.com)
const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const views = require('./views/pages');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('capones:' + ADMIN_PASSWORD).digest('hex');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'capones.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ---------- database ----------
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '',
    price TEXT DEFAULT '', sort INTEGER DEFAULT 0, cat_sort INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS categories (name TEXT PRIMARY KEY, note TEXT DEFAULT '', sort INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT DEFAULT (datetime('now')),
    name TEXT, phone TEXT, email TEXT, event_date TEXT, guests TEXT, location TEXT,
    occasion TEXT, details TEXT, status TEXT DEFAULT 'new');
`);

// seed once
if (!db.prepare('SELECT COUNT(*) c FROM settings').get().c) {
  const site = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/site.json'), 'utf8'));
  const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(site)) ins.run(k, JSON.stringify(v));
}
if (!db.prepare('SELECT COUNT(*) c FROM menu_items').get().c) {
  const menu = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/menu.json'), 'utf8'));
  const insC = db.prepare('INSERT OR REPLACE INTO categories (name, note, sort) VALUES (?, ?, ?)');
  const insI = db.prepare('INSERT INTO menu_items (category, name, description, price, sort) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    menu.categories.forEach((c, ci) => {
      insC.run(c.name, c.note || '', ci);
      c.items.forEach(([n, d, p], ii) => insI.run(c.name, n, d, p, ii));
    });
  })();
}

const getSettings = () => {
  const out = {};
  for (const r of db.prepare('SELECT key, value FROM settings').all()) {
    try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = r.value; }
  }
  return out;
};
const setSetting = (k, v) => db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(k, JSON.stringify(v));
const getMenu = () => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort, name').all();
  const items = db.prepare('SELECT * FROM menu_items ORDER BY sort, id').all();
  return cats.map(c => ({ ...c, items: items.filter(i => i.category === c.name) }))
    .concat(
      [...new Set(items.map(i => i.category))].filter(n => !cats.find(c => c.name === n))
        .map(n => ({ name: n, note: '', items: items.filter(i => i.category === n) }))
    );
};

// ---------- asset versions (cache busting) ----------
const ver = {};
const hashFile = f => crypto.createHash('md5').update(fs.readFileSync(path.join(__dirname, 'public', f))).digest('hex').slice(0, 8);
for (const f of ['css/site.css', 'js/site.js', 'css/admin.css', 'js/admin.js']) {
  try { ver[f] = hashFile(f); } catch { ver[f] = Date.now().toString(36); }
}
views.setVersions(ver);

// ---------- optional email notify ----------
let mailer = null;
if (process.env.SMTP_HOST && process.env.NOTIFY_EMAIL) {
  try {
    const nodemailer = require('nodemailer');
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  } catch (e) { console.warn('Mailer disabled:', e.message); }
}

// ---------- app ----------
const app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, p) {
    if (/\.(woff2?|ttf)$/.test(p)) res.setHeader('Cache-Control', 'public, max-age=2592000');
    else if (/\.(webp|png|jpg|svg)$/.test(p)) res.setHeader('Cache-Control', 'public, max-age=86400');
    else res.setHeader('Cache-Control', 'no-cache');
  }
}));
app.use((req, res, next) => { res.setHeader('Cache-Control', 'no-cache'); next(); });

// sessions: signed cookie
const sign = v => v + '.' + crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('hex');
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=').map(decodeURIComponent)).filter(p => p[0]));
const isAuthed = req => {
  const t = cookies(req).cap_admin; if (!t) return false;
  const i = t.lastIndexOf('.'); const v = t.slice(0, i);
  if (sign(v) !== t) return false;
  return Date.now() - +v < 1000 * 60 * 60 * 24 * 14;
};
const requireAdmin = (req, res, next) => isAuthed(req) ? next() : (req.path.startsWith('/api') ? res.status(401).json({ error: 'login' }) : res.redirect('/admin'));

// public pages
app.get('/', (req, res) => res.send(views.home(getSettings(), getMenu())));
app.get('/menu', (req, res) => res.send(views.menu(getSettings(), getMenu())));
app.get('/catering', (req, res) => res.send(views.catering(getSettings(), { sent: req.query.sent === '1' })));
app.get('/robots.txt', (req, res) => res.type('text').send(`User-agent: *\nDisallow: /admin\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml\n`));
app.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/menu', '/catering'].map(p => `<url><loc>${base}${p}</loc></url>`).join('')}</urlset>`);
});

// catering request
const rate = new Map();
app.post('/catering', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.redirect('/catering?sent=1'); // honeypot
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now(); const hits = (rate.get(ip) || []).filter(t => now - t < 3600e3);
  if (hits.length >= 8) return res.status(429).send('Too many requests — please call us at (585) 267-7588.');
  rate.set(ip, [...hits, now]);
  const clip = (s, n = 200) => String(s || '').trim().slice(0, n);
  const row = {
    name: clip(b.name, 120), phone: clip(b.phone, 40), email: clip(b.email, 160),
    event_date: clip(b.event_date, 40), guests: clip(b.guests, 40), location: clip(b.location, 40),
    occasion: clip(b.occasion, 60), details: clip(b.details, 2000)
  };
  if (!row.name || !row.phone) return res.status(400).send(views.catering(getSettings(), { error: 'Please add your name and a phone number so we can call you back.', values: row }));
  db.prepare(`INSERT INTO inquiries (name, phone, email, event_date, guests, location, occasion, details)
              VALUES (@name, @phone, @email, @event_date, @guests, @location, @occasion, @details)`).run(row);
  if (mailer) {
    mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER, to: process.env.NOTIFY_EMAIL,
      subject: `New catering request — ${row.name} (${row.guests || '?'} guests)`,
      text: Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n')
    }).catch(e => console.warn('notify failed', e.message));
  }
  res.redirect('/catering?sent=1');
});

// ---------- admin ----------
app.get('/admin', (req, res) => res.send(isAuthed(req) ? views.admin() : views.login()));
app.post('/admin/login', (req, res) => {
  const pw = String((req.body || {}).password || '');
  const ok = pw.length === ADMIN_PASSWORD.length && crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(ADMIN_PASSWORD));
  if (!ok) return res.status(401).send(views.login('That password didn’t work.'));
  res.setHeader('Set-Cookie', `cap_admin=${encodeURIComponent(sign(String(Date.now())))}; HttpOnly; Path=/; SameSite=Lax; Max-Age=1209600${req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`);
  res.redirect('/admin');
});
app.post('/admin/logout', (req, res) => { res.setHeader('Set-Cookie', 'cap_admin=; Path=/; Max-Age=0'); res.redirect('/admin'); });

app.get('/api/admin/data', requireAdmin, (req, res) => res.json({
  settings: getSettings(), menu: getMenu(),
  inquiries: db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all()
}));
app.post('/api/admin/inquiries/:id/status', requireAdmin, (req, res) => {
  const s = ['new', 'contacted', 'booked', 'closed'].includes(req.body.status) ? req.body.status : 'new';
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(s, +req.params.id); res.json({ ok: true });
});
app.delete('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM inquiries WHERE id = ?').run(+req.params.id); res.json({ ok: true });
});
app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const allowed = ['announcement', 'announcementOn', 'phone', 'email', 'address', 'orderUrl', 'deliveryUrl', 'rewardsUrl', 'giftCardsUrl', 'appUrl', 'facebookUrl', 'rochesterOrderUrl', 'hours'];
  for (const [k, v] of Object.entries(req.body || {})) if (allowed.includes(k)) setSetting(k, v);
  res.json({ ok: true, settings: getSettings() });
});
app.post('/api/admin/menu', requireAdmin, (req, res) => {
  const b = req.body || {};
  const r = db.prepare('INSERT INTO menu_items (category, name, description, price, sort) VALUES (?, ?, ?, ?, ?)')
    .run(String(b.category || 'Specials').slice(0, 60), String(b.name || 'New item').slice(0, 120), String(b.description || '').slice(0, 400), String(b.price || '').slice(0, 60), 999);
  if (!db.prepare('SELECT 1 FROM categories WHERE name = ?').get(b.category)) db.prepare('INSERT INTO categories (name, note, sort) VALUES (?, ?, ?)').run(b.category || 'Specials', '', -1);
  res.json({ ok: true, id: r.lastInsertRowid });
});
app.put('/api/admin/menu/:id', requireAdmin, (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE menu_items SET name = ?, description = ?, price = ? WHERE id = ?')
    .run(String(b.name || '').slice(0, 120), String(b.description || '').slice(0, 400), String(b.price || '').slice(0, 60), +req.params.id);
  res.json({ ok: true });
});
app.delete('/api/admin/menu/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(+req.params.id); res.json({ ok: true });
});

app.use((req, res) => res.status(404).send(views.notFound(getSettings())));

app.listen(PORT, () => console.log(`Capone's site on :${PORT}`));
