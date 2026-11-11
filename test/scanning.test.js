import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, HV, makeItem, PEOPLE, testEnv } from './helpers/http.js';

const open = (env, as = 'keeper', purpose = 'receive', unit) => call(env, 'POST', '/api/scan/sessions', { as, unit, body: { purpose } });
const scan = (env, id, barcode, as = 'keeper', extra = {}) => call(env, 'POST', `/api/scan/sessions/${id}/scans`, { as, body: { barcode, ...extra } });
const poll = (env, id, after = 0, as = 'keeper') => call(env, 'GET', `/api/scan/sessions/${id}?after=${after}`, { as });
const lookup = (env, code, as = 'keeper') => call(env, 'GET', `/api/lookup?code=${encodeURIComponent(code)}`, { as });

test('pairing: the phone\'s scans reach the computer in order, the same item twice is two scans', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { barcode: '6291041500213' });
  const s = await open(env);
  assert.equal(s.status, 201);
  assert.equal((await poll(env, s.body.id)).body.paired, false);
  const paired = await call(env, 'POST', `/api/scan/sessions/${s.body.id}/pair`, { as: 'keeper' });
  assert.equal(paired.status, 200);
  assert.equal(paired.body.purpose, 'receive');
  const one = await scan(env, s.body.id, '6291041500213');
  assert.deepEqual([one.body.known, one.body.item.id], [true, oil]);
  await scan(env, s.body.id, '6291041500213');
  const got = await poll(env, s.body.id);
  assert.equal(got.body.paired, true);
  assert.equal(got.body.open, true);
  assert.deepEqual(got.body.events.map((e) => e.itemId), [oil, oil]);
  const later = await poll(env, s.body.id, got.body.events[0].seq);
  assert.equal(later.body.events.length, 1);
});

test('pairing: only the same person, in the same unit, can use it', async () => {
  const env = testEnv();
  await makeItem(env, { barcode: '111' });
  const s = await open(env);
  for (const as of ['staff', 'manager', 'admin']) {
    assert.equal((await call(env, 'POST', `/api/scan/sessions/${s.body.id}/pair`, { as })).status, 404, as);
    assert.equal((await scan(env, s.body.id, '111', as)).status, 404, as);
    assert.equal((await poll(env, s.body.id, 0, as)).status, 404, as);
  }
  const hv = await open(env, 'hv', 'count');
  assert.equal(hv.status, 201);
  assert.equal((await poll(env, hv.body.id, 0, 'hv')).status, 200);
  assert.equal((await scan(env, s.body.id, '111', 'hv')).status, 404);
});

test('pairing: it ends when closed, after 15 idle minutes, and is refused after that', async () => {
  const env = testEnv();
  await makeItem(env, { barcode: '222' });
  const s = await open(env);
  await call(env, 'POST', `/api/scan/sessions/${s.body.id}/close`, { as: 'keeper' });
  const ended = await scan(env, s.body.id, '222');
  assert.equal(ended.status, 410);
  assert.equal(ended.body.error.code, 'PAIRING_ENDED');
  assert.equal((await poll(env, s.body.id)).body.open, false);

  const t = await open(env);
  env.DB.db.prepare(`UPDATE scan_sessions SET expires_at = ? WHERE id = ?`).run(new Date(Date.now() - 1000).toISOString(), t.body.id);
  assert.equal((await call(env, 'POST', `/api/scan/sessions/${t.body.id}/pair`, { as: 'keeper' })).status, 410);
});

test('pairing: a scan keeps it open for another 15 minutes, never past four hours', async () => {
  const env = testEnv();
  await makeItem(env, { barcode: '333' });
  const s = await open(env);
  const exp = (id) => new Date(env.DB.db.prepare(`SELECT expires_at FROM scan_sessions WHERE id = ?`).get(id).expires_at).getTime();
  assert.ok(Math.abs(exp(s.body.id) - (Date.now() + 15 * 60e3)) < 5000);
  env.DB.db.prepare(`UPDATE scan_sessions SET created_at = ? WHERE id = ?`).run(new Date(Date.now() - (4 * 3600e3 - 60e3)).toISOString(), s.body.id);
  await scan(env, s.body.id, '333');
  assert.ok(exp(s.body.id) <= Date.now() + 61e3);
});

test('pairing: purpose must be one of the screens, and a viewer cannot open one', async () => {
  const env = testEnv();
  assert.equal((await open(env, 'keeper', 'everything')).status, 422);
  assert.equal((await open(env, 'viewer', 'count')).status, 403);
});

