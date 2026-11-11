import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whenDone } from '../src/domain/servicelink.js';
import worker from '../src/worker.js';
import { AREA, bal, call, HV, makeItem, PEOPLE, receive, S, testEnv } from './helpers/http.js';

/** Oil at 10 and powder at 4 in the spa store; Abhyanga (ABH) uses 0.25 oil and 2 powder: 10.50 each. */
async function spa(env) {
  const oil = await makeItem(env, { name: 'Dhanwantharam thailam' });
  const powder = await makeItem(env, { name: 'Kizhi powder' });
  await receive(env, oil, 10, { storeId: S.sub, unitCost: 10 });
  await receive(env, powder, 20, { storeId: S.sub, unitCost: 4 });
  const svc = (await call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'ABH', name: 'Abhyanga', items: [{ itemId: oil, qty: 0.25 }, { itemId: powder, qty: 2 }] } })).body.id;
  const key = await call(env, 'POST', '/api/link/keys', { as: 'admin', body: { name: 'Front desk billing', storeId: S.sub } });
  assert.equal(key.status, 201);
  return { oil, powder, svc, key: key.body.key, keyId: key.body.id };
}

/** A call from the other system: no sign-in, only the key. */
async function hook(env, key, payload) {
  const res = await worker.fetch(new Request('https://worker.test/hooks/services', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify(payload),
  }), env, { waitUntil: () => {} });
  return { status: res.status, body: await res.json() };
}
const row = (ref, extra = {}) => ({ ref, service: 'ABH', room: 'R1', person: 'HPS001', ...extra });
const inbox = async (env, status = 'FAILED') => (await call(env, 'GET', `/api/link/inbox?status=${status}`, { as: 'manager' })).body;
const records = (env) => env.DB.db.prepare(`SELECT * FROM service_records ORDER BY rowid`).all();

// ── Keys ─────────────────────────────────────────────────────────────────────

test('key: made by an administrator, shown once, and only its fingerprint is kept', async () => {
  const env = testEnv();
  const { key } = await spa(env);
  assert.match(key, /^hfinv_[0-9a-f]{48}$/);
  const stored = env.DB.db.prepare(`SELECT * FROM integration_keys`).get();
  assert.ok(!JSON.stringify(stored).includes(key), 'the key itself is nowhere in the database');
  assert.match(stored.key_hash, /^[0-9a-f]{64}$/);
  const list = await call(env, 'GET', '/api/link/keys', { as: 'admin' });
  assert.deepEqual(list.body.map((k) => [k.name, k.hint, k.store_name, k.revoked_at]), [['Front desk billing', key.slice(0, 12), 'Spa sub store', null]]);
  assert.ok(!JSON.stringify(list.body).includes(key));
  assert.ok(!(await call(env, 'GET', '/api/audit', { as: 'admin' })).body.some((x) => JSON.stringify(x).includes(key)));
  for (const as of ['manager', 'keeper', 'staff']) assert.equal((await call(env, 'POST', '/api/link/keys', { as, body: { name: 'X', storeId: S.sub } })).status, 403, as);
  assert.equal((await call(env, 'POST', '/api/link/keys', { as: 'admin', body: { name: 'front desk billing', storeId: S.sub } })).status, 409);
});

test('key: without one, with a wrong one, or with a revoked one, nothing is taken in', async () => {
  const env = testEnv();
  const { key, keyId } = await spa(env);
  assert.equal((await hook(env, null, { services: [row('A1')] })).status, 401);
  assert.equal((await hook(env, 'hfinv_' + '0'.repeat(48), { services: [row('A1')] })).status, 401);
  assert.equal((await hook(env, key.toUpperCase(), { services: [row('A1')] })).status, 401);
  // A signed-in person's token is not a key.
  const asPerson = await call(env, 'POST', '/hooks/services', { as: 'admin', body: { services: [row('A1')] } });
  assert.equal(asPerson.status, 401);
  assert.equal((await call(env, 'POST', `/api/link/keys/${keyId}/revoke`, { as: 'admin' })).status, 200);
  assert.equal((await hook(env, key, { services: [row('A1')] })).status, 401);
  assert.equal(records(env).length, 0);
});

// ── Taking services in ───────────────────────────────────────────────────────

