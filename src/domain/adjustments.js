/**
 * Corrections to stock: damaged, expired, lost, found, sampled.
 *
 * Raised by the store, posted only when somebody else approves (four eyes, see access.js). A
 * write-off is the one stock action that removes value without anything to show for it, so it
 * is the one that waits for a second person.
 */

import { refuse } from '../lib/errors.js';
import { m2, nextRef, nowIso, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { requireOtherApprover, storeFor } from './access.js';
import { grossOf, requireLimit } from './limits.js';
import { balanceOf, buildPosting, commit, loadItems } from './stock.js';

export const REASONS = {
  DAMAGED: 'Damaged or broken', EXPIRED: 'Expired', LOST: 'Lost or missing', FOUND: 'Found (more than recorded)',
  CORRECTION: 'Correction of an earlier mistake', SAMPLE: 'Given as a sample or tester', OTHER: 'Other',
};
const ADDS = new Set(['FOUND', 'CORRECTION', 'OTHER']);

export async function raiseAdjustment(env, user, body) {
  const store = await storeFor(env, user, body.storeId);
  const reason = String(body.reason || '');
  if (!REASONS[reason]) refuse('REASON_REQUIRED', 'Choose a reason.');
  const note = text(body.note, 500);
  if ((reason === 'OTHER' || reason === 'CORRECTION' || reason === 'LOST') && !note) {
    refuse('NOTE_REQUIRED', 'Add a note: the approver needs to know what happened.');
  }
  if (!Array.isArray(body.lines) || !body.lines.length) refuse('NO_LINES', 'Add at least one item.');
  const lines = body.lines.map((l, i) => {
    const qty = q3(Number(l?.qty));
    if (!Number.isFinite(qty) || qty === 0) refuse('BAD_QTY', `Line ${i + 1}: enter how many to add (+) or take away (−).`);
    if (qty > 0 && !ADDS.has(reason)) refuse('BAD_SIGN', `"${REASONS[reason]}" can only take stock away.`);
    if (qty < 0 && reason === 'FOUND') refuse('BAD_SIGN', '"Found" can only add stock.');
    return { itemId: String(l.itemId), qty, batchId: l.batchId || null, expiry: l.expiry || '', batchNo: text(l.batchNo, 60) };
  });
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  let value = 0;
  for (const l of lines) {
    const it = items.get(l.itemId);
    if (it.is_linen && l.qty < 0) refuse('USE_LINEN_SCREEN', `${it.name} is linen. Discard pieces from the Linen screen.`);
    if (l.qty < 0) {
      const bal = await balanceOf(env, store.id, l.itemId);
      if (bal.qty < -l.qty) refuse('NOT_ENOUGH', `Only ${bal.qty} ${it.uom} of ${it.name} in ${store.name}.`);
    }
    value += l.qty * (it.avg_cost || 0);
  }
  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'ADJ');
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO adjustments (id, unit_id, ref, store_id, reason, note, status, value, requested_by, requested_by_name, requested_at)
       VALUES (?,?,?,?,?,?,'PENDING',?,?,?,?)`,
    ).bind(id, user.unitId, ref, store.id, reason, note, m2(value), user.staffId, user.fullName, nowIso()),
    ...lines.map((l) => env.DB.prepare(
      `INSERT INTO adjustment_lines (id, adjustment_id, item_id, batch_id, qty) VALUES (?,?,?,?,?)`,
    ).bind(uuid(), id, l.itemId, l.batchId, l.qty)),
    auditStmt(env, user, 'ADJUST_RAISE', ref, `${REASONS[reason]}, ${lines.length} line(s), AED ${m2(value)}`),
  ]);
  return { ok: true, id, ref };
}

async function load(env, user, id) {
  const a = await env.DB.prepare(`SELECT * FROM adjustments WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!a) refuse('NOT_FOUND', 'That correction does not exist in this unit.', 404);
  return a;
}

export async function getAdjustment(env, user, id) {
  const a = await load(env, user, id);
  const { results } = await env.DB.prepare(
    `SELECT al.*, i.code, i.name, i.uom, i.avg_cost, bt.batch_no, bt.expiry, COALESCE(b.qty, 0) AS on_hand
       FROM adjustment_lines al JOIN items i ON i.id = al.item_id
       LEFT JOIN batches bt ON bt.id = al.batch_id
       LEFT JOIN balances b ON b.item_id = al.item_id AND b.store_id = ?
      WHERE al.adjustment_id = ? ORDER BY i.name`,
  ).bind(a.store_id, a.id).all();
  const store = await env.DB.prepare(`SELECT name FROM stores WHERE id = ?`).bind(a.store_id).first();
  return { ...a, store_name: store?.name, reason_label: REASONS[a.reason], lines: results || [] };
}

