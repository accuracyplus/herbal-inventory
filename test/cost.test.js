import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, call, HP, HV, makeItem, PEOPLE, receive, S, testEnv } from './helpers/http.js';

const department = async (env, code, name) => (await call(env, 'POST', '/api/departments', { body: { code, name } })).body.id;
const room = (env, id, code, departmentId) => call(env, 'PUT', `/api/areas/${id}`, { body: { code, name: `Room ${code}`, departmentId } });

/** Sara uses 2 at 10 in room 1 (Spa); Kiran uses 1 at 10 in room 2 (Front office), plus Bilal 4. */
async function scene(env) {
  const oil = await makeItem(env, { name: 'Oil', category: 'Oils' });
  const herb = await makeItem(env, { name: 'Herb', category: 'Herbs' });
  await receive(env, oil, 20, { unitCost: 10 });
  await receive(env, herb, 20, { unitCost: 5 });
  await room(env, AREA.room1, 'R1', await department(env, 'SPA', 'Spa'));
  await room(env, AREA.room2, 'R2', await department(env, 'AFO', 'A front office'));
  const use = (itemId, qty, areaId, personId) => call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, areaId, personId, lines: [{ itemId, qty }] } });
  await use(oil, 2, AREA.room1, PEOPLE.staff.id);
  await use(herb, 2, AREA.room2, PEOPLE.keeper.id);
  await use(oil, 4, AREA.room2, PEOPLE.buyer.id);
  return { oil, herb };
}

const report = (env, name, as = 'manager', qs = '') => call(env, 'GET', `/api/reports/${name}${qs}`, { as });

test('cost: by room, department and category, for the period', async () => {
  const env = testEnv();
  await scene(env);
  const r = (await report(env, 'consumption')).body;
  assert.deepEqual(r.byCategory.map((c) => [c.name, c.value]), [['Oils', 60], ['Herbs', 10]]);
  assert.deepEqual(r.byArea.map((a) => [a.name, a.value]), [['Room R2', 50], ['Room R1', 20]]);
  assert.deepEqual(r.byDepartment.map((d) => [d.name, d.value]), [['A front office', 50], ['Spa', 20]]);
});

test('cost: departments are in name order, whichever cost more', async () => {
  const env = testEnv();
  await scene(env);
  const oil = env.DB.db.prepare(`SELECT id FROM items WHERE name = 'Oil'`).get().id;
  await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, areaId: AREA.room1, personId: PEOPLE.staff.id, lines: [{ itemId: oil, qty: 10 }] } });
  const r = (await report(env, 'consumption')).body;
  assert.deepEqual(r.byDepartment.map((d) => d.name), ['A front office', 'Spa']);
  assert.equal(r.byDepartment[1].value, 120);
});

test('cost: a date range leaves out what falls outside it', async () => {
  const env = testEnv();
  await scene(env);
  const r = (await report(env, 'consumption', 'manager', '?from=2020-01-01&to=2020-01-31')).body;
  assert.deepEqual(r.byDepartment, []);
  assert.deepEqual((await report(env, 'people', 'manager', '?from=2020-01-01&to=2020-01-31')).body.rows, []);
  assert.equal((await report(env, 'people', 'manager', '?from=2026-02-01&to=2026-01-01')).status, 422);
});

test('cost: without cost.view the report shows no money', async () => {
  const env = testEnv();
  await scene(env);
  const r = (await report(env, 'consumption', 'keeper')).body;
  assert.ok(!('value' in r.byDepartment[0]));
  assert.ok(!('value' in r.byCategory[0]));
  assert.equal(r.byDepartment[0].times, 2);
});

test('per person: managers and administrators see it in name order, whoever cost most', async () => {
  const env = testEnv();
  await scene(env);
  const r = await report(env, 'people');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.rows.map((p) => [p.name, p.value]), [['Bilal Buyer', 40], ['Kiran Keeper', 10], ['Sara Therapist', 20]]);
  assert.equal(r.body.rows[2].code, 'HPS001');
  assert.equal((await report(env, 'people', 'admin')).status, 200);
});

test('per person: nobody else sees it, even those who see costs', async () => {
  const env = testEnv();
  await scene(env);
  for (const as of ['staff', 'keeper', 'buyer', 'viewer']) assert.equal((await report(env, 'people', as)).status, 403, as);
});

test('per person: stock held and later used counts for the holder, only once used', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await receive(env, oil, 10, { storeId: S.sub, unitCost: 3 });
  await call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, areaId: AREA.room1, lines: [{ itemId: oil, qty: 4 }] } });
  assert.deepEqual((await report(env, 'people')).body.rows, []);
  const [lot] = (await call(env, 'GET', '/api/custody/mine', { as: 'staff' })).body.rows;
  await call(env, 'POST', '/api/custody/use', { as: 'staff', body: { lines: [{ custodyId: lot.id, qty: 3 }] } });
  assert.deepEqual((await report(env, 'people')).body.rows.map((p) => [p.name, p.value]), [['Sara Therapist', 9]]);
});

test('per person: another unit\'s use is not included', async () => {
  const env = testEnv();
  await scene(env);
  const hv = await call(env, 'GET', '/api/reports/people', { as: 'hv', unit: HV });
  assert.deepEqual(hv.body.rows, []);
});

