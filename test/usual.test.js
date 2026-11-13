/**
 * Record use asks less (approved prototype, 13 Nov 2026): the person's usual items in a store and
 * the room they used last, from their own recorded use only; and their own count for Today.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA, PEOPLE, S, call, makeItem, receive, testEnv } from './helpers/http.js';

const use = (env, as, itemId, areaId = AREA.room1, extra = {}) =>
  call(env, 'POST', '/api/use', { as, body: { storeId: S.sub, areaId, lines: [{ itemId, qty: 1 }], ...extra } });
const usual = async (env, as = 'staff', store = S.sub) => (await call(env, 'GET', `/api/use/usual?store=${store}`, { as })).body;

async function setUp() {
  const env = testEnv();
  env.oil = await makeItem(env, { name: 'Oil' });
  env.powder = await makeItem(env, { name: 'Powder' });
  env.cloth = await makeItem(env, { name: 'Cloth' });
  for (const id of [env.oil, env.powder, env.cloth]) await receive(env, id, 50, { storeId: S.sub });
  return env;
}

test('usual items: most used first, the room used last, and nothing for someone with no history', async () => {
  const env = await setUp();
  const first = await usual(env);
  assert.deepEqual(first, { items: [], lastAreaId: null }, 'a new joiner gets no chips and no room');
  for (let i = 0; i < 3; i++) assert.equal((await use(env, 'staff', env.oil)).status, 201);
  await use(env, 'staff', env.powder);
  await use(env, 'staff', env.powder, AREA.room2);
  const u = await usual(env);
  assert.deepEqual(u.items.map((i) => i.itemId), [env.oil, env.powder]);
  assert.equal(u.items[0].times, 3);
  assert.equal(u.lastAreaId, AREA.room2, 'the room they used last');
});

test('usual items are the person\'s own: someone else\'s use is never counted or shown', async () => {
  const env = await setUp();
  await use(env, 'keeper', env.cloth, AREA.room2, { personId: PEOPLE.keeper.id });
  await use(env, 'staff', env.oil);
  const u = await usual(env);
  assert.deepEqual(u.items.map((i) => i.itemId), [env.oil]);
  assert.equal(u.lastAreaId, AREA.room1);
});

test('another store, an item taken off the list, or a room closed, are left out', async () => {
  const env = await setUp();
  await use(env, 'staff', env.oil);
  await use(env, 'staff', env.powder);
  assert.deepEqual((await usual(env, 'staff', S.main)).items, [], 'only the store asked about');
  env.DB.db.prepare(`UPDATE items SET active = 0 WHERE id = ?`).run(env.powder);
  assert.deepEqual((await usual(env)).items.map((i) => i.itemId), [env.oil]);
  env.DB.db.prepare(`UPDATE areas SET active = 0 WHERE id = ?`).run(AREA.room1);
  assert.equal((await usual(env)).lastAreaId, null);
});

test('usual items need the right to record use', async () => {
  const env = await setUp();
  assert.equal((await call(env, 'GET', `/api/use/usual?store=${S.sub}`, { as: 'viewer' })).status, 403);
});

test('Today counts the person\'s own uses today', async () => {
  const env = await setUp();
  assert.equal((await call(env, 'GET', '/api/today', { as: 'staff' })).body.myUses, 0);
  await use(env, 'staff', env.oil);
  await use(env, 'staff', env.powder);
  await use(env, 'keeper', env.cloth, AREA.room2, { personId: PEOPLE.keeper.id });
  assert.equal((await call(env, 'GET', '/api/today', { as: 'staff' })).body.myUses, 2);
});
