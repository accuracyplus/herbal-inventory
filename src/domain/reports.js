/**
 * Reports. Every one returns plain rows the client can show as a table, chart and CSV.
 *
 * None of them ranks people (design guide rule 5, "nobody is compared"): consumption is by
 * item, category, room and day — never by who recorded it. Who did what is in the ledger,
 * where it belongs, as a record rather than a league table.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, isoDate, q3 } from '../lib/data.js';
import { may } from './access.js';
import { setting } from './settings.js';

/** A Gulf-time date range as UTC instants. Defaults to the last 30 days. */
export function range(url) {
  const to = isoDate(url.searchParams.get('to')) || gstDate();
  const from = isoDate(url.searchParams.get('from')) || gstDate(Date.now() - 29 * 864e5);
  if (from > to) refuse('BAD_RANGE', 'The start date is after the end date.');
  const days = (new Date(to) - new Date(from)) / 864e5;
  if (days > 732) refuse('BAD_RANGE', 'Choose a range of two years or less.');
  return {
    from, to,
    fromAt: new Date(`${from}T00:00:00+04:00`).toISOString(),
    toAt: new Date(new Date(`${to}T00:00:00+04:00`).getTime() + 864e5).toISOString(),
  };
}

const money = (user) => may(user, 'cost.view');

