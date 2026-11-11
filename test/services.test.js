import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, bal, call, HV, makeItem, PEOPLE, receive, S, testEnv } from './helpers/http.js';

/** Oil at 10 a bottle and powder at 4, in the spa store; Abhyanga uses 0.25 oil and 2 powder. */
async function spa(env) {
  const oil = await makeItem(env, { name: 'Dhanwantharam thailam', category: 'Oils' });
  const powder = await makeItem(env, { name: 'Kizhi powder', category: 'Herbs' });
  const cloth = await makeItem(env, { name: 'Kizhi cloth', category: 'Consumables' });
  await receive(env, oil, 10, { storeId: S.sub, unitCost: 10 });
  await receive(env, powder, 20, { storeId: S.sub, unitCost: 4 });
  await receive(env, cloth, 20, { storeId: S.sub, unitCost: 1 });
  const svc = await call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'abh', name: 'Abhyanga', items: [{ itemId: oil, qty: 0.25 }, { itemId: powder, qty: 2 }] } });
  assert.equal(svc.status, 201);
  return { oil, powder, cloth, svc: svc.body.id };
}
const done = (env, body, as = 'staff') => call(env, 'POST', '/api/service-records', { as, body: { storeId: S.sub, areaId: AREA.room1, ...body } });
const report = (env, as = 'manager', qs = '') => call(env, 'GET', `/api/reports/services${qs}`, { as });
const lines = (env, ref) => env.DB.db.prepare(
  `SELECT i.name, l.std_qty, l.qty, l.unit_cost FROM service_record_lines l JOIN service_records r ON r.id = l.record_id JOIN items i ON i.id = l.item_id WHERE r.ref = ? ORDER BY i.name`,
).all(ref).map((x) => ({ ...x }));

// ── Recipes ──────────────────────────────────────────────────────────────────

test('recipe: managers keep them; everybody who uses stock can see them, costs only for those who see costs', async () => {
  const env = testEnv();
  const { oil } = await spa(env);
  for (const as of ['keeper', 'staff', 'buyer']) {
    assert.equal((await call(env, 'POST', '/api/services', { as, body: { code: 'X', name: 'X', items: [{ itemId: oil, qty: 1 }] } })).status, 403, as);
  }
  const mine = await call(env, 'GET', '/api/services', { as: 'staff' });
  assert.deepEqual(mine.body.map((s) => [s.code, s.name, s.items.length, s.stdCost]), [['ABH', 'Abhyanga', 2, undefined]]);
  assert.deepEqual(mine.body[0].items.map((i) => [i.name, i.qty, i.uom]), [['Dhanwantharam thailam', 0.25, 'bottle'], ['Kizhi powder', 2, 'bottle']]);
  assert.equal((await call(env, 'GET', '/api/services', { as: 'manager' })).body[0].stdCost, 10.5);
  assert.deepEqual((await call(env, 'GET', '/api/services', { as: 'hv' })).body, []);
});

test('recipe: needs a code, a name and at least one item; no linen, no item twice, no other unit\'s item', async () => {
  const env = testEnv();
  const { oil, svc } = await spa(env);
  const towel = await makeItem(env, { name: 'Towel', isLinen: true });
  const save = (b) => call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'KIZ', name: 'Kizhi', items: [{ itemId: oil, qty: 1 }], ...b } });
  assert.equal((await save({ code: 'has space' })).body.error.code, 'BAD_CODE');
  assert.equal((await save({ name: '' })).body.error.code, 'NAME_REQUIRED');
  assert.equal((await save({ items: [] })).body.error.code, 'NO_LINES');
  assert.equal((await save({ items: [{ itemId: oil, qty: 0 }] })).body.error.code, 'BAD_QTY');
  assert.equal((await save({ items: [{ itemId: oil, qty: 1 }, { itemId: oil, qty: 2 }] })).body.error.code, 'DUPLICATE_LINE');
  assert.equal((await save({ items: [{ itemId: towel, qty: 1 }] })).body.error.code, 'LINEN');
  assert.equal((await save({ code: 'ABH' })).status, 409);
  assert.equal((await call(env, 'POST', '/api/services', { as: 'hv', body: { code: 'A', name: 'A', items: [{ itemId: oil, qty: 1 }] } })).status, 404);
  assert.equal((await call(env, 'PUT', `/api/services/${svc}`, { as: 'hv', body: { code: 'ABH', name: 'Taken', items: [{ itemId: oil, qty: 1 }] } })).status, 404);
  assert.equal((await save({})).status, 201);
});

