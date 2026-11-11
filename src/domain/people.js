/**
 * People from HiFive ID: the picker and the review list on Admin → People, the name fix, and the
 * check made when somebody new is given a seat.
 */

import { refuse } from '../lib/errors.js';
import { nowIso } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { byCode, diffRoster, fetchRoster, hasLeft } from '../lib/roster.js';
import { commit } from './stock.js';

const REVIEW_KEY = 'hfid_review';
const REVIEW_FRESH_MS = 10 * 60e3;

async function localFor(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.code, s.full_name, s.active,
            EXISTS (SELECT 1 FROM staff_units su WHERE su.staff_id = s.id AND su.unit_id = ? AND su.active = 1) AS seated
       FROM staff s`,
  ).bind(user.unitId).all();
  return (results || []).map((r) => ({ ...r, seated: !!r.seated }));
}

/** The register compared with this unit: the picker, and what needs an administrator's decision. */
export async function hfidPeople(env, user, bearer) {
  const [{ staff, asOf }, local] = await Promise.all([fetchRoster(env, bearer), localFor(env, user)]);
  const diff = diffRoster({ roster: staff, local, unitName: user.unit.name });
  await remember(env, user.unitId, diff.count);
  return { asOf, unitName: user.unit.name, ...diff };
}

/** What Today shows an administrator: the count, read again at most every ten minutes. */
export async function reviewCount(env, user, bearer) {
  const row = await env.DB.prepare(`SELECT value FROM settings WHERE unit_id = ? AND key = ?`).bind(user.unitId, REVIEW_KEY).first();
  try {
    const saved = row && JSON.parse(row.value);
    if (saved && Date.now() - new Date(saved.at).getTime() < REVIEW_FRESH_MS) return saved.count;
  } catch { /* read again */ }
  try {
    return (await hfidPeople(env, user, bearer)).count;
  } catch {
    return null; // HiFive ID unreachable: Today says nothing rather than "nothing to review"
  }
}

const remember = (env, unitId, count) => env.DB.prepare(
  `INSERT INTO settings (unit_id, key, value) VALUES (?,?,?) ON CONFLICT(unit_id, key) DO UPDATE SET value = excluded.value`,
).bind(unitId, REVIEW_KEY, JSON.stringify({ at: nowIso(), count })).run();

/**
 * Somebody about to get a seat here, as HiFive ID knows them. The name comes from HiFive ID, not
 * from what was typed. A code HiFive ID does not hold, or somebody it says has left, is refused.
 * With HiFive ID unreachable the administrator is not stuck: the typed name stands, and the
 * activity log says it was not checked.
 */
export async function checkNewSeat(env, code, bearer) {
  let roster;
  try { roster = (await fetchRoster(env, bearer)).staff; } catch { return { checked: false }; }
  const r = byCode(roster).map.get(code);
  if (!r) refuse('NOT_IN_HFID', `${code} is not in HiFive ID. Check the code, or ask HR to add them to HiFive ID first.`);
  if (hasLeft(r)) refuse('HAS_LEFT', `HiFive ID says ${String(r.full_name || code).trim()} has left${r.end_date ? ` (last day ${r.end_date})` : ''}.`);
  return { checked: true, name: String(r.full_name || '').trim() || null };
}

/** "Use HiFive ID's name": the name here is set to what HiFive ID says, read again now. */
export async function takeHfidName(env, user, code, bearer) {
  const c = String(code || '').trim().toUpperCase();
  const s = await env.DB.prepare(
    `SELECT s.id, s.full_name FROM staff s JOIN staff_units su ON su.staff_id = s.id AND su.unit_id = ? WHERE UPPER(TRIM(s.code)) = ?`,
  ).bind(user.unitId, c).first();
  if (!s) refuse('NOT_FOUND', 'That person has no seat in this unit.', 404);
  const r = byCode((await fetchRoster(env, bearer)).staff).map.get(c);
  const name = String(r?.full_name || '').trim();
  if (!name) refuse('NOT_IN_HFID', `${c} is not in HiFive ID.`);
  if (name === s.full_name) return { ok: true, unchanged: true };
  await commit(env, [
    env.DB.prepare(`UPDATE staff SET full_name = ?, updated_at = ?, updated_by = ? WHERE id = ?`).bind(name, nowIso(), user.fullName, s.id),
    auditStmt(env, user, 'NAME_FROM_HFID', c, `${s.full_name} → ${name}`),
  ]);
  await env.DB.prepare(`DELETE FROM settings WHERE unit_id = ? AND key = ?`).bind(user.unitId, REVIEW_KEY).run();
  return { ok: true, name };
}
