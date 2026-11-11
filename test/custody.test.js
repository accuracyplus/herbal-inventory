import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, bal, call, makeItem, PEOPLE, receive, S, testEnv } from './helpers/http.js';

async function stocked(env, fields = {}, qty = 10, extra = {}) {
  const id = await makeItem(env, fields);
  await receive(env, id, qty, { storeId: S.sub, unitCost: 4, ...extra });
  return id;
}

const take = (env, as, itemId, qty, fields = {}) => call(env, 'POST', '/api/custody/take', { as, body: { storeId: S.sub, areaId: AREA.room1, ...fields, lines: [{ itemId, qty }] } });
const mine = async (env, as) => (await call(env, 'GET', '/api/custody/mine', { as })).body;
const settle = (env, as, action, custodyId, qty, fields = {}) => call(env, 'POST', `/api/custody/${action}`, { as, body: { lines: [{ custodyId, qty }], ...fields } });
const age = (env, hours) => env.DB.db.prepare(`UPDATE custody SET taken_at = ?`).run(new Date(Date.now() - hours * 36e5).toISOString());
const issues = (env) => env.DB.db.prepare(`SELECT * FROM movements WHERE kind = 'ISSUE' ORDER BY rowid`).all();
const held = (env, id) => env.DB.db.prepare(`SELECT COALESCE(SUM(qty), 0) AS n FROM custody WHERE item_id = ?`).get(id).n;

test('take: stock leaves the shelf, is with the person, and is not yet consumption', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const res = await take(env, 'staff', oil, 3);
  assert.equal(res.status, 201);
  assert.equal(bal(env, S.sub, oil).qty, 7);
  const list = await mine(env, 'staff');
  assert.equal(list.rows.length, 1);
  assert.equal(list.rows[0].qty, 3);
  assert.equal(list.rows[0].area_name, 'Treatment room 1');
  assert.equal(list.rows[0].unaccounted, false);
  assert.equal(issues(env).length, 0);
  const cons = await call(env, 'GET', '/api/reports/consumption', { as: 'manager' });
  assert.equal(cons.body.byItem.length, 0);
});

test('take: more than the shelf holds is refused, with how many there are', async () => {
  const env = testEnv();
  const oil = await stocked(env, {}, 2);
  const res = await take(env, 'staff', oil, 3);
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, 'NOT_ENOUGH');
  assert.equal(held(env, oil), 0);
  assert.equal(bal(env, S.sub, oil).qty, 2);
});

test('take: staff take for themselves; store roles can hand to somebody and must say who', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const other = await take(env, 'staff', oil, 1, { personId: PEOPLE.keeper.id });
  assert.equal(other.status, 403);
  const missing = await call(env, 'POST', '/api/custody/take', { as: 'keeper', body: { storeId: S.sub, lines: [{ itemId: oil, qty: 1 }] } });
  assert.equal(missing.body.error.code, 'PERSON_REQUIRED');
  const given = await take(env, 'keeper', oil, 2, { personId: PEOPLE.staff.id });
  assert.equal(given.status, 201);
  assert.equal((await mine(env, 'staff')).rows[0].taken_by_name, 'Kiran Keeper');
  assert.equal((await mine(env, 'keeper')).rows.length, 0);
});

test('take: a viewer cannot, linen is refused, and the room is optional', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  assert.equal((await take(env, 'viewer', oil, 1)).status, 403);
  const towel = await makeItem(env, { name: 'Towel', isLinen: true });
  await receive(env, towel, 5, { storeId: S.sub });
  assert.equal((await take(env, 'staff', towel, 1)).body.error.code, 'USE_LINEN_SCREEN');
  assert.equal((await take(env, 'staff', oil, 1, { areaId: null })).status, 201);
});

test('use: held stock becomes consumption for the holder, at the cost when taken, and the shelf is not touched twice', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 5);
  // A dearer delivery after the take moves the average, not what this stock cost.
  await receive(env, oil, 10, { storeId: S.sub, unitCost: 100 });
  const before = bal(env, S.sub, oil).qty;
  const lot = (await mine(env, 'staff')).rows[0];
  const res = await settle(env, 'staff', 'use', lot.id, 2, { purpose: 'Abhyanga' });
  assert.equal(res.status, 200);
  assert.equal(bal(env, S.sub, oil).qty, before);
  assert.equal(held(env, oil), 3);
  const m = issues(env)[0];
  assert.equal(m.qty, -2);
  assert.equal(m.value, -8);
  assert.equal(m.person_id, PEOPLE.staff.id);
  assert.equal(m.area_id, AREA.room1);
  assert.equal(m.from_state, 'custody');
  const cons = await call(env, 'GET', '/api/reports/consumption', { as: 'manager' });
  assert.equal(cons.body.byItem[0].qty, 2);
  assert.equal(cons.body.byItem[0].value, 8);
});

