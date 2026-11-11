import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREA, bal, call, HP, makeItem, PEOPLE, receive, S, testEnv } from './helpers/http.js';

const use = (env, as, fields, itemId, qty = 1) => call(env, 'POST', '/api/use', { as, body: { storeId: as === 'staff' ? S.sub : S.main, ...fields, lines: [{ itemId, qty }] } });
const lastIssue = (env) => env.DB.db.prepare(`SELECT area_id, person_id, person_name, department_id, actor_id FROM movements WHERE kind = 'ISSUE' ORDER BY rowid DESC LIMIT 1`).get();

async function stocked(env) {
  const oil = await makeItem(env);
  await receive(env, oil, 20);
  await receive(env, oil, 20, { storeId: S.sub });
  return oil;
}

const department = async (env, code, name, as = 'admin') => call(env, 'POST', '/api/departments', { as, body: { code, name } });
const room = (env, id, code, departmentId) => call(env, 'PUT', `/api/areas/${id}`, { body: { code, name: `Room ${code}`, departmentId } });

// ── Departments ──────────────────────────────────────────────────────────────

test('department: only a unit administrator keeps them, and another unit never sees them', async () => {
  const env = testEnv();
  assert.equal((await department(env, 'SPA', 'Spa', 'manager')).status, 403);
  const made = await department(env, 'spa', 'Spa');
  assert.equal(made.status, 201);
  assert.equal((await department(env, 'SPA', 'Spa again')).status, 409);
  const mine = await call(env, 'GET', '/api/departments', { as: 'staff' });
  assert.deepEqual(mine.body.map((d) => d.code), ['SPA']);
  assert.deepEqual((await call(env, 'GET', '/api/departments', { as: 'hv' })).body, []);
  const reach = await call(env, 'PUT', `/api/departments/${made.body.id}`, { as: 'admin', unit: 'u-hv', body: { code: 'X', name: 'Taken' } });
  assert.equal(reach.status, 404);
});

test('department: a room belongs to one once the unit has any, and a closing one must be empty', async () => {
  const env = testEnv();
  assert.equal((await room(env, AREA.room1, 'R1', null)).status, 200);
  const spa = await department(env, 'SPA', 'Spa');
  const none = await room(env, AREA.room1, 'R1', null);
  assert.equal(none.status, 422);
  assert.equal(none.body.error.code, 'DEPARTMENT_REQUIRED');
  assert.equal((await room(env, AREA.room1, 'R1', spa.body.id)).status, 200);
  const listed = await call(env, 'GET', '/api/areas', { as: 'staff' });
  assert.equal(listed.body.find((a) => a.id === AREA.room1).department_name, 'Spa');

  const close = (id, active) => call(env, 'PUT', `/api/departments/${id}`, { body: { code: 'SPA', name: 'Spa', active } });
  const refused = await close(spa.body.id, false);
  assert.equal(refused.status, 422);
  assert.equal(refused.body.error.code, 'HAS_ROOMS');
  const lab = await department(env, 'LAB', 'Lab');
  await room(env, AREA.room1, 'R1', lab.body.id);
  assert.equal((await close(spa.body.id, false)).status, 200);
  const closedChoice = await room(env, AREA.room1, 'R1', spa.body.id);
  assert.equal(closedChoice.body.error.code, 'DEPARTMENT_CLOSED');
});

test('department: another unit\'s department cannot be given to a room', async () => {
  const env = testEnv();
  const theirs = await call(env, 'POST', '/api/departments', { as: 'admin', unit: 'u-hv', body: { code: 'HV', name: 'Valley' } });
  assert.equal(theirs.status, 201);
  assert.equal((await room(env, AREA.room1, 'R1', theirs.body.id)).status, 404);
});

// ── Recording use ────────────────────────────────────────────────────────────

test('use: the room, the person and the room\'s department go on the ledger', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const spa = await department(env, 'SPA', 'Spa');
  await room(env, AREA.room1, 'R1', spa.body.id);
  const res = await use(env, 'keeper', { areaId: AREA.room1, personId: PEOPLE.staff.id }, oil);
  assert.equal(res.status, 201);
  assert.deepEqual({ ...lastIssue(env) }, {
    area_id: AREA.room1, person_id: PEOPLE.staff.id, person_name: 'Sara Therapist', department_id: spa.body.id, actor_id: PEOPLE.keeper.id,
  });
});

test('use: moving a room to another department leaves past use where it was', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const spa = await department(env, 'SPA', 'Spa');
  const front = await department(env, 'FO', 'Front office');
  await room(env, AREA.room1, 'R1', spa.body.id);
  await use(env, 'keeper', { areaId: AREA.room1, personId: PEOPLE.staff.id }, oil);
  await room(env, AREA.room1, 'R1', front.body.id);
  await use(env, 'keeper', { areaId: AREA.room1, personId: PEOPLE.staff.id }, oil);
  const seen = env.DB.db.prepare(`SELECT department_id FROM movements WHERE kind = 'ISSUE' ORDER BY rowid`).all().map((m) => m.department_id);
  assert.deepEqual(seen, [spa.body.id, front.body.id]);
});

test('use: a unit that has set nothing needs the room and the person', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const noRoom = await use(env, 'keeper', { personId: PEOPLE.staff.id }, oil);
  assert.equal(noRoom.status, 422);
  assert.equal(noRoom.body.error.code, 'ROOM_REQUIRED');
  const noPerson = await use(env, 'keeper', { areaId: AREA.room1 }, oil);
  assert.equal(noPerson.status, 422);
  assert.equal(noPerson.body.error.code, 'PERSON_REQUIRED');
  assert.equal(bal(env, S.main, oil).qty, 20);
});