// ── Recording ────────────────────────────────────────────────────────────────

test('record: the whole recipe leaves the store in one go, times how many were done', async () => {
  const env = testEnv();
  const { oil, powder, svc } = await spa(env);
  const r = await done(env, { serviceId: svc, times: 3 });
  assert.equal(r.status, 201);
  assert.deepEqual([r.body.ref, r.body.name, r.body.times, r.body.differs, r.body.value], ['HP-SVC-0001', 'Abhyanga', 3, false, undefined]);
  assert.equal(bal(env, S.sub, oil).qty, 9.25);
  assert.equal(bal(env, S.sub, powder).qty, 14);
  const moves = env.DB.db.prepare(`SELECT kind, qty, doc_type, doc_ref, reason, area_id, person_id, value FROM movements WHERE doc_type = 'SERVICE' ORDER BY qty`).all();
  assert.deepEqual(moves.map((m) => [m.kind, m.qty, m.doc_ref, m.reason, m.area_id, m.person_id, m.value]),
    [['ISSUE', -6, 'HP-SVC-0001', 'Abhyanga', AREA.room1, PEOPLE.staff.id, -24], ['ISSUE', -0.75, 'HP-SVC-0001', 'Abhyanga', AREA.room1, PEOPLE.staff.id, -7.5]]);
  const rec = env.DB.db.prepare(`SELECT std_value, actual_value, person_name, by_name FROM service_records`).get();
  assert.deepEqual({ ...rec }, { std_value: 31.5, actual_value: 31.5, person_name: 'Sara Therapist', by_name: 'Sara Therapist' });
  // It is ordinary use: the usage report counts it.
  const cons = await call(env, 'GET', '/api/reports/consumption', { as: 'manager' });
  assert.equal(cons.body.byCategory.reduce((t, c) => t + c.value, 0), 31.5);
});

test('record: less of one item, one left out and one added are all kept beside what the recipe said', async () => {
  const env = testEnv();
  const { oil, powder, cloth, svc } = await spa(env);
  const r = await done(env, { serviceId: svc, times: 2, lines: [{ itemId: oil, qty: 0.75 }, { itemId: cloth, qty: 2 }] });
  assert.equal(r.status, 201);
  assert.equal(r.body.differs, true);
  assert.deepEqual(lines(env, r.body.ref), [
    { name: 'Dhanwantharam thailam', std_qty: 0.5, qty: 0.75, unit_cost: 10 },
    { name: 'Kizhi cloth', std_qty: 0, qty: 2, unit_cost: 1 },
    { name: 'Kizhi powder', std_qty: 4, qty: 0, unit_cost: 4 },
  ]);
  assert.equal(bal(env, S.sub, powder).qty, 20, 'what was left out stays on the shelf');
  assert.equal(bal(env, S.sub, oil).qty, 9.25);
  assert.equal(bal(env, S.sub, cloth).qty, 18);
});

