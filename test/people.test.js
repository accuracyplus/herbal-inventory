import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffRoster } from '../src/lib/roster.js';
import { call, defaultRoster, HP, PEOPLE, testEnv } from './helpers/http.js';

const day = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);
const withRoster = (changes = {}, added = []) => defaultRoster()
  .map((r) => ({ ...r, ...(changes[r.employee_code] || {}) }))
  .concat(added);

test('roster: read with the administrator\'s own session, for app inventory', async () => {
  const calls = [];
  const env = testEnv({ rosterCalls: calls });
  const r = await call(env, 'GET', '/api/hfid/people', { as: 'admin' });
  assert.equal(r.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].app, 'inventory');
  assert.match(calls[0].bearer, /^Bearer ey/);
  assert.equal(r.body.unitName, 'Herbal Park');
});

test('roster: only a unit administrator can read it', async () => {
  const env = testEnv();
  for (const as of ['manager', 'keeper', 'staff', 'viewer']) assert.equal((await call(env, 'GET', '/api/hfid/people', { as })).status, 403, as);
});

test('picker: everybody still working, this unit first, marked if they already have a seat', async () => {
  const env = testEnv({ roster: withRoster({}, [
    { employee_code: 'AD001', full_name: 'Aisha Drug', entity: 'Atomic Drugstore', status: 'active', start_date: '2020-01-01' },
    { employee_code: 'HPOLD', full_name: 'Gone Person', entity: 'Herbal Park', status: 'exited', end_date: '2025-01-01' },
    { employee_code: '', full_name: 'No code', entity: 'Herbal Park', status: 'active' },
  ]) });
  const r = (await call(env, 'GET', '/api/hfid/people', { as: 'admin' })).body;
  const codes = r.people.map((p) => p.code);
  assert.ok(!codes.includes('HPOLD'), 'leavers are not offered');
  const firstOther = r.people.findIndex((p) => !p.inUnit);
  assert.ok(firstOther > 0 && r.people.slice(firstOther).every((p) => !p.inUnit), 'this unit\'s people first');
  assert.deepEqual(r.people.slice(firstOther).map((p) => p.code), ['AD001', 'HVK001'], 'then the rest by name');
  assert.equal(r.people.find((p) => p.code === 'HPNEW2').seated, false);
  assert.equal(r.people.find((p) => p.code === 'HPS001').seated, true);
  assert.equal(r.review.unmappable, 1);
});

test('review: joiners are recent starters in this unit without a seat; older ones are only in the picker', async () => {
  const env = testEnv({ roster: withRoster({}, [
    { employee_code: 'HPJ1', full_name: 'Joined Last Week', entity: 'Herbal Park', status: 'active', start_date: day(-7) },
    { employee_code: 'HPJ2', full_name: 'Starts Monday', entity: 'Herbal Park', status: 'active', start_date: day(5) },
    { employee_code: 'HVJ1', full_name: 'Valley Joiner', entity: 'Herbal Valley', status: 'active', start_date: day(-3) },
    { employee_code: 'HPJ0', full_name: 'Joined Last Year', entity: 'Herbal Park', status: 'active', start_date: day(-400) },
  ]) });
  const r = (await call(env, 'GET', '/api/hfid/people', { as: 'admin' })).body;
  assert.deepEqual(r.review.joiners.map((p) => p.code), ['HPJ2', 'HPJ1']);
  assert.ok(r.people.some((p) => p.code === 'HPJ0'));
  assert.equal(r.count, 2);
});

test('review: leavers, people on notice, names that differ, and codes HiFive ID does not hold', async () => {
  const env = testEnv({ roster: withRoster({
    HPS001: { status: 'exited', end_date: day(-2) },
    HPK001: { end_date: day(20), notice_date: day(-10) },
    HPB001: { full_name: 'Bilal Ahmed Buyer' },
  }).filter((r) => r.employee_code !== 'HPV001') });
  const r = (await call(env, 'GET', '/api/hfid/people', { as: 'admin' })).body.review;
  assert.deepEqual(r.left.map((p) => p.code), ['HPS001']);
  assert.deepEqual(r.leaving.map((p) => [p.code, p.endDate]), [['HPK001', day(20)]]);
  assert.deepEqual(r.renamed.map((p) => [p.name, p.hfidName]), [['Bilal Buyer', 'Bilal Ahmed Buyer']]);
  assert.deepEqual(r.unknown.map((p) => p.code), ['HPV001']);
});

test('review: an end date that has arrived counts as left even if HiFive ID still says active', () => {
  const d = diffRoster({
    roster: [{ employee_code: 'X1', full_name: 'X', status: 'active', end_date: '2026-01-31' }],
    local: [{ id: 'x', code: 'x1', full_name: 'X', seated: true }],
    unitName: 'Herbal Park', today: '2026-02-01',
  });
  assert.equal(d.review.left.length, 1);
});

