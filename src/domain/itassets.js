/**
 * The IT asset register (Design Guide D-086, 22 Nov 2026; docs/it-assets.md).
 *
 * Devices (the server included), SIMs and licences live in the equipment register (assets.js)
 * with `kind`. This file is what they have that equipment does not:
 *
 *  - who holds each one, and every hand-over with the condition seen and its photos;
 *  - a state: in stock, assigned, in repair, idle or retired;
 *  - licence seats, one row per person, ended rows kept as the history;
 *  - the spares the unit wants to keep of a kind of device, so fewer shows as a shortage;
 *  - exit clearance: who is leaving or has left (HiFive ID's staff list, read with the signed-in
 *    person's own session, lib/roster.js) and what they still hold, with the condition it was
 *    issued in beside the condition it comes back in;
 *  - IT's purchase requests to the facility approver, and HR's email account requests to IT.
 *
 * What IT costs is seen by IT, HR and the directors only (`it.prices`). A SIM is kept by the last
 * four digits of its number; a licence never by its key.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, isoDate, nextRef, nowIso, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { byCode, fetchRoster, hasLeft } from '../lib/roster.js';
import { may, requireMay, requireOtherApprover } from './access.js';
import { requireFeature } from './settings.js';
import { commit } from './stock.js';

export const IT_KINDS = { DEVICE: 'Device', SIM: 'SIM', LICENCE: 'Licence' };
export const IT_STATES = { IN_STOCK: 'In stock', ASSIGNED: 'Assigned', IN_REPAIR: 'In repair', IDLE: 'Idle', RETIRED: 'Retired' };
export const CONDITIONS = { NEW: 'New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor', DAMAGED: 'Damaged' };
export const HANDOVER_ACTIONS = {
  ISSUE: 'Issued', RETURN: 'Returned', REPAIR_OUT: 'Sent for repair', REPAIR_BACK: 'Back from repair',
  IDLE: 'Marked idle', STOCK: 'Back in stock', RETIRE: 'Retired',
};
export const REQUEST_KINDS = { PURCHASE: 'Purchase', EMAIL_ACCOUNT: 'Email account' };
export const REQUEST_STATUS = { PENDING: 'Waiting', APPROVED: 'Approved', REJECTED: 'Turned down', DONE: 'Done', CANCELLED: 'Withdrawn' };

export const isIt = (kind) => !!IT_KINDS[kind];
/** May this person see what this kind of asset cost? Equipment keeps its rule; IT has its own. */
export const seesPrice = (user, kind) => (isIt(kind) ? may(user, 'it.prices') : may(user, 'cost.view'));

/** A licence key, in the shapes product keys come in, must never be typed into the register. */
const KEY_SHAPE = /\b[A-Z0-9]{4,6}(?:-[A-Z0-9]{4,6}){3,}\b/i;
export function refuseKeys(...values) {
  if (values.some((v) => v && KEY_SHAPE.test(String(v)))) {
    refuse('NO_KEYS', 'That looks like a licence key. Keys are never kept here: keep them in the licence portal.');
  }
}

/** A SIM by the last four digits of its number, and nothing more. Pure. */
export function simDigits(v) {
  const s = String(v ?? '').replace(/\s/g, '');
  if (!/^\d{4}$/.test(s)) refuse('SIM_DIGITS', 'Enter only the last 4 digits of the SIM number. The whole number is never kept.');
  return s;
}

const condition = (v, needed = true) => {
  if (!v && !needed) return null;
  if (!CONDITIONS[v]) refuse('CONDITION_REQUIRED', 'Say what condition it is in: new, good, fair, poor or damaged.');
  return v;
};

async function itAsset(env, user, id) {
  await requireFeature(env, user.unitId, 'assets.on');
  const a = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!a || !isIt(a.kind) || !may(user, 'it.view')) refuse('NOT_FOUND', 'That is not in this unit’s IT register.', 404);
  return a;
}

/** The staff list from HiFive ID, by code. Every hand-over to a person is checked against it. */
async function rosterMap(env, bearer) {
  return byCode((await fetchRoster(env, bearer)).staff).map;
}

