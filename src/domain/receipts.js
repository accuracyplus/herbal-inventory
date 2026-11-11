/**
 * Deliveries (goods received), in two steps.
 *
 *   recorded by the receiver ── PENDING ──approve──▶ APPROVED   stock reaches the shelf here
 *                                  ├──reject───▶ REJECTED   (with a reason; record it again)
 *                                  └──cancel───▶ CANCELLED  (by the receiver, or a manager)
 *
 * The receiver counts what arrived against the delivery note and attaches the note. Somebody
 * else approves: four eyes, as for every other approval. Nothing is on the shelf, in the average
 * cost or against the purchase order until then. A unit can switch the approval step off
 * (`receipts.approval`), and then a delivery posts as it is recorded.
 *
 * A delivery cannot be approved without its paper: the delivery note, or for a cash purchase with
 * no note, the supplier's invoice (`receipts.note` makes it optional).
 *
 * Differences are worked out for the approver from what each line keeps: counted against the
 * note, the note against what the order still expected, and the price against the order's.
 */

import { refuse } from '../lib/errors.js';
import { isoDate, m2, nextRef, nonNegative, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { filesFor } from '../lib/files.js';
import { may, requireOtherApprover, storeFor } from './access.js';
import { mappingStatements } from './notes.js';
import { parseLines } from './operations.js';
import { setting } from './settings.js';
import { buildPosting, commit, loadItems } from './stock.js';

const fmt = (n) => String(q3(n));

/**
 * The purchase order a delivery is against, checked: open, for this store, every line on it,
 * and not more than what was ordered plus 10% (a supplier delivering double is a conversation,
 * not a receipt). Returns what each order line still expects, and the updates that post it.
 */
async function againstOrder(env, user, poId, store, lines, items) {
  const po = await env.DB.prepare(`SELECT * FROM purchase_orders WHERE id = ? AND unit_id = ?`).bind(poId, user.unitId).first();
  if (!po) refuse('NOT_FOUND', 'That purchase order is not in this unit.', 404);
  if (!['APPROVED', 'PARTLY_RECEIVED'].includes(po.status)) {
    refuse('PO_NOT_OPEN', `${po.ref} is ${po.status.toLowerCase().replace('_', ' ')}; only an approved order can be received against.`);
  }
  if (po.store_id !== store.id) refuse('PO_STORE', `${po.ref} is to be delivered to a different store.`);
  const { results } = await env.DB.prepare(`SELECT * FROM po_lines WHERE po_id = ?`).bind(po.id).all();
  const byItem = new Map((results || []).map((p) => [p.item_id, p]));
  const got = new Map();
  for (const l of lines) {
    const pl = byItem.get(l.itemId);
    if (!pl) refuse('NOT_ON_PO', `${items.get(l.itemId).name} is not on ${po.ref}. Receive it separately.`);
    got.set(pl.id, q3((got.get(pl.id) || 0) + l.qty));
  }
  const updates = [];
  for (const [lineId, qty] of got) {
    const pl = (results || []).find((p) => p.id === lineId);
    const after = q3(pl.received_qty + qty);
    if (after > q3(pl.qty * 1.1)) refuse('OVER_RECEIVED', `${items.get(pl.item_id).name}: ${after} would be received against ${pl.qty} ordered on ${po.ref}.`);
    updates.push(env.DB.prepare(`UPDATE po_lines SET received_qty = round(received_qty + ?, 3) WHERE id = ?`).bind(qty, lineId));
  }
  // Status follows the lines, in the same batch: fully received when every line is.
  updates.push(env.DB.prepare(
    `UPDATE purchase_orders SET
       status = CASE WHEN NOT EXISTS (SELECT 1 FROM po_lines WHERE po_id = ?1 AND received_qty < qty) THEN 'RECEIVED' ELSE 'PARTLY_RECEIVED' END,
       closed_at = CASE WHEN NOT EXISTS (SELECT 1 FROM po_lines WHERE po_id = ?1 AND received_qty < qty) THEN ?2 ELSE closed_at END
     WHERE id = ?1`,
  ).bind(po.id, nowIso()));
  return { po, byItem, updates };
}

/** The statements that put a delivery on the shelf. The first one is what makes it happen once. */
async function postingStatements(env, user, receipt, store, lines, items) {
  const order = receipt.po_id ? await againstOrder(env, user, receipt.po_id, store, lines, items) : null;
  const posting = await buildPosting(env, {
    kind: 'RECEIPT', unitId: user.unitId, actor: actorOf(user), doc: { type: 'RECEIPT', id: receipt.id, ref: receipt.ref },
  }, lines.map((l) => ({ item: items.get(l.itemId), store, qty: l.qty, batchNo: l.batchNo, expiry: l.expiry, unitCost: l.unitCost, note: l.note })));
  return [
    env.DB.prepare(`INSERT INTO receipt_posted (receipt_id, at) VALUES (?,?)`).bind(receipt.id, nowIso()),
    ...posting.statements,
    ...(order ? order.updates : []),
  ];
}

export async function recordReceipt(env, user, body) {
  const store = await storeFor(env, user, body.storeId);
  const lines = parseLines(body.lines);
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  lines.forEach((l, i) => {
    const raw = body.lines[i] || {};
    const it = items.get(l.itemId);
    if (l.expiryRaw && !l.expiry) refuse('BAD_DATE', `${it.name}: the expiry date is not a real date.`);
    if (it.tracks_expiry && !l.expiry) refuse('EXPIRY_REQUIRED', `${it.name} tracks expiry dates. Enter the expiry date on the pack.`);
    l.noteQty = raw.noteQty === undefined || raw.noteQty === null || raw.noteQty === '' ? null : nonNegative(raw.noteQty);
    if (l.noteQty === null && !(raw.noteQty === undefined || raw.noteQty === null || raw.noteQty === '')) refuse('BAD_QTY', `Line ${i + 1}: the quantity on the note must be zero or more.`);
    l.noteText = text(raw.noteText, 200);
    l.factor = positive(raw.factor) || 1;
  });

  let supplier = null;
  if (body.supplierId) {
    supplier = await env.DB.prepare(`SELECT id, name FROM suppliers WHERE id = ? AND unit_id = ?`).bind(body.supplierId, user.unitId).first();
    if (!supplier) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
  }
  const order = body.poId ? await againstOrder(env, user, body.poId, store, lines, items) : null;
  if (order) supplier = supplier || await env.DB.prepare(`SELECT id, name FROM suppliers WHERE id = ?`).bind(order.po.supplier_id).first();
  for (const l of lines) {
    const it = items.get(l.itemId);
    const pl = order?.byItem.get(l.itemId);
    l.poQty = pl ? q3(pl.qty - pl.received_qty) : null;
    l.poCost = pl ? pl.unit_cost : null;
    l.unitCost = l.unitCost ?? pl?.unit_cost ?? it.last_cost ?? it.avg_cost ?? 0;
  }
  const noteDate = body.noteDate ? isoDate(body.noteDate) : null;
  if (body.noteDate && !noteDate) refuse('BAD_DATE', 'The delivery note date is not a real date.');

  const direct = await setting(env, user.unitId, 'receipts.approval') === 'none';
  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'GRN');
  const now = nowIso();
  const total = m2(lines.reduce((s, l) => s + l.qty * l.unitCost, 0));
  const receipt = { id, ref, po_id: order?.po.id ?? null };
  const about = `${lines.length} line(s) into ${store.name}${supplier ? ` from ${supplier.name}` : ''}${order ? ` against ${order.po.ref}` : ''}, AED ${total}`;

  await commit(env, [
    env.DB.prepare(
      `INSERT INTO receipts (id, unit_id, ref, store_id, supplier_id, po_id, invoice_no, invoice_date, note_no, note_date, note, total,
                             by_id, by_name, at, status, decided_at, decision_note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, user.unitId, ref, store.id, supplier?.id ?? null, receipt.po_id, text(body.invoiceNo, 60),
           body.invoiceDate ? isoDate(body.invoiceDate) : null, text(body.noteNo, 60), noteDate, text(body.note, 300), total,
           user.staffId, user.fullName, now, direct ? 'APPROVED' : 'PENDING', direct ? now : null, direct ? 'No approval step in this unit' : null),
    ...lines.map((l) => env.DB.prepare(
      `INSERT INTO receipt_lines (id, receipt_id, item_id, qty, note_qty, unit_cost, batch_no, expiry, note_text, po_qty, po_cost, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(uuid(), id, l.itemId, l.qty, l.noteQty, l.unitCost, l.batchNo, l.expiry, l.noteText, l.poQty, l.poCost, l.note)),
    ...(supplier ? mappingStatements(env, user, supplier.id, lines) : []),
    ...(direct ? await postingStatements(env, user, receipt, store, lines, items) : []),
    auditStmt(env, user, direct ? 'RECEIVE' : 'RECEIPT_RECORD', ref, about),
  ]);
  return { ok: true, id, ref, total, status: direct ? 'APPROVED' : 'PENDING' };
}

async function load(env, user, id) {
  const r = await env.DB.prepare(`SELECT * FROM receipts WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!r) refuse('NOT_FOUND', 'That delivery does not exist in this unit.', 404);
  return r;
}

const linesOf = async (env, receiptId) => (await env.DB.prepare(
  `SELECT rl.*, i.code, i.name, i.uom FROM receipt_lines rl JOIN items i ON i.id = rl.item_id WHERE rl.receipt_id = ? ORDER BY i.name`,
).bind(receiptId).all()).results || [];

export async function decideReceipt(env, user, id, action, body = {}) {
  const r = await load(env, user, id);
  if (r.status !== 'PENDING') refuse('ALREADY_DECIDED', `${r.ref} has already been ${r.status.toLowerCase()}.`, 409);
  const now = nowIso();
  const note = text(body.note, 500);

  if (action === 'cancel') {
    if (r.by_id !== user.staffId && !may(user, 'receipt.decide')) refuse('NOT_YOURS', 'Only the person who recorded it, or a manager, can cancel a delivery.', 403);
    await commit(env, [
      env.DB.prepare(`UPDATE receipts SET status = 'CANCELLED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ? AND status = 'PENDING'`)
        .bind(user.staffId, user.fullName, now, note, r.id),
      auditStmt(env, user, 'RECEIPT_CANCEL', r.ref, note),
    ]);
    return { ok: true, status: 'CANCELLED' };
  }
  if (!may(user, 'receipt.decide')) refuse('NOT_ALLOWED', 'Your role does not allow approving deliveries.', 403);
  await requireOtherApprover(env, user, r.by_id, 'delivery');
  if (action === 'reject') {
    if (!note) refuse('REASON_REQUIRED', 'Say why — the person who received it will see it.');
    await commit(env, [
      env.DB.prepare(`UPDATE receipts SET status = 'REJECTED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ? AND status = 'PENDING'`)
        .bind(user.staffId, user.fullName, now, note, r.id),
      auditStmt(env, user, 'RECEIPT_REJECT', r.ref, note),
    ]);
    return { ok: true, status: 'REJECTED' };
  }
  if (action !== 'approve') refuse('BAD_ACTION', 'Approve, reject or cancel.');

  if (await setting(env, user.unitId, 'receipts.note') !== 'optional') {
    const files = await filesFor(env, 'RECEIPT', r.id);
    if (!files.some((f) => f.kind === 'NOTE' || f.kind === 'INVOICE')) {
      refuse('NOTE_REQUIRED', `${r.ref} has no delivery note attached. Attach a photo or PDF of the note (or the invoice, for a purchase with no note) before approving.`);
    }
  }
  const store = await storeFor(env, user, r.store_id, { forWrite: false });
  if (!store.active) refuse('STORE_CLOSED', `${store.name} is closed.`);
  const rows = await linesOf(env, r.id);
  const lines = rows.map((l) => ({ itemId: l.item_id, qty: l.qty, batchNo: l.batch_no, expiry: l.expiry, unitCost: l.unit_cost, note: l.note }));
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  await commit(env, [
    ...await postingStatements(env, user, r, store, lines, items),
    env.DB.prepare(`UPDATE receipts SET status = 'APPROVED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ?`)
      .bind(user.staffId, user.fullName, now, note, r.id),
    auditStmt(env, user, 'RECEIVE', r.ref, `approved; recorded by ${r.by_name}, ${rows.length} line(s) into ${store.name}, AED ${r.total}`),
  ]);
  return { ok: true, status: 'APPROVED' };
}

