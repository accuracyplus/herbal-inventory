/**
 * The app on this PC, for trying screens: the real Worker on a throwaway SQLite database, and the
 * built client from the same address. Nothing touches Cloudflare or HiFive ID, and everything is
 * gone when it stops.
 *
 *   cd client && node node_modules/vite/bin/vite.js build --mode localtest
 *   node test/serve.mjs [port]
 *
 * Sign in by asking for a test token (admin, manager, keeper, staff, buyer, viewer):
 *   localStorage['hifive-inventory.token'] = await (await fetch('/__token?as=keeper')).text()
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.js';
import { call, defaultRoster, deliver, makeItem, receive, S, testEnv, tokenFor } from './helpers/http.js';

const port = Number(process.argv[2]) || 8791;
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
// A made-up HiFive ID register with something to review: a joiner, a leaver, a spelling.
const day = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const roster = defaultRoster().map((r) => (
  r.employee_code === 'HPV001' ? { ...r, status: 'exited', end_date: day(-3) }
    : r.employee_code === 'HPB001' ? { ...r, full_name: 'Bilal Ahmed Buyer' }
      : r.employee_code === 'HPK001' ? { ...r, end_date: day(25), notice_date: day(-5) } : r));
roster.push({ employee_code: 'HPAHC040', full_name: 'Anitha Krishnan', entity: 'Herbal Park', designation: 'Therapist', start_date: day(-4), status: 'active' });
// What "reading a delivery note" answers here, whatever the photo: a stand-in for Workers AI.
const aiReply = {
  supplier: 'KERALA AYURVEDA TRADERS L.L.C', note_no: 'DN-4471', date: '10/11/2026',
  lines: [
    { text: 'Dhanwantharam Thailam 200ml (Box of 12)', qty: 2, unit: 'box', unit_price: 360 },
    { text: 'Kizhi Powder 1kg', qty: 5, unit: 'kg', unit_price: 18.5 },
    { text: 'Cotton Kizhi Cloth 1m', qty: 20, unit: 'pcs', unit_price: 3.25 },
  ],
};
// A stand-in for Microsoft 365, so the email button can be tried here: it accepts every email
// and sends nothing. Each one is printed so you can see what would have gone.
const MAIL = {
  MS_TENANT_ID: 'local', MS_CLIENT_ID: 'local', MS_CLIENT_SECRET: 'local', MAIL_SENDER: 'purchasing@herbalpark.example',
  MAIL_FETCH: async (url, init) => {
    if (String(url).includes('/oauth2/')) return new Response(JSON.stringify({ access_token: 'local' }));
    const m = JSON.parse(init.body).message;
    console.log(`(not sent) email "${m.subject}" to ${m.toRecipients.map((r) => r.emailAddress.address).join(', ')} with ${m.attachments?.length || 0} attachment(s)`);
    return new Response(null, { status: 202 });
  },
};
const env = testEnv({ APP_ORIGIN: `http://localhost:${port}`, roster, aiReply, ...MAIL });
const ctx = { waitUntil: () => {} };

const seeded = [];
for (const [name, category] of [['Dhanwantharam thailam', 'Oils'], ['Kizhi powder', 'Herbs']]) {
  const id = await makeItem(env, { name, category });
  seeded.push(id);
  await receive(env, id, 40);
  await receive(env, id, 20, { storeId: S.sub });
}
await call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'ABH', name: 'Abhyanga', items: [{ itemId: seeded[0], qty: 0.25 }, { itemId: seeded[1], qty: 2 }] } });

const sup = await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Kerala Ayurveda Traders' } });

// Enough going on to look at every state: short and expiring stock, a request and a delivery
// waiting for a manager, and stock a person is still holding. A step that is refused says so
// and the rest carries on: this is a demonstration, not a test.
const lv = (reorder, critical, par) => [{ storeId: S.main, reorder, critical, par }];
const step = async (what, run) => { try { const r = await run(); if (r?.status >= 400) console.log(`seed, ${what}: ${r.status} ${JSON.stringify(r.body)}`); return r; } catch (e) { console.log(`seed, ${what}: ${e.message}`); return null; } };
const cloth = await makeItem(env, { code: 'CON-021', name: 'Cotton kizhi cloth', category: 'Consumables', uom: 'pcs', levels: lv(40, 10, 120) });
const paper = await makeItem(env, { code: 'CON-007', name: 'Massage table paper roll', category: 'Consumables', uom: 'roll', levels: lv(6, 2, 18) });
const nasya = await makeItem(env, { code: 'OIL-022', name: 'Nasya oil', category: 'Oils', uom: 'bottle', tracksExpiry: true, levels: lv(4, 1, 12) });
await makeItem(env, { code: 'HRB-011', name: 'Navarakizhi rice', category: 'Herbs', uom: 'kg', levels: lv(8, 2, 24) });
await step('cloth', () => receive(env, cloth, 18));
await step('paper', () => receive(env, paper, 1));
await step('nasya', () => receive(env, nasya, 2, { expiry: day(12), batchNo: 'N-0912' }));
await step('a request', () => call(env, 'POST', '/api/requests', { as: 'staff', body: { toStoreId: S.sub, urgency: 'URGENT', lines: [{ itemId: cloth, qty: 6 }] } }));
await step('a delivery waiting', () => call(env, 'POST', '/api/receipts', { as: 'keeper', body: { storeId: S.main, supplierId: sup.body?.id, noteNo: 'DN-4471', lines: [{ itemId: seeded[1], qty: 4, unitCost: 18.5, noteQty: 5 }, { itemId: cloth, qty: 20, unitCost: 3.25 }] } }));
await step('stock taken', () => call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, lines: [{ itemId: seeded[1], qty: 1 }] } }));

// A second supplier and some history, for prices and the delivery record: two orders that
// arrived (one late), one approved and not due, and one waiting for approval at a higher price.
const sup2 = await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Al Noor Spa Supplies', contact: 'Ravi', email: 'orders@alnoor.example', leadDays: 4 } });
await call(env, 'PUT', `/api/suppliers/${sup.body?.id}`, { as: 'buyer', body: { name: 'Kerala Ayurveda Traders', contact: 'Suresh', email: 'sales@keralaayurveda.example', leadDays: 7 } });
const back = (id, days) => env.DB.db.prepare(`UPDATE receipts SET at = ? WHERE id = ?`).run(new Date(Date.now() - days * 864e5).toISOString(), id);
const ordered = async (supplierId, lines, expected) => {
  const p = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId, storeId: S.main, expectedDate: expected, lines } });
  await call(env, 'POST', `/api/pos/${p.body.id}/submit`, { as: 'buyer' });
  await call(env, 'POST', `/api/pos/${p.body.id}/approve`, { as: 'manager' });
  return p.body.id;
};
await step('price history', async () => {
  back((await deliver(env, { storeId: S.main, supplierId: sup.body.id, lines: [{ itemId: cloth, qty: 40, unitCost: 3.1 }] })).id, 60);
  back((await deliver(env, { storeId: S.main, supplierId: sup2.body.id, lines: [{ itemId: cloth, qty: 40, unitCost: 2.9 }, { itemId: seeded[1], qty: 10, unitCost: 17 }] })).id, 30);
  const onTime = await ordered(sup2.body.id, [{ itemId: paper, qty: 10, unitCost: 9.5 }], day(3));
  await deliver(env, { storeId: S.main, poId: onTime, supplierId: sup2.body.id, lines: [{ itemId: paper, qty: 10, unitCost: 9.5 }] });
  const late = await ordered(sup.body.id, [{ itemId: nasya, qty: 4, unitCost: 22 }], day(-4));
  await deliver(env, { storeId: S.main, poId: late, supplierId: sup.body.id, lines: [{ itemId: nasya, qty: 4, unitCost: 22, noteQty: 5, expiry: day(200), batchNo: 'N-1040' }] });
  await ordered(sup2.body.id, [{ itemId: cloth, qty: 60, unitCost: 3 }], day(6));
  const waiting = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: sup.body.id, storeId: S.main, expectedDate: day(10), lines: [{ itemId: cloth, qty: 80, unitCost: 3.4 }, { itemId: seeded[1], qty: 10, unitCost: 18.5 }] } });
  return call(env, 'POST', `/api/pos/${waiting.body.id}/submit`, { as: 'buyer' });
});

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const isApi = (path) => /^\/(api|auth|pending|hooks|version|health)(\/|$)/.test(path);

function serveFile(path, res) {
  const safe = normalize(path).replace(/^(\.\.[\\/])+/, '');
  let file = join(dist, safe);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end('Build the client first: see the top of test/serve.mjs'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname === '/__token') { res.end(tokenFor(url.searchParams.get('as') || 'admin')); return; }
  if (url.pathname === '/__age') { // Make everything held look this many hours old.
    env.DB.db.prepare('UPDATE custody SET taken_at = ?').run(new Date(Date.now() - Number(url.searchParams.get('hours') || 0) * 36e5).toISOString());
    res.end('ok');
    return;
  }
  if (!isApi(url.pathname)) { serveFile(url.pathname, res); return; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const out = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined }), env, ctx);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(port, () => console.log(`HiFive Inventory (local test copy): http://localhost:${port}`));
