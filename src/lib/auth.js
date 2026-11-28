/**
 * Sign-in and the unit fence.
 *
 * `resolveAuthContext` is the only place a role is decided, as in HiFive Transport and
 * Recruitment. The token says who somebody is; the staff tables here say what they may do.
 *
 * Sign-in is HiFive ID only (RS256, verified against its JWKS through the HFID service
 * binding). There is no PIN: every member of staff already has a HiFive ID account, and a
 * second password is a second thing to forget and a second thing to leak.
 *
 * MULTI-UNIT
 *   A person can hold roles in several units (staff_units). The client names the unit it is
 *   working in with the `x-unit` header; the server checks that the person really holds a
 *   seat there and answers in that unit's scope only. With no header, the unit HiFive ID says
 *   they belong to is used, then their first seat.
 *
 *   A group administrator (staff.group_admin) may enter any active unit with every role. The
 *   flag alone is not enough: the token must also carry HiFive ID's `admin` or `hr` role, so a
 *   flag set by mistake on an ordinary account opens nothing.
 */

import { hfidFetch, jwksPath } from './hfid.js';
import { AuthError } from './errors.js';
import { jsonList } from './data.js';
import { enrolFromGrant } from '../domain/nativerole.js';

export { AuthError };

export const ROLES = ['STAFF', 'STOREKEEPER', 'PURCHASER', 'MANAGER', 'UNIT_ADMIN', 'VIEWER', 'IT', 'HR', 'ACCOUNTS'];

/** What a group administrator holds in whichever unit they enter. */
const GROUP_ROLES = ['UNIT_ADMIN', 'MANAGER', 'STOREKEEPER', 'PURCHASER', 'STAFF'];

export const UNIT_HEADER = 'x-unit';
export const MODULE = 'inventory';

const enc = new TextEncoder();

const b64urlToBytes = (s) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const jsonOf = (seg) => JSON.parse(new TextDecoder().decode(b64urlToBytes(seg)));
const unreadable = () => new AuthError('Sign in again.');

// ── JWKS ─────────────────────────────────────────────────────────────────────
// Cached for the isolate with a TTL, so a key rotation needs no redeploy. The three rules below are
// section 2 of hifive-id-shu/docs/signing-key-design.md. Inventory read the key set from the start,
// so it was counted as ready and never given them; Logistics found the same gap in itself and told
// us (28 Nov 2026, transport f8451ae). Sinu, 28 Nov 2026: "Yes, fix it".
//
//   1. Ten minutes is the ordinary life of a cached key set.
//   2. A kid we have not seen means read the list again BEFORE refusing, so a newly published key
//      is picked up at once rather than in ten minutes' time.
//   3. If HiFive ID cannot be reached, keep the last list rather than refusing everyone, and say so
//      in the log.
let jwksCache = { at: 0, keys: null, retriedAt: 0 };

/** The ordinary life of a cached key set. */
const JWKS_TTL_MS = 10 * 60 * 1000;

/**
 * At most one unknown-kid re-read a minute, per isolate (as Recruitment, Performance and Logistics).
 * Without a limit, a token carrying an invented kid would make this Worker call HiFive ID on every
 * request, and the identity provider is the one component whose failure is everybody's failure.
 */
const JWKS_RETRY_MS = 60 * 1000;

/** One structured line: Workers Logs indexes fields, not sentences. */
const logKeys = (event, detail) => {
  try {
    console.warn(JSON.stringify({ level: 'warn', at: new Date().toISOString(), event, ...detail }));
  } catch { /* logging must never be the thing that fails */ }
};

/**
 * Read the key set from HiFive ID (through the service binding) and remember it. An empty key set
 * is a failure, not an answer: remembering one would refuse every sign-in for ten minutes with
 * nothing to fall back on.
 */