/** What differs, in words, for the person approving. Pure. */
export function receiptFlags(lines, { poRef = null, missing = [] } = {}) {
  const flags = [];
  for (const l of lines) {
    if (l.note_qty !== null && l.note_qty !== undefined && q3(l.note_qty) !== q3(l.qty)) {
      const d = q3(l.qty - l.note_qty);
      flags.push({ kind: 'COUNT', tone: 'warn', item: l.name, text: `${l.name}: counted ${fmt(l.qty)} ${l.uom}, the note says ${fmt(l.note_qty)} (${fmt(Math.abs(d))} ${d < 0 ? 'short' : 'over'}).` });
    }
    const said = l.note_qty ?? l.qty;
    if (l.po_qty !== null && l.po_qty !== undefined && q3(said) !== q3(l.po_qty)) {
      flags.push(said > l.po_qty
        ? { kind: 'ORDER_QTY', tone: 'warn', item: l.name, text: `${l.name}: ${fmt(said)} ${l.uom} delivered, only ${fmt(l.po_qty)} still to come on ${poRef || 'the order'}.` }
        : { kind: 'ORDER_QTY', tone: 'info', item: l.name, text: `${l.name}: ${fmt(said)} ${l.uom} delivered of ${fmt(l.po_qty)} still to come on ${poRef || 'the order'}; ${fmt(l.po_qty - said)} outstanding.` });
    }
    if (l.po_cost !== null && l.po_cost !== undefined && Math.abs(l.unit_cost - l.po_cost) > 0.005) {
      flags.push({ kind: 'PRICE', tone: 'warn', item: l.name, text: `${l.name}: priced at ${m2(l.unit_cost).toFixed(2)} on this delivery, ${m2(l.po_cost).toFixed(2)} on ${poRef || 'the order'}.` });
    }
  }
  if (missing.length) flags.push({ kind: 'MISSING', tone: 'info', item: null, text: `On ${poRef || 'the order'} but not on this delivery: ${missing.join(', ')}.` });
  return flags;
}

