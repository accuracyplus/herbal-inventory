import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, bal, call, makeItem, receive, S, testEnv, FOR } from './helpers/http.js';

const day = (n) => new Date(Date.now() + n * 864e5 + 4 * 3600e3).toISOString().slice(0, 10);

test('a receipt puts stock on the shelf and writes the ledger', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'OIL1' });
  const r = await receive(env, id, 12, { unitCost: 25 });
  assert.match(r.ref, /^HP-GRN-0001$/);
  assert.equal(bal(env, S.main, id).qty, 12);
  const m = env.DB.db.prepare(`SELECT kind, qty, balance_after, unit_cost, value, doc_ref FROM movements WHERE item_id = ?`).get(id);
  assert.deepEqual({ ...m }, { kind: 'RECEIPT', qty: 12, balance_after: 12, unit_cost: 25, value: 300, doc_ref: 'HP-GRN-0001' });
});

test('average cost is weighted by quantity across receipts', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  await receive(env, id, 10, { unitCost: 10 });
  await receive(env, id, 30, { unitCost: 20 });
  const it = env.DB.db.prepare(`SELECT avg_cost, last_cost FROM items WHERE id = ?`).get(id);
  assert.equal(it.avg_cost, 17.5);
  assert.equal(it.last_cost, 20);
});

test('use takes stock away, and taking more than is there is refused with the number that is', async () => {
  const env = testEnv();
  const id = await makeItem(env, { name: 'Dhanwantharam oil' });
  await receive(env, id, 5, { storeId: S.sub });
  const ok = await call(env, 'POST', '/api/use', { as: 'staff', body: { storeId: S.sub, ...FOR, lines: [{ itemId: id, qty: 2 }] } });
  assert.equal(ok.status, 201);
  assert.equal(bal(env, S.sub, id).qty, 3);
  const no = await call(env, 'POST', '/api/use', { as: 'staff', body: { storeId: S.sub, ...FOR, lines: [{ itemId: id, qty: 4 }] } });
  assert.equal(no.status, 422);
  assert.equal(no.body.error.code, 'NOT_ENOUGH');
  assert.match(no.body.error.message, /Only 3 bottle of Dhanwantharam oil in Spa sub store/);
  assert.equal(bal(env, S.sub, id).qty, 3);
});

test('two lines of the same item are summed before checking the shelf', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  await receive(env, id, 3);
  const res = await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: id, qty: 2 }, { itemId: id, qty: 2 }] } });
  assert.equal(res.status, 422);
  assert.equal(bal(env, S.main, id).qty, 3);
});

test('the database itself refuses a negative balance, whatever the code does', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  await receive(env, id, 1);
  assert.throws(() => env.DB.db.prepare(`UPDATE balances SET qty = -1 WHERE item_id = ?`).run(id), /CHECK/);
});

test('the ledger is append-only', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  await receive(env, id, 1);
  assert.throws(() => env.DB.db.prepare(`UPDATE movements SET qty = 99`).run(), /append-only/);
  assert.throws(() => env.DB.db.prepare(`DELETE FROM movements`).run(), /append-only/);
});

test('an item that tracks expiry needs a date on receipt, and is issued first-expiry-first', async () => {
  const env = testEnv();
  const id = await makeItem(env, { tracksExpiry: true, name: 'Herbal paste' });
  const noDate = await call(env, 'POST', '/api/receipts', { as: 'keeper', body: { storeId: S.main, lines: [{ itemId: id, qty: 1, unitCost: 1 }] } });
  assert.equal(noDate.status, 422);
  assert.equal(noDate.body.error.code, 'EXPIRY_REQUIRED');

  await receive(env, id, 5, { expiry: day(200), batchNo: 'LATE' });
  await receive(env, id, 5, { expiry: day(40), batchNo: 'EARLY' });
  const use = await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: id, qty: 7 }] } });
  assert.equal(use.status, 201);
  const left = env.DB.db.prepare(`SELECT batch_no, qty FROM batches WHERE item_id = ? ORDER BY expiry`).all(id).map((b) => [b.batch_no, b.qty]);
  assert.deepEqual(left, [['EARLY', 0], ['LATE', 3]]);
  assert.equal(bal(env, S.main, id).qty, 3);
});

test('expired stock is never handed out; it has to be written off', async () => {
  const env = testEnv();
  const id = await makeItem(env, { tracksExpiry: true });
  // Arrange an expired batch directly: a receipt of expired goods is itself a thing to refuse at the door.
  await receive(env, id, 2, { expiry: day(10), batchNo: 'B1' });
  env.DB.db.prepare(`UPDATE batches SET expiry = ? WHERE item_id = ?`).run(day(-3), id);
  const res = await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: id, qty: 1 }] } });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'ONLY_EXPIRED');
});

test('a transfer moves batches with their expiry dates, and leaves the cost alone', async () => {
  const env = testEnv();
  const id = await makeItem(env, { tracksExpiry: true });
  await receive(env, id, 6, { expiry: day(90), batchNo: 'X1', unitCost: 8 });
  const t = await call(env, 'POST', '/api/transfers', { as: 'keeper', body: { fromStoreId: S.main, toStoreId: S.sub, lines: [{ itemId: id, qty: 4 }] } });
  assert.equal(t.status, 201);
  assert.match(t.body.ref, /HP-TRF-/);
  assert.equal(bal(env, S.main, id).qty, 2);
  assert.equal(bal(env, S.sub, id).qty, 4);
  const sub = env.DB.db.prepare(`SELECT batch_no, expiry, qty FROM batches WHERE item_id = ? AND store_id = ?`).get(id, S.sub);
  assert.deepEqual({ ...sub }, { batch_no: 'X1', expiry: day(90), qty: 4 });
  assert.equal(env.DB.db.prepare(`SELECT avg_cost FROM items WHERE id = ?`).get(id).avg_cost, 8);
});

