/**
 * The staff register, from HiFive ID — the way HiFive Transport's lib/roster.js reads it.
 *
 * HiFive ID is where people are created, renamed and marked as having left. Inventory reads its
 * `/roster?app=inventory` and compares it with who holds a seat in the unit, so that adding
 * somebody is picking a name rather than typing a code, and a leaver is noticed as a value
 * HiFive ID sends rather than a seat somebody eventually remembers to remove.
 *
 * READ WITH THE ADMINISTRATOR'S OWN SESSION. The roster accepts a person's token for the app it
 * was issued to. Inventory has no scheduled job (everything is worked out when a screen opens),
 * so it needs no long-lived service token, and HiFive ID's log shows who read the register.
 *
 * NOTHING HERE CHANGES ANYBODY. The comparison is put in front of an administrator with the
 * buttons beside it. Transport learned why: three people once shared one exit date after a bulk
 * edit in HiFive ID, and anything that had acted on it would have locked out people still at work.
 *
 * What is kept from the register: the employee code (the sign-in join) and the name. Email,
 * department, designation and dates are read for the screen and stored nowhere.
 */

import { DomainError } from './errors.js';
import { hfidFetch } from './hfid.js';
import { gstDate } from './data.js';

export const ROSTER_PATH = '/roster?app=inventory';
const JOINER_DAYS = 30;

export async function fetchRoster(env, bearer) {
  if (!bearer) throw new DomainError('HFID_ROSTER', 'Sign in again to read the staff list from HiFive ID.', 401);
  let res;
  try {
    res = await hfidFetch(env, ROSTER_PATH, { headers: { authorization: `Bearer ${bearer}` } });
  } catch {
    throw new DomainError('HFID_ROSTER', 'HiFive ID could not be reached for the staff list. Try again shortly.', 502);
  }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok || !Array.isArray(body?.staff)) {
    // HiFive ID's own reason, passed through: "unknown_app" means Inventory is not registered
    // there yet, which the person reading it can act on.
    throw new DomainError('HFID_ROSTER',
      `HiFive ID did not return the staff list${body?.message ? `: ${body.message}` : body?.error ? ` (${body.error})` : ` (${res.status})`}.`, 502);
  }
  return { asOf: body.as_of ?? null, staff: body.staff };
}

const normCode = (c) => String(c || '').trim().toUpperCase();
const norm = (s) => String(s ?? '').trim().toLowerCase();
export const hasLeft = (r, today = gstDate()) => r.status === 'exited' || (!!r.end_date && r.end_date <= today);

/** The register by employee code. Rows with no code cannot be matched to anybody, and are counted. */
export function byCode(roster) {
  const map = new Map();
  let unmappable = 0;
  for (const r of roster) {
    const code = normCode(r.employee_code);
    if (!code) { unmappable += 1; continue; }
    map.set(code, r);
  }
  return { map, unmappable };
}

/**
 * Compare the register with one unit. Pure, so it is tested on made-up rows.
 *
 * @param roster    rows from /roster
 * @param local     every staff row here, with `seated` = an active seat in this unit
 * @param unitName  the unit's name, which is HiFive ID's entity name
 */
export function diffRoster({ roster, local, unitName, today = gstDate() }) {
  const { map: there, unmappable } = byCode(roster);
  const here = new Map(local.map((s) => [normCode(s.code), s]));
  const joinedSince = new Date(new Date(`${today}T00:00:00Z`).getTime() - JOINER_DAYS * 864e5).toISOString().slice(0, 10);

  // Everybody still working, for the picker: this unit's people first, then the rest by name.
  const people = [];
  const joiners = [];
  for (const [code, r] of there) {
    if (hasLeft(r, today)) continue;
    const s = here.get(code);
    const p = {
      code, name: String(r.full_name || code).trim(), entity: r.entity ?? null, department: r.department ?? null,
      designation: r.designation ?? null, startDate: r.start_date ?? null, endDate: r.end_date ?? null,
      inUnit: norm(r.entity) === norm(unitName), seated: !!s?.seated,
    };
    people.push(p);
    if (p.inUnit && !p.seated && p.startDate && p.startDate >= joinedSince) joiners.push(p);
  }
  people.sort((a, b) => (b.inUnit - a.inUnit) || a.name.localeCompare(b.name));
  joiners.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));

  const left = [];
  const leaving = [];
  const renamed = [];
  const unknown = [];
  for (const [code, s] of here) {
    if (!s.seated) continue;
    const r = there.get(code);
    if (!r) { unknown.push({ id: s.id, code, name: s.full_name }); continue; }
    if (hasLeft(r, today)) { left.push({ id: s.id, code, name: s.full_name, endDate: r.end_date ?? null }); continue; }
    if (r.end_date || r.notice_date) leaving.push({ id: s.id, code, name: s.full_name, endDate: r.end_date ?? null, noticeDate: r.notice_date ?? null });
    const hfidName = String(r.full_name || '').trim();
    if (hfidName && hfidName !== String(s.full_name).trim()) renamed.push({ id: s.id, code, name: s.full_name, hfidName });
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  left.sort(byName); leaving.sort(byName); renamed.sort(byName); unknown.sort(byName);

  return {
    people,
    review: { joiners, left, leaving, renamed, unknown, unmappable },
    // What needs a decision. Somebody still serving notice is shown, not counted: nothing is due yet.
    count: joiners.length + left.length + renamed.length + unknown.length,
  };
}