export async function valuation(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT code, name, category, uom, store, qty, in_use, in_wash, with_people, avg_cost,
            round((qty + in_use + in_wash + with_people) * avg_cost, 2) AS value
       FROM (SELECT i.code, i.name, i.category, i.uom, s.name AS store, b.qty, b.in_use, b.in_wash, i.avg_cost,
                    COALESCE((SELECT SUM(c.qty) FROM custody c WHERE c.store_id = b.store_id AND c.item_id = b.item_id), 0) AS with_people
               FROM balances b JOIN items i ON i.id = b.item_id JOIN stores s ON s.id = b.store_id
              WHERE s.unit_id = ?)
      WHERE qty > 0 OR in_use > 0 OR in_wash > 0 OR with_people > 0
      ORDER BY category, name, store`,
  ).bind(user.unitId).all();
  const rows = results || [];
  if (!money(user)) return { rows: rows.map(({ avg_cost, value, ...r }) => r) };
  const byCategory = {};
  const byStore = {};
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] || 0) + r.value;
    byStore[r.store] = (byStore[r.store] || 0) + r.value;
  }
  const round = (o) => Object.entries(o).map(([k, v]) => ({ name: k, value: Math.round(v * 100) / 100 })).sort((a, b) => b.value - a.value);
  return { rows, byCategory: round(byCategory), byStore: round(byStore), total: Math.round(rows.reduce((s, r) => s + r.value, 0) * 100) / 100 };
}

export async function consumption(env, user, url) {
  const r = range(url);
  const storeId = url.searchParams.get('store') || null;
  const base = `FROM movements m JOIN items i ON i.id = m.item_id
                WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at < ? ${storeId ? 'AND m.store_id = ?' : ''}`;
  const args = [user.unitId, r.fromAt, r.toAt, ...(storeId ? [storeId] : [])];
  const [byItem, byCategory, byArea, byDay] = await Promise.all([
    env.DB.prepare(`SELECT i.code, i.name, i.category, i.uom, round(SUM(-m.qty), 3) AS qty, round(SUM(-m.value), 2) AS value,
                           COUNT(*) AS times ${base} GROUP BY i.id ORDER BY value DESC, qty DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT i.category AS name, round(SUM(-m.value), 2) AS value, round(SUM(-m.qty), 3) AS qty ${base} GROUP BY i.category ORDER BY value DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT COALESCE(a.name, COALESCE(m.reason, 'Not stated')) AS name, round(SUM(-m.value), 2) AS value, COUNT(*) AS times
                      FROM movements m JOIN items i ON i.id = m.item_id LEFT JOIN areas a ON a.id = m.area_id
                     WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at < ? ${storeId ? 'AND m.store_id = ?' : ''}
                     GROUP BY 1 ORDER BY value DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT date(m.at, '+4 hours') AS day, round(SUM(-m.value), 2) AS value, round(SUM(-m.qty), 3) AS qty ${base} GROUP BY day ORDER BY day`).bind(...args).all(),
  ]);
  const strip = (rows) => (money(user) ? rows : rows.map(({ value, ...x }) => x));
  return {
    ...r,
    byItem: strip(byItem.results || []),
    byCategory: strip(byCategory.results || []),
    byArea: strip(byArea.results || []),
    byDay: strip(byDay.results || []),
  };
}

export async function ledger(env, user, url) {
  const r = range(url);
  const where = ['m.unit_id = ?', 'm.at >= ?', 'm.at < ?'];
  const args = [user.unitId, r.fromAt, r.toAt];
  for (const [param, col] of [['store', 'm.store_id'], ['item', 'm.item_id'], ['kind', 'm.kind']]) {
    const v = url.searchParams.get(param);
    if (v) where.push(`${col} = ?`), args.push(v);
  }
  const { results } = await env.DB.prepare(
    `SELECT m.at, m.kind, i.code, i.name AS item, i.uom, s.name AS store, m.qty, m.balance_after, m.from_state, m.to_state,
            m.unit_cost, m.value, m.doc_ref, a.name AS area, cs.name AS counterpart, m.reason, m.note, m.actor_name,
            bt.batch_no, bt.expiry
       FROM movements m JOIN items i ON i.id = m.item_id JOIN stores s ON s.id = m.store_id
       LEFT JOIN areas a ON a.id = m.area_id LEFT JOIN stores cs ON cs.id = m.counterpart_store_id
       LEFT JOIN batches bt ON bt.id = m.batch_id
      WHERE ${where.join(' AND ')}
      ORDER BY m.at DESC LIMIT 3000`,
  ).bind(...args).all();
  const rows = results || [];
  return { ...r, rows: money(user) ? rows : rows.map(({ unit_cost, value, ...x }) => x), capped: rows.length === 3000 };
}

export async function expiryReport(env, user) {
  const warnDays = Number(await setting(env, user.unitId, 'expiry.warn_days')) || 60;
  const { results } = await env.DB.prepare(
    `SELECT i.code, i.name, i.uom, s.name AS store, bt.batch_no, bt.expiry, bt.qty, round(bt.qty * i.avg_cost, 2) AS value
       FROM batches bt JOIN items i ON i.id = bt.item_id JOIN stores s ON s.id = bt.store_id
      WHERE s.unit_id = ? AND bt.qty > 0
      ORDER BY CASE WHEN bt.expiry = '' THEN 1 ELSE 0 END, bt.expiry, i.name`,
  ).bind(user.unitId).all();
  const today = gstDate();
  const soon = gstDate(Date.now() + warnDays * 864e5);
  const rows = (results || []).map((b) => ({
    ...b,
    state: !b.expiry ? 'UNKNOWN' : b.expiry < today ? 'EXPIRED' : b.expiry <= soon ? 'SOON' : 'OK',
    days: b.expiry ? Math.round((new Date(b.expiry) - new Date(today)) / 864e5) : null,
  }));
  return { warnDays, rows: money(user) ? rows : rows.map(({ value, ...x }) => x) };
}

export async function variance(env, user, url) {
  const r = range(url);
  const [{ results: counts }, { results: adj }] = await Promise.all([
    env.DB.prepare(
      `SELECT m.at, m.doc_ref AS ref, i.code, i.name, s.name AS store, m.qty, m.value
         FROM movements m JOIN items i ON i.id = m.item_id JOIN stores s ON s.id = m.store_id
        WHERE m.unit_id = ? AND m.kind = 'COUNT' AND m.at >= ? AND m.at < ? ORDER BY m.at DESC`,
    ).bind(user.unitId, r.fromAt, r.toAt).all(),
    env.DB.prepare(
      `SELECT m.reason AS name, COUNT(*) AS lines, round(SUM(m.qty), 3) AS qty, round(SUM(m.value), 2) AS value
         FROM movements m WHERE m.unit_id = ? AND m.kind IN ('ADJUST') AND m.at >= ? AND m.at < ?
        GROUP BY m.reason ORDER BY value`,
    ).bind(user.unitId, r.fromAt, r.toAt).all(),
  ]);
  const strip = (rows) => (money(user) ? rows : rows.map(({ value, ...x }) => x));
  return { ...r, counts: strip(counts || []), byReason: strip(adj || []) };
}

export async function slowMoving(env, user) {
  const days = Number(await setting(env, user.unitId, 'slow.days')) || 90;
  const { results } = await env.DB.prepare(
    `SELECT i.code, i.name, i.category, i.uom, round(SUM(b.qty), 3) AS qty, round(SUM(b.qty) * i.avg_cost, 2) AS value,
            (SELECT MAX(at) FROM movements m WHERE m.item_id = i.id AND m.kind IN ('ISSUE','TRANSFER_OUT')) AS last_used
       FROM items i JOIN balances b ON b.item_id = i.id
      WHERE i.unit_id = ? AND i.active = 1 AND i.is_linen = 0
      GROUP BY i.id HAVING SUM(b.qty) > 0 AND (last_used IS NULL OR last_used < datetime('now', ?))
      ORDER BY value DESC`,
  ).bind(user.unitId, `-${days} days`).all();
  const rows = results || [];
  return { days, rows: money(user) ? rows : rows.map(({ value, ...x }) => x) };
}

export async function purchases(env, user, url) {
  const r = range(url);
  const [{ results: bySupplier }, { results: receipts }] = await Promise.all([
    env.DB.prepare(
      `SELECT COALESCE(s.name, 'No supplier recorded') AS name, COUNT(*) AS deliveries, round(SUM(r.total), 2) AS value
         FROM receipts r LEFT JOIN suppliers s ON s.id = r.supplier_id
        WHERE r.unit_id = ? AND r.at >= ? AND r.at < ? GROUP BY 1 ORDER BY value DESC`,
    ).bind(user.unitId, r.fromAt, r.toAt).all(),
    env.DB.prepare(
      `SELECT r.at, r.ref, s.name AS supplier, st.name AS store, p.ref AS po_ref, r.invoice_no, r.invoice_date, r.total, r.by_name
         FROM receipts r LEFT JOIN suppliers s ON s.id = r.supplier_id JOIN stores st ON st.id = r.store_id
         LEFT JOIN purchase_orders p ON p.id = r.po_id
        WHERE r.unit_id = ? AND r.at >= ? AND r.at < ? ORDER BY r.at DESC`,
    ).bind(user.unitId, r.fromAt, r.toAt).all(),
  ]);
  return { ...r, bySupplier: bySupplier || [], receipts: receipts || [] };
}

export const REPORTS = { valuation, consumption, ledger, expiry: expiryReport, variance, slow: slowMoving, purchases };

/** Quantities rounded for display, in one place. */
export const qty = q3;