async function readJwks(env) {
  if (!env.HFID_JWKS_URL) throw new AuthError('HiFive ID is not configured.');
  const res = await hfidFetch(env, jwksPath(env));
  if (!res.ok) throw new Error(`the key set answered ${res.status}`);
  const body = await res.json();
  const keys = Array.isArray(body?.keys) ? body.keys : null;
  if (!keys?.length) throw new Error('the key set held no keys');
  jwksCache = { ...jwksCache, at: Date.now(), keys };
  return keys;
}

/**
 * The key set, refreshed when stale, and the one already in hand when it cannot be (rule 3).
 * Before, a failed refresh threw and dropped a list that was merely ten minutes old, so a bad
 * minute at HiFive ID signed everybody out of Inventory too.
 */
async function jwks(env) {
  const now = Date.now();
  if (jwksCache.keys?.length && now - jwksCache.at < JWKS_TTL_MS) return jwksCache.keys;
  try {
    return await readJwks(env);
  } catch (e) {
    if (jwksCache.keys?.length) {
      logKeys('jwks_stale', {
        why: String(e?.message || e).slice(0, 120),
        ageMinutes: Math.round((now - jwksCache.at) / 60000),
        kids: jwksCache.keys.map((k) => k.kid).filter(Boolean),
      });
      return jwksCache.keys;
    }
    // Nothing has ever been read, so there is nothing to carry on with.
    throw e instanceof AuthError ? e : new AuthError('Could not reach HiFive ID.');
  }
}

/**
 * The key a token names (rule 2). The line this replaced:
 *
 *     const jwk = keys.find((k) => k.kid === header.kid) || keys[0];
 *
 * On a kid it had not seen, that tried the first key instead, the signature failed, and the
 * person was told "Sign in again." for up to ten minutes, with nothing in the log naming the kid.
 *
 * A token with NO kid still takes the first key, on purpose: HiFive ID lists its signing key
 * first, so a token already in flight is not refused. It is logged, because it should stop.
 */
async function keyForKid(env, kid) {
  let keys = await jwks(env);
  const found = (ks) => (kid ? ks.find((k) => k.kid === kid) : null);

  let jwk = found(keys);
  if (!jwk && kid) {
    const now = Date.now();
    if (now - jwksCache.retriedAt >= JWKS_RETRY_MS) {
      jwksCache = { ...jwksCache, retriedAt: now };
      try {
        keys = await readJwks(env);
        jwk = found(keys);
        if (jwk) logKeys('jwks_new_kid', { kid });
      } catch (e) {
        // The re-read failing changes nothing: we still hold the list we had.
        logKeys('jwks_reread_failed', { kid, why: String(e?.message || e).slice(0, 120) });
      }
    }
  }

  if (jwk) return jwk;
  if (!kid && keys.length) {
    logKeys('jwks_token_without_kid', { using: keys[0].kid || 'the first key' });
    return keys[0];
  }
  // Refused rather than tried against a key that cannot verify it, which would read as a bad
  // signature, the one thing this is not.
  logKeys('jwks_unknown_kid', { kid, known: keys.map((k) => k.kid).filter(Boolean) });
  return null;
}

/**
 * The signing keys as /version reports them for HiFive ID's control room (suite standard, status
 * report; signing-key-design.md). Inventory reads HiFive ID's published keys and holds no copy.
 * The words match Logistics (transport 5f6a037), so the suite has one vocabulary for the field
 * (Sinu, 28 Nov 2026: "Yes, match Logistics"):
 *
 *   source 'jwks'        read inside the ten-minute window: current
 *   source 'stale'       older than that and a refresh did not work, so the list is being carried
 *   source 'unavailable' nothing has ever been read in this isolate; kids and readAt are null
 *
 * 'stale' is the point: a carried list has the same kids as a healthy one, right up to the day the
 * keys change. It gives up after two seconds (hfidFetch has no timeout of its own) and then reports
 * the list in hand, if any: this app would accept those kids that second, so the report says so.
 */
