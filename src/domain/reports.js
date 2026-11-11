/**
 * Reports. Every one returns plain rows the client can show as a table, chart and CSV.
 *
 * None of them ranks people or units (design guide rule 5, "nobody is compared"). Cost per
 * person exists for the person and for those who manage them, in name order, and the monthly
 * summary across units is in unit name order with no names of people at all.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, isoDate, m2, q3 } from '../lib/data.js';
import { may } from './access.js';
import { accountHours } from './custody.js';
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

const USE_KINDS = ['ISSUE', 'TAKE', 'RETURN'];

/**
 * One line of the ledger as this person may see it. No cost without cost.view; and a name beside
 * the value of stock somebody used would be cost per person, so somebody who sees costs but does
 * not manage people (Purchasing, a Viewer) sees that line without the name.
 */
export function hideCostPerPerson(user, m) {
  if (!money(user)) { const { unit_cost, value, ...x } = m; return x; }
  return USE_KINDS.includes(m.kind) && !may(user, 'cost.people') ? { ...m, actor_name: null } : m;
}

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
  const [byItem, byCategory, byArea, byDay, byDepartment] = await Promise.all([
    env.DB.prepare(`SELECT i.code, i.name, i.category, i.uom, round(SUM(-m.qty), 3) AS qty, round(SUM(-m.value), 2) AS value,
                           COUNT(*) AS times ${base} GROUP BY i.id ORDER BY value DESC, qty DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT i.category AS name, round(SUM(-m.value), 2) AS value, round(SUM(-m.qty), 3) AS qty ${base} GROUP BY i.category ORDER BY value DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT COALESCE(a.name, COALESCE(m.reason, 'Not stated')) AS name, round(SUM(-m.value), 2) AS value, COUNT(*) AS times
                      FROM movements m JOIN items i ON i.id = m.item_id LEFT JOIN areas a ON a.id = m.area_id
                     WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at < ? ${storeId ? 'AND m.store_id = ?' : ''}
                     GROUP BY 1 ORDER BY value DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT date(m.at, '+4 hours') AS day, round(SUM(-m.value), 2) AS value, round(SUM(-m.qty), 3) AS qty ${base} GROUP BY day ORDER BY day`).bind(...args).all(),
    // By name: a department is a team, and teams are not ranked either.
    env.DB.prepare(`SELECT COALESCE(d.name, 'No department') AS name, round(SUM(-m.value), 2) AS value, COUNT(*) AS times
                      FROM movements m JOIN items i ON i.id = m.item_id LEFT JOIN departments d ON d.id = m.department_id
                     WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at < ? ${storeId ? 'AND m.store_id = ?' : ''}
                     GROUP BY 1 ORDER BY CASE WHEN d.name IS NULL THEN 1 ELSE 0 END, d.name`).bind(...args).all(),
  ]);
  const strip = (rows) => (money(user) ? rows : rows.map(({ value, ...x }) => x));
  return {
    ...r,
    byItem: strip(byItem.results || []),
    byCategory: strip(byCategory.results || []),
    byArea: strip(byArea.results || []),
    byDay: strip(byDay.results || []),
    byDepartment: strip(byDepartment.results || []),
  };
}

/** Cost per person, for those who manage them. In name order: a record, not a league table. */
export async function costByPerson(env, user, url) {
  const r = range(url);
  const storeId = url.searchParams.get('store') || null;
  const { results } = await env.DB.prepare(
    `SELECT m.person_id, COALESCE(MAX(m.person_name), 'Not recorded') AS name, s.code, COUNT(*) AS times, round(SUM(-m.value), 2) AS value
       FROM movements m LEFT JOIN staff s ON s.id = m.person_id
      WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at < ? ${storeId ? 'AND m.store_id = ?' : ''}
      GROUP BY m.person_id
      ORDER BY CASE WHEN m.person_id IS NULL THEN 1 ELSE 0 END, name`,
  ).bind(user.unitId, r.fromAt, r.toAt, ...(storeId ? [storeId] : [])).all();
  return { ...r, rows: results || [] };
}

/**
 * Services: what was actually used against what the recipes said, for the period. By service,
 * by item within a service, by room; and by person for those who manage people, in name order.
 * Valued at what each item cost when the service was recorded. Without cost.view: quantities only.
 */