export async function getReceipt(env, user, id) {
  const r = await load(env, user, id);
  const [lines, files, names] = await Promise.all([
    linesOf(env, r.id),
    filesFor(env, 'RECEIPT', r.id),
    env.DB.prepare(
      `SELECT st.name AS store_name, s.name AS supplier_name, p.ref AS po_ref FROM stores st
         LEFT JOIN suppliers s ON s.id = ?2 LEFT JOIN purchase_orders p ON p.id = ?3 WHERE st.id = ?1`,
    ).bind(r.store_id, r.supplier_id, r.po_id).first(),
  ]);
  let missing = [];
  if (r.po_id && r.status === 'PENDING') {
    const { results } = await env.DB.prepare(
      `SELECT i.name FROM po_lines pl JOIN items i ON i.id = pl.item_id WHERE pl.po_id = ? AND pl.received_qty < pl.qty ORDER BY i.name`,
    ).bind(r.po_id).all();
    const here = new Set(lines.map((l) => l.name));
    missing = (results || []).map((x) => x.name).filter((n) => !here.has(n));
  }
  return { ...r, ...names, lines, files, flags: receiptFlags(lines, { poRef: names?.po_ref, missing }), hasNote: files.some((f) => f.kind === 'NOTE' || f.kind === 'INVOICE') };
}

