import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, bal, call, deliver, hfidToken, makeItem, receive, S, testEnv, FOR } from './helpers/http.js';

// ── Requests ─────────────────────────────────────────────────────────────────

test('request: staff ask, a manager approves part, the store gives out in two goes', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { name: 'Pinda thailam' });
  await receive(env, oil, 10);
  const made = await call(env, 'POST', '/api/requests', { as: 'staff', body: { toStoreId: S.sub, urgency: 'URGENT', lines: [{ itemId: oil, qty: 6 }] } });
  assert.equal(made.status, 201);
  assert.equal(made.body.status, 'PENDING');
  assert.match(made.body.ref, /^HP-REQ-0001$/);

  const staffTries = await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'staff', body: { action: 'APPROVE' } });
  assert.equal(staffTries.status, 403);

  const detail = await call(env, 'GET', `/api/requests/${made.body.id}`, { as: 'manager' });
  const line = detail.body.lines[0];
  assert.equal(line.available, 10);
  const ok = await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'manager', body: { action: 'APPROVE', lines: [{ lineId: line.id, approvedQty: 5 }] } });
  assert.equal(ok.status, 200);

  const tooMuch = await call(env, 'POST', `/api/requests/${made.body.id}/issue`, { as: 'keeper', body: { lines: [{ lineId: line.id, qty: 6 }] } });
  assert.equal(tooMuch.status, 422);
  const first = await call(env, 'POST', `/api/requests/${made.body.id}/issue`, { as: 'keeper', body: { lines: [{ lineId: line.id, qty: 3 }] } });
  assert.equal(first.status, 200);
  assert.equal((await call(env, 'GET', `/api/requests/${made.body.id}`, { as: 'keeper' })).body.status, 'PARTLY_ISSUED');
  await call(env, 'POST', `/api/requests/${made.body.id}/issue`, { as: 'keeper', body: { lines: [{ lineId: line.id, qty: 2 }] } });
  const done = await call(env, 'GET', `/api/requests/${made.body.id}`, { as: 'keeper' });
  assert.equal(done.body.status, 'ISSUED');
  assert.equal(done.body.issues.length, 2);
  assert.equal(bal(env, S.main, oil).qty, 5);
  assert.equal(bal(env, S.sub, oil).qty, 5);
});

test('request: rejecting needs a reason, and the person who asked sees it', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const made = await call(env, 'POST', '/api/requests', { as: 'staff', body: { areaId: AREA.room2, lines: [{ itemId: oil, qty: 1 }] } });
  assert.equal((await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'manager', body: { action: 'REJECT' } })).status, 422);
  await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'manager', body: { action: 'REJECT', note: 'Use the open bottle in room 2 first' } });
  const mine = await call(env, 'GET', '/api/requests', { as: 'staff' });
  assert.equal(mine.body[0].status, 'REJECTED');
  assert.equal(mine.body[0].decision_note, 'Use the open bottle in room 2 first');
});

test('request: a manager cannot approve their own while another approver exists', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const made = await call(env, 'POST', '/api/requests', { as: 'manager', body: { toStoreId: S.sub, lines: [{ itemId: oil, qty: 1 }] } });
  const self = await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'manager', body: { action: 'APPROVE' } });
  assert.equal(self.status, 403);
  assert.equal(self.body.error.code, 'FOUR_EYES');
  const other = await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'admin', body: { action: 'APPROVE' } });
  assert.equal(other.status, 200);
});

test('request: a unit can switch approval off, and requests go straight to the store', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'requests.approval': 'none' } })).status, 200);
  const made = await call(env, 'POST', '/api/requests', { as: 'staff', body: { toStoreId: S.sub, lines: [{ itemId: oil, qty: 2 }] } });
  assert.equal(made.body.status, 'APPROVED');
});

