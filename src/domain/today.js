/**
 * Today: what needs this person, then what needs the unit.
 *
 * Design guide rule 1, "me first": the waiting-for-you list is built from the person's own
 * abilities, so a therapist sees their own requests and a manager sees approvals. Rule 3: a
 * section with nothing in it is left out, never shown as an empty box.
 */

import { gstDate, q3 } from '../lib/data.js';
import { may } from './access.js';
import { stockList } from './catalog.js';
import { custodyWaiting } from './custody.js';
import { reviewCount } from './people.js';
import { setting } from './settings.js';

export async function today(env, user, { bearer } = {}) {
  const u = user.unitId;
  const waiting = [];
  const one = (sql, ...args) => env.DB.prepare(sql).bind(...args).first();

  if (may(user, 'request.decide')) {
    const r = await one(`SELECT COUNT(*) AS n, SUM(urgency = 'URGENT') AS urgent FROM requests WHERE unit_id = ? AND status = 'PENDING' AND requested_by <> ?`, u, user.staffId);
    if (r.n) waiting.push({ key: 'requests-approve', screen: 'requests', filter: 'PENDING', n: r.n, urgent: r.urgent || 0, text: `${r.n} request${r.n > 1 ? 's' : ''} to approve` });
  }
  if (may(user, 'request.fulfil')) {
    const r = await one(`SELECT COUNT(*) AS n, SUM(urgency = 'URGENT') AS urgent FROM requests WHERE unit_id = ? AND status IN ('APPROVED','PARTLY_ISSUED')`, u);
    if (r.n) waiting.push({ key: 'requests-issue', screen: 'requests', filter: 'APPROVED', n: r.n, urgent: r.urgent || 0, text: `${r.n} approved request${r.n > 1 ? 's' : ''} to give out` });
  }
  if (may(user, 'po.decide')) {
    const r = await one(`SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS v FROM purchase_orders WHERE unit_id = ? AND status = 'SUBMITTED' AND created_by <> ?`, u, user.staffId);
    if (r.n) waiting.push({ key: 'po-approve', screen: 'purchasing', filter: 'SUBMITTED', n: r.n, text: `${r.n} purchase order${r.n > 1 ? 's' : ''} to approve` });
  }
  if (may(user, 'receive')) {
    const r = await one(`SELECT COUNT(*) AS n, SUM(expected_date IS NOT NULL AND expected_date < ?) AS late FROM purchase_orders WHERE unit_id = ? AND status IN ('APPROVED','PARTLY_RECEIVED')`, gstDate(), u);
    if (r.n) waiting.push({ key: 'po-receive', screen: 'purchasing', filter: 'APPROVED', n: r.n, urgent: r.late || 0, text: `${r.n} order${r.n > 1 ? 's' : ''} expected${r.late ? `, ${r.late} late` : ''}` });
  }
  if (may(user, 'receipt.decide')) {
    const r = await one(`SELECT COUNT(*) AS n FROM receipts WHERE unit_id = ? AND status = 'PENDING' AND by_id <> ?`, u, user.staffId);
    if (r.n) waiting.push({ key: 'receipts-approve', screen: 'purchasing', to: 'purchasing?tab=deliveries&status=PENDING', n: r.n, text: `${r.n} deliver${r.n > 1 ? 'ies' : 'y'} to approve` });
  }
  if (may(user, 'receive')) {
    const r = await one(`SELECT COUNT(*) AS n FROM receipts WHERE unit_id = ? AND status = 'REJECTED' AND by_id = ? AND decided_at > datetime('now', '-7 days')`, u, user.staffId);
    if (r.n) waiting.push({ key: 'receipts-back', screen: 'purchasing', to: 'purchasing?tab=deliveries&status=REJECTED', n: r.n, urgent: r.n, text: `${r.n} deliver${r.n > 1 ? 'ies' : 'y'} you recorded ${r.n > 1 ? 'were' : 'was'} sent back` });
  }
  if (may(user, 'adjust.decide')) {
    const r = await one(`SELECT COUNT(*) AS n FROM adjustments WHERE unit_id = ? AND status = 'PENDING' AND requested_by <> ?`, u, user.staffId);
    if (r.n) waiting.push({ key: 'adj-approve', screen: 'corrections', filter: 'PENDING', n: r.n, text: `${r.n} correction${r.n > 1 ? 's' : ''} to approve` });
  }
  if (may(user, 'count.decide')) {
    const r = await one(`SELECT COUNT(*) AS n FROM counts WHERE unit_id = ? AND status = 'SUBMITTED' AND submitted_by <> ?`, u, user.staffId);
    if (r.n) waiting.push({ key: 'count-approve', screen: 'counts', n: r.n, text: `${r.n} stock count${r.n > 1 ? 's' : ''} to review` });
  }
  if (may(user, 'count.run')) {
    const r = await one(`SELECT COUNT(*) AS n FROM counts WHERE unit_id = ? AND status = 'OPEN'`, u);
    if (r.n) waiting.push({ key: 'count-open', screen: 'counts', n: r.n, text: `${r.n} stock count${r.n > 1 ? 's' : ''} in progress` });
  }

  waiting.push(...await custodyWaiting(env, user));
  if (may(user, 'admin')) {
    const n = await reviewCount(env, user, bearer);
    if (n) waiting.push({ key: 'people-review', screen: 'admin', to: 'admin?tab=people', n, text: `${n} change${n > 1 ? 's' : ''} from HiFive ID to review: joiners, leavers, names` });
  }

  // The person's own requests: what has happened to them this week.
  const { results: mine } = await env.DB.prepare(
    `SELECT id, ref, status, decided_by_name, decision_note, requested_at,
            (SELECT group_concat(i.name, ', ') FROM request_lines rl JOIN items i ON i.id = rl.item_id WHERE rl.request_id = r.id) AS summary
       FROM requests r WHERE unit_id = ? AND requested_by = ? AND requested_at > datetime('now', '-7 days')
      ORDER BY requested_at DESC LIMIT 6`,
  ).bind(u, user.staffId).all();

  // The shelf.
  const { items, stores } = await stockList(env, user);
  const short = [];
  for (const it of items) {
    for (const s of it.stores) {
      if (!s.held || s.status === 'OK') continue;
      short.push({
        itemId: it.id, name: it.name, code: it.code, uom: it.uom, storeId: s.storeId,
        storeName: stores.find((x) => x.id === s.storeId)?.name, qty: s.qty, status: s.status, level: s.level,
      });
    }
  }
  const order = { OUT: 0, CRITICAL: 1, LOW: 2 };
  short.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));

  const warnDays = Number(await setting(env, u, 'expiry.warn_days')) || 60;
  const { results: expiring } = await env.DB.prepare(
    `SELECT bt.id, bt.item_id, i.name, i.uom, bt.batch_no, bt.expiry, bt.qty, s.name AS store_name
       FROM batches bt JOIN items i ON i.id = bt.item_id JOIN stores s ON s.id = bt.store_id
      WHERE s.unit_id = ? AND bt.qty > 0 AND bt.expiry <> '' AND bt.expiry <= ?
      ORDER BY bt.expiry LIMIT 40`,
  ).bind(u, gstDate(Date.now() + warnDays * 864e5)).all();
  const todayStr = gstDate();

  const washDays = Number(await setting(env, u, 'linen.wash_alert_days')) || 3;
  const { results: laundry } = await env.DB.prepare(
    `SELECT b.item_id, i.name, b.in_wash, s.name AS store_name,
            (SELECT MAX(at) FROM movements m WHERE m.item_id = b.item_id AND m.store_id = b.store_id
                AND m.kind = 'LINEN' AND m.from_state = 'in_wash') AS last_back,
            (SELECT MIN(at) FROM movements m WHERE m.item_id = b.item_id AND m.store_id = b.store_id
                AND m.kind = 'LINEN' AND m.to_state = 'in_wash') AS first_sent
       FROM balances b JOIN items i ON i.id = b.item_id JOIN stores s ON s.id = b.store_id
      WHERE s.unit_id = ? AND b.in_wash > 0`,
  ).bind(u).all();
  const cutoff = new Date(Date.now() - washDays * 864e5).toISOString();
  const laundryLate = (laundry || []).filter((l) => (l.last_back || l.first_sent || '') < cutoff)
    .map((l) => ({ itemId: l.item_id, name: l.name, inWash: l.in_wash, storeName: l.store_name, since: l.last_back || l.first_sent }));

  // The day so far, and the month, for people who see costs.
  const showCost = may(user, 'cost.view');
  const dayStart = new Date(`${todayStr}T00:00:00+04:00`).toISOString();
  const day = await one(
    `SELECT SUM(kind = 'ISSUE') AS issues, SUM(kind = 'RECEIPT') AS receipts, SUM(kind = 'TRANSFER_OUT') AS transfers,
            COALESCE(SUM(CASE WHEN kind = 'ISSUE' THEN -value END), 0) AS used_value
       FROM movements WHERE unit_id = ? AND at >= ?`, u, dayStart);
  const month = showCost ? await one(
    `SELECT COALESCE(SUM(CASE WHEN kind = 'ISSUE' THEN -value END), 0) AS used,
            COALESCE(SUM(CASE WHEN kind = 'RECEIPT' THEN value END), 0) AS received,
            COALESCE(SUM(CASE WHEN kind IN ('ADJUST','COUNT') AND value < 0 THEN -value END), 0) AS written_off
       FROM movements WHERE unit_id = ? AND at >= ?`, u, new Date(`${todayStr.slice(0, 8)}01T00:00:00+04:00`).toISOString()) : null;
  const valueRow = showCost ? items.reduce((s, it) => s + (it.value || 0), 0) : null;

  return {
    waiting,
    mine: mine || [],
    short: short.slice(0, 60),
    shortCounts: {
      out: short.filter((s) => s.status === 'OUT').length,
      critical: short.filter((s) => s.status === 'CRITICAL').length,
      low: short.filter((s) => s.status === 'LOW').length,
    },
    expiring: (expiring || []).map((e) => ({ ...e, expired: e.expiry < todayStr })),
    warnDays,
    laundryLate,
    washDays,
    day: { issues: day?.issues || 0, receipts: day?.receipts || 0, transfers: day?.transfers || 0, usedValue: showCost ? q3(day?.used_value || 0) : undefined },
    month: month ? { used: Math.round(month.used), received: Math.round(month.received), writtenOff: Math.round(month.written_off) } : null,
    stockValue: valueRow === null ? null : Math.round(valueRow),
    itemCount: items.length,
  };
}