/** Somebody HiFive ID knows and who has not left: the code, and the name as HiFive ID has it. */
async function personFor(env, bearer, code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) refuse('PERSON_REQUIRED', 'Choose who it is for.');
  const r = (await rosterMap(env, bearer)).get(c);
  if (!r) refuse('NOT_IN_HFID', `HiFive ID has nobody with the employee code ${c}.`, 404);
  if (hasLeft(r)) refuse('HAS_LEFT', `HiFive ID says ${String(r.full_name || c).trim()} has left.`);
  return { code: c, name: String(r.full_name || c).trim() };
}

/** People to hand things to: everybody HiFive ID has who has not left, this unit's first. */
export async function itPeople(env, user, bearer) {
  if (!may(user, 'it.edit') && !may(user, 'it.email')) refuse('AUTH', 'Your role does not allow this.', 403);
  const { staff } = await fetchRoster(env, bearer);
  const unit = user.unit.name.trim().toLowerCase();
  return staff
    .filter((r) => r.employee_code && !hasLeft(r))
    .map((r) => ({
      code: String(r.employee_code).trim().toUpperCase(), name: String(r.full_name || r.employee_code).trim(),
      designation: r.designation || null, entity: r.entity || null, here: String(r.entity || '').trim().toLowerCase() === unit,
    }))
    .sort((a, b) => (b.here - a.here) || a.name.localeCompare(b.name));
}

/**
 * A device or SIM changes hands or state. One hand-over row each time, with the condition seen,
 * so the history answers "who had it, and how was it when they got it".
 */
export async function handOver(env, user, id, body, { bearer } = {}) {
  requireMay(user, 'it.edit');
  const a = await itAsset(env, user, id);
  if (a.kind === 'LICENCE') refuse('USE_SEATS', 'A licence is given to people by its seats, not handed over.');
  const action = HANDOVER_ACTIONS[body.action] ? body.action : null;
  if (!action) refuse('BAD_ACTION', 'Unknown action.');
  const state = a.state || 'IN_STOCK';
  const from = { IN_STOCK: ['ISSUE', 'REPAIR_OUT', 'IDLE', 'RETIRE'], IDLE: ['ISSUE', 'STOCK', 'REPAIR_OUT', 'RETIRE'],
    ASSIGNED: ['RETURN'], IN_REPAIR: ['REPAIR_BACK', 'RETIRE'], RETIRED: [] }[state] || [];
  if (!from.includes(action)) {
    refuse('NOT_NOW', state === 'ASSIGNED'
      ? `${a.tag} is with ${a.holder_name}. Take it back first.`
      : state === 'RETIRED' ? `${a.tag} is retired.` : `${a.tag} is ${IT_STATES[state].toLowerCase()}: that cannot be done now.`, 409);
  }
  const needsCondition = ['ISSUE', 'RETURN', 'REPAIR_BACK'].includes(action);
  const cond = condition(body.condition, needsCondition);
  const note = text(body.note, 500);
  refuseKeys(note);
  if (action === 'RETURN' && cond && ['POOR', 'DAMAGED'].includes(cond) && !note) {
    refuse('NOTE_REQUIRED', 'Say what is wrong with it, so the history shows how it came back.');
  }
  const to = action === 'ISSUE' ? await personFor(env, bearer, body.toCode) : null;
  const next = { ISSUE: 'ASSIGNED', RETURN: 'IN_STOCK', REPAIR_OUT: 'IN_REPAIR', REPAIR_BACK: 'IN_STOCK', IDLE: 'IDLE', STOCK: 'IN_STOCK', RETIRE: 'RETIRED' }[action];
  const now = nowIso();
  const hid = uuid();
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO asset_handovers (id, unit_id, asset_id, at, action, from_code, from_name, to_code, to_name, condition, note, clearance, by_id, by_name)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(hid, user.unitId, a.id, now, action, action === 'RETURN' ? a.holder_code : null, action === 'RETURN' ? a.holder_name : null,
      to?.code ?? null, to?.name ?? null, cond, note, body.clearance ? 1 : 0, user.staffId, user.fullName),
    env.DB.prepare(
      `UPDATE assets SET state = ?, state_since = ?, holder_code = ?, holder_name = ?, condition = COALESCE(?, condition),
              status = CASE WHEN ? = 'RETIRED' THEN 'RETIRED' WHEN ? = 'IN_REPAIR' THEN 'IN_REPAIR' ELSE 'ACTIVE' END,
              updated_at = ?, updated_by = ? WHERE id = ?`,
    ).bind(next, now, to?.code ?? null, to?.name ?? null, cond, next, next, now, user.fullName, a.id),
    auditStmt(env, user, `IT_${action}`, a.tag, [HANDOVER_ACTIONS[action], to && `to ${to.name} (${to.code})`, action === 'RETURN' && a.holder_name && `from ${a.holder_name}`, cond && CONDITIONS[cond], body.clearance && 'exit clearance'].filter(Boolean).join(', ')),
  ]);
  return { ok: true, handoverId: hid, state: next };
}

