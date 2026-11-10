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

export const ROLES = ['STAFF', 'STOREKEEPER', 'PURCHASER', 'MANAGER', 'UNIT_ADMIN', 'VIEWER'];

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

// ── JWKS, cached for the isolate with a TTL so a key rotation needs no redeploy ──
let jwksCache = { at: 0, keys: null };

async function jwks(env) {
  const now = Date.now();
  if (jwksCache.keys && now - jwksCache.at < 10 * 60 * 1000) return jwksCache.keys;
  if (!env.HFID_JWKS_URL) throw new AuthError('HiFive ID is not configured.');
  const res = await hfidFetch(env, jwksPath(env));
  if (!res.ok) throw new AuthError('Could not reach HiFive ID.');
  const body = await res.json();
  jwksCache = { at: now, keys: body.keys || [] };
  return jwksCache.keys;
}

async function verifySignature(token, env) {
  const [h, p, s] = String(token).split('.');
  if (!h || !p || !s) throw unreadable();
  let header;
  try { header = jsonOf(h); } catch { throw unreadable(); }
  if (header.alg !== 'RS256') throw unreadable();

  const keys = await jwks(env);
  const jwk = keys.find((k) => k.kid === header.kid) || keys[0];
  if (!jwk) throw new AuthError('Sign in again.');
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
  `SELECT id, code, full_name, group_admin, active FROM staff WHERE UPPER(TRIM(code)) = ?`,
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
const VIEWER_MAY_POST = new Set(['/auth/hfid/arrived']);

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
