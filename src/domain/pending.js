/**
 * What a person owes in Inventory, for the HiFive ID hub's "Waiting for you".
 *
 * Asked by HiFive ID with a `pending` service assertion naming one employee code. Answers for
 * every unit the person holds a seat in; nothing about anybody else.
 */

import { seatsOf } from '../lib/auth.js';
import { may } from './access.js';

export async function pendingForStaff(env, empCode) {
  const code = String(empCode || '').trim().toUpperCase();
  if (!code) return [];
  const staff = await env.DB.prepare(`SELECT id FROM staff WHERE UPPER(TRIM(code)) = ? AND active = 1`).bind(code).first();
  if (!staff) return [];
  const items = [];
  for (const unit of await seatsOf(env, staff.id)) {
    const user = { staffId: staff.id, unitId: unit.id, roles: unit.roles };
    const tag = (s) => `${s} — ${unit.name}`;
    const n = async (sql, ...args) => (await env.DB.prepare(sql).bind(...args).first())?.n || 0;
    if (may(user, 'request.decide')) {
      const c = await n(`SELECT COUNT(*) AS n FROM requests WHERE unit_id = ? AND status = 'PENDING' AND requested_by <> ?`, unit.id, staff.id);
      if (c) items.push({ text: tag(`${c} stock request${c > 1 ? 's' : ''} to approve`), days: null });
    }
    if (may(user, 'request.fulfil')) {
      const c = await n(`SELECT COUNT(*) AS n FROM requests WHERE unit_id = ? AND status IN ('APPROVED','PARTLY_ISSUED')`, unit.id);
      if (c) items.push({ text: tag(`${c} approved request${c > 1 ? 's' : ''} to give out`), days: null });
    }
    if (may(user, 'po.decide')) {
      const c = await n(`SELECT COUNT(*) AS n FROM purchase_orders WHERE unit_id = ? AND status = 'SUBMITTED' AND created_by <> ?`, unit.id, staff.id);
      if (c) items.push({ text: tag(`${c} purchase order${c > 1 ? 's' : ''} to approve`), days: null });
    }
    if (may(user, 'adjust.decide')) {
      const c = await n(`SELECT COUNT(*) AS n FROM adjustments WHERE unit_id = ? AND status = 'PENDING' AND requested_by <> ?`, unit.id, staff.id);
      if (c) items.push({ text: tag(`${c} stock correction${c > 1 ? 's' : ''} to approve`), days: null });
    }
    if (may(user, 'count.decide')) {
      const c = await n(`SELECT COUNT(*) AS n FROM counts WHERE unit_id = ? AND status = 'SUBMITTED' AND submitted_by <> ?`, unit.id, staff.id);
      if (c) items.push({ text: tag(`${c} stock count${c > 1 ? 's' : ''} to review`), days: null });
    }
  }
  return items;
}
