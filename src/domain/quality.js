/**
 * Inspection and returns to supplier (feature 14, `quarantine.on`, `returns.on`).
 *
 * INSPECTION. With it on, an approved delivery's stock is held (balances.on_hold), owned and
 * valued but unusable: nothing that hands stock out reads on_hold. Somebody allowed to inspect
 * then releases it to the shelf, or rejects it with a reason. Rejected stock never reaches the
 * shelf: with returns on it becomes a return to the supplier, already sent, waiting for the
 * credit note; with returns off it is written off as failed inspection.
 *
 * RETURNS. Raised against an approved delivery, for at most what that delivery brought in less
 * what has already gone back. Somebody else approves (four eyes), and then the stock leaves the
 * shelf. The credit note is recorded when it comes, or the return is closed without one, with
 * the reason. The value expected back is the delivery's own price.
 */

import { refuse } from '../lib/errors.js';
import { isoDate, m2, nextRef, nonNegative, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { may, requireOtherApprover, storeFor } from './access.js';
import { requireOpen } from './periods.js';
import { featureOn, requireFeature } from './settings.js';
import { buildHoldOut, buildPosting, buildRelease, commit, loadItems } from './stock.js';

export const RETURN_REASONS = {
  DAMAGED: 'Damaged on arrival', WRONG: 'Wrong item or wrong pack', SHORT_DATED: 'Expiry too close',
  QUALITY: 'Failed quality control', OVER: 'More than was ordered', OTHER: 'Other',
};

// ── Inspection ───────────────────────────────────────────────────────────────────────────

export async function listInspections(env, user, { status = 'HELD' } = {}) {
  await requireFeature(env, user.unitId, 'quarantine.on');
  const { results } = await env.DB.prepare(
    `SELECT ins.*, i.name, i.code, i.uom, s.name AS store_name, r.ref AS receipt_ref, r.by_name AS received_by, sup.name AS supplier_name,
            sr.ref AS return_ref
       FROM inspections ins JOIN items i ON i.id = ins.item_id JOIN stores s ON s.id = ins.store_id
       JOIN receipts r ON r.id = ins.receipt_id LEFT JOIN suppliers sup ON sup.id = r.supplier_id
       LEFT JOIN supplier_returns sr ON sr.id = ins.return_id
      WHERE ins.unit_id = ? AND ins.status = ?
      ORDER BY ins.held_at ${status === 'HELD' ? 'ASC' : 'DESC'} LIMIT 300`,
  ).bind(user.unitId, status).all();
  return results || [];
}

export async function decideInspection(env, user, id, action, body = {}) {
  await requireFeature(env, user.unitId, 'quarantine.on');
  if (!may(user, 'inspect')) refuse('NOT_ALLOWED', 'Your role does not allow releasing held stock.', 403);
  const ins = await env.DB.prepare(`SELECT * FROM inspections WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!ins) refuse('NOT_FOUND', 'That held stock is not in this unit.', 404);
  if (ins.status !== 'HELD') refuse('ALREADY_DECIDED', 'That has already been released or rejected.', 409);
  const store = await storeFor(env, user, ins.store_id, { forWrite: false });
  const item = (await loadItems(env, user.unitId, [ins.item_id])).get(ins.item_id);
  const receipt = await env.DB.prepare(`SELECT id, ref, supplier_id FROM receipts WHERE id = ?`).bind(ins.receipt_id).first();
  const note = text(body.note, 500);
  const now = nowIso();
  const actor = actorOf(user);
  const doc = { type: 'INSPECTION', id: ins.id, ref: receipt.ref };
  const decided = (status, extra = '') => env.DB.prepare(
    `UPDATE inspections SET status = ?, decided_by = ?, decided_by_name = ?, decided_at = ?, note = ?${extra} WHERE id = ? AND status = 'HELD'`,
  );

  if (action === 'release') {
    await commit(env, [
      decided('RELEASED').bind('RELEASED', user.staffId, user.fullName, now, note, ins.id),
      ...await buildRelease(env, { unitId: user.unitId, actor, store, item, qty: ins.qty, batchNo: ins.batch_no, expiry: ins.expiry, doc, note }),
      auditStmt(env, user, 'INSPECT_RELEASE', receipt.ref, `${item.name}: ${q3(ins.qty)} ${item.uom} released to ${store.name}`),
    ]);
    return { ok: true, status: 'RELEASED' };
  }
  if (action !== 'reject') refuse('BAD_ACTION', 'Release or reject.');
  if (!note) refuse('REASON_REQUIRED', 'Say what was wrong with it. The supplier and the accounts will be told.');

  // Back to the supplier, or written off when this unit does not track returns.
  if (await featureOn(env, user.unitId, 'returns.on')) {
    const returnId = uuid();
    const ref = await nextRef(env, user.unitId, user.unit.code, 'RTN');
    const value = m2(ins.qty * ins.unit_cost);
    await commit(env, [
      decided('REJECTED', ', return_id = ?').bind('REJECTED', user.staffId, user.fullName, now, note, returnId, ins.id),
      env.DB.prepare(
        `INSERT INTO supplier_returns (id, unit_id, ref, receipt_id, supplier_id, store_id, status, reason, note, value,
                                       raised_by, raised_by_name, raised_at, decided_by, decided_by_name, decided_at, decision_note)
         VALUES (?,?,?,?,?,?,'SENT','QUALITY',?,?,?,?,?,?,?,?,'Rejected at inspection')`,
      ).bind(returnId, user.unitId, ref, receipt.id, receipt.supplier_id, store.id, note, value,
             user.staffId, user.fullName, now, user.staffId, user.fullName, now),
      env.DB.prepare(
        `INSERT INTO supplier_return_lines (id, return_id, receipt_line_id, item_id, batch_no, expiry, qty, unit_cost, from_hold)
         VALUES (?,?,?,?,?,?,?,?,1)`,
      ).bind(uuid(), returnId, ins.receipt_line_id, ins.item_id, ins.batch_no, ins.expiry, ins.qty, ins.unit_cost),
      ...await buildHoldOut(env, {
        unitId: user.unitId, actor, store, item, qty: ins.qty, batchNo: ins.batch_no, expiry: ins.expiry, unitCost: ins.unit_cost,
        kind: 'SUPPLIER_RETURN', doc: { type: 'RETURN', id: returnId, ref }, reason: 'QUALITY', note,
      }),
      auditStmt(env, user, 'INSPECT_REJECT', receipt.ref, `${item.name}: ${q3(ins.qty)} ${item.uom} rejected, back to the supplier as ${ref}. ${note}`),
    ]);
    return { ok: true, status: 'REJECTED', returnId, returnRef: ref };
  }
  await commit(env, [
    decided('REJECTED').bind('REJECTED', user.staffId, user.fullName, now, note, ins.id),
    ...await buildHoldOut(env, {
      unitId: user.unitId, actor, store, item, qty: ins.qty, batchNo: ins.batch_no, expiry: ins.expiry, unitCost: ins.unit_cost,
      kind: 'ADJUST', doc, reason: 'FAILED_INSPECTION', note,
    }),
    auditStmt(env, user, 'INSPECT_REJECT', receipt.ref, `${item.name}: ${q3(ins.qty)} ${item.uom} written off. ${note}`),
  ]);
  return { ok: true, status: 'REJECTED' };
}

// ── Returns to supplier ──────────────────────────────────────────────────────────────────

/** What can still go back from a delivery, line by line. */
async function returnable(env, receiptId) {
  const { results } = await env.DB.prepare(
    `SELECT rl.id, rl.item_id, rl.qty, rl.unit_cost, rl.batch_no, rl.expiry, i.name, i.uom,
            COALESCE((SELECT SUM(l.qty) FROM supplier_return_lines l JOIN supplier_returns r ON r.id = l.return_id
                       WHERE l.receipt_line_id = rl.id AND r.status NOT IN ('REJECTED','CANCELLED')), 0) AS returned
       FROM receipt_lines rl JOIN items i ON i.id = rl.item_id WHERE rl.receipt_id = ? ORDER BY i.name`,
  ).bind(receiptId).all();
  return (results || []).map((l) => ({ ...l, left: q3(l.qty - l.returned) }));
}

export async function returnOptions(env, user, receiptId) {
  await requireFeature(env, user.unitId, 'returns.on');
  const r = await env.DB.prepare(`SELECT id, ref, status FROM receipts WHERE id = ? AND unit_id = ?`).bind(receiptId, user.unitId).first();
  if (!r) refuse('NOT_FOUND', 'That delivery is not in this unit.', 404);
  return { receipt: r, lines: await returnable(env, r.id), reasons: RETURN_REASONS };
}

export async function raiseReturn(env, user, body) {
  await requireFeature(env, user.unitId, 'returns.on');
  const r = await env.DB.prepare(`SELECT * FROM receipts WHERE id = ? AND unit_id = ?`).bind(body.receiptId, user.unitId).first();
  if (!r) refuse('NOT_FOUND', 'That delivery is not in this unit.', 404);
  if (r.status !== 'APPROVED') refuse('NOT_RECEIVED', `${r.ref} is not on the shelf yet, so nothing on it can be returned. Reject or correct the delivery instead.`);
  const reason = String(body.reason || '');
  if (!RETURN_REASONS[reason]) refuse('REASON_REQUIRED', 'Choose why it is going back.');
  const note = text(body.note, 500);
  if (reason === 'OTHER' && !note) refuse('NOTE_REQUIRED', 'Say what is wrong with it.');
  const can = new Map((await returnable(env, r.id)).map((l) => [l.id, l]));
  if (!Array.isArray(body.lines) || !body.lines.length) refuse('NO_LINES', 'Choose what is going back.');
  const lines = body.lines.map((x, i) => {
    const l = can.get(x?.receiptLineId);
    if (!l) refuse('NOT_ON_DELIVERY', `Line ${i + 1} is not on ${r.ref}.`);
    const qty = positive(x.qty);
    if (!qty) refuse('BAD_QTY', `${l.name}: how many are going back?`);
    if (qty > l.left) refuse('MORE_THAN_RECEIVED', `${l.name}: ${q3(qty)} ${l.uom} is more than the ${q3(l.left)} still on ${r.ref} to return.`);
    return { ...l, retQty: q3(qty) };
  });
  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'RTN');
  const value = m2(lines.reduce((s, l) => s + l.retQty * l.unit_cost, 0));
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO supplier_returns (id, unit_id, ref, receipt_id, supplier_id, store_id, status, reason, note, value, raised_by, raised_by_name, raised_at)
       VALUES (?,?,?,?,?,?,'PENDING',?,?,?,?,?,?)`,
    ).bind(id, user.unitId, ref, r.id, r.supplier_id, r.store_id, reason, note, value, user.staffId, user.fullName, nowIso()),
    ...lines.map((l) => env.DB.prepare(
      `INSERT INTO supplier_return_lines (id, return_id, receipt_line_id, item_id, batch_no, expiry, qty, unit_cost) VALUES (?,?,?,?,?,?,?,?)`,
    ).bind(uuid(), id, l.id, l.item_id, l.batch_no || '', l.expiry || '', l.retQty, l.unit_cost)),
    auditStmt(env, user, 'RETURN_RAISE', ref, `${RETURN_REASONS[reason]}, ${lines.length} line(s) from ${r.ref}, AED ${value}`),
  ]);
  return { ok: true, id, ref, value };
}

