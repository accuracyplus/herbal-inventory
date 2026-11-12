/**
 * Stock requests.
 *
 *   PENDING ──approve──▶ APPROVED ──issue some──▶ PARTLY_ISSUED ──issue rest / close──▶ ISSUED
 *      │                     │
 *      ├──reject──▶ REJECTED └──cancel (nothing issued yet)──▶ CANCELLED
 *      └──cancel──▶ CANCELLED
 *
 * A unit can switch approval off (setting requests.approval = none): requests are then born
 * APPROVED and go straight to the store. Herbal Park's therapists asking for oil is the case.
 */

import { refuse } from '../lib/errors.js';
import { nextRef, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { areaFor, may, requireOtherApprover, storeFor } from './access.js';
import { commit, loadItems } from './stock.js';
import { parseLines, transfer } from './operations.js';
import { setting } from './settings.js';

const LIVE = ['PENDING', 'APPROVED', 'PARTLY_ISSUED'];

async function mainStore(env, unitId) {
  return env.DB.prepare(
    `SELECT id FROM stores WHERE unit_id = ? AND kind = 'MAIN' AND active = 1 ORDER BY sort, name LIMIT 1`,
  ).bind(unitId).first();
}

export async function createRequest(env, user, body) {
  const fromId = body.fromStoreId || (await mainStore(env, user.unitId))?.id;
  if (!fromId) refuse('NO_MAIN_STORE', 'This unit has no main store to ask. Ask your unit administrator to set one up.');
  const from = await storeFor(env, user, fromId, { forWrite: false });
  const to = body.toStoreId ? await storeFor(env, user, body.toStoreId, { forWrite: false }) : null;
  const area = !to ? await areaFor(env, user, body.areaId) : null;
  if (!to && !area) refuse('DESTINATION', 'Say where the stock is needed: a store, or a room.');
  if (to && to.id === from.id) refuse('SAME_STORE', 'A store cannot request from itself.');

  const lines = parseLines(body.lines);
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  for (const it of items.values()) if (!it.active) refuse('ITEM_INACTIVE', `${it.name} has been retired.`);

  const autoApprove = (await setting(env, user.unitId, 'requests.approval')) === 'none';
  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'REQ');
  const now = nowIso();
  const urgency = body.urgency === 'URGENT' ? 'URGENT' : 'NORMAL';
  const stmts = [
    env.DB.prepare(
      `INSERT INTO requests (id, unit_id, ref, status, urgency, from_store_id, to_store_id, area_id, note,
                             requested_by, requested_by_name, requested_at, decided_by_name, decided_at, decision_note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, user.unitId, ref, autoApprove ? 'APPROVED' : 'PENDING', urgency, from.id, to?.id ?? null,
           area?.id ?? null, text(body.note, 500), user.staffId, user.fullName, now,
           autoApprove ? 'No approval needed in this unit' : null, autoApprove ? now : null, null),
    ...lines.map((l) => env.DB.prepare(
      `INSERT INTO request_lines (id, request_id, item_id, qty, approved_qty) VALUES (?,?,?,?,?)`,
    ).bind(uuid(), id, l.itemId, l.qty, autoApprove ? l.qty : null)),
    auditStmt(env, user, 'REQUEST_CREATE', ref, `${lines.length} line(s), ${urgency.toLowerCase()}`),
  ];
  await commit(env, stmts);
  return { ok: true, id, ref, status: autoApprove ? 'APPROVED' : 'PENDING' };
}

async function load(env, user, id) {
  const r = await env.DB.prepare(`SELECT * FROM requests WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!r) refuse('NOT_FOUND', 'That request does not exist in this unit.', 404);
  return r;
}

export async function getRequest(env, user, id) {
  const r = await load(env, user, id);
  const { results } = await env.DB.prepare(
    `SELECT rl.*, i.code, i.name, i.uom, i.tracks_expiry, i.is_linen,
            COALESCE(b.qty, 0) AS available, loc.location
       FROM request_lines rl
       JOIN items i ON i.id = rl.item_id
       LEFT JOIN balances b ON b.item_id = rl.item_id AND b.store_id = ?1
       LEFT JOIN item_locations loc ON loc.item_id = rl.item_id AND loc.store_id = ?1
      WHERE rl.request_id = ?2
      ORDER BY CASE WHEN loc.location IS NULL THEN 1 ELSE 0 END, loc.location, i.name`,
  ).bind(r.from_store_id, r.id).all();
  const names = await env.DB.prepare(
    `SELECT (SELECT name FROM stores WHERE id = ?) AS from_name,
            (SELECT name FROM stores WHERE id = ?) AS to_name,
            (SELECT name FROM areas WHERE id = ?) AS area_name`,
  ).bind(r.from_store_id, r.to_store_id, r.area_id).first();
  const { results: issues } = await env.DB.prepare(
    `SELECT ref, by_name, at FROM transfers WHERE request_id = ? ORDER BY at`,
  ).bind(r.id).all();
  return { ...r, ...names, lines: results || [], issues: issues || [] };
}

export async function decideRequest(env, user, id, body) {
  const r = await load(env, user, id);
  if (r.status !== 'PENDING') refuse('ALREADY_DECIDED', `${r.ref} has already been ${r.status.toLowerCase().replace('_', ' ')}.`, 409);
  await requireOtherApprover(env, user, r.requested_by, 'request');
  const now = nowIso();
  const note = text(body.note, 500);
  if (body.action === 'REJECT') {
    if (!note) refuse('REASON_REQUIRED', 'Say why the request is being rejected — the person who asked will see it.');
    await commit(env, [
      env.DB.prepare(
        `UPDATE requests SET status = 'REJECTED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ?, closed_at = ?
          WHERE id = ? AND status = 'PENDING'`,
      ).bind(user.staffId, user.fullName, now, note, now, r.id),
      auditStmt(env, user, 'REQUEST_REJECT', r.ref, note),
    ]);
    return { ok: true, status: 'REJECTED' };
  }
  if (body.action !== 'APPROVE') refuse('BAD_ACTION', 'Approve or reject.');
  const { results: lines } = await env.DB.prepare(`SELECT id, qty FROM request_lines WHERE request_id = ?`).bind(r.id).all();
  const given = new Map((body.lines || []).map((l) => [l.lineId, l.approvedQty]));
  const stmts = [];
  let anything = false;
  for (const l of lines || []) {
    const raw = given.has(l.id) ? given.get(l.id) : l.qty;
    const qty = raw === 0 || raw === '0' ? 0 : positive(raw);
    if (qty === null) refuse('BAD_QTY', 'Approved quantities must be zero or more.');
    if (qty > 0) anything = true;
    stmts.push(env.DB.prepare(`UPDATE request_lines SET approved_qty = ? WHERE id = ?`).bind(q3(qty), l.id));
  }
  if (!anything) refuse('NOTHING_APPROVED', 'Every line is zero. Reject the request instead.');
  await commit(env, [
    env.DB.prepare(
      `UPDATE requests SET status = 'APPROVED', decided_by = ?, decided_by_name = ?, decided_at = ?, decision_note = ?
        WHERE id = ? AND status = 'PENDING'`,
    ).bind(user.staffId, user.fullName, now, note, r.id),
    ...stmts,
    auditStmt(env, user, 'REQUEST_APPROVE', r.ref, note),
  ]);
  return { ok: true, status: 'APPROVED' };
}

/**
 * Give out what was approved. Partial issues are normal (the store had six, not ten); `close`
 * ends the request with whatever has gone, so it stops sitting on everybody's list.
 */
export async function fulfilRequest(env, user, id, body) {
  const r = await load(env, user, id);
  if (!['APPROVED', 'PARTLY_ISSUED'].includes(r.status)) {
    refuse('NOT_READY', r.status === 'PENDING' ? `${r.ref} has not been approved yet.` : `${r.ref} is ${r.status.toLowerCase()}.`, 409);
  }
  const { results: lines } = await env.DB.prepare(`SELECT * FROM request_lines WHERE request_id = ?`).bind(r.id).all();
  const byId = new Map((lines || []).map((l) => [l.id, l]));
  const issue = [];
  const updates = [];
  for (const g of body.lines || []) {
    const l = byId.get(g.lineId);
    if (!l) refuse('BAD_LINE', 'A line does not belong to this request.');
    const qty = g.qty === 0 || g.qty === '0' || g.qty === '' || g.qty == null ? 0 : positive(g.qty);
    if (qty === null) refuse('BAD_QTY', 'Quantities must be zero or more.');
    if (!qty) continue;
    const left = q3((l.approved_qty ?? 0) - l.issued_qty);
    if (qty > left) {
      const it = (await loadItems(env, user.unitId, [l.item_id])).get(l.item_id);
      refuse('OVER_ISSUE', `${it.name}: only ${left} ${it.uom} is still to be issued on ${r.ref}.`);
    }
    issue.push({ itemId: l.item_id, qty, batchId: g.batchId || null });
    updates.push({ id: l.id, qty });
  }
  const close = !!body.close;
  if (!issue.length && !close) refuse('NOTHING', 'Enter what you are giving out, or close the request.');

  const stmts = [];
  let ref = null;
  if (issue.length) {
    const t = await transfer(env, user, {
      fromStoreId: r.from_store_id, toStoreId: r.to_store_id, areaId: r.area_id, note: text(body.note, 300) || `For ${r.ref}`, lines: issue,
    }, { request: r });
    ref = t.ref;
    stmts.push(...t.statements);
    for (const u of updates) {
      stmts.push(env.DB.prepare(`UPDATE request_lines SET issued_qty = round(issued_qty + ?, 3) WHERE id = ?`).bind(u.qty, u.id));
    }
  }
  const now = nowIso();
  stmts.push(env.DB.prepare(
    `UPDATE requests SET
       status = CASE WHEN ? = 1 OR NOT EXISTS (
                  SELECT 1 FROM request_lines WHERE request_id = ? AND issued_qty < COALESCE(approved_qty, 0))
                THEN 'ISSUED' ELSE 'PARTLY_ISSUED' END,
       closed_at = CASE WHEN ? = 1 OR NOT EXISTS (
                  SELECT 1 FROM request_lines WHERE request_id = ? AND issued_qty < COALESCE(approved_qty, 0))
                THEN ? ELSE NULL END
     WHERE id = ?`,
  ).bind(close ? 1 : 0, r.id, close ? 1 : 0, r.id, now, r.id));
  stmts.push(auditStmt(env, user, 'REQUEST_ISSUE', r.ref, `${issue.length} line(s)${ref ? ` as ${ref}` : ''}${close ? ', closed' : ''}`));
  await commit(env, stmts);
  return { ok: true, transferRef: ref };
}

export async function cancelRequest(env, user, id, body) {
  const r = await load(env, user, id);
  if (!['PENDING', 'APPROVED'].includes(r.status)) refuse('CANNOT_CANCEL', `${r.ref} is ${r.status.toLowerCase().replace('_', ' ')} and cannot be cancelled.`, 409);
  if (r.requested_by !== user.staffId && !may(user, 'request.decide')) {
    refuse('NOT_YOURS', 'Only the person who asked, or a manager, can cancel a request.', 403);
  }
  const now = nowIso();
  await commit(env, [
    env.DB.prepare(
      `UPDATE requests SET status = 'CANCELLED', closed_at = ?, decision_note = COALESCE(?, decision_note)
        WHERE id = ? AND status IN ('PENDING','APPROVED')
          AND NOT EXISTS (SELECT 1 FROM request_lines WHERE request_id = ? AND issued_qty > 0)`,
    ).bind(now, text(body?.note, 300), r.id, r.id),
    auditStmt(env, user, 'REQUEST_CANCEL', r.ref, text(body?.note, 300)),
  ]);
  return { ok: true };
}

export async function listRequests(env, user, { status, mine, limit = 100 }) {
  const where = ['r.unit_id = ?'];
  const args = [user.unitId];
  if (status === 'OPEN') where.push(`r.status IN (${LIVE.map(() => '?').join(',')})`), args.push(...LIVE);
  else if (status) where.push('r.status = ?'), args.push(status);
  if (mine) where.push('r.requested_by = ?'), args.push(user.staffId);
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.ref, r.status, r.urgency, r.requested_by_name, r.requested_at, r.decided_by_name, r.decided_at,
            r.decision_note, r.note, r.requested_by,
            fs.name AS from_name, ts.name AS to_name, a.name AS area_name,
            (SELECT COUNT(*) FROM request_lines WHERE request_id = r.id) AS line_count,
            (SELECT group_concat(i.name, ', ') FROM request_lines rl JOIN items i ON i.id = rl.item_id WHERE rl.request_id = r.id) AS summary
       FROM requests r
       LEFT JOIN stores fs ON fs.id = r.from_store_id
       LEFT JOIN stores ts ON ts.id = r.to_store_id
       LEFT JOIN areas a ON a.id = r.area_id
      WHERE ${where.join(' AND ')}
      ORDER BY CASE r.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 WHEN 'PARTLY_ISSUED' THEN 2 ELSE 3 END,
               CASE r.urgency WHEN 'URGENT' THEN 0 ELSE 1 END, r.requested_at DESC
      LIMIT ?`,
  ).bind(...args, Math.min(Number(limit) || 100, 500)).all();
  return results || [];
}
