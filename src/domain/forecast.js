/**
 * Suggested stock levels, from what actually left each store.
 *
 * Use is what left the shelf for use or for another store: ISSUE (from the shelf, not the
 * second record made when held stock is used), TAKE less RETURN, and TRANSFER_OUT. Write-offs,
 * counts and corrections are not use.
 *
 *   daily use  = the average of the last 30 days' rate and the last 90 days' rate, so recent use
 *                counts but one busy week does not swing it. An item seen in the store for fewer
 *                than 90 days has its longer rate taken over the days it has been there.
 *   critical   = daily use × days to restock: what lasts while an order is on its way
 *   reorder    = daily use × (days to restock + days to spare)
 *   top up     = reorder + daily use × days one order should last
 *
 * Days to restock: for a main store the item's usual supplier's delivery time, else the unit's
 * setting; for a sub store the unit's restocking setting. Levels are rounded up to whole units,
 * and a used item's reorder level is never below one.
 *
 * Nothing changes by itself: a manager accepts the suggestions they want, edited or not.
 */

import { refuse } from '../lib/errors.js';
import { nonNegative, nowIso, q3 } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { storeFor } from './access.js';
import { setting } from './settings.js';
import { commit } from './stock.js';

const DAY = 864e5;
const up = (n) => Math.ceil(q3(n));

/** The three levels for one item from its use and timings. Pure, so the rule is tested alone. */
export function suggest({ used30, used90, daysKnown, leadDays, safetyDays, coverDays }) {
  const span90 = Math.min(90, Math.max(30, daysKnown ?? 90));
  const rate = (Math.max(0, used30) / 30 + Math.max(0, used90) / span90) / 2;
  if (!(rate > 0)) return null;
  const critical = up(rate * leadDays);
  const reorder = Math.max(1, up(rate * (leadDays + safetyDays)), critical);
  const par = Math.max(reorder + 1, up(reorder + rate * coverDays));
  return { rate: Math.round(rate * 1000) / 1000, critical, reorder, par };
}

/** Is a suggestion different enough from what is set to be worth a look? More than a fifth either way. */
export function differs(now, next) {
  if (!now) return true;
  const far = (a, b) => Math.abs(a - b) > Math.max(1, b * 0.2);
  return far(now.reorder, next.reorder) || far(now.par, next.par) || far(now.critical, next.critical);
}

async function timings(env, unitId) {
  const n = async (key) => Number(await setting(env, unitId, key));
  return { lead: await n('forecast.lead_days'), restock: await n('forecast.restock_days'), safety: await n('forecast.safety_days'), cover: await n('forecast.cover_days') };
}