test('use: a unit can ask for the room only', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'consumption.record': 'room' } })).status, 200);
  assert.equal((await use(env, 'keeper', {}, oil)).body.error.code, 'ROOM_REQUIRED');
  assert.equal((await use(env, 'keeper', { areaId: AREA.room1 }, oil)).status, 201);
  assert.equal(lastIssue(env).person_id, null);
});

test('use: a unit can ask for the person only', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await call(env, 'PUT', '/api/settings', { body: { 'consumption.record': 'person' } });
  assert.equal((await use(env, 'keeper', {}, oil)).body.error.code, 'PERSON_REQUIRED');
  assert.equal((await use(env, 'keeper', { personId: PEOPLE.staff.id }, oil)).status, 201);
  const row = lastIssue(env);
  assert.equal(row.area_id, null);
  assert.equal(row.person_id, PEOPLE.staff.id);
});

test('use: the setting only takes the three choices', async () => {
  const env = testEnv();
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'consumption.record': 'neither' } })).status, 422);
});

test('use: staff are recorded as themselves and cannot put it on somebody else', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const mine = await use(env, 'staff', { areaId: AREA.room1 }, oil);
  assert.equal(mine.status, 201);
  assert.equal(lastIssue(env).person_id, PEOPLE.staff.id);
  assert.equal((await use(env, 'staff', { areaId: AREA.room1, personId: PEOPLE.staff.id }, oil)).status, 201);
  const other = await use(env, 'staff', { areaId: AREA.room1, personId: PEOPLE.keeper.id }, oil);
  assert.equal(other.status, 403);
  assert.equal(other.body.error.code, 'NOT_YOURS');
});

test('use: a person from another unit, or one who has left it, is refused', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const away = await use(env, 'keeper', { areaId: AREA.room1, personId: PEOPLE.hv.id }, oil);
  assert.equal(away.status, 404);
  env.DB.db.prepare(`UPDATE staff_units SET active = 0 WHERE staff_id = ? AND unit_id = ?`).run(PEOPLE.buyer.id, HP);
  assert.equal((await use(env, 'keeper', { areaId: AREA.room1, personId: PEOPLE.buyer.id }, oil)).status, 404);
  assert.equal(bal(env, S.main, oil).qty, 20);
});

test('use: a closed room is refused, and another unit\'s room is not found', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  await call(env, 'PUT', `/api/areas/${AREA.room2}`, { body: { code: 'R2', name: 'Room 2', active: false } });
  const closed = await use(env, 'keeper', { areaId: AREA.room2, personId: PEOPLE.staff.id }, oil);
  assert.equal(closed.status, 422);
  assert.equal(closed.body.error.code, 'AREA_CLOSED');
  env.DB.exec(`INSERT INTO areas (id, unit_id, code, name) VALUES ('ar-hv','u-hv','R9','Valley room')`);
  assert.equal((await use(env, 'keeper', { areaId: 'ar-hv', personId: PEOPLE.staff.id }, oil)).status, 404);
});

test('request: stock given out for a room goes on the person who asked, even after the room closes', async () => {
  const env = testEnv();
  const oil = await stocked(env);
  const spa = await department(env, 'SPA', 'Spa');
  await room(env, AREA.room2, 'R2', spa.body.id);
  const made = await call(env, 'POST', '/api/requests', { as: 'staff', body: { fromStoreId: S.main, areaId: AREA.room2, lines: [{ itemId: oil, qty: 2 }] } });
  assert.equal(made.status, 201);
  const detail = await call(env, 'GET', `/api/requests/${made.body.id}`, { as: 'manager' });
  await call(env, 'POST', `/api/requests/${made.body.id}/decide`, { as: 'manager', body: { action: 'APPROVE' } });
  await call(env, 'PUT', `/api/areas/${AREA.room2}`, { body: { code: 'R2', name: 'Room 2', departmentId: spa.body.id, active: false } });
  const out = await call(env, 'POST', `/api/requests/${made.body.id}/issue`, { as: 'keeper', body: { lines: [{ lineId: detail.body.lines[0].id, qty: 2 }] } });
  assert.equal(out.status, 200);
  const row = lastIssue(env);
  assert.equal(row.person_id, PEOPLE.staff.id);
  assert.equal(row.person_name, 'Sara Therapist');
  assert.equal(row.department_id, spa.body.id);
});

// ── The picker ───────────────────────────────────────────────────────────────

test('picker: names and codes for those who record for others, and nothing for anybody else', async () => {
  const env = testEnv();
  assert.equal((await call(env, 'GET', '/api/people/pick', { as: 'staff' })).status, 403);
  const list = await call(env, 'GET', '/api/people/pick', { as: 'keeper' });
  assert.equal(list.status, 200);
  assert.deepEqual(Object.keys(list.body[0]).sort(), ['code', 'id', 'name']);
  const names = list.body.map((p) => p.name);
  assert.ok(names.includes('Sara Therapist'));
  assert.ok(!names.includes('Vera Viewer'), 'a viewer records nothing');
  assert.ok(!names.includes('Hari Valley'), 'another unit');
});

test('/version names the migration, so a Worker ahead of its database shows', async () => {
  const env = testEnv();
  const ok = await call(env, 'GET', '/version', { as: null });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body.schema.applied, [1, 2]);
});
