/**
 * The stock engine. The only writer of `balances`, `batches` and `movements`.
 *
 * Every document that moves stock — a receipt, a transfer, an issue, an approved adjustment or
 * count, the opening import — describes its lines and hands them here. The engine:
 *
 *   1. checks there is enough on the shelf, and says which item and how many when there is not;
 *   2. for items with expiry dates, picks batches first-expiry-first-out (FEFO), skipping stock
 *      that has already expired unless the document is writing expired stock off;
 *   3. returns the statements that change the balance, the batch and the ledger together, for
 *      the caller to run in ONE D1 batch with its own document rows — so a receipt can never
 *      exist without its stock, nor stock without its receipt.
 *
 * The CHECK (qty >= 0) constraints in schema.sql are the backstop for the race the pre-check
 * cannot see (two people taking the last bottle in the same second): the second batch fails
 * whole, and `commit` turns that into a sentence.
 */

import { DomainError, refuse } from '../lib/errors.js';
import { gstDate, m2, nowIso, q3, uuid } from '../lib/data.js';

export const KINDS = ['RECEIPT', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUST', 'COUNT', 'OPENING', 'LINEN'];
export const LINEN_STATES = { available: 'qty', in_use: 'in_use', in_wash: 'in_wash' };

/** Items by id, fenced to the unit. Refuses an id from another unit as not found. */
export async function loadItems(env, unitId, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const marks = unique.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, unit_id, code, name, category, uom, tracks_expiry, is_linen, avg_cost, last_cost, active
       FROM items WHERE unit_id = ? AND id IN (${marks})`,
  ).bind(unitId, ...unique).all();
  const map = new Map((results || []).map((r) => [r.id, r]));
  for (const id of unique) if (!map.has(id)) refuse('NOT_FOUND', 'One of the items is not in this unit.', 404);
  return map;
}

export async function balanceOf(env, storeId, itemId) {
  const row = await env.DB.prepare(
    `SELECT qty, in_use, in_wash FROM balances WHERE store_id = ? AND item_id = ?`,
  ).bind(storeId, itemId).first();
  return row || { qty: 0, in_use: 0, in_wash: 0 };
}

const fmt = (n) => String(q3(n));

/**
 * Batches to take `qty` from, first expiry first. Unknown expiry ('') goes last: a batch whose
 * date nobody recorded is the one most worth looking at before it is used.
 */
async function fefo(env, { store, item, qty, kind, preferExpired }) {
  const today = gstDate();
  const { results } = await env.DB.prepare(
    `SELECT id, batch_no, expiry, qty FROM batches
      WHERE store_id = ? AND item_id = ? AND qty > 0
      ORDER BY CASE WHEN expiry = '' THEN 1 ELSE 0 END, expiry, received_at`,
  ).bind(store.id, item.id).all();
  let rows = results || [];
  const expired = (b) => b.expiry && b.expiry < today;
  if (kind === 'ISSUE' || kind === 'TRANSFER_OUT') {
    const usable = rows.filter((b) => !expired(b));
    if (!usable.length && rows.length) {
      refuse('ONLY_EXPIRED',
        `Only expired ${item.name} is left in ${store.name}. Write it off with a correction instead of using it.`);
    }
    rows = usable;
  } else if (preferExpired) {
    rows = [...rows.filter(expired), ...rows.filter((b) => !expired(b))];
  }
  const out = [];
  let left = qty;
  for (const b of rows) {
    if (left <= 0) break;
    const take = q3(Math.min(b.qty, left));
    out.push({ batchId: b.id, batchNo: b.batch_no, expiry: b.expiry, qty: take });
    left = q3(left - take);
  }
  if (left > 0) {
    const have = q3(qty - left);
    refuse('NOT_ENOUGH',
      `Only ${fmt(have)} ${item.uom} of ${item.name} can be taken from ${store.name}${kind === 'ISSUE' || kind === 'TRANSFER_OUT' ? ' (expired stock is not counted)' : ''}.`,
      422, { itemId: item.id, available: have });
  }
  return out;
}

/**
 * Build the statements for a set of lines.
 *
 * line: {
 *   item, store,                 rows from loadItems / storeFor
 *   qty,                         signed change to the shelf
 *   batchNo, expiry,             for a positive line on an expiry-tracked item
 *   batchId,                     to take from one named batch
 *   unitCost,                    receipts only: moves the item's average cost
 *   areaId, counterpartStoreId, reason, note
 * }
 * posting: { kind, unitId, doc: { type, id, ref }, actor: { id, name }, at, preferExpired }
 */
export async function buildPosting(env, posting, lines) {
  const { kind, unitId, doc = {}, actor, preferExpired = false } = posting;
  if (!KINDS.includes(kind) || kind === 'LINEN') throw new Error(`buildPosting: bad kind ${kind}`);
  const at = posting.at || nowIso();

  // 1. Enough on the shelf? Summed per store and item, so two lines of the same thing count once.
  const need = new Map();
  for (const l of lines) {
    if (!(Number(l.qty) !== 0)) refuse('BAD_QTY', `Enter a quantity for ${l.item.name}.`);
    if (l.qty < 0) {
      const k = `${l.store.id}|${l.item.id}`;
      need.set(k, { l, qty: q3((need.get(k)?.qty || 0) - l.qty) });
    }
  }
  for (const { l, qty } of need.values()) {
    const bal = await balanceOf(env, l.store.id, l.item.id);
    if (bal.qty < qty) {
      refuse('NOT_ENOUGH',
        `Only ${fmt(bal.qty)} ${l.item.uom} of ${l.item.name} in ${l.store.name}${l.item.is_linen ? ' (clean and available)' : ''}; you asked for ${fmt(qty)}.`,
        422, { itemId: l.item.id, storeId: l.store.id, available: bal.qty });
    }
  }

  // 2. Expand lines into batch-level parts.
  const parts = [];
  for (const l of lines) {
    const qty = q3(l.qty);
    if (!l.item.tracks_expiry) { parts.push({ ...l, qty }); continue; }
    if (qty > 0 && l.batchId) {
      // Back into a named batch (a found bottle of a known lot).
      const b = await env.DB.prepare(
        `SELECT batch_no, expiry FROM batches WHERE id = ? AND store_id = ? AND item_id = ?`,
      ).bind(l.batchId, l.store.id, l.item.id).first();
      if (!b) refuse('NOT_FOUND', `That batch of ${l.item.name} is not in ${l.store.name}.`, 404);
      parts.push({ ...l, qty, batchNo: b.batch_no, expiry: b.expiry });
      continue;
    }
    if (qty > 0) {
      const expiry = l.expiry || '';
      if (!expiry && (kind === 'RECEIPT')) {
        refuse('EXPIRY_REQUIRED', `${l.item.name} tracks expiry dates. Enter the expiry date on the pack.`);
      }
      parts.push({ ...l, qty, batchNo: String(l.batchNo || '').trim().slice(0, 60), expiry });
      continue;
    }
    if (l.batchId) {
      const b = await env.DB.prepare(
        `SELECT id, batch_no, expiry, qty FROM batches WHERE id = ? AND store_id = ? AND item_id = ?`,
      ).bind(l.batchId, l.store.id, l.item.id).first();
      if (!b) refuse('NOT_FOUND', `That batch of ${l.item.name} is not in ${l.store.name}.`, 404);
      if (b.qty < -qty) refuse('NOT_ENOUGH', `Batch ${b.batch_no || b.expiry || '(no number)'} of ${l.item.name} has only ${fmt(b.qty)} left.`);
      parts.push({ ...l, qty, batchId: b.id, batchNo: b.batch_no, expiry: b.expiry });
      continue;
    }
    for (const take of await fefo(env, { store: l.store, item: l.item, qty: -qty, kind, preferExpired })) {
      parts.push({ ...l, qty: -take.qty, batchId: take.batchId, batchNo: take.batchNo, expiry: take.expiry });
    }
  }

  // 3. Average cost, moved only by receipts (and the opening balance, which is a receipt of sorts).
  const costUpdates = new Map();
  if (kind === 'RECEIPT' || kind === 'OPENING') {
    for (const l of lines) {
      if (l.qty <= 0 || l.unitCost === undefined || l.unitCost === null) continue;
      const prev = costUpdates.get(l.item.id) || { avg: l.item.avg_cost || 0, onHand: await onHandInUnit(env, unitId, l.item.id) };
      const total = prev.onHand + l.qty;
      const avg = total > 0 ? (prev.onHand * prev.avg + l.qty * l.unitCost) / total : l.unitCost;
      costUpdates.set(l.item.id, { avg: Math.round(avg * 10000) / 10000, onHand: total, last: l.unitCost });
    }
  }

  // 4. Statements.
  const stmts = [];
  const moved = [];
  for (const p of parts) {
    // SQLite checks CHECK (qty >= 0) on the row an upsert would INSERT before it resolves the
    // conflict, so a negative delta must be a plain UPDATE. The pre-check above means the row
    // exists (balance rows are never deleted), and the CHECK still guards the result.
    stmts.push(p.qty > 0
      ? env.DB.prepare(
        `INSERT INTO balances (store_id, item_id, qty) VALUES (?,?,?)
         ON CONFLICT(store_id, item_id) DO UPDATE SET qty = round(qty + excluded.qty, 3)`,
      ).bind(p.store.id, p.item.id, p.qty)
      : env.DB.prepare(
        `UPDATE balances SET qty = round(qty + ?, 3) WHERE store_id = ? AND item_id = ?`,
      ).bind(p.qty, p.store.id, p.item.id));

    let batchSql = null;
    if (p.item.tracks_expiry) {
      if (p.qty > 0) {
        stmts.push(env.DB.prepare(
          `INSERT INTO batches (id, store_id, item_id, batch_no, expiry, qty, received_at) VALUES (?,?,?,?,?,?,?)
           ON CONFLICT(store_id, item_id, batch_no, expiry) DO UPDATE SET qty = round(qty + excluded.qty, 3)`,
        ).bind(uuid(), p.store.id, p.item.id, p.batchNo || '', p.expiry || '', p.qty, at));
        batchSql = { sql: `(SELECT id FROM batches WHERE store_id = ? AND item_id = ? AND batch_no = ? AND expiry = ?)`,
                     args: [p.store.id, p.item.id, p.batchNo || '', p.expiry || ''] };
      } else {
        stmts.push(env.DB.prepare(
          `UPDATE batches SET qty = round(qty + ?, 3) WHERE id = ?`,
        ).bind(p.qty, p.batchId));
        batchSql = { sql: '?', args: [p.batchId] };
      }
    }

    const unitCost = (kind === 'RECEIPT' || kind === 'OPENING') && p.unitCost != null ? p.unitCost : (p.item.avg_cost || 0);
    const id = uuid();
    stmts.push(env.DB.prepare(
      `INSERT INTO movements (id, unit_id, at, kind, item_id, store_id, batch_id, qty, balance_after,
                              unit_cost, value, doc_type, doc_id, doc_ref, area_id, counterpart_store_id,
                              reason, note, actor_id, actor_name)
       VALUES (?,?,?,?,?,?, ${batchSql ? batchSql.sql : 'NULL'}, ?,
               (SELECT qty FROM balances WHERE store_id = ? AND item_id = ?),
               ?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, unitId, at, kind, p.item.id, p.store.id, ...(batchSql ? batchSql.args : []), p.qty,
           p.store.id, p.item.id,
           unitCost, m2(p.qty * unitCost), doc.type ?? null, doc.id ?? null, doc.ref ?? null,
           p.areaId ?? null, p.counterpartStoreId ?? null, p.reason ?? null, p.note ?? null,
           actor?.id ?? null, actor?.name ?? null));
    moved.push({
      id, item: p.item, itemId: p.item.id, storeId: p.store.id, qty: p.qty, unitCost,
      batchId: p.batchId ?? null, batchNo: p.batchNo ?? null, expiry: p.expiry ?? null,
    });
  }

  for (const [itemId, c] of costUpdates) {
    stmts.push(env.DB.prepare(`UPDATE items SET avg_cost = ?, last_cost = ? WHERE id = ?`).bind(c.avg, c.last, itemId));
  }

  const value = m2(moved.reduce((s, m) => s + m.qty * m.unitCost, 0));
  return { statements: stmts, moved, value };
}