export async function signingKeysStatus(env, { waitMs = 2000 } = {}) {
  let answered = null;
  try {
    answered = await Promise.race([
      jwks(env),
      new Promise((resolve) => setTimeout(() => resolve(null), waitMs)),
    ]);
  } catch { /* whatever is in hand is reported below; a version endpoint does not throw */ }
  const held = Array.isArray(answered) && answered.length
    ? answered
    : (jwksCache.keys?.length ? jwksCache.keys : null);
  if (!held) return { kids: null, readAt: null, source: 'unavailable' };
  return {
    kids: held.map((k) => k?.kid).filter((k) => typeof k === 'string' && k),
    readAt: jwksCache.at ? new Date(jwksCache.at).toISOString() : null,
    source: jwksCache.at && Date.now() - jwksCache.at < JWKS_TTL_MS ? 'jwks' : 'stale',
  };
}

async function verifySignature(token, env) {
  const [h, p, s] = String(token).split('.');
  if (!h || !p || !s) throw unreadable();
  let header;
  try { header = jsonOf(h); } catch { throw unreadable(); }
  if (header.alg !== 'RS256') throw unreadable();

  const jwk = await keyForKid(env, header.kid);
  if (!jwk) throw unreadable();
  let ok;
  let claims;
  try {
    const key = await crypto.subtle.importKey(
      'jwk', { ...jwk, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'],
    );
    ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(s), enc.encode(`${h}.${p}`));
    claims = jsonOf(p);
  } catch {
    throw unreadable();
  }
  if (!ok) throw unreadable();
  return claims;
}

/** Signature, issuer, audience, expiry: genuinely from HiFive ID and genuinely for this app. */
async function verifiedAssertion(request, env, audience = env.HFID_AUDIENCE) {
  const authz = request.headers.get('authorization') || '';
  if (!authz.startsWith('Bearer ')) throw new AuthError('Sign in to continue.');
  const claims = await verifySignature(authz.slice(7), env);
  if (claims.iss !== env.HFID_ISSUER) throw new AuthError('Sign in again.');
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(audience)) throw new AuthError('This sign-in is not for HiFive Inventory.');
  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp < now) throw new AuthError('Your session has expired. Sign in again.');
  return claims;
}

/** HiFive ID's reconciliation reading this app's roster: admin or hr only. */
export async function requireConsoleAdmin(request, env) {
  const claims = await verifiedAssertion(request, env);
  const role = String(claims.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'hr') throw new AuthError('This is limited to administrators and HR.', 403);
  return claims;
}

/** A HiFive ID service assertion for one named verb (pending, sync). The verb is the boundary. */
export async function requireAssertion(request, env, verb) {
  const claims = await verifiedAssertion(request, env);
  if (claims.svc !== verb) throw new AuthError(`This route needs a HiFive ID ${verb} assertion.`, 403);
  return claims;
}

/** Somebody signed in to the HiFive ID admin console, reading or setting a role here. */
export const CONSOLE_AUDIENCE = 'hifive-id';
export async function requireConsoleSession(request, env) {
  const claims = await verifiedAssertion(request, env, CONSOLE_AUDIENCE);
  if (claims.svc || claims.module !== CONSOLE_AUDIENCE) {
    throw new AuthError('This needs somebody signed in to the HiFive ID console.', 403);
  }
  const role = String(claims.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'hr') throw new AuthError('This is limited to administrators and HR.', 403);
  return claims;
}

const findStaff = (env, code) => env.DB.prepare(
  `SELECT id, code, full_name, group_admin, group_summary, active FROM staff WHERE UPPER(TRIM(code)) = ?`,
).bind(String(code).trim().toUpperCase()).first();

