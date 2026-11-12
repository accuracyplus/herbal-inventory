/**
 * Pack sizes and shelf locations (feature 14, `packs.on`, `locations.on`).
 *
 * PACKS. Stock is always kept in the item's own unit: the ledger, the balances, the average cost
 * and every report stay in pieces (or bottles, or ml). A pack is a way of writing a quantity:
 * "5 cartons of 48" on an order is 240 pieces to the stock engine, at the carton's price over 48.
 * The order or delivery line keeps what was written (pack_label, pack_qty, pack_cost) beside what
 * it means, so the paper reads as the supplier's and the shelf as ours.
 *
 * A pack with a supplier is that supplier's own (Kerala Oils' carton is 48, another's is 24);
 * one without a supplier is anybody's. `use_for` says where it is offered: BUY on orders and
 * deliveries, STORE as the way a quantity on the shelf is shown, BOTH.
 *
 * LOCATIONS. A rack, shelf or bin for each item in each store. Shown where somebody has to find
 * the thing: giving out a request, and the count sheet (which is sorted by it).
 */

import { refuse } from '../lib/errors.js';
import { nonNegative, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { featureOn, requireFeature } from './settings.js';

const USES = ['BUY', 'STORE', 'BOTH'];

export async function packsByItem(env, unitId, itemIds = null) {
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.item_id, p.supplier_id, p.label, p.factor, p.use_for, s.name AS supplier_name
       FROM item_packs p LEFT JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.unit_id = ? ORDER BY p.factor`,
  ).bind(unitId).all();
  const map = new Map();
  for (const p of results || []) {
    if (itemIds && !itemIds.includes(p.item_id)) continue;
    const list = map.get(p.item_id) || [];
    list.push({ id: p.id, label: p.label, factor: p.factor, use: p.use_for, supplierId: p.supplier_id, supplierName: p.supplier_name });
    map.set(p.item_id, list);
  }
  return map;
}

/**
 * The statements that replace an item's packs, when the form sent `packs`. Each: { label,
 * factor, supplierId?, use? }. An empty list removes them all.
 */
export async function packStatements(env, user, itemId, body) {
  if (!Object.prototype.hasOwnProperty.call(body, 'packs')) return [];
  if (!Array.isArray(body.packs)) refuse('BAD_PACKS', 'Packs must be a list.');
  if (body.packs.length) await requireFeature(env, user.unitId, 'packs.on');
  if (body.packs.length > 12) refuse('TOO_MANY', 'At most 12 pack sizes on one item.');
  const seen = new Set();
  const rows = [];
  for (const [i, p] of body.packs.entries()) {
    const label = text(p?.label, 40);
    if (!label) refuse('PACK_LABEL', `Pack ${i + 1}: give it a name, such as "Carton of 48".`);
    const factor = positive(p?.factor);
    if (!factor || factor > 100000) refuse('PACK_FACTOR', `${label}: say how many of the item's own unit are in one, above zero.`);
    const use = USES.includes(p?.use) ? p.use : 'BOTH';
    const supplierId = p?.supplierId || null;
    if (supplierId) {
      const s = await env.DB.prepare(`SELECT 1 FROM suppliers WHERE id = ? AND unit_id = ?`).bind(supplierId, user.unitId).first();
      if (!s) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
    }
    const key = `${supplierId || ''}|${label.toLowerCase()}`;
    if (seen.has(key)) refuse('PACK_TWICE', `${label} is on the item twice.`);
    seen.add(key);
    rows.push({ label, factor: q3(factor), use, supplierId });
  }
  const now = nowIso();
  return [
    env.DB.prepare(`DELETE FROM item_packs WHERE item_id = ?`).bind(itemId),
    ...rows.map((r) => env.DB.prepare(
      `INSERT INTO item_packs (id, unit_id, item_id, supplier_id, label, factor, use_for, updated_at, updated_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).bind(uuid(), user.unitId, itemId, r.supplierId, r.label, r.factor, r.use, now, user.fullName)),
  ];
}

/**
 * Lines written in packs, turned into the item's own unit. `raws` are the request's lines in the
 * same order as `lines`; a raw line with `packId` and `packQty` (and `packCost`, the price of one
 * pack) sets the line's qty and unitCost from them, and `pack` for the document to keep.
 */
export async function applyPacks(env, unitId, lines, raws, { supplierId = null } = {}) {
  const wanted = raws.map((r) => r?.packId).filter(Boolean);
  if (!wanted.length) return lines;
  await requireFeature(env, unitId, 'packs.on');
  const marks = wanted.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, item_id, supplier_id, label, factor, use_for FROM item_packs WHERE unit_id = ? AND id IN (${marks})`,
  ).bind(unitId, ...wanted).all();
  const byId = new Map((results || []).map((p) => [p.id, p]));
  lines.forEach((l, i) => {
    const raw = raws[i] || {};
    if (!raw.packId) return;
    const p = byId.get(raw.packId);
    if (!p || p.item_id !== l.itemId) refuse('NOT_FOUND', `Line ${i + 1}: that pack is not one of this item's.`, 404);
    if (p.use_for === 'STORE') refuse('PACK_NOT_BOUGHT', `Line ${i + 1}: ${p.label} is how it is stored, not how it is bought.`);
    if (p.supplier_id && supplierId && p.supplier_id !== supplierId) refuse('PACK_SUPPLIER', `Line ${i + 1}: ${p.label} is another supplier's pack.`);
    const packQty = positive(raw.packQty);
    if (!packQty) refuse('BAD_QTY', `Line ${i + 1}: how many ${p.label}?`);
    const packCost = raw.packCost === undefined || raw.packCost === null || raw.packCost === '' ? null : nonNegative(raw.packCost);
    if (packCost === null && !(raw.packCost === undefined || raw.packCost === null || raw.packCost === '')) refuse('BAD_COST', `Line ${i + 1}: the price cannot be negative.`);
    l.qty = q3(packQty * p.factor);
    if (packCost !== null) l.unitCost = Math.round((packCost / p.factor) * 10000) / 10000;
    l.pack = { label: p.label, qty: packQty, cost: packCost ?? (l.unitCost != null ? Math.round(l.unitCost * p.factor * 100) / 100 : null) };
  });
  return lines;
}

// ── Locations ────────────────────────────────────────────────────────────────────────────

export async function locationsByItem(env, unitId) {
  if (!(await featureOn(env, unitId, 'locations.on'))) return null;
  const { results } = await env.DB.prepare(
    `SELECT l.store_id, l.item_id, l.location FROM item_locations l JOIN stores s ON s.id = l.store_id WHERE s.unit_id = ?`,
  ).bind(unitId).all();
  return new Map((results || []).map((r) => [`${r.item_id}|${r.store_id}`, r.location]));
}

/** levels: [{ storeId, location }]. Only a level line that carries `location` changes it; empty removes it. */
export async function locationStatements(env, user, itemId, levels) {
  if (!Array.isArray(levels) || !levels.some((l) => l && Object.prototype.hasOwnProperty.call(l, 'location'))) return [];
  await requireFeature(env, user.unitId, 'locations.on');
  return levels.filter((l) => l && Object.prototype.hasOwnProperty.call(l, 'location')).map((l) => {
    const loc = text(l.location, 40);
    return loc
      ? env.DB.prepare(
        `INSERT INTO item_locations (store_id, item_id, location)
         SELECT id, ?, ? FROM stores WHERE id = ? AND unit_id = ?
         ON CONFLICT(store_id, item_id) DO UPDATE SET location = excluded.location`,
      ).bind(itemId, loc, l.storeId, user.unitId)
      : env.DB.prepare(`DELETE FROM item_locations WHERE store_id = ? AND item_id = ?`).bind(l.storeId, itemId);
  });
}
