import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, hfidToken, HP, HV, PEOPLE, S, testEnv } from './helpers/http.js';

test('no token is refused, and says to sign in', async () => {
  const env = testEnv();
  const res = await call(env, 'GET', '/api/me', { as: null });
  assert.equal(res.status, 401);
  assert.match(res.body.error.message, /Sign in/);
});

test('a token for another HiFive module is refused', async () => {
  const env = testEnv();
  const res = await call(env, 'GET', '/api/me', { token: hfidToken({ emp_code: 'HPK001', module: 'transport' }) });
  assert.equal(res.status, 403);
});

test('an expired token is refused', async () => {
  const env = testEnv();
  const res = await call(env, 'GET', '/api/me', { token: hfidToken({ emp_code: 'HPK001', exp: 1000 }) });
  assert.equal(res.status, 401);
});

test('a token with a broken signature is refused', async () => {
  const env = testEnv();
  const t = hfidToken({ emp_code: 'HPK001' });
  const res = await call(env, 'GET', '/api/me', { token: `${t.slice(0, -6)}AAAAAA` });
  assert.equal(res.status, 401);
});

test('sign-in joins on the employee code, whatever its case', async () => {
  const env = testEnv();
  const res = await call(env, 'GET', '/api/me', { token: hfidToken({ emp_code: 'hpk001' }) });
  assert.equal(res.status, 200);
  assert.equal(res.body.name, 'Kiran Keeper');
  assert.deepEqual(res.body.roles, ['STOREKEEPER']);
  assert.ok(res.body.can.includes('receive'));
  assert.ok(!res.body.can.includes('adjust.decide'));
});

test('somebody unknown is told to ask, unless a grant role is configured', async () => {
  const env = testEnv();
  const t = hfidToken({ emp_code: 'HPNEW9', name: 'New Person', entity: 'Herbal Park' });
  const refused = await call(env, 'GET', '/api/me', { token: t });
  assert.equal(refused.status, 403);
  assert.match(refused.body.error.message, /not set up/);

  env.HFID_GRANT_ROLE = 'STAFF';
  const granted = await call(env, 'GET', '/api/me', { token: t });
  assert.equal(granted.status, 200);
  assert.deepEqual(granted.body.roles, ['STAFF']);
  assert.equal(granted.body.unit.id, HP);
});

test('a grant never gives unit administrator, whatever the setting says', async () => {
  const env = testEnv({ HFID_GRANT_ROLE: 'UNIT_ADMIN' });
  const res = await call(env, 'GET', '/api/me', { token: hfidToken({ emp_code: 'HPNEW8', entity: 'Herbal Park' }) });
  assert.equal(res.status, 403);
});

test('a unit you hold no seat in is refused, and its data is not shown', async () => {
  const env = testEnv();
  const res = await call(env, 'GET', '/api/stock', { as: 'keeper', unit: HV });
  assert.equal(res.status, 403);
  const own = await call(env, 'GET', '/api/stock', { as: 'hv' });
  assert.equal(own.status, 200);
  assert.deepEqual(own.body.stores.map((s) => s.id), [S.hvMain]);
});

test('a group administrator can enter any unit, but only with HiFive ID admin or hr', async () => {
  const env = testEnv();
  const ok = await call(env, 'GET', '/api/me', { as: 'admin', unit: HV });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.unit.id, HV);
  assert.equal(ok.body.groupAdmin, true);
  // Same flag, but HiFive ID says "employee": the flag alone opens nothing.
  const plain = await call(env, 'GET', '/api/me', { token: hfidToken({ emp_code: PEOPLE.admin.code, role: 'employee' }), unit: HV });
  assert.equal(plain.status, 403);
});

test('a viewer reads, and every write is refused at the choke point', async () => {
  const env = testEnv();
  assert.equal((await call(env, 'GET', '/api/stock', { as: 'viewer' })).status, 200);
  const res = await call(env, 'POST', '/api/requests', { as: 'viewer', body: { areaId: 'x', lines: [] } });
  assert.equal(res.status, 403);
  assert.match(res.body.error.message, /view-only/);
});

test('a staff member tied to the sub store cannot record against the main store', async () => {
  const env = testEnv();
  const res = await call(env, 'POST', '/api/use', { as: 'staff', body: { storeId: S.main, lines: [{ itemId: 'x', qty: 1 }] } });
  assert.equal(res.status, 403);
  assert.match(res.body.error.message, /not set up to record against Main store/);
});

test('CORS: the preflight lists every header the client sends', async () => {
  const env = testEnv();
  const res = await call(env, 'OPTIONS', '/api/me', { as: null });
  const allowed = res.headers.get('access-control-allow-headers').split(',');
  for (const h of ['authorization', 'content-type', 'x-unit']) assert.ok(allowed.includes(h), h);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://inventory.test');
});

test('/version answers without a token and reports the schema level', async () => {
  const env = testEnv();
  const res = await call(env, 'GET', '/version', { as: null });
  assert.equal(res.status, 200);
  assert.equal(res.body.schema.ok, true);
});

test('the sign-in is recorded once per token and links the HiFive ID subject', async () => {
  const env = testEnv();
  const t = hfidToken({ emp_code: 'HPK001', sub: 'hf-keeper-sub' });
  const a = await call(env, 'POST', '/auth/hfid/arrived', { token: t });
  const b = await call(env, 'POST', '/auth/hfid/arrived', { token: t });
  assert.equal(a.body.recorded, true);
  assert.equal(a.body.linked, true);
  assert.equal(b.body.recorded, false);
  assert.equal(env.DB.db.prepare(`SELECT hfid_sub FROM staff WHERE code = 'HPK001'`).get().hfid_sub, 'hf-keeper-sub');
});