/** Give somebody a seat of a licence. A full licence says so: that is the shortage to buy for. */
export async function addSeat(env, user, id, body, { bearer } = {}) {
  requireMay(user, 'it.edit');
  const a = await itAsset(env, user, id);
  if (a.kind !== 'LICENCE') refuse('NOT_LICENCE', 'Only a licence has seats.');
  if (a.state === 'RETIRED') refuse('RETIRED', `${a.name} is retired.`);
  const who = await personFor(env, bearer, body.code);
  const { results } = await env.DB.prepare(`SELECT holder_code FROM licence_seats WHERE asset_id = ? AND until_at IS NULL`).bind(a.id).all();
  if ((results || []).some((r) => r.holder_code === who.code)) refuse('ALREADY_HOLDS', `${who.name} already has a seat.`, 409);
  if (a.seats && (results || []).length >= a.seats) {
    refuse('NO_SEAT', `All ${a.seats} seats of ${a.name} are taken. End one, or raise a purchase request for more.`, 409);
  }
  const now = nowIso();
  await commit(env, [
    env.DB.prepare(`INSERT INTO licence_seats (id, unit_id, asset_id, holder_code, holder_name, from_at, by_name) VALUES (?,?,?,?,?,?,?)`)
      .bind(uuid(), user.unitId, a.id, who.code, who.name, now, user.fullName),
    auditStmt(env, user, 'IT_SEAT_ADD', a.tag, `${a.name}: ${who.name} (${who.code})`),
  ]);
  return { ok: true };
}

export async function endSeat(env, user, id, seatId, { clearance = false } = {}) {
  requireMay(user, 'it.edit');
  const a = await itAsset(env, user, id);
  const s = await env.DB.prepare(`SELECT * FROM licence_seats WHERE id = ? AND asset_id = ? AND until_at IS NULL`).bind(seatId, a.id).first();
  if (!s) refuse('NOT_FOUND', 'That seat is not held now.', 404);
  await commit(env, [
    env.DB.prepare(`UPDATE licence_seats SET until_at = ?, ended_by_name = ? WHERE id = ? AND until_at IS NULL`).bind(nowIso(), user.fullName, s.id),
    auditStmt(env, user, 'IT_SEAT_END', a.tag, `${a.name}: ${s.holder_name} (${s.holder_code})${clearance ? ', exit clearance' : ''}`),
  ]);
  return { ok: true };
}

/** Hand-overs and seats for one asset's window, newest first. */
export async function itHistory(env, a) {
  const [h, seats] = await Promise.all([
    env.DB.prepare(`SELECT * FROM asset_handovers WHERE asset_id = ? ORDER BY at DESC LIMIT 200`).bind(a.id).all(),
    a.kind === 'LICENCE'
      ? env.DB.prepare(`SELECT * FROM licence_seats WHERE asset_id = ? ORDER BY until_at IS NOT NULL, from_at DESC LIMIT 300`).bind(a.id).all()
      : { results: [] },
  ]);
  const ids = (h.results || []).map((x) => x.id);
  const photos = ids.length
    ? (await env.DB.prepare(
      `SELECT id, doc_id, name, mime, uploaded_at FROM files WHERE doc_type = 'HANDOVER' AND removed_at IS NULL AND doc_id IN (${ids.map(() => '?').join(',')})`,
    ).bind(...ids).all()).results || []
    : [];
  return {
    handovers: (h.results || []).map((x) => ({ ...x, action_label: HANDOVER_ACTIONS[x.action], condition_label: CONDITIONS[x.condition] || null, photos: photos.filter((p) => p.doc_id === x.id) })),
    seats: seats.results || [],
  };
}

/** A hand-over this unit holds, for attaching its photos. */
export async function handoverRow(env, user, hid) {
  const h = await env.DB.prepare(
    `SELECT h.*, a.tag FROM asset_handovers h JOIN assets a ON a.id = h.asset_id WHERE h.id = ? AND h.unit_id = ?`,
  ).bind(hid, user.unitId).first();
  if (!h) refuse('NOT_FOUND', 'That hand-over is not in this unit.', 404);
  return h;
}