test('hook: a completed service takes its recipe off the shelf, with the room, person, price and time it carries', async () => {
  const env = testEnv();
  const { key, oil, powder } = await spa(env);
  const at = new Date(Date.now() - 3 * 3600e3).toISOString();
  const r = await hook(env, key, { services: [row('INV-1001/1', { times: 2, price: 250, at })] });
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.unit, r.body.received, r.body.recorded, r.body.failed], ['Herbal Park', 1, 1, 0]);
  assert.deepEqual(r.body.results, [{ ref: 'INV-1001/1', status: 'recorded', record: 'HP-SVC-0001' }]);
  assert.equal(bal(env, S.sub, oil).qty, 9.5);
  assert.equal(bal(env, S.sub, powder).qty, 16);
  const [rec] = records(env);
  assert.deepEqual([rec.service_name, rec.times, rec.area_id, rec.person_id, rec.price, rec.revenue, rec.source, rec.ext_ref, rec.by_name, rec.at, rec.actual_value],
    ['Abhyanga', 2, AREA.room1, PEOPLE.staff.id, 250, 500, 'Front desk billing', 'INV-1001/1', 'Front desk billing (link)', at, 21]);
  const m = env.DB.db.prepare(`SELECT kind, at, person_name, actor_name, doc_ref FROM movements WHERE doc_type = 'SERVICE' LIMIT 1`).get();
  assert.deepEqual({ ...m }, { kind: 'ISSUE', at, person_name: 'Sara Therapist', actor_name: 'Front desk billing (link)', doc_ref: 'HP-SVC-0001' });
  assert.ok(env.DB.db.prepare(`SELECT last_used_at FROM integration_keys`).get().last_used_at);
});

test('hook: the same service sent again is counted once', async () => {
  const env = testEnv();
  const { key, powder } = await spa(env);
  await hook(env, key, { services: [row('B1')] });
  const again = await hook(env, key, [row('B1'), row('B2')]);
  assert.deepEqual(again.body.results.map((x) => x.status), ['duplicate', 'recorded']);
  assert.equal(again.body.duplicates, 1);
  assert.equal(records(env).length, 2);
  assert.equal(bal(env, S.sub, powder).qty, 16);
});

test('hook: names as other systems spell them, a service by its name, and a row with no reference refused', async () => {
  const env = testEnv();
  const { key } = await spa(env);
  const r = await hook(env, key, { services: [
    { reference: 'C1', treatment: 'abhyanga', quantity: 1, area: 'Treatment room 2', employee_code: 'hps001', unit_price: '1,250.50' },
    { service: 'ABH', room: 'R1', person: 'HPS001' },
  ] });
  assert.deepEqual(r.body.results.map((x) => x.status), ['recorded', 'refused']);
  assert.match(r.body.results[1].error, /no reference/);
  assert.deepEqual([records(env)[0].area_id, records(env)[0].price], [AREA.room2, 1250.5]);
  assert.equal((await inbox(env)).length, 0, 'a row with nothing to know it by is not kept');
});

test('hook: what cannot be recorded waits with its reason, and the rest still goes in', async () => {
  const env = testEnv();
  const { key } = await spa(env);
  const r = await hook(env, key, { services: [
    row('D1', { service: 'Shirodhara' }), row('D2', { room: 'R9' }), row('D3', { person: null }), row('D4', { person: 'HVK001' }),
    row('D5', { times: 11 }), row('D6', { at: '2020-01-01' }), row('D7', { times: 2.5 }), row('D8', { store: 'CELLAR' }), row('D9'),
  ] });
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.recorded, r.body.failed], [1, 8]);
  const why = Object.fromEntries(r.body.results.map((x) => [x.ref, x.error || x.status]));
  assert.match(why.D1, /“Shirodhara” is not a service in this unit/);
  assert.match(why.D2, /“R9” is not a room/);
  assert.match(why.D3, /records use against a person/);
  assert.match(why.D4, /not somebody with a seat in this unit/);
  assert.match(why.D5, /Kizhi powder/);
  assert.match(why.D6, /more than 31 days ago/);
  assert.match(why.D7, /whole number/);
  assert.match(why.D8, /“CELLAR” is not a store/);
  assert.equal(why.D9, 'recorded');
  const waiting = await inbox(env);
  assert.equal(waiting.length, 8);
  assert.deepEqual([waiting.find((w) => w.ext_ref === 'D1').source, waiting.find((w) => w.ext_ref === 'D1').payload.service], ['Front desk billing', 'Shirodhara']);
  const t = await call(env, 'GET', '/api/today', { as: 'manager' });
  assert.equal(t.body.waiting.find((w) => w.key === 'link-inbox').n, 8);
  assert.ok(!(await call(env, 'GET', '/api/today', { as: 'keeper' })).body.waiting.some((w) => w.key === 'link-inbox'));
});

