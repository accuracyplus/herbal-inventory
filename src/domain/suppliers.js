/**
 * Supplier depth: what each supplier charged, and how its deliveries went.
 *
 * Nothing here is typed by anybody. Prices are the unit costs on deliveries that were approved;
 * the delivery record is the unit's own purchase orders set against the deliveries that came.
 * So it is all read-only, fenced on the unit like every other query, and it is right the
 * moment a delivery is approved.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, m2 } from '../lib/data.js';

const YEAR_MS = 365 * 864e5;
const dayDiff = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 864e5);

async function supplierIn(env, user, id) {
  const s = await env.DB.prepare(
    `SELECT id, name, contact, phone, email, trn, terms, lead_days, notes, active FROM suppliers WHERE id = ? AND unit_id = ?`,
  ).bind(id, user.unitId).first();
  if (!s) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
  return s;
}

/** Every approved delivery line with a price, for these items, newest first. */
async function priceRows(env, unitId, { itemIds = null, supplierId = null, limit = 2000 } = {}) {
  const out = [];
  const chunks = itemIds ? Array.from({ length: Math.ceil(itemIds.length / 80) }, (_, i) => itemIds.slice(i * 80, i * 80 + 80)) : [null];
  for (const ids of chunks) {
    const where = [`r.unit_id = ?`, `r.status = 'APPROVED'`, `rl.unit_cost > 0`];
    const args = [unitId];
    if (ids) { where.push(`rl.item_id IN (${ids.map(() => '?').join(',')})`); args.push(...ids); }
    if (supplierId) { where.push('r.supplier_id = ?'); args.push(supplierId); }
    const { results } = await env.DB.prepare(
      `SELECT rl.item_id, rl.unit_cost, rl.qty, r.supplier_id, s.name AS supplier_name, s.active AS supplier_active,
              date(r.at, '+4 hours') AS day, r.at, r.ref, r.id AS receipt_id
         FROM receipt_lines rl JOIN receipts r ON r.id = rl.receipt_id LEFT JOIN suppliers s ON s.id = r.supplier_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.at DESC, rl.rowid DESC LIMIT ${Number(limit)}`,
    ).bind(...args).all();
    out.push(...(results || []));
  }
  return out;
}

/**
 * One line per supplier from an item's price rows (newest first): what it last charged and
 * when, what it charged the time before, and its lowest and highest in the last twelve months.
 * When two or more suppliers have a price, the lowest last price is marked.
 */
export function bySupplier(rows, now = Date.now()) {
  const since = gstDate(now - YEAR_MS);
  const map = new Map();
  for (const r of rows) {
    if (!r.supplier_id) continue; // a delivery with no supplier recorded is history, not a comparison
    let s = map.get(r.supplier_id);
    if (!s) {
      s = { supplierId: r.supplier_id, name: r.supplier_name, active: r.supplier_active !== 0, last: r.unit_cost, lastDay: r.day, before: null, beforeDay: null, low: null, high: null, deliveries: 0 };
      map.set(r.supplier_id, s);
    } else if (s.before === null) { s.before = r.unit_cost; s.beforeDay = r.day; }
    s.deliveries += 1;
    if (r.day >= since) { s.low = s.low === null ? r.unit_cost : Math.min(s.low, r.unit_cost); s.high = s.high === null ? r.unit_cost : Math.max(s.high, r.unit_cost); }
  }
  const list = [...map.values()].map((s) => ({ ...s, change: s.before === null ? null : m2(s.last - s.before) }));
  const priced = list.filter((s) => s.active);
  const least = priced.length > 1 ? Math.min(...priced.map((s) => s.last)) : null;
  return list.map((s) => ({ ...s, lowest: least !== null && s.active && s.last === least }))
    .sort((a, b) => a.last - b.last || a.name.localeCompare(b.name));
}

/** An item's prices: each supplier side by side, and the deliveries behind them. */
export async function itemPrices(env, user, itemId) {
  const item = await env.DB.prepare(`SELECT id, code, name, uom FROM items WHERE id = ? AND unit_id = ?`).bind(itemId, user.unitId).first();
  if (!item) refuse('NOT_FOUND', 'That item is not in this unit.', 404);
  const rows = await priceRows(env, user.unitId, { itemIds: [item.id], limit: 400 });
  return {
    item, suppliers: bySupplier(rows),
    history: rows.slice(0, 60).map((r) => ({ day: r.day, supplierId: r.supplier_id, supplierName: r.supplier_name, unitCost: r.unit_cost, qty: r.qty, ref: r.ref, receiptId: r.receipt_id })),
  };
}