test('use: it follows the unit setting for the room', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2, { areaId: null });
  const lot = (await mine(env, 'staff')).rows[0];
  assert.equal((await settle(env, 'staff', 'use', lot.id, 1)).body.error.code, 'ROOM_REQUIRED');
  assert.equal((await settle(env, 'staff', 'use', lot.id, 1, { areaId: AREA.room2 })).status, 200);
  assert.equal(issues(env)[0].area_id, AREA.room2);
  await call(env, 'PUT', '/api/settings', { body: { 'consumption.record': 'person' } });
  assert.equal((await settle(env, 'staff', 'use', lot.id, 1)).status, 200);
});

test('return: back on the shelf it came from, and nothing is consumption', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 4);
  const lot = (await mine(env, 'staff')).rows[0];
  assert.equal((await settle(env, 'staff', 'return', lot.id, 4)).status, 200);
  assert.equal(bal(env, S.sub, oil).qty, 10);
  assert.equal(held(env, oil), 0);
  assert.equal(issues(env).length, 0);
  assert.equal((await mine(env, 'staff')).rows.length, 0);
});

test('return and use: more than is held, or the same piece twice, is refused', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  const lot = (await mine(env, 'staff')).rows[0];
  const over = await settle(env, 'staff', 'use', lot.id, 3);
  assert.equal(over.status, 422);
  assert.equal(over.body.error.code, 'OVER_HELD');
  assert.equal((await settle(env, 'staff', 'return', lot.id, 0)).body.error.code, 'BAD_QTY');
  const twice = await call(env, 'POST', '/api/custody/use', { as: 'staff', body: { lines: [{ custodyId: lot.id, qty: 1 }, { custodyId: lot.id, qty: 1 }] } });
  assert.equal(twice.body.error.code, 'BAD_LINE');
  await settle(env, 'staff', 'return', lot.id, 2);
  assert.equal((await settle(env, 'staff', 'return', lot.id, 1)).body.error.code, 'OVER_HELD');
  assert.equal(bal(env, S.sub, oil).qty, 10);
});

test('expiry: taking follows first-expiry-first, return goes back to that batch, expired held stock cannot be used', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { tracksExpiry: true });
  await receive(env, oil, 2, { storeId: S.sub, expiry: '2099-06-01', batchNo: 'LATE' });
  await receive(env, oil, 2, { storeId: S.sub, expiry: '2099-01-01', batchNo: 'SOON' });
  await take(env, 'staff', oil, 3);
  const rows = (await mine(env, 'staff')).rows;
  assert.deepEqual(rows.map((r) => [r.batch_no, r.qty]).sort(), [['LATE', 1], ['SOON', 2]]);
  const soon = rows.find((r) => r.batch_no === 'SOON');
  await settle(env, 'staff', 'return', soon.id, 2);
  const b = env.DB.db.prepare(`SELECT qty FROM batches WHERE batch_no = 'SOON'`).get();
  assert.equal(b.qty, 2);

  const late = rows.find((r) => r.batch_no === 'LATE');
  env.DB.db.prepare(`UPDATE batches SET expiry = '2020-01-01' WHERE batch_no = 'LATE'`).run();
  const used = await settle(env, 'staff', 'use', late.id, 1);
  assert.equal(used.body.error.code, 'ONLY_EXPIRED');
  assert.equal((await settle(env, 'staff', 'return', late.id, 1)).status, 200);
});

test('privacy: somebody else\'s stock is not found, and the team view is for managers only', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  const lot = (await mine(env, 'staff')).rows[0];
  assert.equal((await settle(env, 'keeper', 'use', lot.id, 1)).status, 404);
  assert.equal((await settle(env, 'hv', 'use', lot.id, 1)).status, 404);
  for (const as of ['staff', 'keeper', 'buyer', 'viewer']) {
    assert.equal((await call(env, 'GET', '/api/custody/team', { as })).status, 403, as);
  }
  assert.equal((await call(env, 'GET', '/api/custody/team', { as: 'manager' })).status, 200);
  assert.equal((await call(env, 'GET', '/api/custody/team', { as: 'admin' })).status, 200);
  assert.deepEqual((await mine(env, 'keeper')).rows, []);
});

test('privacy: another unit\'s manager sees nothing of this unit', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  age(env, 48);
  assert.deepEqual((await call(env, 'GET', '/api/custody/team', { as: 'hv' })).body.people, []);
});

test('settling for somebody else: a manager can, and must say why', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  const lot = (await mine(env, 'staff')).rows[0];
  const bare = await settle(env, 'manager', 'return', lot.id, 1);
  assert.equal(bare.body.error.code, 'NOTE_REQUIRED');
  assert.equal((await settle(env, 'manager', 'return', lot.id, 1, { note: 'Sara has left' })).status, 200);
  const used = await settle(env, 'manager', 'use', lot.id, 1, { note: 'Used before leaving' });
  assert.equal(used.status, 200);
  const m = issues(env)[0];
  assert.equal(m.person_id, PEOPLE.staff.id);
  assert.equal(m.actor_id, PEOPLE.manager.id);
  assert.equal(m.note, 'Used before leaving');
});