test('inbox: once the cause is fixed a retry records it; a dismissal needs a reason and is final', async () => {
  const env = testEnv();
  const { key, oil, powder } = await spa(env);
  await hook(env, key, { services: [row('E1', { service: 'KIZ' }), row('E2', { times: 11 }), row('E3', { service: 'Test booking' })] });
  let waiting = await inbox(env);
  assert.equal(waiting.length, 3);
  // A manager adds the missing service, and stock arrives.
  await call(env, 'POST', '/api/services', { as: 'manager', body: { code: 'KIZ', name: 'Kizhi', items: [{ itemId: powder, qty: 1 }] } });
  await receive(env, powder, 10, { storeId: S.sub, unitCost: 4 });
  for (const as of ['keeper', 'staff']) assert.equal((await call(env, 'POST', '/api/link/inbox/retry', { as })).status, 403, as);
  const all = await call(env, 'POST', '/api/link/inbox/retry', { as: 'manager' });
  assert.deepEqual([all.body.recorded, all.body.failed], [2, 1]);
  const recs = records(env);
  assert.deepEqual(recs.map((x) => [x.ext_ref, x.source, x.by_name]).sort(), [['E1', 'Front desk billing', 'Maya Manager'], ['E2', 'Front desk billing', 'Maya Manager']]);
  assert.equal(bal(env, S.sub, oil).qty, 10 - 0.25 * 11);

  waiting = await inbox(env);
  assert.deepEqual(waiting.map((w) => w.ext_ref), ['E3']);
  assert.equal((await call(env, 'POST', `/api/link/inbox/${waiting[0].id}/dismiss`, { as: 'manager', body: {} })).body.error.code, 'REASON_REQUIRED');
  assert.equal((await call(env, 'POST', `/api/link/inbox/${waiting[0].id}/dismiss`, { as: 'manager', body: { note: 'A test from the billing team' } })).status, 200);
  assert.equal((await inbox(env)).length, 0);
  assert.equal((await inbox(env, 'DISMISSED'))[0].decision_note, 'A test from the billing team');
  // Sent again later, it stays dismissed; and what was recorded stays recorded.
  const again = await hook(env, key, { services: [row('E3'), row('E1')] });
  assert.deepEqual(again.body.results.map((x) => x.status), ['dismissed', 'duplicate']);
  assert.equal(records(env).length, 2);
  assert.equal((await call(env, 'POST', `/api/link/inbox/${waiting[0].id}/retry`, { as: 'manager' })).status, 404);
});

test('hook: a unit that records use against the person only does not need a room', async () => {
  const env = testEnv();
  const { key } = await spa(env);
  await call(env, 'PUT', '/api/settings', { body: { 'consumption.record': 'person' } });
  const r = await hook(env, key, { services: [row('F1', { room: null })] });
  assert.equal(r.body.results[0].status, 'recorded');
  assert.equal(records(env)[0].area_id, null);
});

test('hook: one unit\'s key reaches only that unit, and a body that is not a list of services is refused', async () => {
  const env = testEnv();
  const { key } = await spa(env);
  // The same code and reference exist in Herbal Valley, untouched by Herbal Park's key.
  const hvOil = (await call(env, 'POST', '/api/items', { as: 'admin', unit: HV, body: { code: 'OIL', name: 'Valley oil' } })).body.id;
  await call(env, 'POST', '/api/services', { as: 'hv', body: { code: 'VAL', name: 'Valley only', items: [{ itemId: hvOil, qty: 1 }] } });
  const r = await hook(env, key, { services: [row('G1', { service: 'VAL' })] });
  assert.match(r.body.results[0].error, /“VAL” is not a service in this unit/);
  assert.deepEqual((await call(env, 'GET', '/api/link/inbox', { as: 'hv' })).body, []);
  assert.equal((await hook(env, key, { nothing: true })).body.error.code, 'NO_ROWS');
  assert.equal((await hook(env, key, { services: Array.from({ length: 201 }, (_, i) => row(`X${i}`)) })).body.error.code, 'TOO_MANY');
});