export async function servicesReport(env, user, url) {
  const r = range(url);
  const serviceId = url.searchParams.get('service') || null;
  const where = `r.unit_id = ? AND r.at >= ? AND r.at < ? ${serviceId ? 'AND r.service_id = ?' : ''}`;
  const args = [user.unitId, r.fromAt, r.toAt, ...(serviceId ? [serviceId] : [])];
  const sums = `round(SUM(l.std_qty * l.unit_cost), 2) AS std_value, round(SUM(l.qty * l.unit_cost), 2) AS value`;
  const from = `FROM service_record_lines l JOIN service_records r ON r.id = l.record_id`;
  const done = (group) => `(SELECT COALESCE(SUM(x.times), 0) FROM service_records x WHERE ${where.replace(/\br\./g, 'x.')} AND ${group})`;
  const [byService, byItem, byArea, byPerson] = await Promise.all([
    env.DB.prepare(`SELECT r.service_id, MAX(r.service_name) AS name, ${done('x.service_id = r.service_id')} AS times, ${sums} ${from} WHERE ${where} GROUP BY r.service_id ORDER BY name`).bind(...args, ...args).all(),
    env.DB.prepare(
      `SELECT r.service_id, MAX(r.service_name) AS service, i.code, i.name, i.uom, round(SUM(l.std_qty), 3) AS std_qty, round(SUM(l.qty), 3) AS qty, ${sums}
         ${from} JOIN items i ON i.id = l.item_id WHERE ${where} GROUP BY r.service_id, l.item_id ORDER BY service, i.name`,
    ).bind(...args).all(),
    env.DB.prepare(
      `SELECT COALESCE(a.name, 'No room recorded') AS name, ${done('x.area_id IS r.area_id')} AS times, ${sums}
         ${from} LEFT JOIN areas a ON a.id = r.area_id WHERE ${where} GROUP BY r.area_id ORDER BY CASE WHEN a.name IS NULL THEN 1 ELSE 0 END, a.name`,
    ).bind(...args, ...args).all(),
    may(user, 'cost.people') ? env.DB.prepare(
      `SELECT r.person_id, COALESCE(MAX(r.person_name), 'Not recorded') AS name, ${done('x.person_id IS r.person_id')} AS times, ${sums}
         ${from} WHERE ${where} GROUP BY r.person_id ORDER BY CASE WHEN r.person_id IS NULL THEN 1 ELSE 0 END, name`,
    ).bind(...args, ...args).all() : { results: null },
  ]);
  const strip = (rows) => (money(user) ? rows : rows.map(({ value, std_value, ...x }) => x));
  // Margin, for those who see costs, over the services that carry a price: what was charged less
  // what was actually used. A service with no price is counted apart, not as a margin of nothing.
  let margin;
  let unpriced;
  if (money(user)) {
    const { results } = await env.DB.prepare(
      `SELECT r.service_id, MAX(r.service_name) AS name, SUM(r.times) AS times, round(SUM(r.revenue), 2) AS revenue, round(SUM(r.actual_value), 2) AS cost
         FROM service_records r WHERE ${where} AND r.revenue IS NOT NULL GROUP BY r.service_id ORDER BY name`,
    ).bind(...args).all();
    margin = (results || []).map((x) => ({ ...x, margin: m2(x.revenue - x.cost), percent: x.revenue > 0 ? Math.round(((x.revenue - x.cost) / x.revenue) * 1000) / 10 : null }));
    unpriced = (await env.DB.prepare(`SELECT COALESCE(SUM(r.times), 0) AS n FROM service_records r WHERE ${where} AND r.revenue IS NULL`).bind(...args).first())?.n || 0;
  }
  return {
    ...r,
    byService: strip(byService.results || []), byItem: strip(byItem.results || []), byArea: strip(byArea.results || []),
    byPerson: byPerson.results ? byPerson.results : undefined,
    margin, unpriced,
  };
}

/** A person's own use. Costs are theirs to see; item by item it stays quantities, as for all staff. */
export async function myUse(env, user, url) {
  const r = range(url);
  const args = [user.unitId, user.staffId, r.fromAt, r.toAt];
  const base = `FROM movements m JOIN items i ON i.id = m.item_id WHERE m.unit_id = ? AND m.person_id = ? AND m.kind = 'ISSUE' AND m.at >= ? AND m.at < ?`;
  const [{ results: byCategory }, { results: byItem }] = await Promise.all([
    env.DB.prepare(`SELECT i.category AS name, round(SUM(-m.value), 2) AS value ${base} GROUP BY i.category ORDER BY value DESC`).bind(...args).all(),
    env.DB.prepare(`SELECT i.code, i.name, i.uom, round(SUM(-m.qty), 3) AS qty, COUNT(*) AS times ${base} GROUP BY i.id ORDER BY i.name`).bind(...args).all(),
  ]);
  return { ...r, total: m2((byCategory || []).reduce((s, c) => s + c.value, 0)), byCategory: byCategory || [], byItem: byItem || [] };
}

/**
 * The month across units, for directors and group administrators: counts and totals per unit, no
 * names of people. In unit name order, so it is a summary and not a ranking of the businesses.
 * Deliberately not fenced to one unit; the route is what limits who may ask.
 */
