/**
 * What HiFive ID may ask Inventory about people, each behind its own service verb:
 *
 *   pending              one person's "Waiting for you" on the hub
 *   pending-all          everybody's, once a morning, for the combined email
 *   accountability       one person's stock in hand, for their HiFive ID profile
 *   accountability-all   everybody's, for HiFive ID's nightly copy
 *
 * The lists come from waiting.js, so the hub, the email and Today never disagree. Seats are
 * the person's own (staff_units); a group administrator is not chased for every unit.
 *
 * Accountability is counts and dates only: how many lines a person holds, how many are past
 * the unit's window, since when. Never the items, never money; the detail stays behind
 * Inventory's own sign-in, where With me and the team view decide who sees it.
 */

import { ROLES } from '../lib/auth.js';
import { gstDate, jsonList } from '../lib/data.js';
import { forHfid, unitFacts, waitingList } from './waiting.js';
import { SETTINGS } from './settings.js';

/** HiFive ID's email and hub order by day: an item with neither a day nor a due waits in the app. */
const dated = (w) => !w.quiet && (w.days != null || w.due);

async function seats(env, { code = null } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT s.id AS staff_id, s.code, s.full_name, u.id AS unit_id, u.name AS unit_name, su.roles
       FROM staff_units su JOIN staff s ON s.id = su.staff_id JOIN units u ON u.id = su.unit_id
      WHERE su.active = 1 AND s.active = 1 AND u.active = 1 ${code ? 'AND UPPER(TRIM(s.code)) = ?' : ''}
      ORDER BY s.code, u.name`,
  ).bind(...(code ? [code] : [])).all();
  return (results || [])
    .map((r) => ({ ...r, roles: jsonList(r.roles).filter((x) => ROLES.includes(x)) }))
    .filter((r) => r.roles.length);
}

/** Each person once, with their seats. */
function byPerson(list) {
  const people = new Map();
  for (const s of list) {
    if (!people.has(s.staff_id)) people.set(s.staff_id, { staffId: s.staff_id, code: s.code, name: s.full_name, seats: [] });
    people.get(s.staff_id).seats.push(s);
  }
  return [...people.values()];
}

const unitsOf = (list) => [...new Set(list.map((s) => s.unit_id))];

/** Each unit's facts, read once however many people sit in it. */
async function factsFor(env, list) {
  const ids = unitsOf(list);
  return new Map((await Promise.all(ids.map((id) => unitFacts(env, id)))).map((f) => [f.unitId, f]));
}

function itemsOf(p, facts) {
  const many = p.seats.length > 1;
  return p.seats.flatMap((s) => waitingList(facts.get(s.unit_id), { staffId: p.staffId, roles: s.roles })
    .filter(dated)
    .map((w) => forHfid(w, { id: s.unit_id, name: s.unit_name }, many)));
}

/** One person's list. An unknown or blank code is an empty list, never somebody else's. */
export async function pendingForStaff(env, empCode) {
  const code = String(empCode || '').trim().toUpperCase();
  if (!code) return [];
  const list = await seats(env, { code });
  const [p] = byPerson(list);
  return p ? itemsOf(p, await factsFor(env, list)) : [];
}

/** Everybody's, for the morning email: each person once, nobody with nothing. */
export async function pendingForAll(env) {
  const list = await seats(env);
  const facts = await factsFor(env, list);
  return byPerson(list)
    .map((p) => ({ emp_code: p.code, name: p.name, items: itemsOf(p, facts) }))
    .filter((p) => p.items.length);
}

// ── Accountability ───────────────────────────────────────────────────────────

async function heldByUnit(env, unitIds, code = null, now = Date.now()) {
  const out = [];
  for (const unitId of unitIds) {
    const row = await env.DB.prepare(`SELECT value FROM settings WHERE unit_id = ? AND key = 'custody.account_hours'`).bind(unitId).first();
    const hours = Number(row?.value ?? SETTINGS['custody.account_hours'].default) || 24;
    const cutoff = new Date(now - hours * 36e5).toISOString();
    const { results } = await env.DB.prepare(
      `SELECT c.person_id, COUNT(*) AS holding, SUM(c.taken_at < ?) AS unaccounted,
              MIN(CASE WHEN c.taken_at < ? THEN c.taken_at END) AS oldest
         FROM custody c ${code ? 'JOIN staff s ON s.id = c.person_id AND UPPER(TRIM(s.code)) = ?' : ''}
        WHERE c.unit_id = ? AND c.qty > 0 GROUP BY c.person_id`,
    ).bind(cutoff, cutoff, ...(code ? [code] : []), unitId).all();
    for (const r of results || []) out.push({ ...r, unitId, hours });
  }
  return out;
}

function accountOf(p, held) {
  const units = p.seats.map((s) => {
    const h = held.find((x) => x.person_id === p.staffId && x.unitId === s.unit_id);
    return {
      unit: s.unit_name,
      holding: h?.holding || 0,
      unaccounted: h?.unaccounted || 0,
      // The day the oldest unaccounted line was taken: "since 3 Nov".
      since: h?.oldest ? gstDate(Date.parse(h.oldest)) : null,
      hours: h?.hours ?? null,
      href: `/#/with-me?unit=${encodeURIComponent(s.unit_id)}`,
    };
  });
  return {
    emp_code: p.code,
    name: p.name,
    holding: units.reduce((n, u) => n + u.holding, 0),
    unaccounted: units.reduce((n, u) => n + u.unaccounted, 0),
    since: units.map((u) => u.since).filter(Boolean).sort()[0] || null,
    units,
  };
}

/** One person's stock in hand, across their units; null when Inventory does not know them. */
export async function accountabilityFor(env, empCode) {
  const code = String(empCode || '').trim().toUpperCase();
  if (!code) return null;
  const list = await seats(env, { code });
  if (!list.length) return null;
  return accountOf(byPerson(list)[0], await heldByUnit(env, unitsOf(list), code));
}

/** Everybody with a seat, for HiFive ID's nightly copy. People holding nothing are included: 0 is known. */
export async function accountabilityForAll(env) {
  const list = await seats(env);
  const held = await heldByUnit(env, unitsOf(list));
  return byPerson(list).map((p) => accountOf(p, held));
}
