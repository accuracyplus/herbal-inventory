/**
 * Purchase orders and reorder suggestions.
 *
 *   DRAFT ──submit──▶ SUBMITTED ──approve──▶ APPROVED ──receive──▶ PARTLY_RECEIVED ──▶ RECEIVED
 *     │                   ├──reject──▶ REJECTED (back to the buyer with a reason)
 *     └──cancel──▶ CANCELLED        (an approved order can be cancelled while nothing is received)
 *
 * Receiving is in operations.receive, which moves stock and the order's received quantities in
 * one batch.
 */

import { refuse } from '../lib/errors.js';
import { isoDate, m2, nextRef, nonNegative, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { digestHex } from '../lib/files.js';
import { escapeHtml, isEmail, MailError, mailStatus, sendMail } from '../lib/mail.js';
import { poPdf } from '../lib/pdf.js';
import { requireOtherApprover, storeFor } from './access.js';
import { requireLimit } from './limits.js';
import { applyPacks } from './packs.js';
import { commit, loadItems } from './stock.js';
import { setting } from './settings.js';
import { priceGuide } from './suppliers.js';

async function supplierFor(env, user, id) {
  if (!id) refuse('SUPPLIER_REQUIRED', 'Choose a supplier.');
  const s = await env.DB.prepare(`SELECT id, name, active FROM suppliers WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!s) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
  return s;
}

function poLines(raw) {
  if (!Array.isArray(raw) || !raw.length) refuse('NO_LINES', 'Add at least one item to the order.');
  if (raw.length > 200) refuse('TOO_MANY', 'At most 200 lines on one order.');
  const seen = new Set();
  return raw.map((l, i) => {
    const qty = positive(l?.qty);
    if (!qty) refuse('BAD_QTY', `Line ${i + 1}: enter a quantity above zero.`);
    const cost = nonNegative(l?.unitCost ?? 0);
    if (cost === null) refuse('BAD_COST', `Line ${i + 1}: the price cannot be negative.`);
    if (seen.has(l.itemId)) refuse('DUPLICATE_LINE', `Line ${i + 1}: that item is already on the order. Change its quantity instead.`);
    seen.add(l.itemId);
    return { itemId: String(l.itemId), qty, unitCost: cost };
  });
}

async function load(env, user, id) {
  const po = await env.DB.prepare(`SELECT * FROM purchase_orders WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!po) refuse('NOT_FOUND', 'That purchase order does not exist in this unit.', 404);
  return po;
}

/** Create a draft, or replace a draft's header and lines. */
export async function savePo(env, user, body, id = null) {
  const supplier = await supplierFor(env, user, body.supplierId);
  if (!supplier.active) refuse('SUPPLIER_INACTIVE', `${supplier.name} is no longer active.`);
  const store = await storeFor(env, user, body.storeId, { forWrite: false });
  const lines = poLines(body.lines);
  await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  await applyPacks(env, user.unitId, lines, body.lines, { supplierId: supplier.id });
  const total = m2(lines.reduce((s, l) => s + l.qty * l.unitCost, 0));
  const lineRow = (poId, l) => env.DB.prepare(
    `INSERT INTO po_lines (id, po_id, item_id, qty, unit_cost, pack_label, pack_qty, pack_cost) VALUES (?,?,?,?,?,?,?,?)`,
  ).bind(uuid(), poId, l.itemId, l.qty, l.unitCost, l.pack?.label ?? null, l.pack?.qty ?? null, l.pack?.cost ?? null);
  const expected = body.expectedDate ? isoDate(body.expectedDate) : null;
  if (body.expectedDate && !expected) refuse('BAD_DATE', 'The expected date is not a real date.');
  const now = nowIso();

  if (id) {
    const po = await load(env, user, id);
    if (!['DRAFT', 'REJECTED'].includes(po.status)) refuse('NOT_EDITABLE', `${po.ref} has been ${po.status.toLowerCase()} and can no longer be changed.`, 409);
    await commit(env, [
      env.DB.prepare(
        `UPDATE purchase_orders SET supplier_id = ?, store_id = ?, expected_date = ?, note = ?, total = ?, status = 'DRAFT'
          WHERE id = ? AND status IN ('DRAFT','REJECTED')`,
      ).bind(supplier.id, store.id, expected, text(body.note, 500), total, po.id),
      env.DB.prepare(`DELETE FROM po_lines WHERE po_id = ?`).bind(po.id),
      ...lines.map((l) => lineRow(po.id, l)),
      auditStmt(env, user, 'PO_EDIT', po.ref, `${lines.length} line(s), AED ${total}`),
    ]);
    return { ok: true, id: po.id, ref: po.ref };
  }

  const newId = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'PO');
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO purchase_orders (id, unit_id, ref, supplier_id, store_id, status, expected_date, note, total,
                                    created_by, created_by_name, created_at)
       VALUES (?,?,?,?,?,'DRAFT',?,?,?,?,?,?)`,
    ).bind(newId, user.unitId, ref, supplier.id, store.id, expected, text(body.note, 500), total,
           user.staffId, user.fullName, now),
    ...lines.map((l) => lineRow(newId, l)),
    auditStmt(env, user, 'PO_CREATE', ref, `${supplier.name}, ${lines.length} line(s), AED ${total}`),
  ]);
  return { ok: true, id: newId, ref };
}

export async function poAction(env, user, id, action, body = {}) {
  const po = await load(env, user, id);
  const now = nowIso();
  const note = text(body.note, 500);
  const go = (sql, args, audit) => commit(env, [env.DB.prepare(sql).bind(...args), auditStmt(env, user, audit, po.ref, note)]);

  if (action === 'submit') {
    if (po.status !== 'DRAFT') refuse('BAD_STATE', `${po.ref} is not a draft.`, 409);
    await go(`UPDATE purchase_orders SET status = 'SUBMITTED', submitted_at = ? WHERE id = ? AND status = 'DRAFT'`, [now, po.id], 'PO_SUBMIT');
    return { ok: true, status: 'SUBMITTED' };
  }
  if (action === 'approve' || action === 'reject') {
    if (po.status !== 'SUBMITTED') refuse('BAD_STATE', `${po.ref} is not waiting for approval.`, 409);
    await requireOtherApprover(env, user, po.created_by, 'purchase order');
    if (action === 'reject' && !note) refuse('REASON_REQUIRED', 'Say why the order is being sent back.');
    if (action === 'approve') await requireLimit(env, user, 'po', po.total);
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    await go(
      `UPDATE purchase_orders SET status = ?, decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ?
        WHERE id = ? AND status = 'SUBMITTED'`,
      [status, user.staffId, user.fullName, now, note, po.id], action === 'approve' ? 'PO_APPROVE' : 'PO_REJECT',
    );
    return { ok: true, status };
  }
  if (action === 'cancel') {
    if (!['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].includes(po.status)) refuse('BAD_STATE', `${po.ref} cannot be cancelled now.`, 409);
    await go(
      `UPDATE purchase_orders SET status = 'CANCELLED', closed_at = ?, decision_note = COALESCE(?, decision_note)
        WHERE id = ? AND NOT EXISTS (SELECT 1 FROM po_lines WHERE po_id = ? AND received_qty > 0)`,
      [now, note, po.id, po.id], 'PO_CANCEL',
    );
    return { ok: true, status: 'CANCELLED' };
  }
  if (action === 'close') {
    // Close a partly received order: the rest will not come.
    if (po.status !== 'PARTLY_RECEIVED') refuse('BAD_STATE', 'Only a partly received order can be closed short.', 409);
    if (!note) refuse('REASON_REQUIRED', 'Say why the rest of the order will not arrive.');
    await go(`UPDATE purchase_orders SET status = 'RECEIVED', closed_at = ?, decision_note = ? WHERE id = ?`, [now, note, po.id], 'PO_CLOSE_SHORT');
    return { ok: true, status: 'RECEIVED' };
  }
  refuse('BAD_ACTION', 'Unknown action.');
}

export async function getPo(env, user, id, { prices = false } = {}) {
  const po = await load(env, user, id);
  const { results } = await env.DB.prepare(
    `SELECT pl.*, i.code, i.name, i.uom, i.tracks_expiry FROM po_lines pl JOIN items i ON i.id = pl.item_id
      WHERE pl.po_id = ? ORDER BY i.name`,
  ).bind(po.id).all();
  const extra = await env.DB.prepare(
    `SELECT s.name AS supplier_name, s.phone AS supplier_phone, s.email AS supplier_email, s.trn AS supplier_trn,
            s.contact AS supplier_contact, st.name AS store_name
       FROM suppliers s, stores st WHERE s.id = ? AND st.id = ?`,
  ).bind(po.supplier_id, po.store_id).first();
  const { results: receipts } = await env.DB.prepare(
    `SELECT id, ref, at, by_name, invoice_no, total, status FROM receipts WHERE po_id = ? AND status IN ('PENDING','APPROVED') ORDER BY at`,
  ).bind(po.id).all();
  const { results: emails } = await env.DB.prepare(
    `SELECT to_email, cc, status, error, by_name, at FROM po_emails WHERE po_id = ? ORDER BY at DESC LIMIT 20`,
  ).bind(po.id).all();
  const lines = results || [];
  // What this supplier was last paid for each item, so the approver sees a price that has gone up.
  if (prices && lines.length) {
    const guide = await priceGuide(env, user, { supplierId: po.supplier_id, itemIds: lines.map((l) => l.item_id) });
    for (const l of lines) {
      const g = guide[l.item_id];
      l.last_cost = g?.here?.price ?? null;
      l.last_day = g?.here?.day ?? null;
      l.best = g?.best ?? null;
    }
  }
  return { ...po, ...extra, lines, receipts: receipts || [], emails: emails || [] };
}

/** The order as a PDF: the same bytes whether it is downloaded or emailed. */
export async function poPdfFor(env, user, id) {
  const po = await getPo(env, user, id);
  const bytes = await poPdf(po, { unitName: user.unit.name, currency: (await setting(env, user.unitId, 'currency')) || 'AED' });
  return { po, bytes, name: `${po.ref}.pdf` };
}

/**
 * Email an approved order to its supplier, with the PDF. A person presses the button; nothing is
 * ever sent by itself. Every attempt is kept on the order, sent or failed, with who and when.
 * A second send has to be asked for on purpose (`again`), so a double press sends one email.
 */
export async function emailPo(env, user, id, body = {}) {
  const st = mailStatus(env);
  if (!st.ready) refuse('MAIL_NOT_SET_UP', 'Emailing is not set up for this app yet. Download the PDF and send it yourself.', 409);
  const { po, bytes, name } = await poPdfFor(env, user, id);
  if (!['APPROVED', 'PARTLY_RECEIVED'].includes(po.status)) {
    refuse('NOT_APPROVED', `Only an approved order can be sent to the supplier. ${po.ref} is ${STATE_WORDS[po.status] || po.status.toLowerCase()}.`, 409);
  }
  const to = String(po.supplier_email || '').trim();
  if (!isEmail(to)) refuse('NO_SUPPLIER_EMAIL', `${po.supplier_name} has no email address. Add it under Purchasing, Suppliers, then send again.`, 422);
  // Separated by commas, semicolons or new lines; a space inside one is a mistake to point out, not a separator.
  const cc = [...new Set(String(body.cc || '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean))];
  if (cc.length > 5) refuse('TOO_MANY_COPIES', 'At most five addresses can be copied.');
  const wrong = cc.find((a) => !isEmail(a));
  if (wrong) refuse('BAD_EMAIL', `“${wrong}” does not look like an email address.`);
  const sent = po.emails.find((e) => e.status === 'SENT');
  if (sent && body.again !== true) {
    refuse('ALREADY_SENT', `${po.ref} was already emailed to ${sent.to_email} by ${sent.by_name}. Press Send again if the supplier needs another copy.`, 409, { at: sent.at, to: sent.to_email });
  }

  const note = text(body.message, 1000);
  const subject = `Purchase order ${po.ref} from ${user.unit.name}`;
  const html = [
    `<p>Dear ${escapeHtml(po.supplier_contact || po.supplier_name)},</p>`,
    `<p>Please find attached purchase order <b>${escapeHtml(po.ref)}</b> from ${escapeHtml(user.unit.name)}, to be delivered to ${escapeHtml(po.store_name)}${po.expected_date ? ` by ${escapeHtml(po.expected_date)}` : ''}.</p>`,
    note ? `<p>${escapeHtml(note).replace(/\n/g, '<br>')}</p>` : '',
    '<p>Please send the delivery note with the goods, and reply to this email if anything on the order cannot be supplied.</p>',
    `<p>${escapeHtml(user.fullName)}<br>${escapeHtml(user.unit.name)}</p>`,
  ].join('');
  const digest = await digestHex(bytes);
  const row = (status, error) => env.DB.prepare(
    `INSERT INTO po_emails (id, unit_id, po_id, to_email, cc, subject, status, error, pdf_sha256, by_id, by_name, at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(uuid(), user.unitId, po.id, to, cc.join(', ') || null, subject, status, error, digest, user.staffId, user.fullName, nowIso());
  try {
    await sendMail(env, { to: [to], cc, subject, html, attachments: [{ name, type: 'application/pdf', bytes }] });
  } catch (e) {
    const said = e instanceof MailError ? e.message : 'The email could not be sent. Try again; if it keeps failing, tell an administrator.';
    await commit(env, [row('FAILED', said), auditStmt(env, user, 'PO_EMAIL_FAILED', po.ref, said)]);
    refuse('MAIL_FAILED', said, 502);
  }
  await commit(env, [row('SENT', null), auditStmt(env, user, 'PO_EMAIL', po.ref, `to ${to}${cc.length ? `, copy to ${cc.join(', ')}` : ''}`)]);
  return { ok: true, to, cc };
}

const STATE_WORDS = { DRAFT: 'still a draft', SUBMITTED: 'waiting for approval', REJECTED: 'sent back', CANCELLED: 'cancelled', RECEIVED: 'fully received' };

export async function listPos(env, user, { status }) {
  const where = ['p.unit_id = ?'];
  const args = [user.unitId];
  if (status === 'OPEN') where.push(`p.status IN ('DRAFT','SUBMITTED','APPROVED','PARTLY_RECEIVED','REJECTED')`);
  else if (status) where.push('p.status = ?'), args.push(status);
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.ref, p.status, p.total, p.expected_date, p.created_at, p.created_by_name, p.decided_by_name,
            s.name AS supplier_name, st.name AS store_name,
            (SELECT COUNT(*) FROM po_lines WHERE po_id = p.id) AS line_count
       FROM purchase_orders p JOIN suppliers s ON s.id = p.supplier_id JOIN stores st ON st.id = p.store_id
      WHERE ${where.join(' AND ')}
      ORDER BY CASE p.status WHEN 'SUBMITTED' THEN 0 WHEN 'APPROVED' THEN 1 WHEN 'PARTLY_RECEIVED' THEN 2
                             WHEN 'DRAFT' THEN 3 WHEN 'REJECTED' THEN 4 ELSE 5 END, p.created_at DESC
      LIMIT 300`,
  ).bind(...args).all();
  return results || [];
}

/**
 * What to buy, store by store: anything at or below its reorder level, topped up to par (or to
 * twice the reorder level when no par is set), less what is already on an open order.
 * Grouped by each item's usual supplier so a draft order per supplier is one click.
 */
export async function suggestions(env, user, storeId) {
  const store = await storeFor(env, user, storeId, { forWrite: false });
  const { results } = await env.DB.prepare(
    `SELECT i.id AS item_id, i.code, i.name, i.uom, i.category, i.last_cost, i.avg_cost,
            i.supplier_id, s.name AS supplier_name,
            COALESCE(b.qty, 0) AS on_hand, lv.reorder, lv.par,
            COALESCE((SELECT SUM(pl.qty - pl.received_qty) FROM po_lines pl JOIN purchase_orders p ON p.id = pl.po_id
                       WHERE pl.item_id = i.id AND p.store_id = ? AND p.status IN ('DRAFT','SUBMITTED','APPROVED','PARTLY_RECEIVED')), 0) AS on_order
       FROM item_levels lv
       JOIN items i ON i.id = lv.item_id AND i.active = 1
       LEFT JOIN balances b ON b.item_id = i.id AND b.store_id = lv.store_id
       LEFT JOIN suppliers s ON s.id = i.supplier_id
      WHERE lv.store_id = ? AND lv.reorder > 0
      ORDER BY s.name, i.name`,
  ).bind(store.id, store.id).all();
  return (results || [])
    .filter((r) => r.on_hand + r.on_order <= r.reorder)
    .map((r) => {
      const target = r.par > 0 ? r.par : r.reorder * 2;
      return {
        ...r,
        suggest: q3(Math.max(0, target - r.on_hand - r.on_order)),
        unit_cost: r.last_cost ?? r.avg_cost ?? 0,
      };
    })
    .filter((r) => r.suggest > 0);
}
