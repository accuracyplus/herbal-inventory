/**
 * Who is a facility's unit head, read from HiFive ID's facility contacts (Sinu, 27 Nov 2026: "IT
 * purchase requests (SIM, phone and so on) are approved by the facility's unit head first, then
 * Accounts". Unit heads are kept in HiFive ID, so Inventory keeps no list of its own: suite
 * architecture standard, "holds no copy of a fact another app owns").
 *
 * HiFive ID's GET /service/facility-contacts answers a service token that sees the unit heads only
 * (names and employee codes, never emails), the same view Learning Point's training token has. The
 * token is the HFID_CONTACTS_TOKEN secret. Without it the unit head's step cannot be taken, and
 * every screen says so: it never falls back to somebody else.
 *
 * A unit is matched to its facility by name: an Inventory unit's name is HiFive ID's entity name,
 * as the staff list already assumes (lib/roster.js). The Primary and the Secondary both count as
 * the unit head, as long as HiFive ID still offers them (somebody who has left is not).
 */
import { DomainError } from './errors.js';
import { hfidFetch } from './hfid.js';

export const CONTACTS_PATH = '/service/facility-contacts';
/** One answer serves every unit for a few minutes; a change in HiFive ID shows within that. */
const KEEP_MS = 5 * 60e3;
/** Per environment, so a test's HiFive ID never answers for another's. { at, facilities } */
const kept = new WeakMap();

const norm = (s) => String(s ?? '').trim().toLowerCase();
const codeOf = (p) => (p && p.emp_code ? String(p.emp_code).trim().toUpperCase() : null);

export const unitHeadsSetUp = (env) => !!env.HFID_CONTACTS_TOKEN;

async function facilities(env, now) {
  const k = kept.get(env);
  if (k && now - k.at < KEEP_MS) return k.facilities;
  let res;
  try {
    res = await hfidFetch(env, CONTACTS_PATH, { headers: { authorization: `Bearer ${env.HFID_CONTACTS_TOKEN}` } });
  } catch {
    throw new DomainError('HFID_CONTACTS', 'HiFive ID could not be reached to confirm the unit head. Try again shortly.', 502);
  }
  if (!res.ok) {
    throw new DomainError('HFID_CONTACTS', `HiFive ID did not confirm the unit head (${res.status}). Try again shortly.`, 502);
  }
  const body = await res.json().catch(() => null);
  if (!body || !Array.isArray(body.facilities)) {
    throw new DomainError('HFID_CONTACTS', 'HiFive ID sent facility contacts Inventory could not read.', 502);
  }
  kept.set(env, { at: now, facilities: body.facilities });
  return body.facilities;
}

/**
 * The unit heads of the facility a unit stands for: { codes: Set of employee codes, names: [] }.
 * null when the HiFive ID link is not set up. Throws HFID_CONTACTS when HiFive ID does not answer,
 * so a caller can say it could not check instead of saying there is nobody.
 */
export async function unitHeadsOf(env, unitName, now = Date.now()) {
  if (!unitHeadsSetUp(env)) return null;
  const list = await facilities(env, now);
  const f = list.find((x) => norm(x.entity) === norm(unitName));
  const head = f?.contacts?.unit_head;
  const people = [head?.primary, head?.secondary].filter((p) => codeOf(p));
  return { codes: new Set(people.map(codeOf)), names: people.map((p) => String(p.name || codeOf(p)).trim()) };
}
