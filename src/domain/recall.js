/**
 * Recall tracing (feature 14, `recall.on`).
 *
 * For one lot of one item (its batch number, across every store and expiry it was received
 * under): where it came from, where every piece of it went, and what is left. Built from the
 * ledger, which is append-only, so it reads the same tomorrow as today.
 *
 *   came in     approved deliveries that brought the lot in
 *   went        every movement of its batches: used in a room, by a service, opened at a bench,
 *               moved between stores, taken by a person, written off, sent back
 *   left        what each store still holds, on the shelf and held for inspection
 *   with people what somebody has taken and not yet used or returned
 *   opened      packs opened at a bench or analyser, and how each ended
 *
 * Names of the people who used it are shown to those who may see use by person (`cost.people`);
 * everybody else allowed to trace sees the room, the department and the service.
 */

import { refuse } from '../lib/errors.js';
import { q3, text } from '../lib/data.js';
import { may } from './access.js';
import { requireFeature } from './settings.js';

const KIND_WORDS = {
  RECEIPT: 'Received', ISSUE: 'Used', TRANSFER_OUT: 'Sent to another store', TRANSFER_IN: 'Arrived from another store',
  ADJUST: 'Correction', COUNT: 'Count difference', TAKE: 'Taken by a person', RETURN: 'Put back', RELEASE: 'Released after inspection',
  SUPPLIER_RETURN: 'Sent back to the supplier', OPENING: 'Opening balance',
};

/** Lots whose number contains the text, newest first, to choose one from. */
export async function findLots(env, user, q) {
  await requireFeature(env, user.unitId, 'recall.on');
  const t = text(q, 60);
  if (!t || t.length < 2) return [];
  const { results } = await env.DB.prepare(
    `SELECT bt.item_id, i.name, i.code, i.uom, bt.batch_no, MIN(bt.expiry) AS expiry, SUM(bt.qty + bt.on_hold) AS left_qty, MAX(bt.received_at) AS last_in
       FROM batches bt JOIN items i ON i.id = bt.item_id JOIN stores s ON s.id = bt.store_id
      WHERE s.unit_id = ? AND bt.batch_no <> '' AND bt.batch_no LIKE ?
      GROUP BY bt.item_id, bt.batch_no ORDER BY last_in DESC LIMIT 30`,
  ).bind(user.unitId, `%${t}%`).all();
  return results || [];
}

export async function traceLot(env, user, { itemId, lot }) {
  await requireFeature(env, user.unitId, 'recall.on');
  const batchNo = text(lot, 60);
  if (!itemId || !batchNo) refuse('LOT_REQUIRED', 'Choose the item and the lot number.');
  const item = await env.DB.prepare(`SELECT id, code, name, uom FROM items WHERE id = ? AND unit_id = ?`).bind(itemId, user.unitId).first();
  if (!item) refuse('NOT_FOUND', 'That item is not in this unit.', 404);
  const { results: batches } = await env.DB.prepare(
    `SELECT bt.id, bt.store_id, s.name AS store_name, bt.expiry, bt.qty, bt.on_hold FROM batches bt JOIN stores s ON s.id = bt.store_id
      WHERE s.unit_id = ? AND bt.item_id = ? AND bt.batch_no = ?`,
  ).bind(user.unitId, item.id, batchNo).all();
  const ids = (batches || []).map((b) => b.id);
  if (!ids.length) refuse('NOT_FOUND', `No lot ${batchNo} of ${item.name} has been received in this unit.`, 404);
  const marks = ids.map(() => '?').join(',');
  const names = may(user, 'cost.people');

  const [{ results: moves }, { results: came }, { results: held }, { results: opened }] = await Promise.all([
    env.DB.prepare(
      `SELECT m.at, m.kind, m.qty, m.from_state, m.to_state, m.doc_type, m.doc_ref, m.reason, m.person_name, m.actor_name,
              s.name AS store_name, a.name AS area_name, d.name AS department_name, cs.name AS counterpart_name,
              CASE WHEN m.doc_type = 'SERVICE' THEN (SELECT sr.service_name FROM service_records sr WHERE sr.id = m.doc_id) END AS service_name
         FROM movements m JOIN stores s ON s.id = m.store_id
         LEFT JOIN areas a ON a.id = m.area_id LEFT JOIN departments d ON d.id = m.department_id
         LEFT JOIN stores cs ON cs.id = m.counterpart_store_id
        WHERE m.unit_id = ? AND m.batch_id IN (${marks})
        ORDER BY m.at`,
    ).bind(user.unitId, ...ids).all(),
    env.DB.prepare(
      `SELECT r.ref, r.at, r.decided_at, sup.name AS supplier_name, st.name AS store_name, rl.qty, rl.expiry, r.note_no, r.invoice_no
         FROM receipt_lines rl JOIN receipts r ON r.id = rl.receipt_id JOIN stores st ON st.id = r.store_id
         LEFT JOIN suppliers sup ON sup.id = r.supplier_id
        WHERE r.unit_id = ? AND rl.item_id = ? AND rl.batch_no = ? AND r.status = 'APPROVED'
        ORDER BY r.at`,
    ).bind(user.unitId, item.id, batchNo).all(),
    env.DB.prepare(
      `SELECT c.person_name, c.qty, c.taken_at, a.name AS area_name FROM custody c LEFT JOIN areas a ON a.id = c.area_id
        WHERE c.unit_id = ? AND c.batch_id IN (${marks}) AND c.qty > 0 ORDER BY c.taken_at`,
    ).bind(user.unitId, ...ids).all(),
    env.DB.prepare(
      `SELECT o.opened_at, o.qty, o.status, o.use_by, o.closed_at, o.close_reason, o.opened_by_name, a.name AS area_name, d.name AS department_name
         FROM lot_openings o LEFT JOIN areas a ON a.id = o.area_id LEFT JOIN departments d ON d.id = o.department_id
        WHERE o.unit_id = ? AND o.item_id = ? AND o.batch_no = ? ORDER BY o.opened_at`,
    ).bind(user.unitId, item.id, batchNo).all(),
  ]);

  const went = (moves || []).filter((m) => m.kind !== 'RECEIPT').map((m) => ({
    at: m.at, what: KIND_WORDS[m.kind] || m.kind, kind: m.kind, qty: q3(m.qty), store: m.store_name,
    where: [m.area_name, m.department_name].filter(Boolean).join(', ') || null,
    service: m.service_name || null, counterpart: m.counterpart_name || null, ref: m.doc_ref || null, reason: m.reason || null,
    person: names ? (m.person_name || null) : undefined,
  }));
  const used = q3(-went.filter((m) => m.kind === 'ISSUE').reduce((s, m) => s + m.qty, 0));
  return {
    item, lot: batchNo,
    expiry: [...new Set((batches || []).map((b) => b.expiry).filter(Boolean))],
    cameIn: came || [],
    left: (batches || []).filter((b) => b.qty > 0 || b.on_hold > 0).map((b) => ({ store: b.store_name, qty: b.qty, onHold: b.on_hold, expiry: b.expiry })),
    withPeople: (held || []).map((h) => ({ qty: h.qty, takenAt: h.taken_at, where: h.area_name, person: names ? h.person_name : undefined })),
    opened: (opened || []).map((o) => ({ ...o, opened_by_name: names ? o.opened_by_name : undefined })),
    went,
    totals: {
      received: q3((came || []).reduce((s, r) => s + r.qty, 0)), used,
      left: q3((batches || []).reduce((s, b) => s + b.qty + b.on_hold, 0)),
      withPeople: q3((held || []).reduce((s, h) => s + h.qty, 0)),
    },
    namesShown: names,
  };
}