// ── Spares ───────────────────────────────────────────────────────────────────

export async function spares(env, user) {
  requireMay(user, 'it.view');
  const [{ results: wants }, { results: have }] = await Promise.all([
    env.DB.prepare(`SELECT category, min_spare FROM it_spares WHERE unit_id = ? ORDER BY category`).bind(user.unitId).all(),
    env.DB.prepare(
      `SELECT COALESCE(category, '') AS category, COUNT(*) AS n FROM assets
        WHERE unit_id = ? AND kind = 'DEVICE' AND state = 'IN_STOCK' GROUP BY COALESCE(category, '')`,
    ).bind(user.unitId).all(),
  ]);
  const inStock = new Map((have || []).map((r) => [r.category.toLowerCase(), r.n]));
  return (wants || []).map((w) => {
    const n = inStock.get(w.category.toLowerCase()) || 0;
    return { category: w.category, min: w.min_spare, inStock: n, short: Math.max(0, w.min_spare - n) };
  });
}

export async function setSpare(env, user, body) {
  requireMay(user, 'it.edit');
  const category = text(body.category, 60);
  if (!category) refuse('CATEGORY_REQUIRED', 'Say which kind of device: laptop, phone, monitor.');
  const min = Number(body.min);
  if (!Number.isInteger(min) || min < 0 || min > 500) refuse('BAD_NUMBER', 'How many to keep spare: a whole number, 0 to stop watching it.');
  await commit(env, [
    min === 0
      ? env.DB.prepare(`DELETE FROM it_spares WHERE unit_id = ? AND category = ?`).bind(user.unitId, category)
      : env.DB.prepare(`INSERT INTO it_spares (unit_id, category, min_spare) VALUES (?,?,?) ON CONFLICT(unit_id, category) DO UPDATE SET min_spare = excluded.min_spare`)
        .bind(user.unitId, category, min),
    auditStmt(env, user, 'IT_SPARES', category, min === 0 ? 'not watched' : `keep ${min} spare`),
  ]);
  return { ok: true };
}

// ── Exit clearance ───────────────────────────────────────────────────────────

const LEAVING_DAYS = 30;

/**
 * Everybody HiFive ID says has left, or leaves within 30 days, who still holds something here:
 * each device and SIM with the condition it was issued in, and each licence seat.
 */
export async function clearance(env, user, bearer) {
  requireMay(user, 'it.edit');
  await requireFeature(env, user.unitId, 'assets.on');
  const today = gstDate();
  const soon = new Date(Date.parse(`${today}T00:00:00Z`) + LEAVING_DAYS * 864e5).toISOString().slice(0, 10);
  const [{ results: held }, { results: seats }] = await Promise.all([
    env.DB.prepare(
      `SELECT a.id, a.tag, a.name, a.kind, a.category, a.sim_last4, a.holder_code, a.holder_name, a.condition, a.state_since,
              (SELECT h.condition FROM asset_handovers h WHERE h.asset_id = a.id AND h.action = 'ISSUE' AND h.to_code = a.holder_code ORDER BY h.at DESC LIMIT 1) AS issued_condition,
              (SELECT h.at FROM asset_handovers h WHERE h.asset_id = a.id AND h.action = 'ISSUE' AND h.to_code = a.holder_code ORDER BY h.at DESC LIMIT 1) AS issued_at
         FROM assets a WHERE a.unit_id = ? AND a.state = 'ASSIGNED' AND a.holder_code IS NOT NULL`,
    ).bind(user.unitId).all(),
    env.DB.prepare(
      `SELECT s.id AS seat_id, s.holder_code, s.holder_name, s.from_at, a.id, a.tag, a.name
         FROM licence_seats s JOIN assets a ON a.id = s.asset_id WHERE s.unit_id = ? AND s.until_at IS NULL`,
    ).bind(user.unitId).all(),
  ]);
  const codes = new Set([...(held || []).map((r) => r.holder_code), ...(seats || []).map((r) => r.holder_code)]);
  if (!codes.size) return [];
  const roster = await rosterMap(env, bearer);
  const out = [];
  for (const code of codes) {
    const r = roster.get(code);
    if (!r) continue;
    const left = hasLeft(r, today);
    if (!left && !(r.end_date && r.end_date <= soon)) continue;
    out.push({
      code, name: String(r.full_name || code).trim(), endDate: r.end_date || null, left,
      items: (held || []).filter((x) => x.holder_code === code),
      seats: (seats || []).filter((x) => x.holder_code === code),
    });
  }
  return out.sort((a, b) => (b.left - a.left) || String(a.endDate || '').localeCompare(String(b.endDate || '')));
}