test('a transfer to the same store is refused', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  await receive(env, id, 1);
  const res = await call(env, 'POST', '/api/transfers', { as: 'keeper', body: { fromStoreId: S.main, toStoreId: S.main, lines: [{ itemId: id, qty: 1 }] } });
  assert.equal(res.status, 422);
});

test('linen goes to a room, to the laundry, and comes back; the total only falls on discard', async () => {
  const env = testEnv();
  const id = await makeItem(env, { isLinen: true, name: 'Bath towel', uom: 'pcs', category: 'Linen' });
  await receive(env, id, 20, { storeId: S.sub, unitCost: 15 });
  const go = (flow, qty, extra = {}) => call(env, 'POST', '/api/linen', { as: 'staff', body: { storeId: S.sub, itemId: id, flow, qty, ...extra } });
  assert.equal((await go('ISSUE', 8, { areaId: AREA.room1 })).status, 201);
  assert.equal((await go('WASH', 6)).status, 201);
  assert.equal((await go('RETURN', 4)).status, 201);
  assert.deepEqual({ ...bal(env, S.sub, id) }, { qty: 16, in_use: 2, in_wash: 2 });
  const tooMany = await go('WASH', 3);
  assert.equal(tooMany.status, 422);
  assert.match(tooMany.body.error.message, /Only 2 Bath towel out in rooms/);
  const noReason = await go('DISCARD', 1, { from: 'in_wash' });
  assert.equal(noReason.status, 422);
  assert.equal((await go('DISCARD', 1, { from: 'in_wash', reason: 'Torn' })).status, 201);
  assert.deepEqual({ ...bal(env, S.sub, id) }, { qty: 16, in_use: 2, in_wash: 1 });
});

test('linen cannot be "used up" through the ordinary use screen', async () => {
  const env = testEnv();
  const id = await makeItem(env, { isLinen: true });
  await receive(env, id, 5, { storeId: S.sub });
  const res = await call(env, 'POST', '/api/use', { as: 'staff', body: { storeId: S.sub, ...FOR, lines: [{ itemId: id, qty: 1 }] } });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'USE_LINEN_SCREEN');
});

test('an item code must be unique in the unit, and linen cannot be switched while stock is held', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'DUP' });
  const dup = await call(env, 'POST', '/api/items', { body: { code: 'dup', name: 'Other' } });
  assert.equal(dup.status, 409);
  await receive(env, id, 1);
  const flip = await call(env, 'PUT', `/api/items/${id}`, { body: { code: 'DUP', name: 'Massage oil', isLinen: true } });
  assert.equal(flip.status, 422);
  assert.equal(flip.body.error.code, 'HAS_STOCK');
});

test('switching on expiry tracking with stock held turns the shelf into an undated batch, which can then be used', async () => {
  const env = testEnv();
  const id = await makeItem(env, { code: 'OLDOIL' });
  await receive(env, id, 5);
  await receive(env, id, 2, { storeId: S.sub });
  const on = await call(env, 'PUT', `/api/items/${id}`, { body: { code: 'OLDOIL', name: 'Massage oil', tracksExpiry: true } });
  assert.equal(on.status, 200);
  const b = env.DB.db.prepare(`SELECT store_id, expiry, qty FROM batches WHERE item_id = ? ORDER BY qty DESC`).all(id).map((r) => [r.store_id, r.expiry, r.qty]);
  assert.deepEqual(b, [[S.main, '', 5], [S.sub, '', 2]]);
  const use = await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: id, qty: 3 }] } });
  assert.equal(use.status, 201);
  assert.equal(env.DB.db.prepare(`SELECT qty FROM batches WHERE item_id = ? AND store_id = ?`).get(id, S.main).qty, 2);
  const expiry = await call(env, 'GET', '/api/reports/expiry', { as: 'manager' });
  assert.ok(expiry.body.rows.some((r) => r.code === 'OLDOIL' && r.state === 'UNKNOWN'));
});

test('another unit\'s item is answered as not found', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  const res = await call(env, 'GET', `/api/items/${id}`, { as: 'hv' });
  assert.equal(res.status, 404);
});

test('staff see quantities but not costs; managers see both', async () => {
  const env = testEnv();
  const id = await makeItem(env);
  await receive(env, id, 4, { unitCost: 12 });
  const staff = await call(env, 'GET', '/api/stock', { as: 'staff' });
  const row = staff.body.items.find((i) => i.id === id);
  assert.equal(row.total, 4);
  assert.equal(row.avgCost, undefined);
  assert.equal(row.value, undefined);
  const mgr = await call(env, 'GET', '/api/stock', { as: 'manager' });
  assert.equal(mgr.body.items.find((i) => i.id === id).value, 48);
});

test('levels give each store its own status', async () => {
  const env = testEnv();
  const id = await makeItem(env, { levels: [{ storeId: S.main, reorder: 10, critical: 4, par: 30 }, { storeId: S.sub, reorder: 3, critical: 1, par: 6 }] });
  await receive(env, id, 4);
  const res = await call(env, 'GET', '/api/stock', { as: 'keeper' });
  const row = res.body.items.find((i) => i.id === id);
  const st = Object.fromEntries(row.stores.map((s) => [s.storeId, s.status]));
  assert.equal(st[S.main], 'CRITICAL');
  assert.equal(st[S.sub], 'OUT');
  assert.equal(row.status, 'OUT');
  const bad = await call(env, 'PUT', `/api/items/${id}`, { body: { code: row.code, name: row.name, levels: [{ storeId: S.main, reorder: 5, critical: 9 }] } });
  assert.equal(bad.status, 422);
});