test('unaccounted: past the unit\'s hours it is flagged, to the holder and to the manager', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  let t = await call(env, 'GET', '/api/today', { as: 'staff' });
  assert.ok(!t.body.waiting.some((w) => w.key === 'custody-mine'));

  age(env, 25);
  assert.equal((await mine(env, 'staff')).rows[0].unaccounted, true);
  assert.equal((await mine(env, 'staff')).rows[0].ageHours, 25);
  t = await call(env, 'GET', '/api/today', { as: 'staff' });
  assert.equal(t.body.waiting.find((w) => w.key === 'custody-mine').n, 1);
  t = await call(env, 'GET', '/api/today', { as: 'manager' });
  assert.deepEqual(t.body.waiting.find((w) => w.key === 'custody-team').text, '1 item unaccounted for, with 1 person');
  assert.ok(!(await call(env, 'GET', '/api/today', { as: 'keeper' })).body.waiting.some((w) => w.key === 'custody-team'));

  await call(env, 'PUT', '/api/settings', { body: { 'custody.account_hours': '48' } });
  assert.equal((await mine(env, 'staff')).rows[0].unaccounted, false);
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'custody.account_hours': '0' } })).status, 422);
});

test('team view: per person in name order, oldest first, never ranked', async () => {
  const env = testEnv();
  const a = await stocked(env, { name: 'Oil A' });
  // Sara holds far more than Kiran, and Kiran's name still comes first.
  await take(env, 'staff', a, 6);
  await take(env, 'keeper', a, 1, { personId: PEOPLE.keeper.id });
  age(env, 30);
  const list = await call(env, 'GET', '/api/custody/team', { as: 'manager' });
  assert.deepEqual(list.body.people.map((p) => p.name), ['Kiran Keeper', 'Sara Therapist']);
  assert.equal(list.body.people[1].rows[0].ageHours, 30);
  assert.equal(list.body.people[1].rows[0].item_name, 'Oil A');
  assert.ok(!('unit_cost' in list.body.people[1].rows[0]), 'no cost on this view');
});

test('stock still belongs to the unit: it stays in value, average cost and the total', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 5);
  const val = await call(env, 'GET', '/api/reports/valuation', { as: 'manager' });
  assert.equal(val.body.rows[0].with_people, 5);
  assert.equal(val.body.total, 40);
  // 10 at 4 held (5 of them with Sara) + 10 at 7 = an average of 5.5, not one that forgets her 5.
  await receive(env, oil, 10, { storeId: S.sub, unitCost: 7 });
  assert.equal(env.DB.db.prepare(`SELECT avg_cost FROM items WHERE id = ?`).get(oil).avg_cost, 5.5);
  const list = await call(env, 'GET', '/api/stock', { as: 'manager' });
  const row = list.body.items.find((i) => i.id === oil);
  assert.equal(row.total, 20);
  assert.equal(row.stores.find((s) => s.storeId === S.sub).qty, 15);
  assert.equal(row.stores.find((s) => s.storeId === S.sub).withPeople, 5);
});

test('a store with stock out with people cannot close, until it is back', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 10);
  const save = (active) => call(env, 'PUT', `/api/stores/${S.sub}`, { body: { code: 'SUB', name: 'Spa sub store', kind: 'SUB', active } });
  const closing = await save(false);
  assert.equal(closing.status, 422);
  assert.equal(closing.body.error.code, 'HAS_HELD_STOCK');
  const lot = (await mine(env, 'staff')).rows[0];
  await settle(env, 'staff', 'use', lot.id, 10);
  assert.equal((await save(false)).status, 200);
});

test('a retired item already taken can still be accounted for', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  env.DB.db.prepare(`UPDATE items SET active = 0 WHERE id = ?`).run(oil);
  const lot = (await mine(env, 'staff')).rows[0];
  assert.equal((await settle(env, 'staff', 'return', lot.id, 2)).status, 200);
});

test('every step is on the ledger and the activity log', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await take(env, 'staff', oil, 2);
  const lot = (await mine(env, 'staff')).rows[0];
  await settle(env, 'staff', 'use', lot.id, 1);
  await settle(env, 'staff', 'return', lot.id, 1);
  const kinds = env.DB.db.prepare(`SELECT kind FROM movements WHERE item_id = ? AND kind IN ('TAKE','ISSUE','RETURN') ORDER BY rowid`).all(oil).map((m) => m.kind);
  assert.deepEqual(kinds, ['TAKE', 'ISSUE', 'RETURN']);
  const log = await call(env, 'GET', '/api/audit', { as: 'admin' });
  for (const a of ['CUSTODY_TAKE', 'CUSTODY_USE', 'CUSTODY_RETURN']) assert.ok(log.body.some((r) => r.action === a), a);
});
