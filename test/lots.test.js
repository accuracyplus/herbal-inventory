/**
 * Lab readiness: storage and life once opened on an item, and opened packs followed from the
 * shelf to the bench or analyser until they are finished or thrown away. Off unless switched on.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bal, call, FOR, HV, makeItem, receive, S, testEnv } from './helpers/http.js';
import { standing, useBy } from '../src/domain/lots.js';

const day = (n) => new Date(Date.now() + 4 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
const switchOn = (env) => call(env, 'PUT', '/api/settings', { body: { 'lots.opened': 'on' } });
const open = (env, body, as = 'keeper') => call(env, 'POST', '/api/openings', { as, body: { storeId: S.main, ...FOR, ...body } });

// ── The rules alone ──────────────────────────────────────────────────────────

test('in-use date: the earlier of the printed expiry and the day opened plus its life once opened', () => {
  assert.equal(useBy({ openedOn: '2026-11-12', lifeDays: 30, expiry: '2027-06-30' }), '2026-12-12');
  assert.equal(useBy({ openedOn: '2026-11-12', lifeDays: 30, expiry: '2026-11-20' }), '2026-11-20', 'the pack expires first');
  assert.equal(useBy({ openedOn: '2026-11-12', lifeDays: null, expiry: '2027-01-01' }), '2027-01-01');
  assert.equal(useBy({ openedOn: '2026-11-12', lifeDays: 7, expiry: null }), '2026-11-19');
  assert.equal(useBy({ openedOn: '2026-11-12', lifeDays: null, expiry: null }), null);
  assert.equal(useBy({ openedOn: '2026-12-25', lifeDays: 10, expiry: '' }), '2027-01-04', 'across the year end');
});

test('standing: past, due within the warning days, fine, or no date', () => {
  assert.equal(standing('2026-11-11', '2026-11-12', 2), 'PAST');
  assert.equal(standing('2026-11-12', '2026-11-12', 2), 'DUE', 'due today is not yet past');
  assert.equal(standing('2026-11-14', '2026-11-12', 2), 'DUE');
  assert.equal(standing('2026-11-15', '2026-11-12', 2), 'OK');
  assert.equal(standing(null, '2026-11-12', 2), 'NO_DATE');
});

// ── Items ────────────────────────────────────────────────────────────────────

test('item: storage and days usable once opened are kept, checked, and left alone by a form that does not send them', async () => {
  const env = testEnv();
  const kit = await makeItem(env, { name: 'Glucose reagent kit', storage: 'fridge', openLifeDays: 28 });
  const row = () => env.DB.db.prepare(`SELECT storage, open_life_days FROM items WHERE id = ?`).get(kit);
  assert.deepEqual({ ...row() }, { storage: 'FRIDGE', open_life_days: 28 });
  const list = (await call(env, 'GET', '/api/stock', { as: 'keeper' })).body.items.find((i) => i.id === kit);
  assert.deepEqual([list.storage, list.openLifeDays], ['FRIDGE', 28]);

  // A form that does not know about them (Herbal Park's, with the setting off) changes nothing.
  const same = await call(env, 'PUT', `/api/items/${kit}`, { body: { code: list.code, name: 'Glucose reagent kit (GOD-POD)', uom: 'kit', category: 'Reagents' } });
  assert.equal(same.status, 200, JSON.stringify(same.body));
  assert.deepEqual({ ...row() }, { storage: 'FRIDGE', open_life_days: 28 });
  // Cleared on purpose.
  await call(env, 'PUT', `/api/items/${kit}`, { body: { code: list.code, name: 'Glucose reagent kit', storage: '', openLifeDays: '' } });
  assert.deepEqual({ ...row() }, { storage: null, open_life_days: null });

  const bad = await call(env, 'PUT', `/api/items/${kit}`, { body: { code: list.code, name: 'x', storage: 'BOOT' } });
  assert.equal(bad.body.error.code, 'BAD_STORAGE');
  const bad2 = await call(env, 'PUT', `/api/items/${kit}`, { body: { code: list.code, name: 'x', openLifeDays: 2.5 } });
  assert.equal(bad2.body.error.code, 'BAD_OPEN_LIFE');
});

// ── Opening a pack ───────────────────────────────────────────────────────────

test('open: off until the unit switches it on', async () => {
  const env = testEnv();
  const kit = await makeItem(env, { tracksExpiry: true });
  await receive(env, kit, 3, { expiry: day(200), batchNo: 'L1' });
  const r = await open(env, { itemId: kit });
  assert.deepEqual([r.status, r.body.error.code], [409, 'LOTS_OFF']);
  assert.equal(bal(env, S.main, kit).qty, 3, 'nothing left the shelf');
});

test('open: first to expire first, taken off the shelf as a use at that bench, with its in-use date', async () => {
  const env = testEnv();
  await switchOn(env);
  const kit = await makeItem(env, { name: 'Glucose reagent kit', tracksExpiry: true, openLifeDays: 28, storage: 'FRIDGE' });
  await receive(env, kit, 2, { expiry: day(300), batchNo: 'LATE' });
  await receive(env, kit, 2, { expiry: day(10), batchNo: 'SOON' });

  const r = await open(env, { itemId: kit });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.deepEqual(r.body.openings.map((o) => [o.batchNo, o.useBy, o.qty]), [['SOON', day(10), 1]], 'the printed expiry comes first here');
  assert.equal(bal(env, S.main, kit).qty, 3);
  const m = env.DB.db.prepare(`SELECT kind, qty, area_id, doc_type, reason FROM movements WHERE item_id = ? AND kind = 'ISSUE'`).get(kit);
  assert.deepEqual({ ...m }, { kind: 'ISSUE', qty: -1, area_id: FOR.areaId, doc_type: 'OPEN', reason: 'Opened' });

  // A named lot, and its in-use date from its life once opened.
  const lateId = env.DB.db.prepare(`SELECT id FROM batches WHERE item_id = ? AND batch_no = 'LATE'`).get(kit).id;
  const r2 = await open(env, { itemId: kit, batchId: lateId });
  assert.deepEqual(r2.body.openings.map((o) => [o.batchNo, o.useBy]), [['LATE', day(28)]]);

  const list = (await call(env, 'GET', '/api/openings', { as: 'staff' })).body;
  assert.deepEqual(list.map((o) => [o.batch_no, o.area_name, o.standing]), [['SOON', 'Treatment room 1', 'OK'], ['LATE', 'Treatment room 1', 'OK']]);
});

test('open: two packs across two lots make two openings; an item with no lots still gets a date from its life', async () => {
  const env = testEnv();
  await switchOn(env);
  const kit = await makeItem(env, { tracksExpiry: true });
  await receive(env, kit, 1, { expiry: day(20), batchNo: 'A' });
  await receive(env, kit, 1, { expiry: day(40), batchNo: 'B' });
  const r = await open(env, { itemId: kit, qty: 2 });
  assert.deepEqual(r.body.openings.map((o) => o.batchNo), ['A', 'B']);

  const tips = await makeItem(env, { name: 'Pipette tips', openLifeDays: 5 });
  await receive(env, tips, 10);
  const t = await open(env, { itemId: tips });
  assert.deepEqual(t.body.openings.map((o) => [o.batchNo, o.useBy]), [[null, day(5)]]);
});

test('open: refused with a sentence when it cannot be done, and nothing moves', async () => {
  const env = testEnv();
  await switchOn(env);
  const kit = await makeItem(env, { tracksExpiry: true });
  await receive(env, kit, 1, { expiry: day(30), batchNo: 'A' });
  const noArea = await call(env, 'POST', '/api/openings', { as: 'keeper', body: { storeId: S.main, itemId: kit } });
  assert.equal(noArea.body.error.code, 'AREA_REQUIRED');
  const tooMany = await open(env, { itemId: kit, qty: 2 });
  assert.equal(tooMany.body.error.code, 'NOT_ENOUGH');
  assert.equal(bal(env, S.main, kit).qty, 1);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM lot_openings`).get().n, 0);
  assert.equal((await open(env, { itemId: kit }, 'viewer')).status, 403);
  // The other unit, switched on too, in its own store, still cannot reach this unit's item.
  env.DB.db.prepare(`INSERT INTO settings (unit_id, key, value) VALUES (?, 'lots.opened', 'on')`).run(HV);
  assert.equal((await call(env, 'POST', '/api/openings', { as: 'hv', unit: HV, body: { storeId: S.hvMain, ...FOR, itemId: kit } })).status, 404);
});

// ── Finishing, discarding, tracing ───────────────────────────────────────────

test('finish and discard: no stock moves; the opener or the store may; a discard says why; once only', async () => {
  const env = testEnv();
  await switchOn(env);
  const kit = await makeItem(env, { tracksExpiry: true });
  await receive(env, kit, 3, { expiry: day(30), batchNo: 'LOT-7' });
  const a = (await open(env, { itemId: kit }, 'keeper')).body.openings[0].id;
  const b = (await open(env, { itemId: kit }, 'keeper')).body.openings[0].id;
  const shelf = bal(env, S.main, kit).qty;

  const notYours = await call(env, 'POST', `/api/openings/${a}/finish`, { as: 'staff', body: {} });
  assert.deepEqual([notYours.status, notYours.body.error.code], [403, 'NOT_YOURS']);
  assert.equal((await call(env, 'POST', `/api/openings/${a}/finish`, { as: 'keeper', body: {} })).status, 200);
  const twice = await call(env, 'POST', `/api/openings/${a}/finish`, { as: 'keeper', body: {} });
  assert.deepEqual([twice.status, twice.body.error.code], [409, 'ALREADY_CLOSED']);

  const noWhy = await call(env, 'POST', `/api/openings/${b}/discard`, { as: 'manager', body: {} });
  assert.equal(noWhy.body.error.code, 'REASON_REQUIRED');
  assert.equal((await call(env, 'POST', `/api/openings/${b}/discard`, { as: 'manager', body: { reason: 'Failed quality control' } })).status, 200);
  assert.equal(bal(env, S.main, kit).qty, shelf, 'it left the shelf when it was opened, not now');

  assert.equal((await call(env, 'GET', '/api/openings', { as: 'staff' })).body.length, 0);
  // Tracing: which bench used lot LOT-7, and how each pack ended.
  const trace = (await call(env, 'GET', '/api/openings?closed=1&q=LOT-7', { as: 'staff' })).body;
  assert.deepEqual(trace.map((o) => [o.status, o.area_name, o.close_reason]).sort(), [['DISCARDED', 'Treatment room 1', 'Failed quality control'], ['FINISHED', 'Treatment room 1', null]]);
  assert.equal((await call(env, 'GET', '/api/openings?closed=1&q=NOPE', { as: 'staff' })).body.length, 0);
});

test('today: opened packs past their date and due soon are flagged to the people who use stock, only where switched on', async () => {
  const env = testEnv();
  const kit = await makeItem(env, { tracksExpiry: true, openLifeDays: 1 });
  await receive(env, kit, 3, { expiry: day(300), batchNo: 'A' });
  const flagged = async (as) => (await call(env, 'GET', '/api/today', { as })).body.waiting.find((w) => w.key === 'packs-due');
  await switchOn(env);
  await open(env, { itemId: kit });
  await open(env, { itemId: kit });
  // Age one opening past its date.
  env.DB.db.prepare(`UPDATE lot_openings SET use_by = ? WHERE rowid = (SELECT MIN(rowid) FROM lot_openings)`).run(day(-1));
  const w = await flagged('keeper');
  assert.equal(w.text, 'Opened packs: 1 past its in-use date, 1 due within 2 days');
  assert.deepEqual([w.n, w.urgent, w.screen], [2, 1, 'in-use']);
  assert.equal(await flagged('viewer'), undefined, 'a viewer does not use stock');
  await call(env, 'PUT', '/api/settings', { body: { 'lots.opened': 'off' } });
  assert.equal(await flagged('keeper'), undefined);
});