async function loadReturn(env, user, id) {
  const ret = await env.DB.prepare(`SELECT * FROM supplier_returns WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!ret) refuse('NOT_FOUND', 'That return is not in this unit.', 404);
  return ret;
}

const returnLines = async (env, id) => (await env.DB.prepare(
  `SELECT l.*, i.name, i.code, i.uom, i.tracks_expiry FROM supplier_return_lines l JOIN items i ON i.id = l.item_id WHERE l.return_id = ? ORDER BY i.name`,
).bind(id).all()).results || [];

export async function returnAction(env, user, id, action, body = {}) {
  await requireFeature(env, user.unitId, 'returns.on');
  const ret = await loadReturn(env, user, id);
  const note = text(body.note, 500);
  const now = nowIso();
  const set = (sql, ...args) => env.DB.prepare(sql).bind(...args);

  if (action === 'cancel') {
    if (ret.status !== 'PENDING') refuse('BAD_STATE', `${ret.ref} has already been ${ret.status.toLowerCase()}.`, 409);
    if (ret.raised_by !== user.staffId && !may(user, 'return.decide')) refuse('NOT_YOURS', 'Only the person who raised it, or a manager, can cancel it.', 403);
    await commit(env, [set(`UPDATE supplier_returns SET status = 'CANCELLED', decided_at = ?, decision_note = ? WHERE id = ? AND status = 'PENDING'`, now, note, ret.id), auditStmt(env, user, 'RETURN_CANCEL', ret.ref, note)]);
    return { ok: true, status: 'CANCELLED' };
  }
  if (action === 'approve' || action === 'reject') {
    if (!may(user, 'return.decide')) refuse('NOT_ALLOWED', 'Your role does not allow approving returns.', 403);
    if (ret.status !== 'PENDING') refuse('BAD_STATE', `${ret.ref} is not waiting for approval.`, 409);
    await requireOtherApprover(env, user, ret.raised_by, 'return');
    if (action === 'reject') {
      if (!note) refuse('REASON_REQUIRED', 'Say why it is not going back.');
      await commit(env, [set(`UPDATE supplier_returns SET status = 'REJECTED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ? AND status = 'PENDING'`, user.staffId, user.fullName, now, note, ret.id), auditStmt(env, user, 'RETURN_REJECT', ret.ref, note)]);
      return { ok: true, status: 'REJECTED' };
    }
    const store = await storeFor(env, user, ret.store_id, { forWrite: false });
    const lines = await returnLines(env, ret.id);
    const items = await loadItems(env, user.unitId, lines.map((l) => l.item_id));
    const posted = [];
    for (const l of lines) {
      let batchId = null;
      if (l.tracks_expiry) {
        const b = await env.DB.prepare(`SELECT id FROM batches WHERE store_id = ? AND item_id = ? AND batch_no = ? AND expiry = ?`).bind(store.id, l.item_id, l.batch_no, l.expiry).first();
        if (!b) refuse('NOT_ENOUGH', `${l.name}: the lot that came on this delivery is no longer in ${store.name}.`);
        batchId = b.id;
      }
      posted.push({ item: items.get(l.item_id), store, qty: -l.qty, batchId, reason: ret.reason, note: ret.note });
    }
    const posting = await buildPosting(env, { kind: 'SUPPLIER_RETURN', unitId: user.unitId, actor: actorOf(user), doc: { type: 'RETURN', id: ret.id, ref: ret.ref }, preferExpired: true }, posted);
    await commit(env, [
      set(`UPDATE supplier_returns SET status = 'SENT', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ? AND status = 'PENDING'`, user.staffId, user.fullName, now, note, ret.id),
      ...posting.statements,
      auditStmt(env, user, 'RETURN_APPROVE', ret.ref, `sent back; credit expected AED ${ret.value}`),
    ]);
    return { ok: true, status: 'SENT' };
  }
  if (action === 'credit') {
    if (!may(user, 'po.edit')) refuse('NOT_ALLOWED', 'Purchasing or a manager records credit notes.', 403);
    if (ret.status !== 'SENT') refuse('BAD_STATE', `${ret.ref} is not waiting for a credit note.`, 409);
    const no = text(body.creditNo, 60);
    if (!no) refuse('CREDIT_NO', 'Enter the credit note number.');
    const date = isoDate(body.creditDate);
    if (!date) refuse('BAD_DATE', 'Enter the date on the credit note.');
    const amount = nonNegative(body.amount);
    if (amount === null) refuse('BAD_AMOUNT', 'Enter the amount credited.');
    await requireOpen(env, user.unitId, date, 'The credit note');
    await commit(env, [
      set(`UPDATE supplier_returns SET status = 'CREDITED', credit_no = ?, credit_date = ?, credit_amount = ?, credited_by_name = ?, credited_at = ? WHERE id = ? AND status = 'SENT'`,
        no, date, m2(amount), user.fullName, now, ret.id),
      auditStmt(env, user, 'RETURN_CREDIT', ret.ref, `credit note ${no}, AED ${m2(amount)} of AED ${ret.value} expected`),
    ]);
    return { ok: true, status: 'CREDITED', short: m2(ret.value - amount) };
  }
  if (action === 'close') {
    if (!may(user, 'return.decide')) refuse('NOT_ALLOWED', 'A manager closes a return without a credit note.', 403);
    if (ret.status !== 'SENT') refuse('BAD_STATE', `${ret.ref} is not waiting for a credit note.`, 409);
    if (!note) refuse('REASON_REQUIRED', 'Say why no credit note will come: replaced instead, refused by the supplier.');
    await commit(env, [set(`UPDATE supplier_returns SET status = 'CLOSED', decision_note = ? WHERE id = ? AND status = 'SENT'`, note, ret.id), auditStmt(env, user, 'RETURN_CLOSE', ret.ref, note)]);
    return { ok: true, status: 'CLOSED' };
  }
  refuse('BAD_ACTION', 'Unknown action.');
}

