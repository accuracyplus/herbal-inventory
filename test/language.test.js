/**
 * The interface language and the first-login walkthrough (Design Guide D-043): saved on the
 * person here, handed to HiFive ID, and HiFive ID's own choice passed back when it has one.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { call, testEnv } from './helpers/http.js';

const me = async (env, as = 'staff') => (await call(env, 'GET', '/api/me', { as })).body;
const save = (env, body, as = 'staff') => call(env, 'PUT', '/api/me/prefs', { as, body });

test('language: never chosen is null, then saved on the person and on nobody else', async () => {
  const env = testEnv();
  assert.equal((await me(env)).lang, null);
  assert.equal((await me(env)).tourDoneAt, null);
  const r = await save(env, { lang: 'ml' });
  assert.equal(r.status, 200);
  assert.equal(r.body.lang, 'ml');
  assert.equal((await me(env)).lang, 'ml');
  assert.equal((await me(env, 'keeper')).lang, null, 'one person\'s choice is theirs alone');
  assert.equal((await save(env, { lang: 'fr' })).body.error.code, 'BAD_LANG');
  assert.equal((await save(env, {})).body.error.code, 'NOTHING');
  assert.equal((await save(env, { lang: null })).body.lang, null, 'back to "not chosen"');
});

test('language: handed to HiFive ID; a refusal there never fails the save', async () => {
  const sent = [];
  const env = testEnv();
  const real = env.HFID.fetch;
  env.HFID.fetch = async (req, init) => {
    const r = req instanceof Request ? req : new Request(req, init);
    if (new URL(r.url).pathname === '/me/prefs') { sent.push({ method: r.method, body: await r.json() }); return new Response('{}', { status: 400 }); }
    return real(req, init);
  };
  const r = await save(env, { lang: 'ml' });
  assert.equal(r.status, 200);
  assert.equal(r.body.savedInHfid, false);
  assert.deepEqual(sent, [{ method: 'PATCH', body: { lang: 'ml' } }]);
  assert.equal((await me(env)).lang, 'ml', 'kept here all the same');
});

test('walkthrough: done, and replayable', async () => {
  const env = testEnv();
  assert.match((await save(env, { tourDone: true })).body.tourDoneAt, /^\d{4}-/);
  assert.equal((await save(env, { tourDone: false })).body.tourDoneAt, null);
});

test('appearance: HiFive ID\'s language passes through only when it is one Inventory has', async () => {
  const env = testEnv();
  env.me = { prefs: { skin: 'water', style: 'soft', mode: 'light', lang: 'ml' } };
  assert.deepEqual((await call(env, 'GET', '/api/appearance', { as: 'staff' })).body.prefs, { skin: 'water', style: 'soft', mode: 'light', lang: 'ml' });
  env.me = { prefs: { skin: 'water', style: 'soft', mode: 'light', lang: 'ar' } };
  assert.equal((await call(env, 'GET', '/api/appearance', { as: 'staff' })).body.prefs.lang, null);
});

test('a Worker live before migration 0011 still signs people in, and does not show the walkthrough every time', async () => {
  const env = testEnv();
  env.DB.db.exec('ALTER TABLE staff DROP COLUMN tour_done_at; ALTER TABLE staff DROP COLUMN lang;');
  const r = await call(env, 'GET', '/api/me', { as: 'staff' });
  assert.equal(r.status, 200);
  assert.equal(r.body.lang, null);
  assert.equal(r.body.tourDoneAt, 'unavailable');
});

test('a viewer, who records nothing, may still choose a language and finish the walkthrough', async () => {
  const env = testEnv();
  const r = await save(env, { lang: 'ml', tourDone: true }, 'viewer');
  assert.equal(r.status, 200);
  assert.equal((await me(env, 'viewer')).lang, 'ml');
  assert.ok((await me(env, 'viewer')).tourDoneAt);
  const write = await call(env, 'POST', '/api/requests', { as: 'viewer', body: { lines: [] } });
  assert.equal(write.status, 403, 'every other write is still refused');
});