/** Every item used from this store in the last 90 days, with what is set and what is suggested. */
export async function forecast(env, user, storeId, now = Date.now()) {
  const store = await storeFor(env, user, storeId, { forWrite: false });
  const t = await timings(env, user.unitId);
  const since90 = new Date(now - 90 * DAY).toISOString();
  const since30 = new Date(now - 30 * DAY).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT m.item_id,
            SUM(CASE WHEN m.at >= ? THEN -m.qty ELSE 0 END) AS used30,
            SUM(-m.qty) AS used90,
            (SELECT MIN(f.at) FROM movements f WHERE f.store_id = m.store_id AND f.item_id = m.item_id) AS first_at
       FROM movements m
      WHERE m.unit_id = ? AND m.store_id = ? AND m.at >= ?
        AND m.kind IN ('ISSUE','TAKE','RETURN','TRANSFER_OUT') AND COALESCE(m.from_state, '') <> 'custody'
      GROUP BY m.item_id`,
  ).bind(since30, user.unitId, store.id, since90).all();
  const used = new Map((results || []).map((r) => [r.item_id, r]));

  const { results: items } = await env.DB.prepare(
    `SELECT i.id, i.code, i.name, i.uom, i.category, i.is_linen, s.name AS supplier_name, s.lead_days,
            lv.reorder, lv.critical, lv.par, COALESCE(b.qty, 0) AS on_hand
       FROM items i
       LEFT JOIN suppliers s ON s.id = i.supplier_id AND s.unit_id = i.unit_id
       LEFT JOIN item_levels lv ON lv.item_id = i.id AND lv.store_id = ?
       LEFT JOIN balances b ON b.item_id = i.id AND b.store_id = ?
      WHERE i.unit_id = ? AND i.active = 1 AND i.is_linen = 0
      ORDER BY i.name`,
  ).bind(store.id, store.id, user.unitId).all();

  const rows = [];
  let unusedWithLevels = 0;
  for (const it of items || []) {
    const u = used.get(it.id);
    const set = it.reorder || it.critical || it.par ? { reorder: it.reorder, critical: it.critical, par: it.par } : null;
    if (!u || !(u.used90 > 0)) { if (set) unusedWithLevels += 1; continue; }
    const daysKnown = u.first_at ? Math.floor((now - Date.parse(u.first_at)) / DAY) : 90;
    const fromSupplier = store.kind === 'MAIN' && Number.isInteger(it.lead_days) && it.lead_days > 0;
    const leadDays = store.kind === 'MAIN' ? (fromSupplier ? it.lead_days : t.lead) : t.restock;
    const next = suggest({ used30: u.used30, used90: u.used90, daysKnown, leadDays, safetyDays: t.safety, coverDays: t.cover });
    if (!next) continue;
    rows.push({
      itemId: it.id, code: it.code, name: it.name, uom: it.uom, category: it.category, onHand: it.on_hand,
      used30: q3(u.used30), used90: q3(u.used90), daysKnown: Math.min(90, daysKnown), littleHistory: daysKnown < 30,
      leadDays, leadFrom: store.kind === 'MAIN' ? (fromSupplier ? 'supplier' : 'unit') : 'restock', supplierName: it.supplier_name,
      now: set, suggested: next, differs: differs(set, next),
    });
  }
  return {
    store: { id: store.id, name: store.name, kind: store.kind },
    timings: { leadDays: t.lead, restockDays: t.restock, safetyDays: t.safety, coverDays: t.cover },
    rows, noLevels: rows.filter((r) => !r.now).length, toLook: rows.filter((r) => r.differs).length, unusedWithLevels,
  };
}

/**
 * Accept levels for one store, as suggested or as the manager changed them. One batch, one audit
 * row. The same checks as editing an item: critical at or below reorder, top up above it.
 */
export async function acceptLevels(env, user, body) {
  const store = await storeFor(env, user, body.storeId, { forWrite: false });
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) refuse('NOTHING_CHOSEN', 'Tick at least one item to set its levels.');
  if (rows.length > 300) refuse('TOO_MANY', 'At most 300 items at once.');
  const ids = [...new Set(rows.map((r) => String(r.itemId)))];
  if (ids.length !== rows.length) refuse('DUPLICATE', 'An item is in the list twice.');
  const known = new Map();
  for (let i = 0; i < ids.length; i += 80) {
    const part = ids.slice(i, i + 80);
    const { results } = await env.DB.prepare(`SELECT id, name, is_linen FROM items WHERE unit_id = ? AND active = 1 AND id IN (${part.map(() => '?').join(',')})`).bind(user.unitId, ...part).all();
    for (const r of results || []) known.set(r.id, r);
  }
  const statements = rows.map((r) => {
    const it = known.get(String(r.itemId));
    if (!it) refuse('NOT_FOUND', 'One of the items is not in this unit, or has been retired.', 404);
    const reorder = nonNegative(r.reorder);
    const critical = nonNegative(r.critical);
    const par = nonNegative(r.par);
    if (reorder === null || critical === null || par === null) refuse('BAD_LEVELS', `${it.name}: each level is a number, zero or more.`);
    if (!(reorder > 0)) refuse('BAD_LEVELS', `${it.name}: the reorder level must be above zero. To stop ordering it, clear its levels on the item instead.`);
    if (critical > reorder) refuse('BAD_LEVELS', `${it.name}: the critical level should be at or below the reorder level.`);
    if (par <= reorder) refuse('BAD_LEVELS', `${it.name}: the top-up level should be above the reorder level.`);
    return env.DB.prepare(
      `INSERT INTO item_levels (item_id, store_id, reorder, critical, par) VALUES (?,?,?,?,?)
       ON CONFLICT(item_id, store_id) DO UPDATE SET reorder = excluded.reorder, critical = excluded.critical, par = excluded.par`,
    ).bind(it.id, store.id, q3(reorder), q3(critical), q3(par));
  });
  await commit(env, [...statements, auditStmt(env, user, 'LEVELS_FROM_FORECAST', store.name, `${rows.length} item(s), ${nowIso().slice(0, 10)}`)]);
  return { ok: true, set: rows.length };
}