// ── Requests ─────────────────────────────────────────────────────────────────

export async function listItRequests(env, user, { status } = {}) {
  if (!may(user, 'it.view') && !may(user, 'it.email')) refuse('AUTH', 'Your role does not allow this.', 403);
  const open = status !== 'closed';
  const { results } = await env.DB.prepare(
    `SELECT * FROM it_requests WHERE unit_id = ? AND status ${open ? "IN ('PENDING','APPROVED')" : "IN ('REJECTED','DONE','CANCELLED')"}
      ORDER BY raised_at DESC LIMIT 200`,
  ).bind(user.unitId).all();
  const prices = may(user, 'it.prices');
  return (results || [])
    // HR sees the email requests; purchases are IT's and the approver's.
    .filter((r) => r.kind === 'EMAIL_ACCOUNT' || may(user, 'it.edit') || may(user, 'it.purchase') || may(user, 'it.decide'))
    .map((r) => ({ ...r, estimate: prices ? r.estimate : undefined, kind_label: REQUEST_KINDS[r.kind], status_label: REQUEST_STATUS[r.status] }));
}

export async function raiseItRequest(env, user, body) {
  const kind = REQUEST_KINDS[body.kind] ? body.kind : null;
  if (!kind) refuse('KIND_REQUIRED', 'A purchase, or an email account?');
  requireMay(user, kind === 'PURCHASE' ? 'it.purchase' : 'it.email');
  const title = text(body.title, 160);
  const details = text(body.details, 1000);
  refuseKeys(title, details);
  const neededBy = body.neededBy ? isoDate(body.neededBy) : null;
  if (body.neededBy && !neededBy) refuse('BAD_DATE', 'The date it is needed by is not a real date.');
  let forCode = null; let forName = null; let estimate = null;
  if (kind === 'EMAIL_ACCOUNT') {
    forName = text(body.forName, 120);
    forCode = text(body.forCode, 30)?.toUpperCase() || null;
    if (!forName) refuse('PERSON_REQUIRED', 'Who is the email account for?');
  } else {
    if (!title) refuse('TITLE_REQUIRED', 'Say what is to be bought.');
    if (body.estimate !== '' && body.estimate !== undefined && body.estimate !== null) {
      estimate = Number(body.estimate);
      if (!Number.isFinite(estimate) || estimate < 0) refuse('BAD_AMOUNT', 'The estimate is not an amount.');
    }
  }
  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'ITR');
  const what = kind === 'EMAIL_ACCOUNT' ? `Email account for ${forName}` : title;
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO it_requests (id, unit_id, ref, kind, title, details, for_code, for_name, needed_by, estimate, raised_by, raised_name, raised_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, user.unitId, ref, kind, what, details, forCode, forName, neededBy, estimate, user.staffId, user.fullName, nowIso()),
    auditStmt(env, user, `IT_REQUEST_${kind}`, ref, what),
  ]);
  return { ok: true, id, ref };
}

/**
 * approve / reject (the facility approver, a purchase only, never their own), done (IT: bought,
 * or the account made), cancel (whoever raised it, while it waits).
 */
