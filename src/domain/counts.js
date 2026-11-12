/**
 * Stock counts (stock takes).
 *
 *   OPEN ──submit──▶ SUBMITTED ──approve──▶ APPROVED (variances posted)
 *     └──cancel──▶ CANCELLED   └──reopen──▶ OPEN
 *
 * The system quantity is snapshotted when the count starts. On approval each line posts
 * `counted − snapshot` to the CURRENT balance: if two bottles were used while the shelf was
 * being counted, they were used after the count and must not be taken twice.
 *
 * Blind by default: the people counting do not see what the system expects, because a counter
 * who can see "12" finds 12.
 */

import { refuse } from '../lib/errors.js';
import { nextRef, nonNegative, nowIso, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { may, requireOtherApprover, storeFor } from './access.js';
import { grossOf, requireLimit } from './limits.js';
import { balanceOf, buildPosting, commit, loadItems } from './stock.js';

export async function startCount(env, user, body) {
  const store = await storeFor(env, user, body.storeId);
  const open = await env.DB.prepare(
    `SELECT ref FROM counts WHERE store_id = ? AND status IN ('OPEN','SUBMITTED') LIMIT 1`,
  ).bind(store.id).first();
  if (open) refuse('COUNT_OPEN', `${open.ref} is still open for ${store.name}. Finish or cancel it first.`, 409);

  const category = text(body.category, 80);
  // A cycle count (feature 14): just the items named, which the ABC schedule says are due.
  const only = Array.isArray(body.itemIds) && body.itemIds.length ? [...new Set(body.itemIds.map(String))].slice(0, 500) : null;
  const { results } = await env.DB.prepare(
    `SELECT i.id, COALESCE(b.qty, 0) AS qty
       FROM items i
       LEFT JOIN balances b ON b.item_id = i.id AND b.store_id = ?
       LEFT JOIN item_levels lv ON lv.item_id = i.id AND lv.store_id = ?
      WHERE i.unit_id = ? AND i.active = 1 AND (b.item_id IS NOT NULL OR lv.item_id IS NOT NULL)
        ${category ? 'AND i.category = ?' : ''}
        ${only ? `AND i.id IN (${only.map(() => '?').join(',')})` : ''}
      ORDER BY i.category, i.name`,
  ).bind(store.id, store.id, user.unitId, ...(category ? [category] : []), ...(only || [])).all();
  if (!results?.length) refuse('NOTHING_TO_COUNT', `${store.name} holds nothing${category ? ` in ${category}` : ''}${only ? ' of those items' : ''} to count.`);

  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'CNT');
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO counts (id, unit_id, ref, store_id, category, blind, status, note, started_by, started_by_name, started_at)
       VALUES (?,?,?,?,?,?,'OPEN',?,?,?,?)`,
    ).bind(id, user.unitId, ref, store.id, category, body.blind === false ? 0 : 1, text(body.note, 300),
           user.staffId, user.fullName, nowIso()),
    ...results.map((r) => env.DB.prepare(
      `INSERT INTO count_lines (id, count_id, item_id, expected) VALUES (?,?,?,?)`,
    ).bind(uuid(), id, r.id, r.qty)),
    auditStmt(env, user, 'COUNT_START', ref, `${store.name}${category ? `, ${category}` : ''}: ${results.length} item(s)`),
  ]);
  return { ok: true, id, ref, lines: results.length };
}

async function load(env, user, id) {
  const c = await env.DB.prepare(`SELECT * FROM counts WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!c) refuse('NOT_FOUND', 'That count does not exist in this unit.', 404);
  return c;
}