export async function groupMonthly(env, monthParam) {
  const month = monthParam || gstDate().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) refuse('BAD_MONTH', 'Choose a month.');
  const [y, mo] = month.split('-').map(Number);
  const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
  const fromAt = new Date(`${month}-01T00:00:00+04:00`).toISOString();
  const toAt = new Date(`${next}-01T00:00:00+04:00`).toISOString();
  const [{ results: units }, { results: moved }, { results: deliveries }, { results: shelves }, { results: held }] = await Promise.all([
    env.DB.prepare(`SELECT id, code, name FROM units WHERE active = 1 ORDER BY name`).all(),
    env.DB.prepare(
      `SELECT unit_id, SUM(kind = 'ISSUE') AS lines, COALESCE(SUM(CASE WHEN kind = 'ISSUE' THEN -value END), 0) AS used,
              COALESCE(SUM(CASE WHEN kind IN ('ADJUST','COUNT') AND value < 0 THEN -value END), 0) AS written_off
         FROM movements WHERE at >= ? AND at < ? GROUP BY unit_id`,
    ).bind(fromAt, toAt).all(),
    env.DB.prepare(`SELECT unit_id, COUNT(*) AS n, COALESCE(SUM(total), 0) AS value FROM receipts WHERE status = 'APPROVED' AND at >= ? AND at < ? GROUP BY unit_id`).bind(fromAt, toAt).all(),
    env.DB.prepare(
      `SELECT s.unit_id, SUM((b.qty + b.in_use + b.in_wash) * i.avg_cost) AS value
         FROM balances b JOIN stores s ON s.id = b.store_id JOIN items i ON i.id = b.item_id GROUP BY s.unit_id`,
    ).all(),
    env.DB.prepare(`SELECT c.unit_id, SUM(c.qty * i.avg_cost) AS value FROM custody c JOIN items i ON i.id = c.item_id WHERE c.qty > 0 GROUP BY c.unit_id`).all(),
  ]);
  const by = (rows) => new Map((rows || []).map((r) => [r.unit_id, r]));
  const m = by(moved); const d = by(deliveries); const s = by(shelves); const h = by(held);
  const rows = [];
  for (const u of units || []) {
    const cutoff = new Date(Date.now() - (await accountHours(env, u.id)) * 36e5).toISOString();
    const out = await env.DB.prepare(`SELECT COUNT(*) AS n FROM custody WHERE unit_id = ? AND qty > 0 AND taken_at < ?`).bind(u.id, cutoff).first();
    rows.push({
      unit: u.name, code: u.code,
      lines: m.get(u.id)?.lines || 0, used: m2(m.get(u.id)?.used || 0),
      deliveries: d.get(u.id)?.n || 0, received: m2(d.get(u.id)?.value || 0),
      writtenOff: m2(m.get(u.id)?.written_off || 0),
      stockValueNow: m2((s.get(u.id)?.value || 0) + (h.get(u.id)?.value || 0)),
      unaccountedNow: out.n,
    });
  }
  const sum = (k) => m2(rows.reduce((t, r) => t + r[k], 0));
  return { month, rows, totals: { lines: sum('lines'), used: sum('used'), deliveries: sum('deliveries'), received: sum('received'), writtenOff: sum('writtenOff'), stockValueNow: sum('stockValueNow'), unaccountedNow: sum('unaccountedNow') } };
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
  return { ...r, rows: rows.map((m) => hideCostPerPerson(user, m)), capped: rows.length === 3000 };
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
        WHERE r.unit_id = ? AND r.status = 'APPROVED' AND r.at >= ? AND r.at < ? GROUP BY 1 ORDER BY value DESC`,
    ).bind(user.unitId, r.fromAt, r.toAt).all(),
    env.DB.prepare(
      `SELECT r.at, r.ref, s.name AS supplier, st.name AS store, p.ref AS po_ref, r.note_no, r.invoice_no, r.invoice_date, r.total, r.by_name, r.decided_by_name AS approved_by
         FROM receipts r LEFT JOIN suppliers s ON s.id = r.supplier_id JOIN stores st ON st.id = r.store_id
         LEFT JOIN purchase_orders p ON p.id = r.po_id
        WHERE r.unit_id = ? AND r.status = 'APPROVED' AND r.at >= ? AND r.at < ? ORDER BY r.at DESC`,
    ).bind(user.unitId, r.fromAt, r.toAt).all(),
  ]);
  return { ...r, bySupplier: bySupplier || [], receipts: receipts || [] };
}

export const REPORTS = { valuation, consumption, people: costByPerson, services: servicesReport, ledger, expiry: expiryReport, variance, slow: slowMoving, purchases };

/** Quantities rounded for display, in one place. */
export const qty = q3;