test('dates: a timestamp, a date, day first, an Excel number; never the future, never older than a month', () => {
  const now = Date.parse('2026-11-11T08:00:00Z');
  assert.equal(whenDone(null, now), null);
  assert.equal(whenDone('2026-11-10T10:30:00+04:00', now), '2026-11-10T06:30:00.000Z');
  assert.equal(whenDone('2026-11-10 14:30', now), '2026-11-10T10:30:00.000Z');
  assert.equal(whenDone('2026-11-10', now), '2026-11-10T08:00:00.000Z');
  assert.equal(whenDone('10/11/2026 9:05', now), '2026-11-10T05:05:00.000Z');
  assert.equal(whenDone(46336.604166666664, now), '2026-11-10T10:30:00.000Z');
  assert.throws(() => whenDone('2026-11-12', now), /future/);
  assert.throws(() => whenDone('01/10/2026', now), /more than 31 days/);
  assert.throws(() => whenDone('last Tuesday', now), /could not be understood/);
});

// ── A sheet ──────────────────────────────────────────────────────────────────

const HEAD = ['Reference', 'Date', 'Service', 'How many', 'Room', 'Person', 'Price', 'Store'];
const sheet = (env, rows, { as = 'manager', apply = false, storeId = S.sub } = {}) => call(env, 'POST', '/api/link/sheet', { as, body: { headers: HEAD, rows, storeId, dryRun: !apply } });

test('sheet: the check says what each row would do and whether the store holds enough, and changes nothing', async () => {
  const env = testEnv();
  const { key } = await spa(env);
  await hook(env, key, { services: [row('S0')] });
  const r = await sheet(env, [
    ['S0', null, 'ABH', 1, 'R1', 'HPS001', null, null],
    ['S1', null, 'Abhyanga', 6, 'R1', 'HPS001', 200, null],
    ['S2', null, 'ABH', 4, 'R2', 'HPK001', null, 'SUB'],
    ['S2', null, 'ABH', 1, 'R1', 'HPS001', null, null],
    ['S3', null, 'Shirodhara', 1, 'R1', 'HPS001', null, null],
    [null, null, null, null, null, null, null, null],
  ]);
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.dryRun, r.body.received, r.body.ready, r.body.duplicates, r.body.problems], [true, 5, 2, 1, 2]);
  assert.deepEqual(r.body.results.map((x) => [x.row, x.status]), [[2, 'duplicate'], [3, 'ready'], [4, 'ready'], [5, 'problem'], [6, 'problem']]);
  assert.equal(r.body.results[1].what, '6 × Abhyanga in Treatment room 1 by Sara Therapist');
  assert.match(r.body.results[3].error, /earlier row/);
  assert.deepEqual(r.body.short, ['Kizhi powder: these rows need 20 bottle, and Spa sub store holds 18.']);
  assert.equal(records(env).length, 1);
  assert.equal((await inbox(env)).length, 0);
});

test('sheet: applying takes each row in on its own, and the same file again adds nothing', async () => {
  const env = testEnv();
  await spa(env);
  const rows = [['T1', '10/11/2026 10:00', 'ABH', 2, 'R1', 'HPS001', 250, null], ['T2', null, 'ABH', 20, 'R1', 'HPS001', null, null], ['T3', null, 'ABH', 1, 'R2', 'HPS001', null, null]];
  const now = Date.now();
  if (Date.parse('2026-11-10T06:00:00Z') < now - 31 * 864e5 || Date.parse('2026-11-10T06:00:00Z') > now) rows[0][1] = null;   // keep the test true whenever it is run
  const r = await sheet(env, rows, { apply: true });
  assert.deepEqual([r.body.dryRun, r.body.recorded, r.body.failed], [false, 2, 1]);
  assert.deepEqual(r.body.results.map((x) => [x.row, x.status]), [[2, 'recorded'], [3, 'failed'], [4, 'recorded']]);
  assert.deepEqual(records(env).map((x) => [x.ext_ref, x.source, x.by_name, x.revenue]), [['T1', 'Sheet upload', 'Maya Manager', 500], ['T3', 'Sheet upload', 'Maya Manager', null]]);
  assert.deepEqual((await inbox(env)).map((w) => [w.ext_ref, w.source]), [['T2', 'Sheet upload']]);
  const again = await sheet(env, rows, { apply: true });
  assert.deepEqual([again.body.recorded, again.body.duplicates, again.body.failed], [0, 2, 1]);
  assert.equal(records(env).length, 2);
});