test('request: staff only see their own requests', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await call(env, 'POST', '/api/requests', { as: 'keeper', body: { toStoreId: S.sub, lines: [{ itemId: oil, qty: 1 }] } });
  const r = await call(env, 'POST', '/api/requests', { as: 'staff', body: { toStoreId: S.sub, lines: [{ itemId: oil, qty: 1 }] } });
  const list = await call(env, 'GET', '/api/requests', { as: 'staff' });
  assert.deepEqual(list.body.map((x) => x.id), [r.body.id]);
});

// ── Purchasing ───────────────────────────────────────────────────────────────

async function supplier(env) {
  const s = await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Kerala Ayurveda Traders', phone: '+971500000000', email: 'orders@example.com' } });
  assert.equal(s.status, 201);
  return s.body.id;
}

test('purchase order: draft, submit, approve, receive in part, then the rest', async () => {
  const env = testEnv();
  const sup = await supplier(env);
  const oil = await makeItem(env);
  const po = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: sup, storeId: S.main, lines: [{ itemId: oil, qty: 20, unitCost: 30 }] } });
  assert.equal(po.status, 201);
  assert.match(po.body.ref, /^HP-PO-0001$/);
  const early = await call(env, 'POST', '/api/receipts', { as: 'keeper', body: { storeId: S.main, poId: po.body.id, lines: [{ itemId: oil, qty: 1 }] } });
  assert.equal(early.status, 422);
  assert.equal(early.body.error.code, 'PO_NOT_OPEN');

  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/submit`, { as: 'buyer' })).status, 200);
  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'buyer' })).status, 403);
  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'manager' })).status, 200);

  const part = await deliver(env, { storeId: S.main, poId: po.body.id, invoiceNo: 'INV-77', lines: [{ itemId: oil, qty: 12 }] });
  assert.equal(part.total, 360);
  let got = await call(env, 'GET', `/api/pos/${po.body.id}`, { as: 'manager' });
  assert.equal(got.body.status, 'PARTLY_RECEIVED');
  assert.equal(got.body.lines[0].received_qty, 12);

  const over = await call(env, 'POST', '/api/receipts', { as: 'keeper', body: { storeId: S.main, poId: po.body.id, lines: [{ itemId: oil, qty: 11 }] } });
  assert.equal(over.status, 422);
  assert.equal(over.body.error.code, 'OVER_RECEIVED');

  await deliver(env, { storeId: S.main, poId: po.body.id, lines: [{ itemId: oil, qty: 8 }] });
  got = await call(env, 'GET', `/api/pos/${po.body.id}`, { as: 'manager' });
  assert.equal(got.body.status, 'RECEIVED');
  assert.equal(got.body.receipts.length, 2);
  assert.equal(bal(env, S.main, oil).qty, 20);
});

test('purchase order: suggestions top up to par less what is already on order', async () => {
  const env = testEnv();
  const sup = await supplier(env);
  const oil = await makeItem(env, { supplierId: sup, levels: [{ storeId: S.main, reorder: 10, critical: 3, par: 40 }] });
  await receive(env, oil, 6, { unitCost: 5 });
  const s1 = await call(env, 'GET', `/api/pos/suggestions?store=${S.main}`, { as: 'buyer' });
  assert.equal(s1.body[0].suggest, 34);
  assert.equal(s1.body[0].supplier_name, 'Kerala Ayurveda Traders');
  await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: sup, storeId: S.main, lines: [{ itemId: oil, qty: 34, unitCost: 5 }] } });
  const s2 = await call(env, 'GET', `/api/pos/suggestions?store=${S.main}`, { as: 'buyer' });
  assert.equal(s2.body.length, 0);
});

// ── Corrections ──────────────────────────────────────────────────────────────

test('correction: raised by the store, posted only when a manager approves', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await receive(env, oil, 10, { unitCost: 4 });
  const adj = await call(env, 'POST', '/api/adjustments', { as: 'keeper', body: { storeId: S.main, reason: 'DAMAGED', lines: [{ itemId: oil, qty: -3 }] } });
  assert.equal(adj.status, 201);
  assert.equal(bal(env, S.main, oil).qty, 10);
  assert.equal((await call(env, 'POST', `/api/adjustments/${adj.body.id}/decide`, { as: 'keeper', body: { action: 'APPROVE' } })).status, 403);
  const ok = await call(env, 'POST', `/api/adjustments/${adj.body.id}/decide`, { as: 'manager', body: { action: 'APPROVE' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.value, -12);
  assert.equal(bal(env, S.main, oil).qty, 7);
  const again = await call(env, 'POST', `/api/adjustments/${adj.body.id}/decide`, { as: 'manager', body: { action: 'APPROVE' } });
  assert.equal(again.status, 409);
});

test('correction: "damaged" cannot add stock, and "lost" needs a note', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await receive(env, oil, 2);
  assert.equal((await call(env, 'POST', '/api/adjustments', { as: 'keeper', body: { storeId: S.main, reason: 'DAMAGED', lines: [{ itemId: oil, qty: 1 }] } })).status, 422);
  assert.equal((await call(env, 'POST', '/api/adjustments', { as: 'keeper', body: { storeId: S.main, reason: 'LOST', lines: [{ itemId: oil, qty: -1 }] } })).status, 422);
});

// ── Counts ───────────────────────────────────────────────────────────────────

test('count: blind for the counter, variance posted on approval, and use during the count is not taken twice', async () => {
  const env = testEnv();
  const a = await makeItem(env, { name: 'Oil A' });
  const b = await makeItem(env, { name: 'Oil B' });
  await receive(env, a, 10, { unitCost: 2 });
  await receive(env, b, 5, { unitCost: 3 });
  const c = await call(env, 'POST', '/api/counts', { as: 'keeper', body: { storeId: S.main } });
  assert.equal(c.status, 201);
  const second = await call(env, 'POST', '/api/counts', { as: 'keeper', body: { storeId: S.main } });
  assert.equal(second.status, 409);

  const sheet = await call(env, 'GET', `/api/counts/${c.body.id}`, { as: 'keeper' });
  assert.equal(sheet.body.hidden, true);
  assert.ok(sheet.body.lines.every((l) => l.expected === null));

  // Two bottles of A are used while the shelf is being counted.
  await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: a, qty: 2 }] } });

  await call(env, 'PUT', `/api/counts/${c.body.id}/lines`, { as: 'keeper', body: { lines: [{ itemId: a, counted: 9 }, { itemId: b, counted: 5 }] } });
  assert.equal((await call(env, 'POST', `/api/counts/${c.body.id}/submit`, { as: 'keeper' })).status, 200);
  const review = await call(env, 'GET', `/api/counts/${c.body.id}`, { as: 'manager' });
  const va = review.body.lines.find((l) => l.item_id === a);
  assert.equal(va.expected, 10);
  assert.equal(va.variance, -1);
  const ok = await call(env, 'POST', `/api/counts/${c.body.id}/approve`, { as: 'manager' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.variances, 1);
  // 10 received − 2 used − 1 missing.
  assert.equal(bal(env, S.main, a).qty, 7);
  assert.equal(bal(env, S.main, b).qty, 5);
});

// ── Import ───────────────────────────────────────────────────────────────────

const OLD = {
  items: [
    { Code: 'HP001', 'Item Name': 'Dhanwantharam Thailam', Category: 'Medicines & Oils', Unit: 'bottle', 'Main Stock': 12, 'Sub Stock': 3, Reorder: 5, Critical: 2 },
    { code: 'HP002', name: 'Kizhi powder', cat: 'Herbs', unit: 'kg', mainStock: 4, subStock: 0, reorder: 2, critical: 1 },
    { code: 'HP002', name: 'Duplicate', mainStock: 1 },
    { code: '', name: 'No code' },
  ],
  linen: [{ name: 'Bath towel', total: 40, available: 30, inUse: 6, inWash: 4 }],
  rooms: [{ id: 'r1', num: '1', name: 'Abhyanga room', type: 'Treatment', status: 'Active' }],
  staff: [{ name: 'Anitha', roles: 'therapist', store: 'sub' }],
  movements: [{ datetime: '2026-04-10 10:00:00', type: 'OUT', itemName: 'Kizhi powder', qty: 1, store: 'Sub', staff: 'Anitha', purpose: 'Room 1' }],
  requests: [{ status: 'Pending' }],
};

test('import: a dry run reports, a real run sets the shelves, and a second run is refused', async () => {
  const env = testEnv();
  const dry = await call(env, 'POST', '/api/import', { body: { data: OLD, mainStoreId: S.main, subStoreId: S.sub, dryRun: true } });
  assert.equal(dry.status, 200);
  assert.equal(dry.body.report.items, 2);
  assert.equal(dry.body.report.problems.length, 2);
  assert.equal(dry.body.report.staffToAdd[0].name, 'Anitha');
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM items`).get().n, 0);

  const run = await call(env, 'POST', '/api/import', { body: { data: OLD, mainStoreId: S.main, subStoreId: S.sub } });
  assert.equal(run.status, 200);
  const item = env.DB.db.prepare(`SELECT id, name, category, uom FROM items WHERE code = 'HP001'`).get();
  assert.equal(item.name, 'Dhanwantharam Thailam');
  assert.equal(bal(env, S.main, item.id).qty, 12);
  assert.equal(bal(env, S.sub, item.id).qty, 3);
  const lv = env.DB.db.prepare(`SELECT reorder, critical FROM item_levels WHERE item_id = ? AND store_id = ?`).get(item.id, S.main);
  assert.deepEqual({ ...lv }, { reorder: 5, critical: 2 });
  const towel = env.DB.db.prepare(`SELECT id FROM items WHERE is_linen = 1`).get();
  assert.deepEqual({ ...bal(env, S.sub, towel.id) }, { qty: 30, in_use: 6, in_wash: 4 });
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM areas WHERE unit_id = 'u-hp'`).get().n, 3);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM legacy_movements`).get().n, 1);

  const again = await call(env, 'POST', '/api/import', { body: { data: OLD, mainStoreId: S.main, subStoreId: S.sub } });
  assert.equal(again.status, 409);
});