export async function listReturns(env, user, { status } = {}) {
  await requireFeature(env, user.unitId, 'returns.on');
  const where = ['sr.unit_id = ?'];
  const args = [user.unitId];
  if (status) where.push('sr.status = ?'), args.push(status);
  const { results } = await env.DB.prepare(
    `SELECT sr.*, r.ref AS receipt_ref, s.name AS supplier_name, st.name AS store_name,
            (SELECT group_concat(i.name, ', ') FROM supplier_return_lines l JOIN items i ON i.id = l.item_id WHERE l.return_id = sr.id) AS summary
       FROM supplier_returns sr JOIN receipts r ON r.id = sr.receipt_id LEFT JOIN suppliers s ON s.id = sr.supplier_id JOIN stores st ON st.id = sr.store_id
      WHERE ${where.join(' AND ')}
      ORDER BY CASE sr.status WHEN 'PENDING' THEN 0 WHEN 'SENT' THEN 1 ELSE 2 END, sr.raised_at DESC LIMIT 300`,
  ).bind(...args).all();
  return (results || []).map((x) => ({ ...x, reason_label: RETURN_REASONS[x.reason] || x.reason }));
}

export async function getReturn(env, user, id) {
  await requireFeature(env, user.unitId, 'returns.on');
  const ret = await loadReturn(env, user, id);
  const names = await env.DB.prepare(
    `SELECT r.ref AS receipt_ref, s.name AS supplier_name, st.name AS store_name FROM receipts r
       LEFT JOIN suppliers s ON s.id = ?2 JOIN stores st ON st.id = ?3 WHERE r.id = ?1`,
  ).bind(ret.receipt_id, ret.supplier_id, ret.store_id).first();
  return { ...ret, ...names, reason_label: RETURN_REASONS[ret.reason] || ret.reason, lines: await returnLines(env, ret.id) };
}
