/**
 * Month close (feature 14, part of `accounting.on`).
 *
 * A closed month cannot change: the database refuses any stock movement dated in it (trigger
 * movements_period_closed in migration 0010), whichever screen or import tries, and a credit
 * note cannot be dated in it. Only a past month can be closed, so today's work is never stopped.
 * Reopening needs a reason, and both are in the activity log.
 *
 * Months are Gulf months: a movement at 22:00 UTC on the 31st belongs to the next day here.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, nowIso, text } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { commit } from './stock.js';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const monthOf = (isoOrDate) => (String(isoOrDate || '').length > 10 ? gstDate(Date.parse(isoOrDate)) : String(isoOrDate || '')).slice(0, 7);

export async function closedMonths(env, unitId) {
  const { results } = await env.DB.prepare(
    `SELECT month, closed_at, closed_by_name, note FROM closed_periods WHERE unit_id = ? ORDER BY month DESC`,
  ).bind(unitId).all();
  return results || [];
}

export async function isClosed(env, unitId, dateOrIso) {
  const m = monthOf(dateOrIso);
  if (!m) return false;
  return !!(await env.DB.prepare(`SELECT 1 AS x FROM closed_periods WHERE unit_id = ? AND month = ?`).bind(unitId, m).first());
}

export async function requireOpen(env, unitId, dateOrIso, what = 'This') {
  if (await isClosed(env, unitId, dateOrIso)) {
    refuse('PERIOD_CLOSED', `${what} falls in ${monthOf(dateOrIso)}, which is closed for the accounts. The unit administrator can reopen it, with a reason.`, 409);
  }
}

export async function closeMonth(env, user, { month, note }) {
  const m = String(month || '').trim();
  if (!MONTH.test(m)) refuse('BAD_MONTH', 'Choose a month, as YYYY-MM.');
  if (m >= gstDate().slice(0, 7)) refuse('NOT_OVER', `${m} is not over yet. Only a past month can be closed.`);
  if (await isClosed(env, user.unitId, m)) refuse('ALREADY_CLOSED', `${m} is already closed.`, 409);
  await commit(env, [
    env.DB.prepare(`INSERT INTO closed_periods (unit_id, month, closed_at, closed_by, closed_by_name, note) VALUES (?,?,?,?,?,?)`)
      .bind(user.unitId, m, nowIso(), user.staffId, user.fullName, text(note, 300)),
    auditStmt(env, user, 'PERIOD_CLOSE', m, text(note, 300)),
  ]);
  return { ok: true, month: m };
}

export async function reopenMonth(env, user, { month, reason }) {
  const m = String(month || '').trim();
  const why = text(reason, 300);
  if (!why) refuse('REASON_REQUIRED', 'Say why the month is being reopened. It goes in the activity log.');
  if (!(await isClosed(env, user.unitId, m))) refuse('NOT_CLOSED', `${m} is not closed.`, 409);
  await commit(env, [
    env.DB.prepare(`DELETE FROM closed_periods WHERE unit_id = ? AND month = ?`).bind(user.unitId, m),
    auditStmt(env, user, 'PERIOD_REOPEN', m, why),
  ]);
  return { ok: true, month: m };
}