test('unknown barcode: answered, not passed on, until somebody says which item it is', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const s = await open(env);
  const unknown = await scan(env, s.body.id, '999000');
  assert.deepEqual(unknown.body, { known: false, barcode: '999000' });
  assert.equal((await poll(env, s.body.id)).body.events.length, 0);
  const picked = await scan(env, s.body.id, '999000', 'keeper', { itemId: oil });
  assert.equal(picked.body.item.id, oil);
  assert.equal((await poll(env, s.body.id)).body.events.length, 1);
  // Picked without linking: the next scan of it is still unknown.
  assert.equal((await scan(env, s.body.id, '999000')).body.known, false);
});

test('linking: the first barcode becomes the item\'s own, later ones are extra, all are found', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const link = (barcode, as = 'keeper', id = oil) => call(env, 'POST', `/api/items/${id}/barcodes`, { as, body: { barcode } });
  assert.equal((await link('5000')).status, 200);
  assert.equal(env.DB.db.prepare(`SELECT barcode FROM items WHERE id = ?`).get(oil).barcode, '5000');
  assert.equal((await link('5001')).status, 200);
  assert.equal((await lookup(env, '5001')).body.id, oil);
  assert.equal((await lookup(env, '5000')).body.id, oil);
  assert.equal((await link('5001')).body.unchanged, true);
  const stock = await call(env, 'GET', '/api/stock', { as: 'staff' });
  assert.deepEqual(stock.body.items.find((i) => i.id === oil).barcodes, ['5001']);
  const log = await call(env, 'GET', '/api/audit', { as: 'admin' });
  assert.ok(log.body.some((r) => r.action === 'BARCODE_LINK'));
});

test('linking: a barcode belongs to one item, and only store roles may link one', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { barcode: '7000' });
  const herb = await makeItem(env, { name: 'Herb' });
  await call(env, 'POST', `/api/items/${oil}/barcodes`, { as: 'keeper', body: { barcode: '7001' } });
  for (const code of ['7000', '7001']) {
    const taken = await call(env, 'POST', `/api/items/${herb}/barcodes`, { as: 'keeper', body: { barcode: code } });
    assert.equal(taken.status, 409, code);
    assert.equal(taken.body.error.code, 'BARCODE_TAKEN');
  }
  const viaEdit = await call(env, 'PUT', `/api/items/${herb}`, { body: { code: 'HERB', name: 'Herb', barcode: '7001' } });
  assert.equal(viaEdit.status, 409);
  assert.equal((await call(env, 'POST', `/api/items/${herb}/barcodes`, { as: 'staff', body: { barcode: '7002' } })).status, 403);
  for (const as of ['buyer', 'manager']) assert.equal((await call(env, 'POST', `/api/items/${herb}/barcodes`, { as, body: { barcode: `71${as}` } })).status, 200, as);
});

test('linking: another unit\'s item cannot be given a barcode, and the same barcode can live in two units', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  assert.equal((await call(env, 'POST', `/api/items/${oil}/barcodes`, { as: 'hv', body: { barcode: '8000' } })).status, 404);
  const hvItem = await call(env, 'POST', '/api/items', { as: 'admin', unit: HV, body: { code: 'HV1', name: 'Valley oil', barcode: '8000' } });
  assert.equal(hvItem.status, 201);
  assert.equal((await call(env, 'POST', `/api/items/${oil}/barcodes`, { as: 'keeper', body: { barcode: '8000' } })).status, 200);
  assert.equal((await lookup(env, '8000')).body.id, oil);
  assert.equal((await call(env, 'GET', '/api/lookup?code=8000', { as: 'hv' })).body.id, hvItem.body.id);
});

test('lookup: a retired item is not found by its barcode', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { barcode: '9100' });
  env.DB.db.prepare(`UPDATE items SET active = 0 WHERE id = ?`).run(oil);
  assert.equal((await lookup(env, '9100')).status, 404);
});

test('old pairings and their scans are cleared after two days', async () => {
  const env = testEnv();
  await makeItem(env, { barcode: '9200' });
  const s = await open(env);
  await scan(env, s.body.id, '9200');
  env.DB.db.prepare(`UPDATE scan_sessions SET expires_at = ?`).run(new Date(Date.now() - 3 * 864e5).toISOString());
  await open(env, 'manager');
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM scan_events`).get().n, 0);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM scan_sessions WHERE staff_id = ?`).get(PEOPLE.keeper.id).n, 0);
});