/** Every active seat a person holds, in active units. */
export async function seatsOf(env, staffId) {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.code, u.name, su.roles, su.stores
       FROM staff_units su JOIN units u ON u.id = su.unit_id
      WHERE su.staff_id = ? AND su.active = 1 AND u.active = 1
      ORDER BY u.name`,
  ).bind(staffId).all();
  return (results || []).map((r) => ({
    id: r.id, code: r.code, name: r.name,
    roles: jsonList(r.roles).filter((x) => ROLES.includes(x)),
    stores: r.stores ? jsonList(r.stores) : null,
  })).filter((s) => s.roles.length);
}

async function allUnits(env) {
  const { results } = await env.DB.prepare(
    `SELECT id, code, name FROM units WHERE active = 1 ORDER BY name`,
  ).all();
  return (results || []).map((u) => ({ ...u, roles: GROUP_ROLES, stores: null }));
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * The choke point.
 *
 * Returns { staffId, code, fullName, groupAdmin, unit, unitId, roles, stores, units, ... }.
 */
export async function resolveAuthContext(request, env) {
  const claims = await verifiedAssertion(request, env);
  // Audience alone does not identify a module in HiFive ID; the `module` claim does.
  if (claims.module !== MODULE) throw new AuthError('This sign-in is for a different HiFive module.', 403);
  if (claims.svc) throw new AuthError('A service assertion cannot be used as a sign-in.', 403);
  if (!claims.sub) throw new AuthError('Sign in again.');
  if (!claims.emp_code) {
    throw new AuthError('Your HiFive ID account has no employee code. Ask HR to add one.', 403);
  }

  // The join is the employee code, never the token's `sub` — see HiFive Transport's auth.js.
  let staff = await findStaff(env, claims.emp_code);
  if (!staff && await enrolFromGrant(env, claims)) staff = await findStaff(env, claims.emp_code);
  if (!staff) throw new AuthError('You are not set up in HiFive Inventory yet. Ask your unit administrator to add you.', 403);
  if (!staff.active) throw new AuthError('Your HiFive Inventory access has been withdrawn.', 403);

  const hfRole = String(claims.role || '').toLowerCase();
  const groupAdmin = !!staff.group_admin && (hfRole === 'admin' || hfRole === 'hr');

  const units = groupAdmin ? await allUnits(env) : await seatsOf(env, staff.id);
  if (!units.length) {
    throw new AuthError(groupAdmin
      ? 'No unit has been set up yet.'
      : 'You have no role in any unit of HiFive Inventory. Ask your unit administrator.', 403);
  }

  const asked = request.headers.get(UNIT_HEADER);
  let unit;
  if (asked) {
    unit = units.find((u) => u.id === asked);
    // A unit you hold no seat in is answered as if it did not exist.
    if (!unit) throw new AuthError('You do not have access to that unit.', 403);
  } else {
    unit = units.find((u) => norm(u.name) === norm(claims.entity)) || units[0];
  }

  const me = {
    staffId: staff.id,
    code: staff.code,
    fullName: staff.full_name,
    groupAdmin,
    groupSummary: groupAdmin || !!staff.group_summary,
    unit: { id: unit.id, code: unit.code, name: unit.name },
    unitId: unit.id,
    roles: unit.roles,
    stores: unit.stores,
    units: units.map((u) => ({ id: u.id, code: u.code, name: u.name, roles: u.roles })),
    hfIdSub: claims.sub,
    hfIdRole: claims.role ?? null,
    expiresAt: claims.exp ?? null,
  };
  refuseViewerWrite(me, request);
  return me;
}

/**
 * A Viewer reads. Refused here, where every request passes, rather than left to each handler —
 * the lesson HiFive Transport learned on 5 November 2026.
 */
// Their own language and "walkthrough seen" are the person's settings, not a record of stock (D-043).
const VIEWER_MAY_POST = new Set(['/auth/hfid/arrived', '/api/me/prefs']);

function refuseViewerWrite(user, request) {
  if (request.method === 'GET' || !user.roles.every((r) => r === 'VIEWER')) return;
  if (VIEWER_MAY_POST.has(new URL(request.url).pathname)) return;
  throw new AuthError('You have view-only access here. Ask your unit administrator if you need to record this.', 403);
}

export function hasRole(user, ...allowed) {
  return user.roles.some((r) => allowed.includes(r));
}

export function requireRole(user, ...allowed) {
  if (!hasRole(user, ...allowed)) throw new AuthError('Your role does not allow this.', 403);
}