/** Everything of an item the unit holds: shelves, rooms and laundry. Used for average cost. */
async function onHandInUnit(env, unitId, itemId) {
  const row = await env.DB.prepare(
    `SELECT COALESCE(SUM(b.qty + b.in_use + b.in_wash), 0) AS n
       FROM balances b JOIN stores s ON s.id = b.store_id
      WHERE s.unit_id = ? AND b.item_id = ?`,
  ).bind(unitId, itemId).first();
  return Number(row?.n || 0);
}

/**
 * Linen changes state: clean pieces go to a room, used pieces go to the laundry, washed pieces
 * come back, worn-out pieces are discarded. The store's total changes only on discard.
 */
const FLOWS = {
  ISSUE:   { from: 'available', to: 'in_use',    label: 'issued to a room' },
  WASH:    { from: 'in_use',    to: 'in_wash',   label: 'sent to the laundry' },
  RETURN:  { from: 'in_wash',   to: 'available', label: 'returned clean' },
  // Sent straight from the shelf to the laundry (stained in storage, or a full rewash).
  REWASH:  { from: 'available', to: 'in_wash',   label: 'sent to the laundry from the shelf' },
  // Collected back from a room unused.
  BACK:    { from: 'in_use',    to: 'available', label: 'returned unused' },
};
export const LINEN_FLOWS = Object.keys(FLOWS);
export const DISCARD_FROM = ['available', 'in_use', 'in_wash'];