export async function getCount(env, user, id) {
  const c = await load(env, user, id);
  const { results } = await env.DB.prepare(
    `SELECT cl.*, i.code, i.name, i.uom, i.category, i.avg_cost, i.barcode, COALESCE(b.qty, 0) AS current_qty, loc.location
       FROM count_lines cl JOIN items i ON i.id = cl.item_id
       LEFT JOIN balances b ON b.item_id = cl.item_id AND b.store_id = ?1
       LEFT JOIN item_locations loc ON loc.item_id = cl.item_id AND loc.store_id = ?1
      WHERE cl.count_id = ?2
      ORDER BY CASE WHEN loc.location IS NULL THEN 1 ELSE 0 END, loc.location, i.category, i.name`,
  ).bind(c.store_id, c.id).all();
  // While the count is open and blind, the expected figure is withheld from everyone who
  // only counts. Whoever approves sees it — they have to.
  const hide = c.status === 'OPEN' && c.blind && !may(user, 'count.decide');
  const store = await env.DB.prepare(`SELECT name FROM stores WHERE id = ?`).bind(c.store_id).first();
  const lines = (results || []).map((l) => {
    const variance = l.counted === null ? null : q3(l.counted - l.expected);
    return hide
      ? { ...l, expected: null, current_qty: null, variance: null, value: null }
      : { ...l, variance, value: variance === null ? null : Math.round(variance * (l.avg_cost || 0) * 100) / 100 };
  });
  return { ...c, store_name: store?.name, hidden: hide, lines };
}

export async function saveCountLines(env, user, id, body) {
  const c = await load(env, user, id);
  if (c.status !== 'OPEN') refuse('NOT_OPEN', `${c.ref} is no longer open for counting.`, 409);
  if (!Array.isArray(body.lines) || !body.lines.length) refuse('NO_LINES', 'Nothing to save.');
  const stmts = [];
  const now = nowIso();
  const add = [];
  for (const l of body.lines) {
    const counted = l.counted === '' || l.counted === null || l.counted === undefined ? null : nonNegative(l.counted);
    if (l.counted !== '' && l.counted !== null && l.counted !== undefined && counted === null) {
      refuse('BAD_QTY', 'A count cannot be negative.');
    }
    const exists = await env.DB.prepare(`SELECT id FROM count_lines WHERE count_id = ? AND item_id = ?`).bind(c.id, l.itemId).first();
    if (!exists) add.push(l.itemId);
    stmts.push(exists
      ? env.DB.prepare(`UPDATE count_lines SET counted = ?, counted_by = ?, counted_at = ?, note = ? WHERE id = ?`)
        .bind(counted, user.fullName, counted === null ? null : now, text(l.note, 200), exists.id)
      : null);
  }
  // An item found on the shelf that was not on the sheet: added with today's system quantity.
  if (add.length) {
    const items = await loadItems(env, user.unitId, add);
    for (const itemId of add) {
      const l = body.lines.find((x) => x.itemId === itemId);
      const bal = await balanceOf(env, c.store_id, itemId);
      const counted = nonNegative(l.counted);
      stmts.push(env.DB.prepare(
        `INSERT INTO count_lines (id, count_id, item_id, expected, counted, counted_by, counted_at, note) VALUES (?,?,?,?,?,?,?,?)`,
      ).bind(uuid(), c.id, itemId, bal.qty, counted, user.fullName, counted === null ? null : now,
             text(l.note, 200) || `Added during the count: ${items.get(itemId).name}`));
    }
  }
  await commit(env, stmts.filter(Boolean));
  return { ok: true };
}

