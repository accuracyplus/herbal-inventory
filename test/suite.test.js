/**
 * Feature 13: what HiFive ID is told. The hub ("Waiting for you"), the combined morning email
 * (everybody at once) and the person's stock in hand for their profile, each behind its own
 * verb, and the hub and the email always saying what Today says.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA, HP, HV, PEOPLE, S, call, hfidToken, makeItem, receive } from './helpers/http.js';
import { testEnv } from './helpers/http.js';

const asHfid = (env, path, claims) => call(env, 'POST', path, { token: hfidToken(claims) });
const everybody = async (env) => (await asHfid(env, '/pending/service/all', { svc: 'pending-all', role: 'hr', emp_code: null })).body.people;
const hub = async (env, code) => (await asHfid(env, '/pending/service', { svc: 'pending', emp_code: code })).body.items;
const today = async (env, as) => (await call(env, 'GET', '/api/today', { as })).body.waiting;
const ask = (env, as) => call(env, 'POST', '/api/requests', { as, body: { toStoreId: S.sub, lines: [{ itemId: env.oil, qty: 1 }] } });
const backdate = (env, sql, days) => env.DB.db.prepare(sql).run(new Date(Date.now() - days * 864e5).toISOString());

async function setUp() {
  const env = testEnv();
  env.oil = await makeItem(env);
  await receive(env, env.oil, 10, { storeId: S.sub });
  return env;
}

test('everybody at once opens to the pending-all verb only', async () => {
  const env = await setUp();
  for (const svc of ['pending', 'sync', 'accountability-all', undefined]) {
    const r = await asHfid(env, '/pending/service/all', { svc, role: 'hr', emp_code: null });
    assert.equal(r.status, 403, String(svc));
  }
  const signedIn = await call(env, 'POST', '/pending/service/all', { as: 'admin' });
  assert.equal(signedIn.status, 403, 'a person signed in to Inventory is not HiFive ID');
  const ok = await asHfid(env, '/pending/service/all', { svc: 'pending-all', role: 'hr', emp_code: null });
  assert.equal(ok.status, 200);
  assert.ok(Array.isArray(ok.body.people));
});

test('the morning email: each person once, with a link into the right unit, nobody with nothing', async () => {
  const env = await setUp();
  await ask(env, 'staff');
  const people = await everybody(env);
  const maya = people.find((p) => p.emp_code === PEOPLE.manager.code);
  assert.equal(maya.name, PEOPLE.manager.name);
  const item = maya.items.find((i) => i.kind === 'inventory_requests_approve');
  assert.deepEqual(item, {
    kind: 'inventory_requests_approve', text: '1 request to approve', detail: 'Herbal Park', days: 0,
    href: `/#/requests?status=PENDING&unit=${HP}`, action: 'Approve',
  });
  assert.ok(!people.some((p) => p.emp_code === PEOPLE.staff.code), 'the person who asked is not asked to approve it');
  assert.ok(!people.some((p) => p.emp_code === PEOPLE.viewer.code), 'nothing waiting, not in the list');
  assert.equal(new Set(people.map((p) => p.emp_code)).size, people.length, 'each person once');
});

test('the hub, the email and Today give the same list for the same person', async () => {
  const env = await setUp();
  await ask(env, 'staff');
  await call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, areaId: AREA.room1, lines: [{ itemId: env.oil, qty: 1 }] } });
  backdate(env, `UPDATE custody SET taken_at = ?`, 2);
  for (const who of ['manager', 'keeper', 'staff']) {
    const code = PEOPLE[who].code;
    const fromToday = (await today(env, who)).filter((w) => w.days != null || w.due).map((w) => `inventory_${w.key.replace(/-/g, '_')}`).sort();
    const fromHub = (await hub(env, code)).map((i) => i.kind).sort();
    const fromEmail = ((await everybody(env)).find((p) => p.emp_code === code)?.items || []).map((i) => i.kind).sort();
    assert.deepEqual(fromHub, fromToday, `${who}: hub`);
    assert.deepEqual(fromEmail, fromToday, `${who}: email`);
  }
  assert.deepEqual((await hub(env, PEOPLE.staff.code)).map((i) => i.kind), ['inventory_custody_mine']);
});

test('days: how long an approval has waited, how late held stock and orders are', async () => {
  const env = await setUp();
  await ask(env, 'staff');
  backdate(env, `UPDATE requests SET requested_at = ?`, 3);
  const approve = (await hub(env, PEOPLE.manager.code)).find((i) => i.kind === 'inventory_requests_approve');
  assert.equal(approve.days, -3, 'raised three days ago: three days waiting');

  await call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, areaId: AREA.room1, lines: [{ itemId: env.oil, qty: 1 }] } });
  backdate(env, `UPDATE custody SET taken_at = ?`, 3); // 24 h window: two days past it
  const held = (await hub(env, PEOPLE.staff.code)).find((i) => i.kind === 'inventory_custody_mine');
  assert.equal(held.due, 'overdue');
  assert.equal(held.days, -2);
  assert.equal(held.href, `/#/with-me?unit=${HP}`);
  const team = (await hub(env, PEOPLE.manager.code)).find((i) => i.kind === 'inventory_custody_team');
  assert.equal(team.text, '1 item unaccounted for, with 1 person');
});

test('what is not a task with a day stays in the app: an order with no date, a count in progress', async () => {
  const env = await setUp();
  const db = env.DB.db;
  db.prepare(`INSERT INTO suppliers (id, unit_id, name, active) VALUES ('sp-x', ?, 'Supplier X', 1)`).run(HP);
  const po = (id, expected) => db.prepare(
    `INSERT INTO purchase_orders (id, unit_id, ref, supplier_id, store_id, status, expected_date, created_by, created_by_name, created_at)
     VALUES (?, ?, ?, 'sp-x', ?, 'APPROVED', ?, 'p-buyer', 'Bilal Buyer', ?)`,
  ).run(id, HP, id, S.main, expected, new Date().toISOString());
  po('PO-A', null);
  db.prepare(`INSERT INTO counts (id, unit_id, ref, store_id, status, started_by, started_by_name, started_at) VALUES ('c1', ?, 'CNT-1', ?, 'OPEN', 'p-keeper', 'Kiran Keeper', ?)`)
    .run(HP, S.main, new Date().toISOString());
  const keeperToday = (await today(env, 'keeper')).map((w) => w.key);
  assert.ok(keeperToday.includes('po-receive') && keeperToday.includes('count-open'), 'Today still names both');
  assert.deepEqual((await hub(env, PEOPLE.keeper.code)).map((i) => i.kind), [], 'neither has a day, so the hub and email wait');

  po('PO-B', '2026-01-05');
  const late = (await hub(env, PEOPLE.keeper.code)).find((i) => i.kind === 'inventory_po_receive');
  assert.equal(late.text, '2 orders expected, 1 late');
  assert.ok(late.days < 0, 'as late as the late order');
});

test('somebody with seats in two units is told which unit each line is for', async () => {
  const env = await setUp();
  env.DB.db.prepare(`INSERT INTO staff_units (staff_id, unit_id, roles, active) VALUES (?, ?, '["MANAGER"]', 1)`).run(PEOPLE.manager.id, HV);
  await ask(env, 'staff');
  const items = await hub(env, PEOPLE.manager.code);
  const one = items.find((i) => i.kind === 'inventory_requests_approve');
  assert.equal(one.text, '1 request to approve at Herbal Park');
  assert.equal(one.detail, 'Herbal Park');
  assert.ok(items.every((i) => i.href.endsWith(`unit=${HP}`)), 'nothing waits in Herbal Valley');
});

test('the hub answers nothing for a blank or unknown code, never somebody else', async () => {
  const env = await setUp();
  await ask(env, 'staff');
  for (const code of ['', '   ', 'NOBODY1']) {
    const r = await asHfid(env, '/pending/service', { svc: 'pending', emp_code: code });
    assert.ok(r.status === 400 || (r.status === 200 && r.body.items.length === 0), JSON.stringify(code));
  }
  assert.equal((await hub(env, ' hpm001 ')).length, 1, 'case and spaces do not matter');
});

// ── Stock in hand, for the HiFive ID profile ─────────────────────────────────

const account = (env, code, svc = 'accountability') => asHfid(env, '/accountability/service', { svc, emp_code: code });

test('stock in hand: counts and dates for the named person, by unit, never the items', async () => {
  const env = await setUp();
  const take = () => call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, areaId: AREA.room1, lines: [{ itemId: env.oil, qty: 1 }] } });
  await take();
  backdate(env, `UPDATE custody SET taken_at = ?`, 3);
  await take(); // just now, still inside the window

  const r = await account(env, PEOPLE.staff.code);
  assert.equal(r.status, 200);
  const p = r.body.person;
  assert.equal(p.emp_code, PEOPLE.staff.code);
  assert.equal(p.holding, 2);
  assert.equal(p.unaccounted, 1);
  assert.match(p.since, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(Object.keys(p.units[0]).sort(), ['holding', 'hours', 'href', 'since', 'unaccounted', 'unit']);
  assert.equal(p.units[0].unit, 'Herbal Park');
  assert.equal(p.units[0].href, `/#/with-me?unit=${HP}`);
  assert.doesNotMatch(JSON.stringify(r.body), /oil|cost|value|price/i, 'no item names, no money');

  const maya = (await account(env, PEOPLE.manager.code)).body.person;
  assert.equal(maya.holding, 0, 'a manager sees the team in Inventory; their own profile shows their own hands');
  assert.equal((await account(env, 'NOBODY1')).body.person, null, 'not known here: null, never a zero');
  assert.equal((await account(env, '')).status, 400);
  assert.equal((await account(env, PEOPLE.staff.code, 'pending')).status, 403, 'its own verb');
});

test('stock in hand for everybody: every seat holder once, zero included', async () => {
  const env = await setUp();
  await call(env, 'POST', '/api/custody/take', { as: 'staff', body: { storeId: S.sub, areaId: AREA.room1, lines: [{ itemId: env.oil, qty: 2 }] } });
  assert.equal((await asHfid(env, '/accountability/service/all', { svc: 'accountability', role: 'hr', emp_code: 'APML131' })).status, 403);
  const r = await asHfid(env, '/accountability/service/all', { svc: 'accountability-all', role: 'hr', emp_code: null });
  assert.equal(r.status, 200);
  const codes = r.body.people.map((x) => x.emp_code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.includes(PEOPLE.viewer.code) && codes.includes(PEOPLE.hv.code));
  assert.equal(r.body.people.find((x) => x.emp_code === PEOPLE.staff.code).holding, 1);
  assert.equal(r.body.people.find((x) => x.emp_code === PEOPLE.viewer.code).holding, 0);
});