/**
 * For a purchase order being written: per item, what this supplier last charged ("here"), and
 * another active supplier's last price when it is lower ("best"), so the buyer sees it before
 * the order goes for approval, not after.
 */
export async function priceGuide(env, user, { supplierId, itemIds }) {
  const ids = [...new Set((itemIds || []).map(String))].slice(0, 200);
  if (!ids.length) return {};
  const rows = await priceRows(env, user.unitId, { itemIds: ids, limit: 4000 });
  const byItem = new Map();
  for (const r of rows) { if (!byItem.has(r.item_id)) byItem.set(r.item_id, []); byItem.get(r.item_id).push(r); }
  const out = {};
  for (const id of ids) {
    const list = bySupplier(byItem.get(id) || []);
    const mine = list.find((s) => s.supplierId === supplierId) || null;
    const others = list.filter((s) => s.supplierId !== supplierId && s.active);
    const best = others.length ? others[0] : null; // bySupplier sorts lowest first
    out[id] = {
      here: mine ? { price: mine.last, day: mine.lastDay } : null,
      best: best && (!mine || best.last < mine.last) ? { price: best.last, day: best.lastDay, supplierId: best.supplierId, supplierName: best.name } : null,
    };
  }
  return out;
}

/** What a supplier has been charging: each item it delivered, its last price and the one before. */
export async function supplierPrices(env, user, supplierId) {
  const rows = await priceRows(env, user.unitId, { supplierId, limit: 3000 });
  const map = new Map();
  for (const r of rows) {
    const s = map.get(r.item_id);
    if (!s) map.set(r.item_id, { itemId: r.item_id, last: r.unit_cost, lastDay: r.day, before: null, deliveries: 1 });
    else { s.deliveries += 1; if (s.before === null) s.before = r.unit_cost; }
  }
  if (!map.size) return [];
  const ids = [...map.keys()];
  const names = new Map();
  for (let i = 0; i < ids.length; i += 80) {
    const part = ids.slice(i, i + 80);
    const { results } = await env.DB.prepare(`SELECT id, code, name, uom FROM items WHERE unit_id = ? AND id IN (${part.map(() => '?').join(',')})`).bind(user.unitId, ...part).all();
    for (const it of results || []) names.set(it.id, it);
  }
  return [...map.values()].filter((s) => names.has(s.itemId))
    .map((s) => ({ ...s, ...names.get(s.itemId), id: s.itemId, change: s.before === null ? null : m2(s.last - s.before) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * How a supplier's orders went, judged one by one. An order is:
 *   ON_TIME       all of it arrived, the last delivery on or before the expected date
 *   LATE          all of it arrived, after the expected date
 *   OVERDUE       not all here yet, and the expected date has passed
 *   WAITING       not all here yet, and not yet due
 *   CLOSED_SHORT  closed with something never delivered (not judged for time)
 *   NO_DATE       no expected date was given, so it cannot be judged for time
 * "Judged" is ON_TIME + LATE + OVERDUE: the orders that can be called on time or not.
 */
export function judgeOrders(orders, today = gstDate()) {
  const each = orders.map((o) => {
    const complete = o.status === 'RECEIVED';
    let verdict;
    let daysLate = null;
    if (complete && o.lines_short > 0) verdict = 'CLOSED_SHORT';
    else if (!o.expected_date) verdict = complete ? 'NO_DATE' : 'WAITING';
    else if (complete) {
      daysLate = o.last_day ? dayDiff(o.last_day, o.expected_date) : 0;
      verdict = daysLate > 0 ? 'LATE' : 'ON_TIME';
      if (daysLate < 0) daysLate = 0;
    } else if (today > o.expected_date) { verdict = 'OVERDUE'; daysLate = dayDiff(today, o.expected_date); } else verdict = 'WAITING';
    const approved = o.decided_at ? gstDate(Date.parse(o.decided_at)) : null;
    return { ...o, verdict, daysLate, waitDays: approved && o.first_day ? Math.max(0, dayDiff(o.first_day, approved)) : null };
  });
  const n = (v) => each.filter((o) => o.verdict === v).length;
  const waits = each.map((o) => o.waitDays).filter((d) => d !== null);
  const lates = each.filter((o) => o.verdict === 'LATE' || o.verdict === 'OVERDUE').map((o) => o.daysLate);
  return {
    orders: each.length, onTime: n('ON_TIME'), late: n('LATE'), overdue: n('OVERDUE'), waiting: n('WAITING'), closedShort: n('CLOSED_SHORT'), noDate: n('NO_DATE'),
    judged: n('ON_TIME') + n('LATE') + n('OVERDUE'),
    usualWaitDays: waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : null,
    usualDaysLate: lates.length ? Math.round(lates.reduce((a, b) => a + b, 0) / lates.length) : null,
    each,
  };
}

const ORDERS_SQL = `
  SELECT p.id, p.ref, p.supplier_id, p.status, p.expected_date, p.decided_at, p.closed_at, p.total,
         (SELECT COUNT(*) FROM po_lines WHERE po_id = p.id AND received_qty < qty) AS lines_short,
         (SELECT MIN(date(r.at, '+4 hours')) FROM receipts r WHERE r.po_id = p.id AND r.status = 'APPROVED') AS first_day,
         (SELECT MAX(date(r.at, '+4 hours')) FROM receipts r WHERE r.po_id = p.id AND r.status = 'APPROVED') AS last_day
    FROM purchase_orders p
   WHERE p.unit_id = ? AND p.status IN ('APPROVED','PARTLY_RECEIVED','RECEIVED') AND p.decided_at >= ?`;

/** The last twelve months of every supplier's orders, for the list: on time out of judged, and closed short. */
export async function suppliersRecord(env, user, now = Date.now()) {
  const since = new Date(now - YEAR_MS).toISOString();
  const { results } = await env.DB.prepare(`${ORDERS_SQL} ORDER BY p.decided_at DESC LIMIT 3000`).bind(user.unitId, since).all();
  const bySup = new Map();
  for (const o of results || []) { if (!bySup.has(o.supplier_id)) bySup.set(o.supplier_id, []); bySup.get(o.supplier_id).push(o); }
  const out = {};
  for (const [id, list] of bySup) {
    const { each, ...sum } = judgeOrders(list, gstDate(now)); // eslint-disable-line no-unused-vars
    out[id] = sum;
  }
  return out;
}

/** One supplier: who they are, how the last twelve months of orders went, and what they charge. */
export async function supplierPage(env, user, id, { prices = false, now = Date.now() } = {}) {
  const supplier = await supplierIn(env, user, id);
  const since = new Date(now - YEAR_MS).toISOString();
  const { results } = await env.DB.prepare(`${ORDERS_SQL} AND p.supplier_id = ? ORDER BY p.decided_at DESC LIMIT 300`).bind(user.unitId, since, id).all();
  const { each, ...record } = judgeOrders(results || [], gstDate(now));
  const note = await env.DB.prepare(
    `SELECT COUNT(DISTINCT r.id) AS deliveries, COUNT(rl.id) AS lines,
            COALESCE(SUM(CASE WHEN rl.note_qty IS NOT NULL AND rl.qty < rl.note_qty THEN 1 ELSE 0 END), 0) AS short
       FROM receipts r JOIN receipt_lines rl ON rl.receipt_id = r.id
      WHERE r.unit_id = ? AND r.supplier_id = ? AND r.status = 'APPROVED' AND r.at >= ?`,
  ).bind(user.unitId, id, since).first();
  return {
    supplier, record,
    againstNote: { deliveries: note?.deliveries || 0, lines: note?.lines || 0, short: note?.short || 0 },
    orders: each.slice(0, 30).map((o) => ({ id: o.id, ref: o.ref, status: o.status, expected: o.expected_date, lastDay: o.last_day, verdict: o.verdict, daysLate: o.daysLate, total: prices ? o.total : undefined })),
    prices: prices ? await supplierPrices(env, user, id) : null,
  };
}
