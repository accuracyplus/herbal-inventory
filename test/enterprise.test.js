/**
 * Feature 14: enterprise features, each behind a per-unit setting. Part 1: approval limits by
 * amount, and month close.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { HP, PEOPLE, S, bal, call, makeItem, receive, testEnv } from './helpers/http.js';

export const settings = (env, values, as = 'admin') => call(env, 'PUT', '/api/settings', { as, body: values });

async function withStock(cost = 100, qty = 100) {
  const env = testEnv();
  env.oil = await makeItem(env);
  await receive(env, env.oil, qty, { unitCost: cost });
  return env;
}

const correction = async (env, qty) => {
  const r = await call(env, 'POST', '/api/adjustments', { as: 'keeper', body: { storeId: S.main, reason: 'DAMAGED', lines: [{ itemId: env.oil, qty }] } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.id;
};
const approveCorrection = (env, id, as) => call(env, 'POST', `/api/adjustments/${id}/decide`, { as, body: { action: 'APPROVE' } });

test('approval limits: off, a manager approves any amount', async () => {
  const env = await withStock();
  const id = await correction(env, -60); // AED 6,000
  assert.equal((await approveCorrection(env, id, 'manager')).status, 200);
});

test('approval limits: above the amount a correction needs a unit administrator or a director', async () => {
  const env = await withStock();
  await settings(env, { 'limits.on': 'on', 'limits.writeoff': '1000' });
  const small = await correction(env, -5); // AED 500
  assert.equal((await approveCorrection(env, small, 'manager')).status, 200, 'under the limit: a manager');

  const big = await correction(env, -20); // AED 2,000
  const refused = await approveCorrection(env, big, 'manager');
  assert.equal(refused.status, 403);
  assert.equal(refused.body.error.code, 'OVER_LIMIT');
  assert.match(refused.body.error.message, /AED 2000\.00, above the AED 1000\.00 a manager may approve/);
  assert.equal(bal(env, S.main, env.oil).qty, 95, 'nothing moved');

  env.DB.db.prepare(`UPDATE staff SET group_summary = 1 WHERE id = ?`).run(PEOPLE.manager.id);
  assert.equal((await approveCorrection(env, big, 'manager')).status, 200, 'a manager ticked Director may');
  assert.equal(bal(env, S.main, env.oil).qty, 75);

  const me = (await call(env, 'GET', '/api/me', { as: 'keeper' })).body;
  assert.deepEqual(me.limits, { po: 5000, writeoff: 1000, count: 1000, anyAmount: false });
});

test('approval limits: a count counts shortages and surpluses together', async () => {
  const env = await withStock();
  const other = await makeItem(env, { name: 'Towel soap' });
  await receive(env, other, 100, { unitCost: 100 });
  await settings(env, { 'limits.on': 'on', 'limits.count': '1500' });
  const c = await call(env, 'POST', '/api/counts', { as: 'keeper', body: { storeId: S.main } });
  await call(env, 'PUT', `/api/counts/${c.body.id}/lines`, { as: 'keeper', body: { lines: [{ itemId: env.oil, counted: 90 }, { itemId: other, counted: 110 }] } });
  await call(env, 'POST', `/api/counts/${c.body.id}/submit`, { as: 'keeper' });
  const refused = await call(env, 'POST', `/api/counts/${c.body.id}/approve`, { as: 'manager' });
  assert.equal(refused.body.error?.code, 'OVER_LIMIT', 'AED 1,000 short and 1,000 over is 2,000 of difference, not nothing');
  assert.equal((await call(env, 'POST', `/api/counts/${c.body.id}/approve`, { as: 'admin' })).status, 200, 'a unit administrator may');
});

test('approval limits: a purchase order above the amount', async () => {
  const env = await withStock();
  env.DB.db.prepare(`INSERT INTO suppliers (id, unit_id, name, active) VALUES ('sp-1', ?, 'Kerala Oils', 1)`).run(HP);
  await settings(env, { 'limits.on': 'on', 'limits.po': '5000' });
  const po = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: 'sp-1', storeId: S.main, lines: [{ itemId: env.oil, qty: 60, unitCost: 100 }] } });
  await call(env, 'POST', `/api/pos/${po.body.id}/submit`, { as: 'buyer' });
  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'manager' })).body.error?.code, 'OVER_LIMIT');
  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'admin' })).status, 200);
});

// ── Pack sizes ───────────────────────────────────────────────────────────────────────────

const editItem = (env, id, body) => call(env, 'PUT', `/api/items/${id}`, { as: 'manager', body: { code: 'OIL1', name: 'Massage oil', uom: 'bottle', category: 'Oils', ...body } });
const stockItem = async (env, id, as = 'manager') => (await call(env, 'GET', '/api/stock', { as })).body.items.find((i) => i.id === id);

async function withPacks() {
  const env = testEnv();
  env.DB.db.prepare(`INSERT INTO suppliers (id, unit_id, name, active) VALUES ('sp-1', ?, 'Kerala Oils', 1), ('sp-2', ?, 'Gulf Supplies', 1)`).run(HP, HP);
  env.oil = await makeItem(env, { code: 'OIL1' });
  await settings(env, { 'packs.on': 'on' });
  const r = await editItem(env, env.oil, { packs: [
    { label: 'Carton of 48', factor: 48, supplierId: 'sp-1', use: 'BUY' },
    { label: 'Box of 12', factor: 12, use: 'BOTH' },
  ] });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  env.packs = (await stockItem(env, env.oil)).packs;
  env.carton = env.packs.find((p) => p.label === 'Carton of 48').id;
  env.box = env.packs.find((p) => p.label === 'Box of 12').id;
  return env;
}

test('pack sizes: off, an item cannot be given packs', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { code: 'OIL1' });
  const r = await editItem(env, oil, { packs: [{ label: 'Box of 12', factor: 12 }] });
  assert.equal(r.body.error.code, 'FEATURE_OFF');
  assert.equal((await stockItem(env, oil)).packs, undefined, 'the stock list says nothing about packs');
});

test('pack sizes: an order in cartons is pieces to the stock, the carton kept on the line and the paper', async () => {
  const env = await withPacks();
  assert.deepEqual(env.packs.map((p) => [p.label, p.factor, p.supplierName ?? null]), [['Box of 12', 12, null], ['Carton of 48', 48, 'Kerala Oils']]);
  const po = await call(env, 'POST', '/api/pos', { as: 'buyer', body: {
    supplierId: 'sp-1', storeId: S.main, lines: [{ itemId: env.oil, qty: 5, unitCost: 480, packId: env.carton, packQty: 5, packCost: 480 }],
  } });
  assert.equal(po.status, 201, JSON.stringify(po.body));
  const line = env.DB.db.prepare(`SELECT qty, unit_cost, pack_label, pack_qty, pack_cost FROM po_lines WHERE po_id = ?`).get(po.body.id);
  assert.deepEqual({ ...line }, { qty: 240, unit_cost: 10, pack_label: 'Carton of 48', pack_qty: 5, pack_cost: 480 });
  const order = (await call(env, 'GET', `/api/pos/${po.body.id}`, { as: 'buyer' })).body;
  assert.equal(order.total, 2400);

  const other = await call(env, 'POST', '/api/pos', { as: 'buyer', body: {
    supplierId: 'sp-2', storeId: S.main, lines: [{ itemId: env.oil, qty: 1, packId: env.carton, packQty: 1, packCost: 480 }],
  } });
  assert.equal(other.body.error.code, 'PACK_SUPPLIER', "Kerala Oils' carton is not Gulf Supplies'");
});

test('pack sizes: a delivery counted in boxes puts pieces on the shelf at the price of one piece', async () => {
  const env = await withPacks();
  const rec = await call(env, 'POST', '/api/receipts', { as: 'keeper', body: {
    storeId: S.main, supplierId: 'sp-2', lines: [{ itemId: env.oil, qty: 3, packId: env.box, packQty: 3, packCost: 60 }],
  } });
  assert.equal(rec.status, 201, JSON.stringify(rec.body));
  const line = env.DB.db.prepare(`SELECT qty, unit_cost, pack_label, pack_qty FROM receipt_lines WHERE receipt_id = ?`).get(rec.body.id);
  assert.deepEqual({ ...line }, { qty: 36, unit_cost: 5, pack_label: 'Box of 12', pack_qty: 3 });
  assert.equal(rec.body.total, 180);
});

// ── Shelf locations ──────────────────────────────────────────────────────────────────────

test('shelf locations: set per store on the item, shown on the stock list, the count sheet and a request', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { code: 'OIL1', name: 'Massage oil' });
  const soap = await makeItem(env, { code: 'SOAP1', name: 'Aloe soap' });
  await receive(env, oil, 10);
  await receive(env, soap, 10);
  const level = (location) => [{ storeId: S.main, reorder: 0, critical: 0, par: 0, location }];
  assert.equal((await editItem(env, oil, { levels: level('B-2') })).body.error.code, 'FEATURE_OFF');
  await settings(env, { 'locations.on': 'on' });
  assert.equal((await editItem(env, oil, { levels: level('B-2') })).status, 200);
  assert.equal((await call(env, 'PUT', `/api/items/${soap}`, { as: 'manager', body: { code: 'SOAP1', name: 'Aloe soap', uom: 'bar', category: 'Soap', levels: level('A-1') } })).status, 200);
  assert.equal((await stockItem(env, oil)).stores.find((s) => s.storeId === S.main).location, 'B-2');

  const c = await call(env, 'POST', '/api/counts', { as: 'keeper', body: { storeId: S.main } });
  const sheet = (await call(env, 'GET', `/api/counts/${c.body.id}`, { as: 'keeper' })).body.lines;
  assert.deepEqual(sheet.map((l) => [l.name, l.location]), [['Aloe soap', 'A-1'], ['Massage oil', 'B-2']], 'walked in shelf order');

  const req = await call(env, 'POST', '/api/requests', { as: 'staff', body: { fromStoreId: S.main, toStoreId: S.sub, lines: [{ itemId: oil, qty: 1 }] } });
  const got = (await call(env, 'GET', `/api/requests/${req.body.id}`, { as: 'keeper' })).body;
  assert.equal(got.lines[0].location, 'B-2');

  assert.equal((await editItem(env, oil, { levels: level('') })).status, 200, 'emptied, the location is removed');
  assert.equal((await stockItem(env, oil)).stores.find((s) => s.storeId === S.main).location, null);
});

// ── Quarantine / inspection ──────────────────────────────────────────────────────────────

const holdOf = (env, store, item) => env.DB.db.prepare(`SELECT qty, on_hold FROM balances WHERE store_id = ? AND item_id = ?`).get(store, item);
const held = async (env, as = 'manager') => (await call(env, 'GET', '/api/inspections', { as })).body;

test('inspection: every delivery held until released; nothing held can be used', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await settings(env, { 'quarantine.on': 'all' });
  await receive(env, oil, 10, { unitCost: 20 });
  assert.deepEqual({ ...holdOf(env, S.main, oil) }, { qty: 0, on_hold: 10 });
  const use = await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, areaId: 'ar-r1', personId: PEOPLE.keeper.id, lines: [{ itemId: oil, qty: 1 }] } });
  assert.equal(use.body.error.code, 'NOT_ENOUGH', 'held stock is not on the shelf');
  const valued = (await call(env, 'GET', '/api/stock', { as: 'manager' })).body.items.find((i) => i.id === oil);
  assert.equal(valued.stores.find((s) => s.storeId === S.main).onHold, 10);

  const list = await held(env);
  assert.equal(list.length, 1);
  assert.ok((await call(env, 'GET', '/api/today', { as: 'manager' })).body.waiting.some((w) => w.key === 'inspect'));
  assert.equal((await call(env, 'POST', `/api/inspections/${list[0].id}/release`, { as: 'keeper' })).status, 403, 'a store keeper does not release');
  assert.equal((await call(env, 'POST', `/api/inspections/${list[0].id}/release`, { as: 'manager' })).status, 200);
  assert.deepEqual({ ...holdOf(env, S.main, oil) }, { qty: 10, on_hold: 0 });
  assert.equal((await call(env, 'POST', `/api/inspections/${list[0].id}/release`, { as: 'manager' })).body.error.code, 'ALREADY_DECIDED');
  const m = env.DB.db.prepare(`SELECT kind, qty, value FROM movements WHERE item_id = ? ORDER BY at`).all(oil).map((x) => [x.kind, x.qty, x.value]);
  assert.deepEqual(m, [['RECEIPT', 10, 200], ['RELEASE', 10, 0]], 'valued once, when received');
});

test('inspection: only items marked "inspect on arrival", and a lot is released into its own batch', async () => {
  const env = testEnv();
  await settings(env, { 'quarantine.on': 'flagged' });
  const reagent = await makeItem(env, { name: 'Glucose reagent', tracksExpiry: true });
  const gloves = await makeItem(env, { name: 'Gloves' });
  env.DB.db.prepare(`UPDATE items SET inspect = 1 WHERE id = ?`).run(reagent);
  await receive(env, reagent, 5, { expiry: '2027-03-01', batchNo: 'G-1' });
  await receive(env, gloves, 50);
  assert.equal(holdOf(env, S.main, gloves).qty, 50, 'not marked: straight to the shelf');
  assert.equal(holdOf(env, S.main, reagent).on_hold, 5);
  const [ins] = await held(env);
  assert.equal(ins.batch_no, 'G-1');
  await call(env, 'POST', `/api/inspections/${ins.id}/release`, { as: 'manager' });
  const b = env.DB.db.prepare(`SELECT qty, on_hold FROM batches WHERE item_id = ?`).get(reagent);
  assert.deepEqual({ ...b }, { qty: 5, on_hold: 0 });
});

test('inspection: rejected stock goes back to the supplier waiting for its credit, or is written off', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await settings(env, { 'quarantine.on': 'all', 'returns.on': 'on' });
  await receive(env, oil, 4, { unitCost: 25 });
  const [ins] = await held(env);
  assert.equal((await call(env, 'POST', `/api/inspections/${ins.id}/reject`, { as: 'manager' })).body.error.code, 'REASON_REQUIRED');
  const r = await call(env, 'POST', `/api/inspections/${ins.id}/reject`, { as: 'manager', body: { note: 'Seal broken' } });
  assert.equal(r.status, 200);
  assert.deepEqual({ ...holdOf(env, S.main, oil) }, { qty: 0, on_hold: 0 });
  const ret = (await call(env, 'GET', `/api/returns/${r.body.returnId}`, { as: 'manager' })).body;
  assert.equal(ret.status, 'SENT');
  assert.equal(ret.value, 100);
  assert.equal(ret.lines[0].from_hold, 1);
  const mv = env.DB.db.prepare(`SELECT kind, qty, value FROM movements WHERE item_id = ? AND kind = 'SUPPLIER_RETURN'`).get(oil);
  assert.deepEqual({ ...mv }, { kind: 'SUPPLIER_RETURN', qty: -4, value: -100 });

  const credit = await call(env, 'POST', `/api/returns/${ret.id}/credit`, { as: 'buyer', body: { creditNo: 'CN-77', creditDate: '2026-11-10', amount: 100 } });
  assert.equal(credit.status, 200, JSON.stringify(credit.body));
  assert.equal((await call(env, 'GET', `/api/returns/${ret.id}`, { as: 'buyer' })).body.status, 'CREDITED');

  // Returns off: a rejection is a write-off at the price it came in at.
  const env2 = testEnv();
  const oil2 = await makeItem(env2);
  await settings(env2, { 'quarantine.on': 'all' });
  await receive(env2, oil2, 2, { unitCost: 30 });
  const [ins2] = await held(env2);
  await call(env2, 'POST', `/api/inspections/${ins2.id}/reject`, { as: 'manager', body: { note: 'Wrong colour' } });
  const w = env2.DB.db.prepare(`SELECT kind, reason, value FROM movements WHERE item_id = ? AND kind = 'ADJUST'`).get(oil2);
  assert.deepEqual({ ...w }, { kind: 'ADJUST', reason: 'FAILED_INSPECTION', value: -60 });
});

// ── Returns to supplier ──────────────────────────────────────────────────────────────────

test('returns: against a delivery, never more than it brought, approved by somebody else, then the credit', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const raise = (b) => call(env, 'POST', '/api/returns', { as: 'keeper', body: b });
  const off = await raise({ receiptId: 'x', reason: 'DAMAGED', lines: [] });
  assert.equal(off.body.error.code, 'FEATURE_OFF');
  await settings(env, { 'returns.on': 'on', 'accounting.on': 'on' });
  const rec = await receive(env, oil, 10, { unitCost: 12 });
  const opts = (await call(env, 'GET', `/api/returns/options/${rec.id}`, { as: 'keeper' })).body;
  const line = opts.lines[0];
  assert.equal(line.left, 10);
  assert.equal((await raise({ receiptId: rec.id, reason: 'DAMAGED', lines: [{ receiptLineId: line.id, qty: 11 }] })).body.error.code, 'MORE_THAN_RECEIVED');
  const ok = await raise({ receiptId: rec.id, reason: 'DAMAGED', note: 'Two leaking', lines: [{ receiptLineId: line.id, qty: 6 }] });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.value, 72);
  assert.equal((await raise({ receiptId: rec.id, reason: 'DAMAGED', lines: [{ receiptLineId: line.id, qty: 5 }] })).body.error.code, 'MORE_THAN_RECEIVED', '6 already on the way back');
  assert.equal(bal(env, S.main, oil).qty, 10, 'nothing leaves until it is approved');

  assert.equal((await call(env, 'POST', `/api/returns/${ok.body.id}/approve`, { as: 'keeper' })).status, 403);
  assert.equal((await call(env, 'POST', `/api/returns/${ok.body.id}/approve`, { as: 'manager' })).status, 200);
  assert.equal(bal(env, S.main, oil).qty, 4);
  const waiting = (await call(env, 'GET', '/api/today', { as: 'buyer' })).body.waiting;
  assert.ok(waiting.some((w) => w.key === 'returns-credit'), 'purchasing is told a credit is owed');

  await close(env, '2026-01');
  const early = await call(env, 'POST', `/api/returns/${ok.body.id}/credit`, { as: 'buyer', body: { creditNo: 'CN-1', creditDate: '2026-01-20', amount: 72 } });
  assert.equal(early.body.error.code, 'PERIOD_CLOSED', 'a credit note cannot be dated in a closed month');
  assert.equal((await call(env, 'POST', `/api/returns/${ok.body.id}/close`, { as: 'manager' })).body.error.code, 'REASON_REQUIRED');
  assert.equal((await call(env, 'POST', `/api/returns/${ok.body.id}/close`, { as: 'manager', body: { note: 'Replaced instead' } })).status, 200);
});

// ── Recall tracing ───────────────────────────────────────────────────────────────────────

test('recall: a lot traced from the supplier to every store, room and person, and what is left', async () => {
  const env = testEnv();
  await settings(env, { 'recall.on': 'on' });
  const oil = await makeItem(env, { name: 'Nasya oil', tracksExpiry: true });
  await receive(env, oil, 10, { expiry: '2027-01-31', batchNo: 'N-0912' });
  await receive(env, oil, 5, { expiry: '2027-06-30', batchNo: 'N-1001' });
  const t = await call(env, 'POST', '/api/transfers', { as: 'keeper', body: { fromStoreId: S.main, toStoreId: S.sub, lines: [{ itemId: oil, qty: 4 }] } });
  assert.equal(t.status, 201, JSON.stringify(t.body));
  const u = await call(env, 'POST', '/api/use', { as: 'staff', body: { storeId: S.sub, areaId: 'ar-r1', lines: [{ itemId: oil, qty: 2 }] } });
  assert.equal(u.status, 201, JSON.stringify(u.body));

  const found = (await call(env, 'GET', '/api/recall?q=0912', { as: 'manager' })).body;
  assert.deepEqual(found.map((l) => l.batch_no), ['N-0912']);
  const trace = (await call(env, 'GET', `/api/recall?item=${oil}&lot=N-0912`, { as: 'manager' })).body;
  assert.equal(trace.cameIn.length, 1);
  assert.deepEqual(trace.totals, { received: 10, used: 2, left: 8, withPeople: 0 });
  assert.deepEqual(trace.left.map((l) => [l.store, l.qty]).sort(), [['Main store', 6], ['Spa sub store', 2]]);
  const used = trace.went.find((m) => m.kind === 'ISSUE');
  assert.equal(used.person, PEOPLE.staff.name);
  assert.match(used.where, /Treatment room 1/);
  assert.ok(!trace.went.some((m) => m.ref && /N-1001/.test(m.ref)), 'the other lot is not in it');

  const keeper = (await call(env, 'GET', `/api/recall?item=${oil}&lot=N-0912`, { as: 'keeper' })).body;
  assert.equal(keeper.went.find((m) => m.kind === 'ISSUE').person, undefined, 'names only for those who see use by person');
});

// ── Month close ──────────────────────────────────────────────────────────────────────────

const close = (env, month, as = 'admin') => call(env, 'POST', '/api/periods/close', { as, body: { month } });

test('month close: off, the routes say where to switch it on', async () => {
  const env = testEnv();
  const r = await close(env, '2026-01');
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'FEATURE_OFF');
  assert.match(r.body.error.message, /Admin, Settings/);
});

test('month close: only a past month, only a unit administrator, and nothing dated in it can be posted', async () => {
  const env = await withStock();
  await settings(env, { 'accounting.on': 'on' });
  const thisMonth = new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 7);
  assert.equal((await close(env, thisMonth)).body.error.code, 'NOT_OVER');
  assert.equal((await close(env, '2026-01', 'manager')).status, 403);
  assert.equal((await close(env, '2026-01')).status, 200);
  assert.equal((await close(env, '2026-01')).body.error.code, 'ALREADY_CLOSED');

  // The database refuses a movement dated in the closed month, whatever writes it.
  const insert = (at) => env.DB.db.prepare(
    `INSERT INTO movements (id, unit_id, at, kind, item_id, store_id, qty) VALUES (?, ?, ?, 'ADJUST', ?, ?, 1)`,
  ).run(`m-${at}`, HP, at, env.oil, S.main);
  assert.throws(() => insert('2026-01-15T10:00:00.000Z'), /PERIOD_CLOSED/);
  assert.throws(() => insert('2025-12-31T21:00:00.000Z'), /PERIOD_CLOSED/, '01:00 on 1 January in the Gulf');
  insert('2025-12-31T19:00:00.000Z'); // 23:00 on 31 December in the Gulf: open
  insert('2026-02-01T08:00:00.000Z');

  // Today's work goes on.
  const id = await correction(env, -1);
  assert.equal((await approveCorrection(env, id, 'manager')).status, 200);

  const list = (await call(env, 'GET', '/api/periods', { as: 'manager' })).body;
  assert.deepEqual(list.map((p) => p.month), ['2026-01']);
  assert.equal((await call(env, 'POST', '/api/periods/reopen', { as: 'admin', body: { month: '2026-01' } })).body.error.code, 'REASON_REQUIRED');
  assert.equal((await call(env, 'POST', '/api/periods/reopen', { as: 'admin', body: { month: '2026-01', reason: 'Late invoice' } })).status, 200);
  insert('2026-01-20T10:00:00.000Z');
  const log = env.DB.db.prepare(`SELECT action, detail FROM audit_log WHERE action LIKE 'PERIOD_%' ORDER BY at`).all();
  assert.deepEqual(log.map((l) => l.action), ['PERIOD_CLOSE', 'PERIOD_REOPEN']);
});