test('sheet: managers only, the headings must be the sheet\'s, and the sheet to fill in can be asked for', async () => {
  const env = testEnv();
  await spa(env);
  for (const as of ['keeper', 'staff', 'buyer']) assert.equal((await sheet(env, [['U1', null, 'ABH', 1, 'R1', 'HPS001', null, null]], { as })).status, 403, as);
  const bad = await call(env, 'POST', '/api/link/sheet', { as: 'manager', body: { headers: ['Service', 'Room'], rows: [['ABH', 'R1']], storeId: S.sub } });
  assert.match(bad.body.error.message, /no “Reference” column/);
  const t = await call(env, 'GET', '/api/link/sheet', { as: 'manager' });
  assert.deepEqual(t.body.columns.map((c) => c.header), HEAD);
  assert.deepEqual(t.body.columns.filter((c) => c.text).map((c) => c.header), ['Reference', 'Date', 'Room', 'Person', 'Store']);
});

// ── Price and margin ─────────────────────────────────────────────────────────

test('margin: revenue less what was actually used, over the services that carry a price', async () => {
  const env = testEnv();
  const { key, svc, oil, powder } = await spa(env);
  await hook(env, key, { services: [row('M1', { times: 2, price: 250 })] });                         // 500 against 21
  // Recorded in the app, with no price anywhere: counted apart.
  await call(env, 'POST', '/api/service-records', { as: 'staff', body: { serviceId: svc, storeId: S.sub, areaId: AREA.room1 } });
  let r = (await call(env, 'GET', '/api/reports/services', { as: 'manager' })).body;
  assert.deepEqual(r.margin, [{ service_id: svc, name: 'Abhyanga', times: 2, revenue: 500, cost: 21, margin: 479, percent: 95.8 }]);
  assert.equal(r.unpriced, 1);
  // The recipe gets a usual price: used from then on when none is sent, and when recorded in the app.
  await call(env, 'PUT', `/api/services/${svc}`, { as: 'manager', body: { code: 'ABH', name: 'Abhyanga', price: 200, items: [{ itemId: oil, qty: 0.25 }, { itemId: powder, qty: 2 }] } });
  await hook(env, key, { services: [row('M2')] });
  await call(env, 'POST', '/api/service-records', { as: 'staff', body: { serviceId: svc, storeId: S.sub, areaId: AREA.room1, lines: [{ itemId: oil, qty: 1 }] } });
  r = (await call(env, 'GET', '/api/reports/services', { as: 'manager' })).body;
  assert.deepEqual([r.margin[0].times, r.margin[0].revenue, r.margin[0].cost, r.margin[0].margin], [4, 900, 41.5, 858.5]);
  assert.equal(r.unpriced, 1);
});

test('margin: prices and margins are for those who see costs', async () => {
  const env = testEnv();
  const { key, svc, oil, powder } = await spa(env);
  await call(env, 'PUT', `/api/services/${svc}`, { as: 'manager', body: { code: 'ABH', name: 'Abhyanga', price: 200, items: [{ itemId: oil, qty: 0.25 }, { itemId: powder, qty: 2 }] } });
  await hook(env, key, { services: [row('N1')] });
  const keeper = (await call(env, 'GET', '/api/reports/services', { as: 'keeper' })).body;
  assert.equal(keeper.margin, undefined);
  assert.equal(keeper.unpriced, undefined);
  const staff = (await call(env, 'GET', '/api/services', { as: 'staff' })).body[0];
  assert.deepEqual([staff.price, staff.margin, staff.stdCost], [undefined, undefined, undefined]);
  const mgr = (await call(env, 'GET', '/api/services', { as: 'manager' })).body[0];
  assert.deepEqual([mgr.price, mgr.stdCost, mgr.margin], [200, 10.5, 189.5]);
  assert.equal((await call(env, 'PUT', `/api/services/${svc}`, { as: 'manager', body: { code: 'ABH', name: 'Abhyanga', price: -5, items: [{ itemId: oil, qty: 1 }] } })).body.error.code, 'BAD_PRICE');
});