export async function buildLinenMove(env, { unitId, actor, store, item, flow, qty, areaId, note, from, reason }) {
  if (!item.is_linen) refuse('NOT_LINEN', `${item.name} is not set up as linen.`);
  const n = q3(qty);
  if (!(n > 0)) refuse('BAD_QTY', 'Enter how many pieces.');
  let fromState;
  let toState;
  if (flow === 'DISCARD') {
    if (!DISCARD_FROM.includes(from)) refuse('BAD_STATE', 'Say where the discarded pieces were: on the shelf, in a room or at the laundry.');
    if (!reason) refuse('REASON_REQUIRED', 'Say why the pieces are being discarded.');
    fromState = from;
    toState = 'gone';
  } else {
    const f = FLOWS[flow];
    if (!f) refuse('BAD_FLOW', 'Choose what is happening to the linen.');
    fromState = f.from;
    toState = f.to;
  }
  const bal = await balanceOf(env, store.id, item.id);
  const have = bal[LINEN_STATES[fromState]];
  if (have < n) {
    const where = { available: 'clean on the shelf', in_use: 'out in rooms', in_wash: 'at the laundry' }[fromState];
    refuse('NOT_ENOUGH', `Only ${fmt(have)} ${item.name} ${where} in ${store.name}.`, 422, { available: have });
  }
  const at = nowIso();
  const fromCol = LINEN_STATES[fromState];
  const stmts = [];
  if (toState === 'gone') {
    stmts.push(env.DB.prepare(
      `UPDATE balances SET ${fromCol} = round(${fromCol} - ?, 3) WHERE store_id = ? AND item_id = ?`,
    ).bind(n, store.id, item.id));
  } else {
    const toCol = LINEN_STATES[toState];
    stmts.push(env.DB.prepare(
      `UPDATE balances SET ${fromCol} = round(${fromCol} - ?, 3), ${toCol} = round(${toCol} + ?, 3)
        WHERE store_id = ? AND item_id = ?`,
    ).bind(n, n, store.id, item.id));
  }
  const cost = item.avg_cost || 0;
  stmts.push(env.DB.prepare(
    `INSERT INTO movements (id, unit_id, at, kind, item_id, store_id, qty, balance_after, from_state, to_state,
                            unit_cost, value, doc_type, area_id, reason, note, actor_id, actor_name)
     VALUES (?,?,?,'LINEN',?,?,?, (SELECT qty FROM balances WHERE store_id = ? AND item_id = ?), ?,?,?,?,'LINEN',?,?,?,?,?)`,
  ).bind(uuid(), unitId, at, item.id, store.id, n, store.id, item.id, fromState, toState,
         cost, toState === 'gone' ? m2(-n * cost) : 0, areaId ?? null, reason ?? null, note ?? null,
         actor.id, actor.name));
  return { statements: stmts };
}

/**
 * Run statements as one batch. A CHECK failure means stock moved between the pre-check and the
 * write — said as such, never as SQLite's words.
 */
export async function commit(env, statements) {
  try {
    return await env.DB.batch(statements);
  } catch (e) {
    const msg = String(e?.message || e);
    if (/CHECK constraint/i.test(msg)) {
      throw new DomainError('STOCK_CHANGED', 'Stock changed while you were recording this. Refresh and try again.', 409);
    }
    if (/UNIQUE constraint/i.test(msg)) {
      throw new DomainError('DUPLICATE', 'That has just been recorded by somebody else. Refresh and check.', 409);
    }
    throw e;
  }
}