test('my use: a person sees their own cost, by category, and quantities by item', async () => {
  const env = testEnv();
  await scene(env);
  const r = await call(env, 'GET', '/api/my-use', { as: 'staff' });
  assert.equal(r.status, 200);
  assert.equal(r.body.total, 20);
  assert.deepEqual(r.body.byCategory, [{ name: 'Oils', value: 20 }]);
  assert.deepEqual(r.body.byItem.map((i) => [i.name, i.qty]), [['Oil', 2]]);
  assert.ok(!('value' in r.body.byItem[0]));
  assert.ok(!JSON.stringify(r.body).includes('Bilal'));
  assert.equal((await call(env, 'GET', '/api/my-use', { as: 'viewer' })).body.total, 0);
});

test('ledger: somebody who sees costs but does not manage people gets no name beside a use', async () => {
  const env = testEnv();
  const { oil } = await scene(env);
  const line = async (as) => (await report(env, 'ledger', as)).body.rows.find((m) => m.kind === 'ISSUE');
  for (const as of ['viewer', 'buyer']) {
    const m = await line(as);
    assert.notEqual(m.value, undefined, as);
    assert.equal(m.actor_name, null, as);
  }
  const mgr = await line('manager');
  assert.equal(mgr.actor_name, 'Kiran Keeper');
  const kpr = await line('keeper');
  assert.equal(kpr.actor_name, 'Kiran Keeper');
  assert.equal(kpr.value, undefined);
  const received = (await report(env, 'ledger', 'viewer')).body.rows.find((m) => m.kind === 'RECEIPT');
  assert.equal(received.actor_name, 'Kiran Keeper');

  const detail = (await call(env, 'GET', `/api/items/${oil}`, { as: 'viewer' })).body.movements.find((m) => m.kind === 'ISSUE');
  assert.equal(detail.actor_name, null);
  assert.equal((await call(env, 'GET', `/api/items/${oil}`, { as: 'manager' })).body.movements.find((m) => m.kind === 'ISSUE').actor_name, 'Kiran Keeper');
});

// ── The monthly summary ──────────────────────────────────────────────────────

const monthly = (env, as, qs = '') => call(env, 'GET', `/api/group/monthly${qs}`, { as });

test('group summary: a row per unit in name order, with counts and totals and no names', async () => {
  const env = testEnv();
  await scene(env);
  const r = await monthly(env, 'admin');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.rows.map((u) => u.unit), ['Herbal Park', 'Herbal Valley']);
  const hp = r.body.rows[0];
  assert.equal(hp.lines, 3);
  assert.equal(hp.used, 70);
  assert.equal(hp.deliveries, 2);
  assert.equal(hp.received, 300);
  assert.equal(hp.stockValueNow, 230);
  assert.equal(r.body.rows[1].used, 0);
  assert.equal(r.body.totals.used, 70);
  const text = JSON.stringify(r.body);
  for (const p of Object.values(PEOPLE)) assert.ok(!text.includes(p.name), p.name);
});

test('group summary: stock with people counts in value, and unaccounted is a count', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await receive(env, oil, 10, { storeId: S.sub, unitCost: 2 });
  await call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, lines: [{ itemId: oil, qty: 4 }] } });
  env.DB.db.prepare(`UPDATE custody SET taken_at = ?`).run(new Date(Date.now() - 40 * 36e5).toISOString());
  const hp = (await monthly(env, 'admin')).body.rows[0];
  assert.equal(hp.stockValueNow, 20);
  assert.equal(hp.unaccountedNow, 1);
});

test('group summary: an earlier month is empty, and a bad month is refused', async () => {
  const env = testEnv();
  await scene(env);
  const old = await monthly(env, 'admin', '?month=2020-12');
  assert.equal(old.body.month, '2020-12');
  assert.equal(old.body.rows[0].used, 0);
  assert.equal((await monthly(env, 'admin', '?month=2020-13')).status, 422);
});

test('group summary: a unit manager or administrator of one unit cannot read it', async () => {
  const env = testEnv();
  for (const as of ['manager', 'keeper', 'staff', 'viewer', 'hv']) assert.equal((await monthly(env, as)).status, 403, as);
});

test('group summary: a group administrator can give it to a director, and it opens nothing else', async () => {
  const env = testEnv();
  await scene(env);
  const code = PEOPLE.viewer.code;
  const give = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code, roles: ['VIEWER'], groupSummary: true } });
  assert.equal(give.status, 200);
  assert.equal((await monthly(env, 'viewer')).status, 200);
  const me = await call(env, 'GET', '/api/me', { as: 'viewer' });
  assert.equal(me.body.groupSummary, true);
  assert.equal(me.body.groupAdmin, false);
  assert.deepEqual(me.body.units.map((u) => u.id), [HP]);
  assert.equal((await report(env, 'people', 'viewer')).status, 403);
  assert.equal((await call(env, 'GET', '/api/reports/consumption', { as: 'viewer', unit: HV })).status, 403);

  await call(env, 'PUT', '/api/people', { as: 'admin', body: { code, roles: ['VIEWER'], groupSummary: false } });
  assert.equal((await monthly(env, 'viewer')).status, 403);
});

test('group summary: only a group administrator can give it', async () => {
  const env = testEnv();
  env.DB.db.prepare(`UPDATE staff_units SET roles = '["UNIT_ADMIN"]' WHERE staff_id = ?`).run(PEOPLE.manager.id);
  const res = await call(env, 'PUT', '/api/people', { as: 'manager', body: { code: PEOPLE.viewer.code, roles: ['VIEWER'], groupSummary: true } });
  assert.equal(res.status, 403);
  assert.equal((await monthly(env, 'viewer')).status, 403);
  assert.equal(env.DB.db.prepare(`SELECT group_summary FROM staff WHERE id = ?`).get(PEOPLE.viewer.id).group_summary, 0);
});