export async function countAction(env, user, id, action, body = {}) {
  const c = await load(env, user, id);
  const now = nowIso();
  const note = text(body.note, 500);

  if (action === 'submit') {
    if (c.status !== 'OPEN') refuse('NOT_OPEN', `${c.ref} is not open.`, 409);
    const done = await env.DB.prepare(`SELECT COUNT(*) AS n FROM count_lines WHERE count_id = ? AND counted IS NOT NULL`).bind(c.id).first();
    if (!done?.n) refuse('NOTHING_COUNTED', 'Nothing has been counted yet.');
    await commit(env, [
      env.DB.prepare(`UPDATE counts SET status = 'SUBMITTED', submitted_by = ?, submitted_by_name = ?, submitted_at = ? WHERE id = ? AND status = 'OPEN'`)
        .bind(user.staffId, user.fullName, now, c.id),
      auditStmt(env, user, 'COUNT_SUBMIT', c.ref, `${done.n} line(s) counted`),
    ]);
    return { ok: true, status: 'SUBMITTED' };
  }
  if (action === 'reopen') {
    if (c.status !== 'SUBMITTED') refuse('BAD_STATE', 'Only a submitted count can be sent back.', 409);
    await commit(env, [
      env.DB.prepare(`UPDATE counts SET status = 'OPEN', decision_note = ? WHERE id = ? AND status = 'SUBMITTED'`).bind(note, c.id),
      auditStmt(env, user, 'COUNT_REOPEN', c.ref, note),
    ]);
    return { ok: true, status: 'OPEN' };
  }
  if (action === 'cancel') {
    if (!['OPEN', 'SUBMITTED'].includes(c.status)) refuse('BAD_STATE', `${c.ref} is already ${c.status.toLowerCase()}.`, 409);
    await commit(env, [
      env.DB.prepare(`UPDATE counts SET status = 'CANCELLED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ?`)
        .bind(user.staffId, user.fullName, now, note, c.id),
      auditStmt(env, user, 'COUNT_CANCEL', c.ref, note),
    ]);
    return { ok: true, status: 'CANCELLED' };
  }
  if (action !== 'approve') refuse('BAD_ACTION', 'Unknown action.');
  if (c.status !== 'SUBMITTED') refuse('BAD_STATE', `${c.ref} has not been submitted.`, 409);
  await requireOtherApprover(env, user, c.submitted_by, 'count');

  const { results } = await env.DB.prepare(
    `SELECT * FROM count_lines WHERE count_id = ? AND counted IS NOT NULL AND counted <> expected`,
  ).bind(c.id).all();
  const store = await env.DB.prepare(`SELECT id, unit_id, code, name, kind, active FROM stores WHERE id = ?`).bind(c.store_id).first();
  const items = await loadItems(env, user.unitId, (results || []).map((l) => l.item_id));
  const lines = [];
  const clamped = [];
  for (const l of results || []) {
    let qty = q3(l.counted - l.expected);
    if (qty < 0) {
      // Never take more than is there now; whatever was used since the count already went.
      const bal = await balanceOf(env, store.id, l.item_id);
      if (bal.qty < -qty) { clamped.push(items.get(l.item_id).name); qty = -bal.qty; }
    }
    if (qty !== 0) lines.push({ item: items.get(l.item_id), store, qty, reason: 'COUNT', note: l.note });
  }
  const posting = lines.length
    ? await buildPosting(env, {
      kind: 'COUNT', unitId: user.unitId, actor: actorOf(user), doc: { type: 'COUNT', id: c.id, ref: c.ref }, preferExpired: true,
    }, lines)
    : { statements: [], value: 0, moved: [] };
  await requireLimit(env, user, 'count', grossOf(posting.moved));
  await commit(env, [
    env.DB.prepare(`UPDATE counts SET status = 'APPROVED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ? WHERE id = ? AND status = 'SUBMITTED'`)
      .bind(user.staffId, user.fullName, now, note, c.id),
    ...posting.statements,
    auditStmt(env, user, 'COUNT_APPROVE', c.ref, `${lines.length} variance(s), AED ${posting.value}${clamped.length ? `; limited to stock on hand: ${clamped.join(', ')}` : ''}`),
  ]);
  return { ok: true, status: 'APPROVED', variances: lines.length, value: posting.value, clamped };
}

export async function listCounts(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.ref, c.status, c.category, c.blind, c.started_by_name, c.started_at, c.submitted_at, c.decided_at,
            c.decided_by_name, s.name AS store_name,
            (SELECT COUNT(*) FROM count_lines WHERE count_id = c.id) AS line_count,
            (SELECT COUNT(*) FROM count_lines WHERE count_id = c.id AND counted IS NOT NULL) AS counted_count
       FROM counts c JOIN stores s ON s.id = c.store_id
      WHERE c.unit_id = ?
      ORDER BY CASE c.status WHEN 'SUBMITTED' THEN 0 WHEN 'OPEN' THEN 1 ELSE 2 END, c.started_at DESC LIMIT 200`,
  ).bind(user.unitId).all();
  return results || [];
}
