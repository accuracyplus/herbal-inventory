/**
 * What is waiting, and for whom: the one set of rules behind Today, the HiFive ID hub's
 * "Waiting for you" and HiFive ID's combined morning email.
 *
 * WHY ONE MODULE. The hub's list used to be its own copy of Today's queries, and had already
 * fallen behind (no orders to receive, nothing held too long, no opened packs). Three lists
 * that disagree are worse than one: a person told by email that something waits, who then
 * finds nothing in the app, stops reading the email.
 *
 * WHY FACTS, THEN A LIST. The morning email asks once for everybody (`pending-all`), so the
 * queries are per UNIT, grouped by who raised each thing, and each person's list is worked out
 * from those facts without touching the database again. A unit costs about a dozen reads
 * whether it has three people or three hundred.
 *
 * Every item carries `days` (negative = that many days late, 0 = today, positive = days to go,
 * null = no day) and `due` for the email; Today reads `n`, `urgent`, `screen` as before.
 */

import { gstDate } from '../lib/data.js';
import { may } from './access.js';
import { SETTINGS } from './settings.js';

const DAY = 864e5;
const dayOf = (iso) => (iso ? gstDate(Date.parse(iso)) : null);
const diff = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Everything a unit's lists are made of. `now` is for tests only. */
export async function unitFacts(env, unitId, now = Date.now()) {
  const today = gstDate(now);
  const all = (sql, ...a) => env.DB.prepare(sql).bind(...a).all().then((r) => r.results || []);
  const one = async (sql, ...a) => (await all(sql, ...a))[0] || {};
  const saved = new Map((await all(`SELECT key, value FROM settings WHERE unit_id = ?`, unitId)).map((r) => [r.key, r.value]));
  const set = (k) => saved.get(k) ?? SETTINGS[k]?.default ?? null;
  const hours = Number(set('custody.account_hours')) || 24;
  const cutoff = new Date(now - hours * 36e5).toISOString();
  const weekAgo = new Date(now - 7 * DAY).toISOString();
  const lots = set('lots.opened') === 'on';
  const dueDays = Number(set('lots.due_days')) || 0;

  const [requests, toIssue, orders, toReceive, deliveries, sentBack, inbox, corrections, counted, counting, held, packs] = await Promise.all([
    all(`SELECT requested_by AS by, COUNT(*) AS n, SUM(urgency = 'URGENT') AS urgent, MIN(requested_at) AS oldest
           FROM requests WHERE unit_id = ? AND status = 'PENDING' GROUP BY requested_by`, unitId),
    one(`SELECT COUNT(*) AS n, SUM(urgency = 'URGENT') AS urgent, MIN(COALESCE(decided_at, requested_at)) AS oldest
           FROM requests WHERE unit_id = ? AND status IN ('APPROVED','PARTLY_ISSUED')`, unitId),
    all(`SELECT created_by AS by, COUNT(*) AS n, MIN(COALESCE(submitted_at, created_at)) AS oldest
           FROM purchase_orders WHERE unit_id = ? AND status = 'SUBMITTED' GROUP BY created_by`, unitId),
    one(`SELECT COUNT(*) AS n, SUM(expected_date IS NOT NULL AND expected_date < ?) AS late,
                MIN(CASE WHEN expected_date < ? THEN expected_date END) AS first_late,
                MIN(CASE WHEN expected_date >= ? THEN expected_date END) AS next_due
           FROM purchase_orders WHERE unit_id = ? AND status IN ('APPROVED','PARTLY_RECEIVED')`, today, today, today, unitId),
    all(`SELECT by_id AS by, COUNT(*) AS n, MIN(at) AS oldest FROM receipts WHERE unit_id = ? AND status = 'PENDING' GROUP BY by_id`, unitId),
    all(`SELECT by_id AS by, COUNT(*) AS n FROM receipts WHERE unit_id = ? AND status = 'REJECTED' AND decided_at > ? GROUP BY by_id`, unitId, weekAgo),
    one(`SELECT COUNT(*) AS n FROM service_inbox WHERE unit_id = ? AND status = 'FAILED'`, unitId),
    all(`SELECT requested_by AS by, COUNT(*) AS n, MIN(requested_at) AS oldest
           FROM adjustments WHERE unit_id = ? AND status = 'PENDING' GROUP BY requested_by`, unitId),
    all(`SELECT submitted_by AS by, COUNT(*) AS n, MIN(submitted_at) AS oldest
           FROM counts WHERE unit_id = ? AND status = 'SUBMITTED' GROUP BY submitted_by`, unitId),
    one(`SELECT COUNT(*) AS n, MIN(started_at) AS oldest FROM counts WHERE unit_id = ? AND status = 'OPEN'`, unitId),
    all(`SELECT person_id AS by, COUNT(*) AS n, MIN(taken_at) AS oldest
           FROM custody WHERE unit_id = ? AND qty > 0 AND taken_at < ? GROUP BY person_id`, unitId, cutoff),
    lots
      ? one(`SELECT SUM(use_by < ?) AS past, SUM(use_by >= ? AND use_by <= ?) AS due, MIN(CASE WHEN use_by >= ? THEN use_by END) AS next
               FROM lot_openings WHERE unit_id = ? AND status = 'OPEN' AND use_by IS NOT NULL`,
        today, today, gstDate(Date.parse(`${today}T00:00:00Z`) - 4 * 36e5 + dueDays * DAY), today, unitId)
      : null,
  ]);
  return { unitId, today, hours, dueDays, requests, toIssue, orders, toReceive, deliveries, sentBack, inbox, corrections, counted, counting, held, packs };
}