export async function listReceipts(env, user, { status, limit = 200 }) {
  const where = ['r.unit_id = ?'];
  const args = [user.unitId];
  if (status) where.push('r.status = ?'), args.push(status);
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.ref, r.status, r.at, r.by_id, r.by_name, r.total, r.note_no, r.invoice_no, r.decided_by_name, r.decided_at, r.decision_note,
            st.name AS store_name, s.name AS supplier_name, p.ref AS po_ref,
            (SELECT COUNT(*) FROM receipt_lines WHERE receipt_id = r.id) AS line_count,
            (SELECT COUNT(*) FROM files f WHERE f.doc_type = 'RECEIPT' AND f.doc_id = r.id AND f.removed_at IS NULL AND f.kind IN ('NOTE','INVOICE')) AS notes,
            (SELECT COUNT(*) FROM receipt_lines rl WHERE rl.receipt_id = r.id AND ((rl.note_qty IS NOT NULL AND rl.note_qty <> rl.qty)
                OR (rl.po_cost IS NOT NULL AND abs(rl.unit_cost - rl.po_cost) > 0.005) OR (rl.po_qty IS NOT NULL AND COALESCE(rl.note_qty, rl.qty) > rl.po_qty))) AS differences
       FROM receipts r JOIN stores st ON st.id = r.store_id LEFT JOIN suppliers s ON s.id = r.supplier_id LEFT JOIN purchase_orders p ON p.id = r.po_id
      WHERE ${where.join(' AND ')}
      ORDER BY CASE r.status WHEN 'PENDING' THEN 0 ELSE 1 END, r.at DESC LIMIT ?`,
  ).bind(...args, Math.min(Number(limit) || 200, 500)).all();
  return results || [];
}
