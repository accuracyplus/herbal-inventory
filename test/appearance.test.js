/**
 * The appearance a person chose in HiFive ID, read for the page by this Worker.
 * The page may only talk to this Worker, so it cannot ask HiFive ID itself.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, testEnv } from './helpers/http.js';

test('the choice saved in HiFive ID is passed on, asked for with the person’s own session', async () => {
  const meCalls = [];
  const env = testEnv({ me: { sub: 'u1', prefs: { skin: 'earth', style: 'soft', mode: 'dark', extra: 'ignored' } }, meCalls });
  const r = await call(env, 'GET', '/api/appearance', { as: 'staff' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { known: true, prefs: { skin: 'earth', style: 'soft', mode: 'dark', lang: null } });
  assert.equal(meCalls.length, 1);
  assert.equal(meCalls[0].aud, 'hifive-inventory');
  assert.match(meCalls[0].bearer, /^Bearer ey/, 'HiFive ID is asked as the person, not as the app');
});

test('a choice the person cleared comes through as cleared, so the default returns', async () => {
  const env = testEnv({ me: { prefs: { skin: null, style: null, mode: null } } });
  const r = await call(env, 'GET', '/api/appearance', { as: 'staff' });
  assert.deepEqual(r.body, { known: true, prefs: { skin: null, style: null, mode: null, lang: null } });
});

test('when HiFive ID has nothing to say, the page is told nothing is known and keeps what it wears', async () => {
  const env = testEnv();
  for (const me of [{ sub: 'u1' }, { prefs: null }, 401, 500, new Error('unreachable')]) {
    env.me = me;
    const r = await call(env, 'GET', '/api/appearance', { as: 'staff' });
    assert.equal(r.status, 200, 'appearance never fails a screen');
    assert.deepEqual(r.body, { known: false });
  }
});

test('nobody signed out can ask', async () => {
  const r = await call(testEnv(), 'GET', '/api/appearance', { as: null });
  assert.equal(r.status, 401);
});