/** Rows grouped by who raised them, without the person's own. */
function others(rows, me) {
  const mine = rows.filter((r) => r.by !== me);
  return {
    n: mine.reduce((s, r) => s + (r.n || 0), 0),
    urgent: mine.reduce((s, r) => s + (r.urgent || 0), 0),
    oldest: mine.map((r) => r.oldest).filter(Boolean).sort()[0] || null,
    people: mine.length,
  };
}

/** Waiting since that moment: due the day it arrived, a day late for each day after. */
const since = (today, iso) => (iso ? -Math.max(0, diff(dayOf(iso), today)) : 0);

/**
 * One person's list in one unit, from the unit's facts. `user` is { staffId, roles }.
 * The order is Today's order; the hub and the email sort by `days` themselves.
 */
export function waitingList(f, user) {
  const out = [];
  const t = f.today;
  const add = (item) => out.push({ urgent: 0, ...item });

  if (may(user, 'request.decide')) {
    const r = others(f.requests, user.staffId);
    if (r.n) add({ key: 'requests-approve', screen: 'requests', filter: 'PENDING', n: r.n, urgent: r.urgent, days: since(t, r.oldest), action: 'Approve', text: `${plural(r.n, 'request')} to approve` });
  }
  if (may(user, 'request.fulfil') && f.toIssue.n) {
    add({ key: 'requests-issue', screen: 'requests', filter: 'APPROVED', n: f.toIssue.n, urgent: f.toIssue.urgent || 0, days: since(t, f.toIssue.oldest), action: 'Give out', text: `${plural(f.toIssue.n, 'approved request')} to give out` });
  }
  if (may(user, 'po.decide')) {
    const r = others(f.orders, user.staffId);
    if (r.n) add({ key: 'po-approve', screen: 'purchasing', filter: 'SUBMITTED', n: r.n, days: since(t, r.oldest), action: 'Approve', text: `${plural(r.n, 'purchase order')} to approve` });
  }
  if (may(user, 'receive') && f.toReceive.n) {
    const { n, late, first_late: firstLate, next_due: nextDue } = f.toReceive;
    // Late: as late as the first late order. Otherwise when the next is due; no date, no day.
    const days = late ? diff(t, firstLate) : nextDue ? diff(t, nextDue) : null;
    add({ key: 'po-receive', screen: 'purchasing', filter: 'APPROVED', n, urgent: late || 0, days, action: 'Receive', text: `${plural(n, 'order')} expected${late ? `, ${late} late` : ''}` });
  }
  if (may(user, 'receipt.decide')) {
    const r = others(f.deliveries, user.staffId);
    if (r.n) add({ key: 'receipts-approve', screen: 'purchasing', to: 'purchasing?tab=deliveries&status=PENDING', n: r.n, days: since(t, r.oldest), action: 'Approve', text: `${plural(r.n, 'delivery', 'deliveries')} to approve` });
  }
  if (may(user, 'receive')) {
    const n = f.sentBack.find((r) => r.by === user.staffId)?.n || 0;
    if (n) add({ key: 'receipts-back', screen: 'purchasing', to: 'purchasing?tab=deliveries&status=REJECTED', n, urgent: n, days: 0, action: 'Open', text: `${plural(n, 'delivery', 'deliveries')} you recorded ${n > 1 ? 'were' : 'was'} sent back` });
  }
  if (may(user, 'services.edit') && f.inbox.n) {
    const n = f.inbox.n;
    add({ key: 'link-inbox', screen: 'services', to: 'services?tab=link', n, urgent: n, days: 0, action: 'Fix', text: `${plural(n, 'service')} from bookings or billing could not be recorded` });
  }
  if (may(user, 'adjust.decide')) {
    const r = others(f.corrections, user.staffId);
    if (r.n) add({ key: 'adj-approve', screen: 'corrections', filter: 'PENDING', n: r.n, days: since(t, r.oldest), action: 'Approve', text: `${plural(r.n, 'correction')} to approve` });
  }
  if (may(user, 'count.decide')) {
    const r = others(f.counted, user.staffId);
    if (r.n) add({ key: 'count-approve', screen: 'counts', n: r.n, days: since(t, r.oldest), action: 'Review', text: `${plural(r.n, 'stock count')} to review` });
  }
  if (may(user, 'count.run') && f.counting.n) {
    // In progress is not late: it is named, with no day, so the email leaves it out.
    add({ key: 'count-open', screen: 'counts', n: f.counting.n, days: null, quiet: true, action: 'Carry on', text: `${plural(f.counting.n, 'stock count')} in progress` });
  }

  // Held too long: late from the moment the unit's window ran out.
  const lateFrom = (iso) => new Date(Date.parse(iso) + f.hours * 36e5).toISOString();
  const mine = f.held.find((r) => r.by === user.staffId);
  if (mine?.n) add({ key: 'custody-mine', screen: 'with-me', n: mine.n, due: 'overdue', days: since(t, lateFrom(mine.oldest)), action: 'Account for it', text: `${plural(mine.n, 'item')} with you to account for` });
  if (may(user, 'custody.team')) {
    const r = others(f.held, user.staffId);
    if (r.n) add({ key: 'custody-team', screen: 'with-me', filter: 'TEAM', n: r.n, due: 'overdue', days: since(t, lateFrom(r.oldest)), action: 'See who', text: `${plural(r.n, 'item')} unaccounted for, with ${r.people} ${r.people > 1 ? 'people' : 'person'}` });
  }

  if (f.packs && may(user, 'stock.use')) {
    const past = f.packs.past || 0;
    const due = f.packs.due || 0;
    if (past || due) {
      const words = [past && `${past} past ${past === 1 ? 'its' : 'their'} in-use date`, due && `${due} due within ${plural(f.dueDays, 'day')}`].filter(Boolean).join(', ');
      add({ key: 'packs-due', screen: 'in-use', n: past + due, urgent: past, due: past ? 'overdue' : null, days: past ? null : diff(t, f.packs.next), action: 'Check the packs', text: `Opened packs: ${words}` });
    }
  }
  return out;
}

/** The page an item opens, in the unit it belongs to (the app switches to it on arrival). */
export const hrefOf = (w, unitId) => {
  const to = w.to || `${w.screen}${w.filter ? `?status=${w.filter}` : ''}`;
  return `/#/${to}${to.includes('?') ? '&' : '?'}unit=${encodeURIComponent(unitId)}`;
};

/**
 * An item as HiFive ID takes it (pending.ts PendingItem, digest.ts DigestItem). The unit goes
 * in `detail`, and in the text only for somebody with seats in more than one unit, where the
 * hub's one line has to say which.
 */
export function forHfid(w, unit, manyUnits) {
  return {
    kind: `inventory_${w.key.replace(/-/g, '_')}`,
    text: manyUnits ? `${w.text} at ${unit.name}` : w.text,
    detail: unit.name,
    days: w.days ?? null,
    ...(w.due ? { due: w.due } : {}),
    href: hrefOf(w, unit.id),
    action: w.action,
  };
}