export async function decideAdjustment(env, user, id, body) {
  const a = await load(env, user, id);
  if (a.status !== 'PENDING') refuse('ALREADY_DECIDED', `${a.ref} has already been ${a.status.toLowerCase()}.`, 409);
  const now = nowIso();
  const note = text(body.note, 500);

  if (body.action === 'CANCEL') {
    if (a.requested_by !== user.staffId) refuse('NOT_YOURS', 'Only the person who raised it can withdraw it.', 403);
    await commit(env, [
      env.DB.prepare(`UPDATE adjustments SET status = 'CANCELLED', decided_at = ?, decision_note = ? WHERE id = ? AND status = 'PENDING'`)
        .bind(now, note, a.id),
      auditStmt(env, user, 'ADJUST_CANCEL', a.ref, note),
    ]);
    return { ok: true, status: 'CANCELLED' };
  }

  await requireOtherApprover(env, user, a.requested_by, 'correction');
  if (body.action === 'REJECT') {
    if (!note) refuse('REASON_REQUIRED', 'Say why. The store keeper will see it.');
    await commit(env, [
      env.DB.prepare(
        `UPDATE adjustments SET status = 'REJECTED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ?
          WHERE id = ? AND status = 'PENDING'`,
      ).bind(user.staffId, user.fullName, now, note, a.id),
      auditStmt(env, user, 'ADJUST_REJECT', a.ref, note),
    ]);
    return { ok: true, status: 'REJECTED' };
  }
  if (body.action !== 'APPROVE') refuse('BAD_ACTION', 'Approve or reject.');

  const store = await env.DB.prepare(`SELECT id, unit_id, code, name, kind, active FROM stores WHERE id = ?`).bind(a.store_id).first();
  const { results: lines } = await env.DB.prepare(`SELECT * FROM adjustment_lines WHERE adjustment_id = ?`).bind(a.id).all();
  const items = await loadItems(env, user.unitId, (lines || []).map((l) => l.item_id));
  const posting = await buildPosting(env, {
    kind: 'ADJUST', unitId: user.unitId, actor: actorOf(user), doc: { type: 'ADJUSTMENT', id: a.id, ref: a.ref },
    preferExpired: a.reason === 'EXPIRED',
  }, (lines || []).map((l) => ({
    item: items.get(l.item_id), store, qty: l.qty, batchId: l.batch_id, reason: a.reason, note: a.note,
  })));
  await requireLimit(env, user, 'writeoff', grossOf(posting.moved));
  await commit(env, [
    env.DB.prepare(
      `UPDATE adjustments SET status = 'APPROVED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ?, value = ?
        WHERE id = ? AND status = 'PENDING'`,
    ).bind(user.staffId, user.fullName, now, note, posting.value, a.id),
    ...posting.statements,
    auditStmt(env, user, 'ADJUST_APPROVE', a.ref, `AED ${posting.value}`),
  ]);
  return { ok: true, status: 'APPROVED', value: posting.value };
}

export async function listAdjustments(env, user, { status }) {
  const where = ['a.unit_id = ?'];
  const args = [user.unitId];
  if (status) where.push('a.status = ?'), args.push(status);
  const { results } = await env.DB.prepare(
    `SELECT a.id, a.ref, a.reason, a.status, a.value, a.note, a.requested_by, a.requested_by_name, a.requested_at,
            a.decided_by_name, a.decided_at, a.decision_note, s.name AS store_name,
            (SELECT group_concat(i.name, ', ') FROM adjustment_lines al JOIN items i ON i.id = al.item_id WHERE al.adjustment_id = a.id) AS summary
       FROM adjustments a JOIN stores s ON s.id = a.store_id
      WHERE ${where.join(' AND ')}
      ORDER BY CASE a.status WHEN 'PENDING' THEN 0 ELSE 1 END, a.requested_at DESC LIMIT 300`,
  ).bind(...args).all();
  return (results || []).map((r) => ({ ...r, reason_label: REASONS[r.reason] }));
}