export async function actOnItRequest(env, user, id, action, body = {}) {
  const r = await env.DB.prepare(`SELECT * FROM it_requests WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!r) refuse('NOT_FOUND', 'That request is not in this unit.', 404);
  const note = text(body.note, 500);
  refuseKeys(note);
  const now = nowIso();
  let set;
  if (action === 'approve' || action === 'reject') {
    requireMay(user, 'it.decide');
    if (r.kind !== 'PURCHASE') refuse('NOT_PURCHASE', 'Only a purchase request is approved.');
    if (r.status !== 'PENDING') refuse('CLOSED', `${r.ref} is ${REQUEST_STATUS[r.status].toLowerCase()}.`, 409);
    await requireOtherApprover(env, user, r.raised_by, 'request');
    if (action === 'reject' && !note) refuse('NOTE_REQUIRED', 'Say why, so IT knows what to do instead.');
    set = [`status = ?, decided_by = ?, decided_name = ?, decided_at = ?, decision_note = ?`, action === 'approve' ? 'APPROVED' : 'REJECTED', user.staffId, user.fullName, now, note];
  } else if (action === 'done') {
    requireMay(user, 'it.edit');
    const ready = r.kind === 'PURCHASE' ? r.status === 'APPROVED' : r.status === 'PENDING';
    if (!ready) refuse('NOT_READY', r.kind === 'PURCHASE' && r.status === 'PENDING' ? `${r.ref} has not been approved yet.` : `${r.ref} is ${REQUEST_STATUS[r.status].toLowerCase()}.`, 409);
    set = [`status = 'DONE', done_name = ?, done_at = ?, done_note = ?`, user.fullName, now, note];
  } else if (action === 'cancel') {
    if (r.raised_by !== user.staffId && !may(user, 'it.decide')) refuse('AUTH', 'Only the person who raised it, or the approver, can withdraw it.', 403);
    if (r.status !== 'PENDING') refuse('CLOSED', `${r.ref} is ${REQUEST_STATUS[r.status].toLowerCase()}.`, 409);
    set = [`status = 'CANCELLED', decided_name = ?, decided_at = ?, decision_note = ?`, user.fullName, now, note];
  } else refuse('BAD_ACTION', 'Unknown action.');
  const [sql, ...args] = set;
  await commit(env, [
    env.DB.prepare(`UPDATE it_requests SET ${sql} WHERE id = ?`).bind(...args, r.id),
    auditStmt(env, user, `IT_REQUEST_${action.toUpperCase()}`, r.ref, note || r.title),
  ]);
  return { ok: true };
}

// ── What waits (Today and the hub, waiting.js) ───────────────────────────────

export async function itFacts(env, unitId, today, soonDay, idleDays) {
  const idleSince = new Date(Date.parse(`${today}T00:00:00Z`) - idleDays * 864e5).toISOString();
  const one = (sql, ...a) => env.DB.prepare(sql).bind(...a).first();
  const [assets, seatsFull, spareRows, requests] = await Promise.all([
    one(`SELECT SUM(state = 'IDLE' OR (state = 'IN_STOCK' AND kind = 'DEVICE' AND COALESCE(state_since, created_at) < ?2)) AS idle,
                SUM(kind <> 'LICENCE' AND warranty_until >= ?3 AND warranty_until <= ?4) AS warranty,
                SUM(kind = 'LICENCE' AND renews_on <= ?4) AS renewals,
                MIN(CASE WHEN kind = 'LICENCE' THEN renews_on END) AS first_renewal
           FROM assets WHERE unit_id = ?1 AND kind <> 'EQUIPMENT' AND COALESCE(state, '') <> 'RETIRED'`, unitId, idleSince, today, soonDay),
    one(`SELECT COUNT(*) AS n FROM assets a WHERE a.unit_id = ? AND a.kind = 'LICENCE' AND a.seats > 0 AND COALESCE(a.state, '') <> 'RETIRED'
           AND (SELECT COUNT(*) FROM licence_seats s WHERE s.asset_id = a.id AND s.until_at IS NULL) >= a.seats`, unitId),
    env.DB.prepare(
      `SELECT w.category, w.min_spare,
              (SELECT COUNT(*) FROM assets a WHERE a.unit_id = w.unit_id AND a.kind = 'DEVICE' AND a.state = 'IN_STOCK' AND LOWER(COALESCE(a.category, '')) = LOWER(w.category)) AS n
         FROM it_spares w WHERE w.unit_id = ?`,
    ).bind(unitId).all(),
    env.DB.prepare(
      `SELECT kind, status, raised_by AS by, COUNT(*) AS n, MIN(raised_at) AS oldest FROM it_requests
        WHERE unit_id = ? AND status IN ('PENDING','APPROVED') GROUP BY kind, status, raised_by`,
    ).bind(unitId).all(),
  ]);
  const short = (spareRows.results || []).filter((r) => r.n < r.min_spare).length;
  return { idle: assets?.idle || 0, warranty: assets?.warranty || 0, renewals: assets?.renewals || 0, firstRenewal: assets?.first_renewal || null,
    seatsFull: seatsFull?.n || 0, short, requests: requests.results || [] };
}