test('review: nobody is removed or changed by reading it', async () => {
  const env = testEnv({ roster: withRoster({ HPS001: { status: 'exited', end_date: day(-2) }, HPB001: { full_name: 'Someone Else' } }) });
  await call(env, 'GET', '/api/hfid/people', { as: 'admin' });
  await call(env, 'GET', '/api/today', { as: 'admin' });
  const seat = env.DB.db.prepare(`SELECT active FROM staff_units WHERE staff_id = ? AND unit_id = ?`).get(PEOPLE.staff.id, HP);
  assert.equal(seat.active, 1);
  assert.equal(env.DB.db.prepare(`SELECT full_name FROM staff WHERE id = ?`).get(PEOPLE.buyer.id).full_name, 'Bilal Buyer');
  // And the person who has left can still sign in here until somebody decides: HiFive ID is what stops them.
  assert.equal((await call(env, 'GET', '/api/me', { as: 'staff' })).status, 200);
});

test('today: an administrator is told how much there is to review; nobody else is', async () => {
  const env = testEnv({ roster: withRoster({ HPS001: { status: 'exited', end_date: day(-1) } }) });
  const t = await call(env, 'GET', '/api/today', { as: 'admin' });
  const w = t.body.waiting.find((x) => x.key === 'people-review');
  assert.equal(w.n, 1);
  assert.equal(w.to, 'admin?tab=people');
  assert.ok(!(await call(env, 'GET', '/api/today', { as: 'manager' })).body.waiting.some((x) => x.key === 'people-review'));
});

test('today: HiFive ID unreachable is not shown as nothing to review, and Today still opens', async () => {
  const env = testEnv({ rosterFails: 500 });
  const t = await call(env, 'GET', '/api/today', { as: 'admin' });
  assert.equal(t.status, 200);
  assert.ok(!t.body.waiting.some((x) => x.key === 'people-review'));
  const r = await call(env, 'GET', '/api/hfid/people', { as: 'admin' });
  assert.equal(r.status, 502);
  assert.match(r.body.error.message, /Pass \?app=/);
});

test('adding: the name comes from HiFive ID, whatever was typed', async () => {
  const env = testEnv();
  const r = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'hpnew2', name: 'typo nisa', roles: ['STAFF'] } });
  assert.equal(r.status, 200);
  assert.equal(env.DB.db.prepare(`SELECT full_name FROM staff WHERE code = 'HPNEW2'`).get().full_name, 'Nisha Nair');
});

test('adding: a code HiFive ID does not hold, or somebody who has left, is refused', async () => {
  const env = testEnv({ roster: withRoster({}, [{ employee_code: 'HPGONE', full_name: 'Gone', entity: 'Herbal Park', status: 'exited', end_date: day(-30) }]) });
  const typo = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'HPNEW9', name: 'Somebody', roles: ['STAFF'] } });
  assert.equal(typo.status, 422);
  assert.equal(typo.body.error.code, 'NOT_IN_HFID');
  const gone = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'HPGONE', roles: ['STAFF'] } });
  assert.equal(gone.body.error.code, 'HAS_LEFT');
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM staff WHERE code IN ('HPNEW9','HPGONE')`).get().n, 0);
});

test('adding: a leaver who already has a seat can still have it changed or removed', async () => {
  const env = testEnv({ roster: withRoster({ HPS001: { status: 'exited', end_date: day(-1) } }) });
  const remove = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'HPS001', roles: ['STAFF'], active: false } });
  assert.equal(remove.status, 200);
  assert.equal(env.DB.db.prepare(`SELECT active FROM staff_units WHERE staff_id = ? AND unit_id = ?`).get(PEOPLE.staff.id, HP).active, 0);
});

test('adding: with HiFive ID unreachable an administrator is not stuck, and the log says it was not checked', async () => {
  const env = testEnv({ rosterFails: 503 });
  const r = await call(env, 'PUT', '/api/people', { as: 'admin', body: { code: 'HPNEW8', name: 'Typed Name', roles: ['STAFF'] } });
  assert.equal(r.status, 200);
  const log = (await call(env, 'GET', '/api/audit', { as: 'admin' })).body.find((x) => x.action === 'SEAT_SET');
  assert.match(log.detail, /could not be checked/);
});

test('names: an administrator takes HiFive ID\'s spelling, read again at the time', async () => {
  const env = testEnv({ roster: withRoster({ HPB001: { full_name: 'Bilal Ahmed Buyer' } }) });
  const r = await call(env, 'POST', '/api/hfid/people/HPB001/name', { as: 'admin' });
  assert.equal(r.status, 200);
  assert.equal(env.DB.db.prepare(`SELECT full_name FROM staff WHERE id = ?`).get(PEOPLE.buyer.id).full_name, 'Bilal Ahmed Buyer');
  assert.equal((await call(env, 'POST', '/api/hfid/people/HPB001/name', { as: 'manager' })).status, 403);
  assert.equal((await call(env, 'POST', '/api/hfid/people/HVK001/name', { as: 'admin' })).status, 404, 'no seat in this unit');
});

test('the console role dropdown and the "Can access" grant work as before', async () => {
  const env = testEnv();
  const consoleToken = (await import('./helpers/http.js')).hfidToken({ aud: 'hifive-id', module: 'hifive-id', role: 'hr', emp_code: 'APML131' });
  assert.equal((await call(env, 'GET', '/api/roles/HPS001', { token: consoleToken })).body.role, 'STAFF');
});
