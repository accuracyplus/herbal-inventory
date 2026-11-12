/**
 * ABC cycle counts (feature 14, `abc.on`).
 *
 * Items are graded by what the unit used of them over the last 90 days, by value: the few that
 * make up the first 80% of the value used are A, the next 15% B, the rest C (and anything not
 * used at all is C). How often each is used breaks a tie. A items are counted most often
 * (`abc.a_days`), B less (`abc.b_days`), C least (`abc.c_days`).
 *
 * An item is due in a store when it has never been counted there, or its last approved count
 * there is that many days old. "Count these" starts an ordinary count of just those items, so
 * the count, its approval and its differences work exactly as any other count.
 */

import { gstDate } from '../lib/data.js';
import { requireFeature, setting } from './settings.js';

const DAY = 864e5;

/** A, B or C for each item. Pure. rows: [{ itemId, value, uses }]. */
export function abcClasses(rows) {
  const used = rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value || b.uses - a.uses);
  const total = used.reduce((s, r) => s + r.value, 0);
  const out = new Map(rows.map((r) => [r.itemId, 'C']));
  let before = 0;
  for (const r of used) {
    // Graded by where the item starts: the one that crosses 80% is still an A.
    const share = before / total;
    out.set(r.itemId, share < 0.8 ? 'A' : share < 0.95 ? 'B' : 'C');
    before += r.value;
  }
  return out;
}

async function intervals(env, unitId) {
  return {
    A: Number(await setting(env, unitId, 'abc.a_days')) || 30,
    B: Number(await setting(env, unitId, 'abc.b_days')) || 90,
    C: Number(await setting(env, unitId, 'abc.c_days')) || 180,
  };
}

/** Each item's grade in the unit, from the last 90 days of use. */
export async function gradeItems(env, unitId, now = Date.now()) {
  const since = new Date(now - 90 * DAY).toISOString();
  const [{ results: items }, { results: use }] = await Promise.all([
    env.DB.prepare(`SELECT id FROM items WHERE unit_id = ? AND active = 1 AND is_linen = 0`).bind(unitId).all(),
    env.DB.prepare(
      `SELECT item_id, SUM(-value) AS value, COUNT(*) AS uses FROM movements
        WHERE unit_id = ? AND kind = 'ISSUE' AND at >= ? GROUP BY item_id`,
    ).bind(unitId, since).all(),
  ]);
  const byItem = new Map((use || []).map((u) => [u.item_id, u]));
  const rows = (items || []).map((i) => ({ itemId: i.id, value: byItem.get(i.id)?.value || 0, uses: byItem.get(i.id)?.uses || 0 }));
  return { grades: abcClasses(rows), use: new Map(rows.map((r) => [r.itemId, r])) };
}

/** What is due for a cycle count in each store (or one), and when it was last counted. */
export async function cycleDue(env, unitId, { storeId = null, now = Date.now() } = {}) {
  const today = gstDate(now);
  const days = await intervals(env, unitId);
  const { grades, use } = await gradeItems(env, unitId, now);
  const [{ results: held }, { results: counted }] = await Promise.all([
    env.DB.prepare(
      `SELECT DISTINCT x.store_id, x.item_id, i.name, i.code, i.uom, i.category, s.name AS store_name
         FROM (SELECT store_id, item_id FROM balances WHERE qty > 0 OR on_hold > 0 UNION SELECT store_id, item_id FROM item_levels) x
         JOIN items i ON i.id = x.item_id JOIN stores s ON s.id = x.store_id
        WHERE s.unit_id = ? AND s.active = 1 AND i.active = 1 AND i.is_linen = 0 ${storeId ? 'AND s.id = ?' : ''}`,
    ).bind(unitId, ...(storeId ? [storeId] : [])).all(),
    env.DB.prepare(
      `SELECT c.store_id, cl.item_id, MAX(c.decided_at) AS last
         FROM count_lines cl JOIN counts c ON c.id = cl.count_id
        WHERE c.unit_id = ? AND c.status = 'APPROVED' AND cl.counted IS NOT NULL GROUP BY c.store_id, cl.item_id`,
    ).bind(unitId).all(),
  ]);
  const last = new Map((counted || []).map((c) => [`${c.store_id}|${c.item_id}`, c.last]));
  const rows = (held || []).map((h) => {
    const grade = grades.get(h.item_id) || 'C';
    const lastAt = last.get(`${h.store_id}|${h.item_id}`) || null;
    const lastDay = lastAt ? gstDate(Date.parse(lastAt)) : null;
    const dueOn = lastDay ? new Date(Date.parse(`${lastDay}T00:00:00Z`) + days[grade] * DAY).toISOString().slice(0, 10) : today;
    return {
      storeId: h.store_id, storeName: h.store_name, itemId: h.item_id, name: h.name, code: h.code, uom: h.uom, category: h.category,
      grade, value90: Math.round((use.get(h.item_id)?.value || 0) * 100) / 100, lastCounted: lastDay, dueOn, due: dueOn <= today,
      lateDays: dueOn < today ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dueOn}T00:00:00Z`)) / DAY) : 0,
    };
  });
  const order = { A: 0, B: 1, C: 2 };
  rows.sort((a, b) => Number(b.due) - Number(a.due) || order[a.grade] - order[b.grade] || b.lateDays - a.lateDays || a.name.localeCompare(b.name));
  return { days, rows };
}

/** For the Counts screen: the schedule for one store, and how many items are in each grade. */
export async function cycleSchedule(env, user, storeId) {
  await requireFeature(env, user.unitId, 'abc.on');
  const { days, rows } = await cycleDue(env, user.unitId, { storeId });
  const grades = { A: 0, B: 0, C: 0 };
  for (const r of rows) grades[r.grade] += 1;
  return { days, grades, rows, due: rows.filter((r) => r.due).length };
}
