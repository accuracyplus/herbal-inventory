// /version's status report for HiFive ID's control room (suite architecture standard, "The status
// report format", hifive-id cee2a42; Sinu, 27 Nov 2026: "Add"). Every field is left out when it is
// not known: the control room reads a missing field as "Not reported" and a 0 as a real zero.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { call, testEnv } from './helpers/http.js';
import { releaseReport, stampFrom, toB64 } from '../src/lib/release.js';

const doc = (p) => readFileSync(new URL(`../docs/${p}`, import.meta.url), 'utf8');

test('status report: the keys read from HiFive ID, and what the deploy stamped', async () => {
  const stamp = stampFrom(doc('feature-register.md'), JSON.parse(doc('status.json')));
  const env = testEnv({ RELEASE_FEATURES: toB64(stamp.features), RELEASE_STATUS: toB64(stamp.status) });
  const v = (await call(env, 'GET', '/version')).body;
  assert.equal(v.hifiveKeyMode, 'jwks');
  assert.ok(v.signingKeys.kids.length >= 1, 'the key names read');
  assert.equal(v.signingKeys.source, 'jwks');
  assert.ok(!Number.isNaN(Date.parse(v.signingKeys.readAt)));
  assert.deepEqual(v.features, stamp.features);
  assert.deepEqual(v.status, stamp.status);
  assert.ok(v.build && v.schema, 'nothing that was there before is gone');
});

test('status report: not stamped, or stamped wrong, is left out, never a zero', async () => {
  const bare = (await call(testEnv(), 'GET', '/version')).body;
  assert.equal('features' in bare, false);
  assert.equal('status' in bare, false);
  assert.deepEqual(releaseReport({ RELEASE_FEATURES: 'not base64 json', RELEASE_STATUS: toB64({ openWork: -1, waitingOnSinu: 0, waiting: [] }) }), {});
  assert.deepEqual(releaseReport({ RELEASE_STATUS: toB64({ openWork: 1, waitingOnSinu: 2, waiting: [] }) }), {}, 'more waiting than open is not true');
  assert.deepEqual(releaseReport({ RELEASE_STATUS: toB64({ openWork: 1, waitingOnSinu: 1, waiting: [{ text: 'x', since: '27-11-2026' }] }) }), {}, 'a machine date is yyyy-mm-dd');
});

test('status report: keys HiFive ID cannot give are left out; keys read in the last 10 minutes say when', async () => {
  // A fresh copy of the module is a server that has read no keys yet.
  const cold = await import(`../src/lib/auth.js?cold=${Date.now()}`);
  const down = { ...testEnv(), HFID: { fetch: async () => new Response('{}', { status: 503 }) } };
  assert.equal(await cold.signingKeysStatus(down), null);
  // A server that read them earlier reports that read, with its time, while they are still kept.
  const warm = await import(`../src/lib/auth.js?warm=${Date.now()}`);
  const up = testEnv();
  const first = await warm.signingKeysStatus(up);
  assert.ok(first.kids.length);
  const again = await warm.signingKeysStatus({ ...up, HFID: { fetch: async () => new Response('{}', { status: 503 }) } });
  assert.equal(again.readAt, first.readAt);
});

test('the stamp is counted from the register and the status list, not typed in', () => {
  const reg = '| F-001 | a | d | w | x.test.js: t |\n| F-002 | b | d | w |  |\nnot a row';
  const s = stampFrom(reg, { items: [
    { text: 'one', since: '2026-11-20', waitingOnSinu: true }, { text: 'two', since: '2026-11-21', waitingOnSinu: false },
    ...['3', '4', '5', '6', '7'].map((n) => ({ text: n, since: '2026-11-22', waitingOnSinu: true })),
  ] });
  assert.deepEqual(s.features, { total: 2, untested: 1 });
  assert.equal(s.status.openWork, 7);
  assert.equal(s.status.waitingOnSinu, 6);
  assert.deepEqual(s.status.waiting.map((w) => w.text), ['one', '3', '4', '5', '6'], 'five at most, in the file order');
});

test('docs/status.json is kept true: plain lines, real past dates, no staff names or codes', () => {
  const s = JSON.parse(doc('status.json'));
  assert.ok(Array.isArray(s.items) && s.items.length > 0);
  const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
  for (const i of s.items) {
    assert.ok(typeof i.text === 'string' && i.text.trim().length > 5, JSON.stringify(i));
    assert.match(i.since, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(i.since <= today, `${i.text}: not waiting from the future`);
    assert.equal(typeof i.waitingOnSinu, 'boolean');
    assert.doesNotMatch(i.text, /\b[A-Z]{2,6}\d{2,4}\b/, `${i.text}: no employee codes`);
  }
  assert.ok(releaseReport({ RELEASE_STATUS: toB64(stampFrom('', s).status) }).status, 'what the deploy sends passes the Worker check');
});
