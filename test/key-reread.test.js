/**
 * Reading HiFive ID's signing keys when they change (signing-key design, section 2).
 *
 * Every test here was written against the line Inventory had until 28 Nov 2026:
 *
 *     const jwk = keys.find((k) => k.kid === header.kid) || keys[0];
 *
 * A token signed by a newly published key carries a kid this app has not seen; that line tried the
 * first key instead, and everybody was told "Sign in again." for up to ten minutes, with nothing in
 * the log. Ported from Logistics (transport f8451ae, test/key-reread.test.js), which found the gap
 * in itself and then in Inventory. Sinu, 28 Nov 2026: "Yes, fix it".
 *
 * `requireAssertion` is the probe: it checks signature, issuer, audience and expiry with no staff
 * row, so these exercise the key choice and nothing else. Each test imports its own copy of
 * auth.js, because the key set is cached in module scope.
 */

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';

const ISSUER = 'hifive-id';
const AUDIENCE = 'hifive-inventory';

/** A key pair and the JWK HiFive ID would publish for it. */
const keyPair = (kid) => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return { kid, privateKey, jwk: { ...publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' } };
};

/** A token as HiFive ID mints one. `kid: null` is a token from before kids were stamped. */
const tokenFrom = (key, { kid = key.kid, svc = 'pending', claims = {} } = {}) => {
  const seg = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const header = { alg: 'RS256', typ: 'JWT' };
  if (kid) header.kid = kid;
  const now = Math.floor(Date.now() / 1000);
  const body = `${seg(header)}.${seg({ iss: ISSUER, aud: AUDIENCE, sub: 'hf-1', svc, iat: now, exp: now + 3600, ...claims })}`;
  return `${body}.${createSign('RSA-SHA256').update(body).sign(key.privateKey, 'base64url')}`;
};

const ask = (token) => new Request('https://worker.test/service/pending', {
  headers: { authorization: `Bearer ${token}` },
});

/**
 * One isolate's worth of this app: its own copy of auth.js, and a HiFive ID whose published key
 * set the test can change between calls while counting how often it is asked.
 */
let instance = 0;
async function freshApp(published) {
  const auth = await import(`../src/lib/auth.js?case=${instance += 1}`);
  const hfid = { calls: 0, keys: published };
  const env = {
    HFID_JWKS_URL: 'https://hifive-id.test/.well-known/jwks.json',
    HFID_ISSUER: ISSUER,
    HFID_AUDIENCE: AUDIENCE,
    HFID: {
      fetch: async () => {
        hfid.calls += 1;
        if (hfid.keys === 'down') return new Response('no', { status: 503 });
        return new Response(JSON.stringify({ keys: hfid.keys }));
      },
    },
  };
  return { auth, env, hfid };
}

/** Everything the app wrote to the log during one test. */
let logged;
const realWarn = console.warn;
beforeEach(() => {
  logged = [];
  console.warn = (line) => { try { logged.push(JSON.parse(line)); } catch { logged.push({ raw: line }); } };
});
afterEach(() => { console.warn = realWarn; });
const events = () => logged.map((l) => l.event);

describe('a key that appears after the list was read', () => {
  test('is picked up at once, not in ten minutes', async () => {
    const [current, next] = [keyPair('hifive-id-2026-07'), keyPair('hifive-id-2027-11')];
    const { auth, env, hfid } = await freshApp([current.jwk]);

    // A sign-in first, so the key set is cached with one key in it — the state every isolate is
    // in on the morning of a rotation.
    await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');
    assert.equal(hfid.calls, 1);

    // HiFive ID publishes the next key and signs with it.
    hfid.keys = [current.jwk, next.jwk];
    const claims = await auth.requireAssertion(ask(tokenFrom(next)), env, 'pending');

    assert.equal(claims.sub, 'hf-1', 'the token was refused: this is the rotation failure');
    assert.equal(hfid.calls, 2, 'the unknown kid did not make it read the list again');
    assert.ok(events().includes('jwks_new_kid'), `the new kid went unlogged: ${events().join(', ')}`);
  });

  test('and the one it already knows still works, from the cache', async () => {
    const current = keyPair('hifive-id-2026-07');
    const { auth, env, hfid } = await freshApp([current.jwk]);
    await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');
    await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');
    assert.equal(hfid.calls, 1, 'a known kid must not cost a call to HiFive ID');
    assert.deepEqual(events(), []);
  });
});

describe('the re-read is rationed', () => {
  test('at most once a minute, however many bad tokens arrive', async () => {
    const current = keyPair('hifive-id-2026-07');
    const stranger = keyPair('not-a-hifive-key');
    const { auth, env, hfid } = await freshApp([current.jwk]);
    await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');

    for (let i = 0; i < 5; i += 1) {
      await assert.rejects(() => auth.requireAssertion(ask(tokenFrom(stranger)), env, 'pending'));
    }
    /*
     * Why this is rationed: HiFive ID is the one component whose failure is everybody's failure,
     * and without a limit any token carrying an invented kid is a lever on it.
     */
    assert.equal(hfid.calls, 2, 'five invented kids caused five calls to the identity provider');
    assert.equal(events().filter((e) => e === 'jwks_unknown_kid').length, 5,
      'every refusal says which kid it did not know');
  });

  test('and a token nobody can verify is refused as unknown, not as a bad signature', async () => {
    const current = keyPair('hifive-id-2026-07');
    const stranger = keyPair('someone-elses-key');
    const { auth, env } = await freshApp([current.jwk]);
    await assert.rejects(() => auth.requireAssertion(ask(tokenFrom(stranger)), env, 'pending'),
      /Sign in again/);
    const line = logged.find((l) => l.event === 'jwks_unknown_kid');
    assert.ok(line, 'nothing in the log names the kid, which is the whole fault');
    assert.equal(line.kid, 'someone-elses-key');
    assert.deepEqual(line.known, ['hifive-id-2026-07'], 'and what it did know, for the comparison');
  });
});

describe('when HiFive ID cannot be reached', () => {
  test('the list it already holds carries on being used', async () => {
    const current = keyPair('hifive-id-2026-07');
    const { auth, env, hfid } = await freshApp([current.jwk]);
    await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');

    // Eleven minutes later, with HiFive ID down: the cached set is stale and cannot be refreshed.
    mock.timers.enable({ apis: ['Date'], now: Date.now() + 11 * 60 * 1000 });
    try {
      hfid.keys = 'down';
      const claims = await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');
      /*
       * Before this, the failed refresh threw and the throw replaced a key set that was merely
       * eleven minutes old — so a bad minute at HiFive ID signed everybody out of Inventory.
       * One system's fault reported as two.
       */
      assert.equal(claims.sub, 'hf-1', 'a fault at HiFive ID signed this person out');
      const line = logged.find((l) => l.event === 'jwks_stale');
      assert.ok(line, 'it carried on using a stale list without saying so');
      assert.equal(line.ageMinutes, 11);
      assert.deepEqual(line.kids, ['hifive-id-2026-07']);
    } finally {
      mock.timers.reset();
    }
  });

  test('but a list that was never read is not invented', async () => {
    const { auth, env } = await freshApp('down');
    const key = keyPair('hifive-id-2026-07');
    await assert.rejects(() => auth.requireAssertion(ask(tokenFrom(key)), env, 'pending'),
      /Could not reach HiFive ID/);
  });

  test('and an empty key set is a failure, not an answer worth remembering', async () => {
    const current = keyPair('hifive-id-2026-07');
    const { auth, env, hfid } = await freshApp([]);
    await assert.rejects(() => auth.requireAssertion(ask(tokenFrom(current)), env, 'pending'));

    // Had the empty set been cached, this would refuse for ten minutes with nothing to fall back
    // on — the opposite of the rule above.
    hfid.keys = [current.jwk];
    const claims = await auth.requireAssertion(ask(tokenFrom(current)), env, 'pending');
    assert.equal(claims.sub, 'hf-1');
  });
});

describe('a token from before kids were stamped', () => {
  test('takes the first key in the list, and is logged', async () => {
    const current = keyPair('hifive-id-2026-07');
    const { auth, env } = await freshApp([current.jwk, keyPair('hifive-id-2027-11').jwk]);
    const claims = await auth.requireAssertion(ask(tokenFrom(current, { kid: null })), env, 'pending');
    assert.equal(claims.sub, 'hf-1');
    /*
     * Kept deliberately: HiFive ID lists its signing key first and Recruitment relies on the same
     * order, so a token already in flight is not refused. Logged because it should become rare and
     * then stop — if this line is still appearing in a year, something is minting tokens without a
     * kid and wants finding.
     */
    const line = logged.find((l) => l.event === 'jwks_token_without_kid');
    assert.ok(line, 'an unkeyed token was accepted silently');
    assert.equal(line.using, 'hifive-id-2026-07');
  });

  test('and is still refused if the first key is not the one that signed it', async () => {
    const [current, other] = [keyPair('hifive-id-2026-07'), keyPair('hifive-id-2027-11')];
    const { auth, env } = await freshApp([current.jwk, other.jwk]);
    // Signed by the second key but naming no kid: the fallback must not become a way in.
    await assert.rejects(() => auth.requireAssertion(ask(tokenFrom(other, { kid: null })), env, 'pending'),
      /Sign in again/);
  });
});

describe('what /version reports about the keys', () => {
  test('is the kids in hand, and survives the provider being down', async () => {
    const current = keyPair('hifive-id-2026-07');
    const { auth, env, hfid } = await freshApp([current.jwk]);
    assert.deepEqual((await auth.signingKeysStatus(env)).kids, ['hifive-id-2026-07']);
    mock.timers.enable({ apis: ['Date'], now: Date.now() + 11 * 60 * 1000 });
    try {
      hfid.keys = 'down';
      assert.deepEqual((await auth.signingKeysStatus(env))?.kids, ['hifive-id-2026-07'],
        'the control room row went blank because HiFive ID had a bad minute');
    } finally {
      mock.timers.reset();
    }
  });
});
