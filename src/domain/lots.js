/**
 * Opened packs: a kit, a vial, a bottle of reagent opened at a bench or analyser.
 *
 * Opening is a use: an ISSUE through the stock engine (first to expire first, expired never),
 * in the same batch as the opening row, so cost by department is the same as for any other use.
 * The opening row keeps what the ledger cannot: when it was opened, where it is in use, the date
 * it must be finished by, and how it ended. Finishing or discarding one moves no stock: it left
 * the shelf when it was opened.
 *
 * The in-use date is the earlier of the printed expiry and the day it was opened plus the days
 * the item stays usable once opened. Either may be missing; with neither there is no date.
 *
 * All of it is off until the unit switches on `lots.opened`.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { may, storeFor } from './access.js';
import { consumptionFor } from './consumption.js';
import { setting } from './settings.js';
import { buildPosting, commit, loadItems } from './stock.js';

const DAY = 864e5;

/** The in-use date: the earlier of the printed expiry and opened + life. Pure, tested alone. */
export function useBy({ openedOn, lifeDays, expiry }) {
  const byLife = lifeDays ? gstDate(Date.parse(`${openedOn}T00:00:00Z`) - 4 * 3600e3 + lifeDays * DAY) : null;
  const printed = expiry || null;
  if (byLife && printed) return byLife < printed ? byLife : printed;
  return byLife || printed;
}

/** How an open pack stands today: past its date, due within `dueDays`, fine, or no date at all. */
export function standing(useByDate, today = gstDate(), dueDays = 2) {
  if (!useByDate) return 'NO_DATE';
  if (useByDate < today) return 'PAST';
  if (useByDate <= gstDate(Date.parse(`${today}T00:00:00Z`) - 4 * 3600e3 + dueDays * DAY)) return 'DUE';
  return 'OK';
}

async function switchedOn(env, unitId) {
  if ((await setting(env, unitId, 'lots.opened')) !== 'on') {
    refuse('LOTS_OFF', 'Opened packs are not switched on for this unit. A unit administrator can switch them on under Admin, Settings.', 409);
  }
}

