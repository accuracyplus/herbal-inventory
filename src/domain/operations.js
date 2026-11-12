/**
 * The everyday stock actions: use, transfer, and linen. Deliveries are in receipts.js.
 *
 * Each builds its document row (if it has one), asks the engine for the stock statements, and
 * commits both in one batch with the audit row.
 */

import { refuse } from '../lib/errors.js';
import { isoDate, nextRef, nonNegative, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { areaFor, storeFor } from './access.js';
import { consumptionFor } from './consumption.js';
import { buildLinenMove, buildPosting, commit, loadItems } from './stock.js';

const MAX_LINES = 200;

/** Lines from a request body: [{ itemId, qty, ... }]. Quantities are positive here. */
export function parseLines(raw, { allowZero = false } = {}) {
  if (!Array.isArray(raw) || !raw.length) refuse('NO_LINES', 'Add at least one item.');
  if (raw.length > MAX_LINES) refuse('TOO_MANY', `At most ${MAX_LINES} lines at a time.`);
  return raw.map((l, i) => {
    const qty = allowZero ? nonNegative(l?.qty) : positive(l?.qty);
    if (qty === null) refuse('BAD_QTY', `Line ${i + 1}: enter a quantity above zero.`);
    if (!l?.itemId) refuse('BAD_LINE', `Line ${i + 1}: choose an item.`);
    return {
      itemId: String(l.itemId),
      qty,
      batchId: l.batchId ? String(l.batchId) : null,
      batchNo: text(l.batchNo, 60),
      expiry: l.expiry ? isoDate(l.expiry) : null,
      expiryRaw: l.expiry,
      unitCost: l.unitCost === undefined || l.unitCost === null || l.unitCost === '' ? null : nonNegative(l.unitCost),
      note: text(l.note, 200),
    };
  });
}

function refuseInactive(items) {
  for (const it of items.values()) {
    if (!it.active) refuse('ITEM_INACTIVE', `${it.name} has been retired. Ask a manager to reactivate it first.`);
  }
}

/** Record use: stock leaves a store for a room, a treatment, or a purpose. */
export async function recordUse(env, user, body) {
  const store = await storeFor(env, user, body.storeId);
  const { area, person, departmentId } = await consumptionFor(env, user, { areaId: body.areaId, personId: body.personId });
  const lines = parseLines(body.lines);
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  refuseInactive(items);
  for (const it of items.values()) {
    if (it.is_linen) refuse('USE_LINEN_SCREEN', `${it.name} is linen. Use the Linen screen to send it to a room.`);
  }
  const purpose = text(body.purpose, 120);
  const docId = uuid();
  const { statements, value } = await buildPosting(env, {
    kind: 'ISSUE', unitId: user.unitId, actor: actorOf(user), doc: { type: 'USE', id: docId },
  }, lines.map((l) => ({
    item: items.get(l.itemId), store, qty: -l.qty, batchId: l.batchId,
    areaId: area?.id, reason: purpose, note: l.note || text(body.note, 300),
    personId: person?.id, personName: person?.name, departmentId,
  })));
  await commit(env, [...statements, auditStmt(env, user, 'USE', docId,
    `${lines.length} line(s) from ${store.name}${area ? ` to ${area.name}` : ''}${person ? ` by ${person.name}` : ''}${purpose ? `: ${purpose}` : ''}`)]);
  return { ok: true, id: docId, value };
}

/**
 * Move stock between two stores in the unit. Batches travel with their expiry dates, and the
 * cost does not change: a transfer is not a purchase.
 */
export async function transfer(env, user, body, { request = null, ref: givenRef = null } = {}) {
  const from = await storeFor(env, user, body.fromStoreId);
  const to = body.toStoreId ? await storeFor(env, user, body.toStoreId, { forWrite: false }) : null;
  const area = !to ? await areaFor(env, user, body.areaId) : null;
  if (!to && !area) refuse('DESTINATION', 'Choose where the stock is going.');
  if (to && !to.active) refuse('STORE_CLOSED', `${to.name} is closed.`);
  if (to && to.id === from.id) refuse('SAME_STORE', 'Choose two different stores.');

  const lines = parseLines(body.lines);
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  refuseInactive(items);

  const id = uuid();
  const ref = givenRef || await nextRef(env, user.unitId, user.unit.code, 'TRF');
  const doc = { type: 'TRANSFER', id, ref };
  const actor = actorOf(user);
  const note = text(body.note, 300);

  // To an area (fulfilling a request for use) it is an issue, not a transfer.
  if (!to) {
    const { person, departmentId } = await consumptionFor(env, user, {
      areaId: area.id, personId: body.personId,
      requester: request ? { id: request.requested_by, name: request.requested_by_name } : null,
    });
    const { statements } = await buildPosting(env, { kind: 'ISSUE', unitId: user.unitId, actor, doc },
      lines.map((l) => ({
        item: items.get(l.itemId), store: from, qty: -l.qty, batchId: l.batchId, areaId: area.id, note,
        personId: person?.id, personName: person?.name, departmentId,
      })));
    return {
      id, ref, statements: [
        env.DB.prepare(
          `INSERT INTO transfers (id, unit_id, ref, from_store_id, to_store_id, area_id, request_id, note, by_id, by_name, at)
           VALUES (?,?,?,?,NULL,?,?,?,?,?,?)`,
        ).bind(id, user.unitId, ref, from.id, area.id, request?.id ?? null, note, user.staffId, user.fullName, nowIso()),
        ...statements,
      ],
    };
  }

  for (const it of items.values()) {
    if (it.is_linen) {
      const b = await env.DB.prepare(`SELECT qty FROM balances WHERE store_id = ? AND item_id = ?`).bind(from.id, it.id).first();
      if (!b) refuse('NOT_ENOUGH', `There is no ${it.name} in ${from.name}.`);
    }
  }

  const out = await buildPosting(env, { kind: 'TRANSFER_OUT', unitId: user.unitId, actor, doc },
    lines.map((l) => ({ item: items.get(l.itemId), store: from, qty: -l.qty, batchId: l.batchId, counterpartStoreId: to.id, note })));
  const inn = await buildPosting(env, { kind: 'TRANSFER_IN', unitId: user.unitId, actor, doc },
    out.moved.map((m) => ({
      item: m.item, store: to, qty: -m.qty, batchNo: m.batchNo, expiry: m.expiry, counterpartStoreId: from.id, note,
    })));
  return {
    id, ref, statements: [
      env.DB.prepare(
        `INSERT INTO transfers (id, unit_id, ref, from_store_id, to_store_id, area_id, request_id, note, by_id, by_name, at)
         VALUES (?,?,?,?,?,NULL,?,?,?,?,?)`,
      ).bind(id, user.unitId, ref, from.id, to.id, request?.id ?? null, note, user.staffId, user.fullName, nowIso()),
      ...out.statements, ...inn.statements,
    ],
  };
}

export async function recordTransfer(env, user, body) {
  const t = await transfer(env, user, body);
  await commit(env, [...t.statements, auditStmt(env, user, 'TRANSFER', t.ref, `${(body.lines || []).length} line(s)`)]);
  return { ok: true, id: t.id, ref: t.ref };
}

/** Linen: one movement of pieces from one state to another. */
export async function linenMove(env, user, body) {
  const store = await storeFor(env, user, body.storeId);
  const items = await loadItems(env, user.unitId, [body.itemId]);
  const item = items.get(body.itemId);
  const area = body.flow === 'ISSUE' ? await areaFor(env, user, body.areaId) : null;
  const { statements } = await buildLinenMove(env, {
    unitId: user.unitId, actor: actorOf(user), store, item, flow: body.flow, qty: body.qty,
    areaId: area?.id, note: text(body.note, 300), from: body.from, reason: text(body.reason, 120),
  });
  await commit(env, [...statements, auditStmt(env, user, `LINEN_${body.flow}`, item.code,
    `${q3(body.qty)} × ${item.name} in ${store.name}${area ? ` to ${area.name}` : ''}`)]);
  return { ok: true };
}