test('record: when one item is short, nothing leaves the store', async () => {
  const env = testEnv();
  const { oil, powder, svc } = await spa(env);
  const r = await done(env, { serviceId: svc, times: 11 });
  assert.equal(r.status, 422);
  assert.equal(r.body.error.code, 'NOT_ENOUGH');
  assert.match(r.body.error.message, /Kizhi powder/);
  assert.equal(bal(env, S.sub, oil).qty, 10);
  assert.equal(bal(env, S.sub, powder).qty, 20);
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM service_records`).get().n, 0);
});

test('record: the room and the person follow the unit\'s rule, and staff record only their own', async () => {
  const env = testEnv();
  const { svc } = await spa(env);
  assert.equal((await done(env, { serviceId: svc, areaId: null })).body.error.code, 'ROOM_REQUIRED');
  assert.equal((await done(env, { serviceId: svc, personId: PEOPLE.keeper.id })).body.error.code, 'NOT_YOURS');
  assert.equal((await done(env, { serviceId: svc, storeId: S.main })).body.error.code, 'STORE_NOT_YOURS');
  assert.equal((await done(env, { serviceId: svc }, 'keeper')).body.error.code, 'PERSON_REQUIRED');
  const forSara = await done(env, { serviceId: svc, personId: PEOPLE.staff.id }, 'keeper');
  assert.equal(forSara.status, 201);
  assert.deepEqual({ ...env.DB.db.prepare(`SELECT person_name, by_name FROM service_records`).get() }, { person_name: 'Sara Therapist', by_name: 'Kiran Keeper' });
  assert.equal((await done(env, { serviceId: svc }, 'viewer')).status, 403);
});

test('record: how many must be a whole number, something must be used, and another unit\'s service is not found', async () => {
  const env = testEnv();
  const { oil, powder, svc } = await spa(env);
  for (const times of [0, 1.5, 51, 'two']) assert.equal((await done(env, { serviceId: svc, times })).body.error.code, 'BAD_TIMES', String(times));
  assert.equal((await done(env, { serviceId: svc, lines: [{ itemId: oil, qty: 0 }, { itemId: powder, qty: 0 }] })).body.error.code, 'NOTHING_USED');
  assert.equal((await done(env, { serviceId: svc, lines: [{ itemId: oil, qty: -1 }] })).body.error.code, 'BAD_QTY');
  assert.equal((await call(env, 'POST', '/api/service-records', { as: 'hv', unit: HV, body: { serviceId: svc, storeId: S.hvMain } })).status, 404);
  assert.equal((await done(env, { serviceId: 'nope' })).status, 404);
});

test('record: a retired service cannot be recorded, and changing a recipe does not rewrite the past', async () => {
  const env = testEnv();
  const { oil, powder, svc } = await spa(env);
  const first = await done(env, { serviceId: svc });
  await call(env, 'PUT', `/api/services/${svc}`, { as: 'manager', body: { code: 'ABH', name: 'Abhyanga (full body)', items: [{ itemId: oil, qty: 0.5 }] } });
  const second = await done(env, { serviceId: svc });
  assert.deepEqual(lines(env, first.body.ref).map((l) => [l.name, l.std_qty]), [['Dhanwantharam thailam', 0.25], ['Kizhi powder', 2]]);
  assert.deepEqual(lines(env, second.body.ref).map((l) => [l.name, l.std_qty]), [['Dhanwantharam thailam', 0.5]]);
  assert.equal(bal(env, S.sub, powder).qty, 18);
  await call(env, 'PUT', `/api/services/${svc}`, { as: 'manager', body: { code: 'ABH', name: 'Abhyanga', items: [{ itemId: oil, qty: 0.5 }], active: false } });
  assert.equal((await done(env, { serviceId: svc })).body.error.code, 'SERVICE_INACTIVE');
  assert.deepEqual((await call(env, 'GET', '/api/services', { as: 'staff' })).body, []);
  assert.equal((await call(env, 'GET', '/api/services?all=1', { as: 'manager' })).body.length, 1);
});

test('record: an item with expiry dates is taken first-expiry-first, and never from expired stock', async () => {
  const env = testEnv();
  const oil = await makeItem(env, { name: 'Dated oil', tracksExpiry: true });
  await receive(env, oil, 1, { storeId: S.sub, expiry: '2099-06-01', batchNo: 'LATE' });
  await receive(env, oil, 1, { storeId: S.sub, expiry: '2099-01-01', batchNo: 'SOON' });
  const svc = (await call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'T', name: 'Test', items: [{ itemId: oil, qty: 1.5 }] } })).body.id;
  assert.equal((await done(env, { serviceId: svc })).status, 201);
  assert.deepEqual(env.DB.db.prepare(`SELECT batch_no, qty FROM batches ORDER BY batch_no`).all().map((b) => [b.batch_no, b.qty]), [['LATE', 0.5], ['SOON', 0]]);
  env.DB.db.prepare(`UPDATE batches SET expiry = '2020-01-01'`).run();
  assert.equal((await done(env, { serviceId: svc, lines: [{ itemId: oil, qty: 0.5 }] })).body.error.code, 'ONLY_EXPIRED');
});

test('recent: a person sees their own, a manager the unit\'s', async () => {
  const env = testEnv();
  const { oil, svc } = await spa(env);
  await done(env, { serviceId: svc });
  await done(env, { serviceId: svc, personId: PEOPLE.keeper.id, lines: [{ itemId: oil, qty: 1 }] }, 'keeper');
  const mine = (await call(env, 'GET', '/api/service-records', { as: 'staff' })).body;
  assert.deepEqual(mine.map((r) => [r.ref, r.differences]), [['HP-SVC-0001', 0]]);
  const all = (await call(env, 'GET', '/api/service-records', { as: 'manager' })).body;
  assert.deepEqual(all.map((r) => [r.ref, r.differences]), [['HP-SVC-0002', 2], ['HP-SVC-0001', 0]]);
});

// ── Actual against standard ──────────────────────────────────────────────────

async function busyWeek(env) {
  const x = await spa(env);
  const kiz = (await call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'KIZ', name: 'Kizhi', items: [{ itemId: x.powder, qty: 1 }, { itemId: x.cloth, qty: 1 }] } })).body.id;
  await done(env, { serviceId: x.svc, times: 2 });                                                             // Sara, room 1, as the recipe: 21
  await done(env, { serviceId: x.svc, lines: [{ itemId: x.oil, qty: 0.5 }, { itemId: x.powder, qty: 2 }] });   // Sara, room 1, oil over: 13 against 10.5
  await done(env, { serviceId: kiz, areaId: AREA.room2, personId: PEOPLE.keeper.id, lines: [{ itemId: x.powder, qty: 1 }] }, 'keeper'); // Kiran, room 2, no cloth: 4 against 5
  return { ...x, kiz };
}

test('report: actual against standard by service, by item and by room', async () => {
  const env = testEnv();
  await busyWeek(env);
  const r = (await report(env)).body;
  assert.deepEqual(r.byService.map((s) => [s.name, s.times, s.std_value, s.value]), [['Abhyanga', 3, 31.5, 34], ['Kizhi', 1, 5, 4]]);
  assert.deepEqual(r.byItem.map((i) => [i.service, i.name, i.std_qty, i.qty]), [
    ['Abhyanga', 'Dhanwantharam thailam', 0.75, 1], ['Abhyanga', 'Kizhi powder', 6, 6],
    ['Kizhi', 'Kizhi cloth', 1, 0], ['Kizhi', 'Kizhi powder', 1, 1],
  ]);
  assert.deepEqual(r.byArea.map((a) => [a.name, a.times, a.std_value, a.value]), [['Treatment room 1', 3, 31.5, 34], ['Treatment room 2', 1, 5, 4]]);
});

test('report: by person is for managers, in name order; other roles get the rest without it', async () => {
  const env = testEnv();
  await busyWeek(env);
  const mgr = (await report(env)).body;
  assert.deepEqual(mgr.byPerson.map((p) => [p.name, p.times, p.std_value, p.value]), [['Kiran Keeper', 1, 5, 4], ['Sara Therapist', 3, 31.5, 34]]);
  for (const as of ['viewer', 'buyer', 'keeper']) assert.equal((await report(env, as)).body.byPerson, undefined, as);
  assert.equal((await report(env, 'staff')).status, 403);
});

test('report: without cost.view there are quantities and counts, no money', async () => {
  const env = testEnv();
  await busyWeek(env);
  const r = (await report(env, 'keeper')).body;
  assert.deepEqual(r.byService.map((s) => [s.name, s.times, s.value, s.std_value]), [['Abhyanga', 3, undefined, undefined], ['Kizhi', 1, undefined, undefined]]);
  assert.deepEqual(Object.keys(r.byItem[0]).sort(), ['code', 'name', 'qty', 'service', 'service_id', 'std_qty', 'uom']);
});

test('report: one service, a date range, and another unit', async () => {
  const env = testEnv();
  const { kiz } = await busyWeek(env);
  const one = (await report(env, 'manager', `?service=${kiz}`)).body;
  assert.deepEqual(one.byService.map((s) => s.name), ['Kizhi']);
  assert.deepEqual(one.byArea.map((a) => a.name), ['Treatment room 2']);
  assert.deepEqual((await report(env, 'manager', '?from=2020-01-01&to=2020-01-31')).body.byService, []);
  assert.deepEqual((await call(env, 'GET', '/api/reports/services', { as: 'hv' })).body.byService, []);
});

test('the unit chooses its word, and the activity log has the recipe and each service', async () => {
  const env = testEnv();
  const { svc } = await spa(env);
  await done(env, { serviceId: svc });
  assert.equal((await call(env, 'GET', '/api/me', { as: 'staff' })).body.settings['services.word'], 'Services');
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'services.word': 'Treatments' } })).status, 200);
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'services.word': 'Rituals' } })).status, 422);
  const log = (await call(env, 'GET', '/api/audit', { as: 'admin' })).body;
  assert.match(log.find((x) => x.action === 'SERVICE_CREATE').detail, /Abhyanga: 0\.25 bottle Dhanwantharam thailam, 2 bottle Kizhi powder/);
  assert.equal(log.find((x) => x.action === 'SERVICE_RECORD').detail, '1 × Abhyanga from Spa sub store in Treatment room 1 by Sara Therapist');
});
