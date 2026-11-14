/**
 * Who did what: a therapist (no reports) sees their own name on an item's history and the linen
 * log, and nobody else's, as on their own treatments list. The store and the managers see names.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA, PEOPLE, S, call, makeItem, receive, testEnv } from './helpers/http.js';

test('item history and the linen log name colleagues only to people with reports', async () => {
  const env = testEnv();
  const item = await makeItem(env, { name: 'Oil' });
  await receive(env, item, 30, { storeId: S.sub, unitCost: 10 });
  const use = (as, personId) => call(env, 'POST', '/api/use', { as, body: { storeId: S.sub, areaId: AREA.room1, personId, lines: [{ itemId: item, qty: 1 }] } });
  assert.equal((await use('keeper', PEOPLE.manager.id)).status, 201);
  assert.equal((await use('staff')).status, 201);
  const by = async (as) => (await call(env, 'GET', `/api/items/${item}`, { as })).body.movements
    .filter((m) => m.kind === 'ISSUE').map((m) => m.actor_name).sort((a, b) => String(a).localeCompare(String(b)));
  assert.deepEqual(await by('staff'), [null, PEOPLE.staff.name].sort((a, b) => String(a).localeCompare(String(b))), 'their own line named, the keeper\'s not');
  assert.deepEqual(await by('keeper'), [PEOPLE.keeper.name, PEOPLE.staff.name].sort());
  assert.deepEqual(await by('manager'), [PEOPLE.keeper.name, PEOPLE.staff.name].sort());
  const one = (await call(env, 'GET', `/api/items/${item}`, { as: 'staff' })).body.movements[0];
  assert.equal('actor_id' in one, false, 'the id that decides it is not sent');

  const towel = await makeItem(env, { name: 'Towel', isLinen: true });
  await receive(env, towel, 20, { storeId: S.sub });
  const send = (as) => call(env, 'POST', '/api/linen', { as, body: { storeId: S.sub, itemId: towel, flow: 'ISSUE', qty: 1, areaId: AREA.room1 } });
  const k = await send('keeper');
  const s = await send('staff');
  assert.equal(k.status, 201, JSON.stringify(k.body));
  assert.equal(s.status, 201, JSON.stringify(s.body));
  const names = async (as) => (await call(env, 'GET', '/api/linen', { as })).body.recent.map((m) => m.actor_name).sort((a, b) => String(a).localeCompare(String(b)));
  assert.deepEqual(await names('staff'), [null, PEOPLE.staff.name].sort((a, b) => String(a).localeCompare(String(b))));
  assert.deepEqual(await names('manager'), [PEOPLE.keeper.name, PEOPLE.staff.name].sort());
});