test('import: only a unit administrator may run it', async () => {
  const env = testEnv();
  const res = await call(env, 'POST', '/api/import', { as: 'manager', body: { data: OLD, mainStoreId: S.main, subStoreId: S.sub, dryRun: true } });
  assert.equal(res.status, 403);
});

// ── Today, reports, HiFive ID hooks ──────────────────────────────────────────

test('today: approvals appear for the approver, and an empty section is simply absent', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { levels: [{ storeId: S.sub, reorder: 5, critical: 2 }] });
  await receive(env, oil, 1, { storeId: S.sub });
  await call(env, 'POST', '/api/requests', { as: 'staff', body: { toStoreId: S.sub, lines: [{ itemId: oil, qty: 4 }] } });
  const mgr = await call(env, 'GET', '/api/today', { as: 'manager' });
  assert.equal(mgr.status, 200);
  assert.ok(mgr.body.waiting.some((w) => w.key === 'requests-approve' && w.n === 1));
  assert.equal(mgr.body.shortCounts.critical, 1);
  const staff = await call(env, 'GET', '/api/today', { as: 'staff' });
  assert.equal(staff.body.waiting.length, 0);
  assert.equal(staff.body.mine.length, 1);
  assert.equal(staff.body.month, null);
});

test('reports answer for the unit, and the purchases report is limited to people who see costs', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await receive(env, oil, 10, { unitCost: 3 });
  await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: oil, qty: 4 }] } });
  for (const name of ['valuation', 'consumption', 'ledger', 'expiry', 'variance', 'slow']) {
    const r = await call(env, 'GET', `/api/reports/${name}`, { as: 'manager' });
    assert.equal(r.status, 200, name);
  }
  const cons = await call(env, 'GET', '/api/reports/consumption', { as: 'manager' });
  assert.equal(cons.body.byItem[0].qty, 4);
  assert.equal(cons.body.byItem[0].value, 12);
  assert.equal(cons.body.byArea[0].name, 'Treatment room 1');
  assert.equal((await call(env, 'GET', '/api/reports/purchases', { as: 'keeper' })).status, 403);
  assert.equal((await call(env, 'GET', '/api/reports/valuation', { as: 'staff' })).status, 403);
});

