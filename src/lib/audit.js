/**
 * The audit trail: who did what, in which unit, when.
 *
 * Returns a statement rather than running one, so the audit row can go in the same D1 batch as
 * the change it describes — a change with no audit row, or an audit row for a change that
 * failed, are both worse than either alone. `auditNow` is for the few places with no batch.
 */

import { nowIso, uuid } from './data.js';

export function auditStmt(env, user, action, subject, detail, unitId = user?.unitId) {
  return env.DB.prepare(
    `INSERT INTO audit_log (id, at, actor_id, actor_name, unit_id, action, subject, detail)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).bind(uuid(), nowIso(), user?.staffId ?? null, user?.fullName ?? null, unitId ?? null,
         action, subject ?? null, detail ? String(detail).slice(0, 1000) : null);
}

export async function auditNow(env, user, action, subject, detail, unitId) {
  try {
    await auditStmt(env, user, action, subject, detail, unitId).run();
  } catch { /* auditing must never fail the request it is auditing */ }
}

export const actorOf = (user) => ({ id: user.staffId, name: user.fullName });