/** Open one or more packs of an item at a bench or analyser. */
export async function openPack(env, user, body) {
  await switchedOn(env, user.unitId);
  const store = await storeFor(env, user, body.storeId);
  if (!body.areaId) refuse('AREA_REQUIRED', 'Choose the bench or analyser it is opened for.');
  const { area, person, departmentId } = await consumptionFor(env, user, { areaId: body.areaId, personId: body.personId });
  const qty = positive(body.qty ?? 1);
  if (!qty) refuse('BAD_QTY', 'Enter how many packs are opened.');
  if (qty > 50) refuse('BAD_QTY', 'At most 50 packs at once.');
  const items = await loadItems(env, user.unitId, [String(body.itemId || '')]);
  const item = items.get(String(body.itemId));
  if (!item.active) refuse('INACTIVE', `${item.name} has been retired and cannot be used.`);
  if (item.is_linen) refuse('USE_LINEN_SCREEN', `${item.name} is linen. Use the Linen screen.`);

  const docId = uuid();
  const at = nowIso();
  const openedOn = gstDate(Date.parse(at));
  const { statements, moved } = await buildPosting(env, { kind: 'ISSUE', unitId: user.unitId, actor: actorOf(user), at, doc: { type: 'OPEN', id: docId } }, [{
    item, store, qty: -qty, batchId: body.batchId || undefined, areaId: area?.id, reason: 'Opened',
    note: text(body.note, 300), personId: person?.id, personName: person?.name, departmentId,
  }]);
  // One opening per batch it came from: a pack belongs to one lot.
  const rows = moved.map((m) => {
    const expiry = m.expiry || null;
    return {
      id: uuid(), batchId: m.batchId, batchNo: m.batchNo || null, expiry, qty: q3(-m.qty),
      useBy: useBy({ openedOn, lifeDays: item.open_life_days, expiry }),
    };
  });
  await commit(env, [
    ...statements,
    ...rows.map((r) => env.DB.prepare(
      `INSERT INTO lot_openings (id, unit_id, store_id, item_id, batch_id, batch_no, expiry, qty, opened_at, opened_by, opened_by_name,
                                 use_by, area_id, department_id, doc_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(r.id, user.unitId, store.id, item.id, r.batchId, r.batchNo, r.expiry, r.qty, at, user.staffId, user.fullName,
           r.useBy, area?.id ?? null, departmentId ?? null, docId)),
    auditStmt(env, user, 'PACK_OPEN', item.code, `${qty} × ${item.name}${rows.map((r) => (r.batchNo ? ` lot ${r.batchNo}` : '')).join(',')} at ${area?.name || 'no area'}`),
  ]);
  return { ok: true, id: docId, openings: rows.map((r) => ({ id: r.id, batchNo: r.batchNo, useBy: r.useBy, qty: r.qty })) };
}

const ROW_SQL = `
  SELECT o.id, o.item_id, i.name, i.code, i.uom, i.storage, o.batch_no, o.expiry, o.qty, o.opened_at, o.opened_by, o.opened_by_name,
         o.use_by, o.status, o.closed_at, o.closed_by_name, o.close_reason,
         o.area_id, a.name AS area_name, d.name AS department_name, s.name AS store_name
    FROM lot_openings o JOIN items i ON i.id = o.item_id JOIN stores s ON s.id = o.store_id
    LEFT JOIN areas a ON a.id = o.area_id LEFT JOIN departments d ON d.id = o.department_id`;

/**
 * Open packs, soonest due first; or finished and discarded ones, newest first. `q` finds a lot
 * number or an item by name, which is how a lot is traced to the benches that used it.
 */
export async function openings(env, user, { closed = false, q = '' } = {}) {
  const dueDays = Number(await setting(env, user.unitId, 'lots.due_days'));
  const today = gstDate();
  const where = ['o.unit_id = ?', closed ? "o.status <> 'OPEN'" : "o.status = 'OPEN'"];
  const args = [user.unitId];
  const find = text(q, 60);
  if (find) { where.push('(o.batch_no LIKE ? OR i.name LIKE ? OR i.code LIKE ?)'); args.push(`%${find}%`, `%${find}%`, `%${find}%`); }
  const { results } = await env.DB.prepare(
    `${ROW_SQL} WHERE ${where.join(' AND ')}
      ORDER BY ${closed ? 'o.closed_at DESC' : "CASE WHEN o.use_by IS NULL THEN 1 ELSE 0 END, o.use_by, o.opened_at"} LIMIT 300`,
  ).bind(...args).all();
  return (results || []).map((r) => ({ ...r, standing: r.status === 'OPEN' ? standing(r.use_by, today, dueDays) : null, mine: r.opened_by === user.staffId }));
}

/** Mark an open pack finished, or discarded with a reason. The opener, or the store's people. */
export async function closeOpening(env, user, id, action, body = {}) {
  if (!['finish', 'discard'].includes(action)) refuse('BAD_ACTION', 'Unknown action.');
  const o = await env.DB.prepare(`SELECT o.*, i.name FROM lot_openings o JOIN items i ON i.id = o.item_id WHERE o.id = ? AND o.unit_id = ?`).bind(id, user.unitId).first();
  if (!o) refuse('NOT_FOUND', 'That opened pack is not in this unit.', 404);
  if (o.status !== 'OPEN') refuse('ALREADY_CLOSED', `That pack of ${o.name} was already marked ${o.status === 'FINISHED' ? 'finished' : 'discarded'} by ${o.closed_by_name}.`, 409);
  if (o.opened_by !== user.staffId && !may(user, 'adjust.raise')) {
    refuse('NOT_YOURS', 'Only the person who opened it, or the store, can mark this pack.', 403);
  }
  const reason = text(body.reason, 300);
  if (action === 'discard' && !reason) refuse('REASON_REQUIRED', 'Say why it is being thrown away: past its date, contaminated, failed control.');
  const status = action === 'finish' ? 'FINISHED' : 'DISCARDED';
  await commit(env, [
    env.DB.prepare(
      `UPDATE lot_openings SET status = ?, closed_at = ?, closed_by = ?, closed_by_name = ?, close_reason = ? WHERE id = ? AND status = 'OPEN'`,
    ).bind(status, nowIso(), user.staffId, user.fullName, reason, o.id),
    auditStmt(env, user, action === 'finish' ? 'PACK_FINISH' : 'PACK_DISCARD', o.batch_no || o.name, reason),
  ]);
  return { ok: true, status };
}

// Today's line for packs past or near their in-use date is in waiting.js.