test('HiFive ID hub: /pending/service answers for the named person, with the pending verb only', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await call(env, 'POST', '/api/requests', { as: 'staff', body: { toStoreId: S.sub, lines: [{ itemId: oil, qty: 1 }] } });
  const wrong = await call(env, 'POST', '/pending/service', { token: hfidToken({ svc: 'sync', emp_code: 'HPM001', role: 'hr' }) });
  assert.equal(wrong.status, 403);
  const res = await call(env, 'POST', '/pending/service', { token: hfidToken({ svc: 'pending', emp_code: 'HPM001' }) });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.items.map((i) => i.text), ['1 stock request to approve — Herbal Park']);
});

test('HiFive ID console: a single role can be read and set; unit administrator cannot be given from there', async () => {
  const env = testEnv();
  const consoleToken = hfidToken({ aud: 'hifive-id', module: 'hifive-id', role: 'hr', emp_code: 'APML131' });
  const read = await call(env, 'GET', '/api/roles/HPS001', { token: consoleToken });
  assert.equal(read.body.role, 'STAFF');
  assert.equal(read.body.writable, true);
  const set = await call(env, 'PUT', '/api/roles/HPS001', { token: consoleToken, body: { role: 'STOREKEEPER' } });
  assert.equal(set.status, 200);
  const admin = await call(env, 'PUT', '/api/roles/HPS001', { token: consoleToken, body: { role: 'UNIT_ADMIN' } });
  assert.equal(admin.status, 422);
  const several = await call(env, 'GET', '/api/roles/APML131', { token: consoleToken });
  assert.equal(several.body.writable, false);
  const created = await call(env, 'PUT', '/api/roles/HPNEW1', { token: consoleToken, body: { role: 'STAFF', person: { emp_code: 'HPNEW1', full_name: 'New Therapist', entity: 'Herbal Park' } } });
  assert.equal(created.status, 201);
  // An app sign-in, even an admin one, is not the console.
  const app = await call(env, 'GET', '/api/roles/HPS001', { as: 'admin' });
  assert.equal(app.status, 401);
});

test('people: the last unit administrator cannot be removed', async () => {
  const env = testEnv();
  const res = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'APML131', roles: ['MANAGER'] } });
  assert.equal(res.status, 422);
  const add = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'HPNEW2', name: 'Nisha', roles: ['STAFF'], stores: [S.sub] } });
  assert.equal(add.status, 200);
  const list = await call(env, 'GET', '/api/people', { as: 'admin' });
  const nisha = list.body.find((p) => p.code === 'HPNEW2');
  assert.deepEqual(nisha.stores, [S.sub]);
});

test('units: only a group administrator creates one, and it starts with a main store', async () => {
  const env = testEnv();
  assert.equal((await call(env, 'POST', '/api/units', { as: 'manager', body: { code: 'AD', name: 'Atomic Drugstore' } })).status, 403);
  const made = await call(env, 'POST', '/api/units', { as: 'admin', body: { code: 'AD', name: 'Atomic Drugstore', city: 'Dubai' } });
  assert.equal(made.status, 201);
  const stores = await call(env, 'GET', '/api/stores', { as: 'admin', unit: made.body.id });
  assert.equal(stores.body[0].kind, 'MAIN');
});
