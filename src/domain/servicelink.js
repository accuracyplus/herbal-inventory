/**
 * The link to a booking or billing system: completed services arrive from outside, and their
 * recipes come off the shelf.
 *
 * Two ways in, one set of rules:
 *   POST /hooks/services         another system, holding a key an administrator made for the unit
 *   POST /api/service-imports    a manager uploading a sheet, until something is connected
 *
 * WHAT ARRIVES IS NEVER LOST AND NEVER COUNTED TWICE. Each service carries its own reference,
 * unique in the unit. A service already recorded is answered "duplicate", so a system that
 * retries does no harm. One that cannot be recorded (an unknown service or room, not enough
 * stock) is kept in the inbox with the reason, for a manager to fix the cause and retry, or to
 * dismiss. Each service is its own batch: one failing does not stop the rest.
 *
 * AN OUTSIDE SYSTEM GETS NO SHORTCUT. The unit's rule for use still holds: if use is recorded
 * against a room and a person, a service with neither waits in the inbox.
 *
 * A key is shown once, when it is made. Only its SHA-256 is kept, so nobody can read a key back
 * out of the database, and a lost key is replaced, not recovered.
 */

import { DomainError, refuse } from '../lib/errors.js';
import { nonNegative, nowIso, sha256Hex, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { storeFor } from './access.js';
import { setting } from './settings.js';
import { postService } from './services.js';

const MAX_ROWS = 200;
const BACK_DAYS = 31;

// ── Keys ─────────────────────────────────────────────────────────────────────

export async function listKeys(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT k.id, k.name, k.hint, k.created_at, k.created_by, k.last_used_at, k.revoked_at, k.revoked_by, s.name AS store_name
       FROM integration_keys k JOIN stores s ON s.id = k.store_id WHERE k.unit_id = ? ORDER BY k.revoked_at IS NOT NULL, k.created_at DESC`,
  ).bind(user.unitId).all();
  return results || [];
}

export async function createKey(env, user, body) {
  const name = text(body.name, 60);
  if (!name) refuse('NAME_REQUIRED', 'Give the connection a name, such as the billing system it is for.');
  const store = await storeFor(env, user, body.storeId, { forWrite: false });
  if (!store.active) refuse('STORE_CLOSED', `${store.name} is closed.`);
  const clash = await env.DB.prepare(`SELECT 1 FROM integration_keys WHERE unit_id = ? AND LOWER(name) = LOWER(?) AND revoked_at IS NULL`).bind(user.unitId, name).first();
  if (clash) refuse('NAME_TAKEN', `There is already a live connection called ${name}. Revoke it first, or use another name.`, 409);
  const raw = crypto.getRandomValues(new Uint8Array(24));
  const key = `hfinv_${[...raw].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  const id = uuid();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO integration_keys (id, unit_id, name, key_hash, hint, store_id, created_at, created_by) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(id, user.unitId, name, await sha256Hex(key), key.slice(0, 12), store.id, nowIso(), user.fullName),
    auditStmt(env, user, 'LINK_KEY_CREATE', name, `takes stock from ${store.name}; key ${key.slice(0, 12)}…`),
  ]);
  return { id, name, key };
}

export async function revokeKey(env, user, id) {
  const k = await env.DB.prepare(`SELECT id, name, revoked_at FROM integration_keys WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!k) refuse('NOT_FOUND', 'That connection does not exist in this unit.', 404);
  if (k.revoked_at) return { ok: true, unchanged: true };
  await env.DB.batch([
    env.DB.prepare(`UPDATE integration_keys SET revoked_at = ?, revoked_by = ? WHERE id = ?`).bind(nowIso(), user.fullName, k.id),
    auditStmt(env, user, 'LINK_KEY_REVOKE', k.name, null),
  ]);
  return { ok: true };
}

/** The connection a request's key belongs to, or null. */
export async function linkFor(env, request) {
  const auth = request.headers.get('authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!key.startsWith('hfinv_')) return null;
  const k = await env.DB.prepare(
    `SELECT k.id, k.name, k.unit_id, k.store_id, u.code AS unit_code, u.name AS unit_name FROM integration_keys k JOIN units u ON u.id = k.unit_id
      WHERE k.key_hash = ? AND k.revoked_at IS NULL AND u.active = 1`,
  ).bind(await sha256Hex(key)).first();
  if (!k) return null;
  await env.DB.prepare(`UPDATE integration_keys SET last_used_at = ? WHERE id = ?`).bind(nowIso(), k.id).run();
  return { unitId: k.unit_id, unitCode: k.unit_code, unitName: k.unit_name, staffId: null, fullName: `${k.name} (link)`, source: k.name, storeId: k.store_id };
}

// ── One row ──────────────────────────────────────────────────────────────────

const pick = (row, ...names) => { for (const n of names) if (row?.[n] !== undefined && row[n] !== null && row[n] !== '') return row[n]; return null; };

/** A row as any sender might spell it, reduced to the fields this app understands. */
export function canonical(row) {
  return {
    ref: text(pick(row, 'ref', 'reference', 'id'), 80),
    service: text(pick(row, 'service', 'serviceCode', 'service_code', 'treatment', 'test'), 80),
    times: pick(row, 'times', 'qty', 'quantity', 'howMany'),
    at: pick(row, 'at', 'date', 'completedAt', 'completed_at'),
    room: text(pick(row, 'room', 'area'), 80),
    person: text(pick(row, 'person', 'employee', 'employeeCode', 'employee_code', 'therapist', 'doneBy'), 120),
    price: pick(row, 'price', 'unitPrice', 'unit_price'),
    store: text(pick(row, 'store'), 80),
  };
}

/**
 * When the service was done, as an instant. Senders write this many ways: a full timestamp, a
 * date, a date and time with no zone (taken as Gulf time), day first as Excel shows it, or an
 * Excel serial number. Empty means now. Refused if in the future or more than a month back.
 */
export function whenDone(v, now = Date.now()) {
  if (v === null || v === undefined || v === '') return null;
  let ms = NaN;
  if (typeof v === 'number' && v > 30000 && v < 80000) ms = Math.round((v - 25569) * 86400e3) - 4 * 3600e3;   // Excel serial, as Gulf wall time
  else {
    const s = String(v).trim();
    const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/.exec(s);
    const ymd = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?)?$/.exec(s);
    const local = (y, m, d, hh, mm) => Date.parse(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh ?? 12).padStart(2, '0')}:${mm ?? '00'}:00+04:00`);
    if (dmy) ms = local(dmy[3], dmy[2], dmy[1], dmy[4], dmy[5]);
    else if (ymd) ms = local(ymd[1], ymd[2], ymd[3], ymd[4], ymd[5]);
    else ms = Date.parse(s);
  }
  if (!Number.isFinite(ms)) refuse('BAD_DATE', `The date “${v}” could not be understood. Use 2026-11-10 14:30, or 10/11/2026 14:30.`);
  if (ms > now + 10 * 60e3) refuse('BAD_DATE', 'The date is in the future. Only completed services are recorded.');
  if (ms < now - BACK_DAYS * 864e5) refuse('BAD_DATE', `The date is more than ${BACK_DAYS} days ago, which is too old to post to stock.`);
  return new Date(ms).toISOString();
}

const byCodeOrName = (rows, value) => {
  const v = value.trim().toLowerCase();
  const code = rows.filter((r) => String(r.code).toLowerCase() === v);
  return code.length ? code : rows.filter((r) => String(r.name).trim().toLowerCase() === v);
};

/** Everything a unit's rows are matched against, read once for a whole file or call. */
async function lookups(env, unitId) {
  const [services, areas, stores, people, mode] = await Promise.all([
    env.DB.prepare(`SELECT id, code, name, price, active FROM services WHERE unit_id = ?`).bind(unitId).all(),
    env.DB.prepare(`SELECT id, code, name, active, department_id FROM areas WHERE unit_id = ?`).bind(unitId).all(),
    env.DB.prepare(`SELECT id, unit_id, code, name, kind, active FROM stores WHERE unit_id = ?`).bind(unitId).all(),
    env.DB.prepare(
      `SELECT s.id, s.code, s.full_name AS name FROM staff_units su JOIN staff s ON s.id = su.staff_id WHERE su.unit_id = ? AND su.active = 1 AND s.active = 1`,
    ).bind(unitId).all(),
    setting(env, unitId, 'consumption.record'),
  ]);
  return { services: services.results || [], areas: areas.results || [], stores: stores.results || [], people: people.results || [], mode };
}

/** A row matched to this unit, or a refusal saying which part of it is not known here. */
function resolve(c, look, defaultStoreId) {
  if (!c.service) refuse('NO_SERVICE', 'The row does not say which service was done.');
  const svc = byCodeOrName(look.services, c.service);
  if (!svc.length) refuse('UNKNOWN_SERVICE', `“${c.service}” is not a service in this unit. Add it under Recipes, with its code or exact name.`);
  if (svc.length > 1) refuse('UNKNOWN_SERVICE', `More than one service is called “${c.service}”. Send its code.`);
  const times = c.times === null ? 1 : Number(c.times);
  if (!Number.isInteger(times) || times < 1 || times > 50) refuse('BAD_TIMES', `How many were done must be a whole number from 1 to 50, not “${c.times}”.`);

  let store = look.stores.find((s) => s.id === defaultStoreId) || null;
  if (c.store) {
    const hit = byCodeOrName(look.stores, c.store);
    if (hit.length !== 1) refuse('UNKNOWN_STORE', `“${c.store}” is not a store in this unit.`);
    [store] = hit;
  }
  if (!store) refuse('STORE_REQUIRED', 'No store is set for this to take stock from.');
  if (!store.active) refuse('STORE_CLOSED', `${store.name} is closed.`);

  let area = null;
  if (c.room) {
    const hit = byCodeOrName(look.areas, c.room);
    if (hit.length !== 1) refuse('UNKNOWN_ROOM', `“${c.room}” is not a room or area in this unit. Send its code as it is here, or add the room.`);
    [area] = hit;
    if (!area.active) refuse('AREA_CLOSED', `${area.name} is closed.`);
  } else if (look.mode !== 'person') refuse('ROOM_REQUIRED', 'This unit records use against a room, and the row names none.');

  let person = null;
  if (c.person) {
    const hit = byCodeOrName(look.people, c.person);
    if (!hit.length) refuse('UNKNOWN_PERSON', `“${c.person}” is not somebody with a seat in this unit. Send their employee code as in HiFive ID.`);
    if (hit.length > 1) refuse('UNKNOWN_PERSON', `More than one person is called “${c.person}”. Send their employee code.`);
    person = { id: hit[0].id, name: hit[0].name };
  } else if (look.mode !== 'room') refuse('PERSON_REQUIRED', 'This unit records use against a person, and the row names none.');

  const price = c.price === null ? null : nonNegative(typeof c.price === 'string' ? c.price.replace(/[, ]/g, '') : c.price);
  if (c.price !== null && price === null) refuse('BAD_PRICE', `The price “${c.price}” is not a number, zero or more.`);
  return { svc: svc[0], times, store, area, person, departmentId: area?.department_id ?? null, price, at: whenDone(c.at) };
}

const inboxOf = (env, unitId, ref) => env.DB.prepare(`SELECT * FROM service_inbox WHERE unit_id = ? AND ext_ref = ?`).bind(unitId, ref).first();

/**
 * Take one service in: record it, or keep it with the reason it could not be. The service and its
 * inbox row are written in one batch, so a retry after a half-finished attempt cannot count twice.
 */
async function takeOne(env, who, look, row, { retrying = null } = {}) {
  const c = canonical(row);
  if (!c.ref) return { ref: null, status: 'refused', error: 'The row has no reference of its own, so it could not be told apart from a repeat. Send one for every service.' };
  const seen = retrying || await inboxOf(env, who.unitId, c.ref);
  if (seen?.status === 'RECORDED') return { ref: c.ref, status: 'duplicate' };
  if (seen?.status === 'DISMISSED') return { ref: c.ref, status: 'dismissed' };
  const id = seen?.id || uuid();
  const now = nowIso();
  const keep = (status, error, recordId) => env.DB.prepare(
    `INSERT INTO service_inbox (id, unit_id, source, ext_ref, payload, store_id, status, error, record_id, received_at, tried_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(unit_id, ext_ref) DO UPDATE SET payload = excluded.payload, store_id = excluded.store_id, status = excluded.status, error = excluded.error,
       record_id = excluded.record_id, tried_at = excluded.tried_at`,
  ).bind(id, who.unitId, seen?.source || who.source, c.ref, JSON.stringify(c), who.storeId ?? null, status, error, recordId, seen?.received_at || now, now);
  try {
    const r = resolve(c, look, who.storeId);
    const rec = await postService(env, who, { ...r, source: seen?.source || who.source, extRef: c.ref, note: null, extra: ({ id: recordId }) => [keep('RECORDED', null, recordId)] });
    return { ref: c.ref, status: 'recorded', record: rec.ref };
  } catch (e) {
    const error = e instanceof DomainError ? e.message : 'Something went wrong recording this. Try again.';
    if (!(e instanceof DomainError)) console.error('[servicelink]', c.ref, String(e?.message || e).slice(0, 200));
    await keep('FAILED', error, null).run();
    return { ref: c.ref, status: 'failed', error };
  }
}

function summary(results) {
  const n = (s) => results.filter((r) => r.status === s).length;
  return { received: results.length, recorded: n('recorded'), duplicates: n('duplicate'), failed: n('failed') + n('refused'), dismissed: n('dismissed'), results };
}

/** Services from a connection or a sheet, each taken in on its own. */
export async function takeServices(env, who, rows) {
  if (!Array.isArray(rows) || !rows.length) refuse('NO_ROWS', 'Send a list of completed services: { "services": [ { "ref": …, "service": … } ] }.');
  if (rows.length > MAX_ROWS) refuse('TOO_MANY', `At most ${MAX_ROWS} services in one go; this has ${rows.length}.`);
  const look = await lookups(env, who.unitId);
  const results = [];
  for (const row of rows) results.push(await takeOne(env, who, look, row));
  return summary(results);
}

// ── A sheet uploaded by a manager ────────────────────────────────────────────

export const SHEET_COLUMNS = [
  { key: 'ref', header: 'Reference', text: true, required: true, width: 18, hint: 'The booking or invoice line number. It is what stops the same service being counted twice.' },
  { key: 'at', header: 'Date', text: true, width: 18, hint: 'When it was done: 2026-11-10 14:30, or 10/11/2026 14:30. Empty means now.' },
  { key: 'service', header: 'Service', required: true, width: 22, hint: 'Its code or exact name, as under Recipes.' },
  { key: 'times', header: 'How many', width: 10, hint: '1 if left empty.' },
  { key: 'room', header: 'Room', text: true, width: 14, hint: 'The room or area code or name.' },
  { key: 'person', header: 'Person', text: true, width: 16, hint: 'The employee code of who did it, as in HiFive ID.' },
  { key: 'price', header: 'Price', width: 10, hint: 'Charged for one. Leave empty to use the usual price from the recipe.' },
  { key: 'store', header: 'Store', text: true, width: 12, hint: 'The store code. Leave empty to use the store chosen on the screen.' },
];
const slug = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');

function sheetRows(body) {
  if (!Array.isArray(body?.headers) || !Array.isArray(body?.rows)) refuse('BAD_FILE', 'That file could not be read. Download the sheet and fill that in.');
  const at = new Map();
  body.headers.forEach((h, i) => { const col = SHEET_COLUMNS.find((c) => slug(c.header) === slug(h) || c.key === slug(h)); if (col && !at.has(col.key)) at.set(col.key, i); });
  for (const col of SHEET_COLUMNS.filter((c) => c.required)) {
    if (!at.has(col.key)) refuse('BAD_FILE', `This sheet has no “${col.header}” column. Download the sheet and use its headings.`);
  }
  const rows = body.rows.map((r, i) => ({ row: i + 2, cells: r })).filter((r) => Array.isArray(r.cells) && r.cells.some((c) => c !== null && String(c).trim() !== ''));
  if (!rows.length) refuse('EMPTY_FILE', 'The file has headings but no rows.');
  if (rows.length > MAX_ROWS) refuse('TOO_MANY', `At most ${MAX_ROWS} rows at a time; this file has ${rows.length}. Split it.`);
  return rows.map((r) => ({ row: r.row, data: Object.fromEntries([...at].map(([key, i]) => [key, r.cells[i] ?? null])) }));
}

/** Check a sheet (changes nothing), or take its rows in. */
export async function importSheet(env, user, body) {
  const store = await storeFor(env, user, body.storeId, { forWrite: false });
  const rows = sheetRows(body);
  const who = { unitId: user.unitId, unitCode: user.unit.code, staffId: user.staffId, fullName: user.fullName, source: 'Sheet upload', storeId: store.id };
  const look = await lookups(env, user.unitId);
  if (body.dryRun === false) {
    const results = [];
    for (const r of rows) results.push({ row: r.row, ...await takeOne(env, who, look, r.data) });
    return { dryRun: false, ...summary(results) };
  }
  // The check: what each row would do, and whether the stores hold enough for all of them together.
  const need = new Map();
  const seen = new Set();
  const results = [];
  for (const r of rows) {
    const c = canonical(r.data);
    try {
      if (!c.ref) refuse('NO_REF', 'There is no reference on this row.');
      if (seen.has(c.ref)) refuse('REPEATED', 'The same reference is on an earlier row.');
      seen.add(c.ref);
      const inbox = await inboxOf(env, user.unitId, c.ref);
      if (inbox?.status === 'RECORDED') { results.push({ row: r.row, ref: c.ref, status: 'duplicate' }); continue; }
      if (inbox?.status === 'DISMISSED') { results.push({ row: r.row, ref: c.ref, status: 'dismissed' }); continue; }
      const v = resolve(c, look, store.id);
      const { results: recipe } = await env.DB.prepare(`SELECT si.item_id, si.qty, i.name, i.uom FROM service_items si JOIN items i ON i.id = si.item_id WHERE si.service_id = ?`).bind(v.svc.id).all();
      for (const it of recipe || []) {
        const k = `${v.store.id}|${it.item_id}`;
        need.set(k, { store: v.store, item: it, qty: (need.get(k)?.qty || 0) + it.qty * v.times });
      }
      results.push({ row: r.row, ref: c.ref, status: 'ready', what: `${v.times} × ${v.svc.name}${v.area ? ` in ${v.area.name}` : ''}${v.person ? ` by ${v.person.name}` : ''}` });
    } catch (e) {
      if (!(e instanceof DomainError)) throw e;
      results.push({ row: r.row, ref: c.ref, status: 'problem', error: e.message });
    }
  }
  const short = [];
  for (const { store: s, item, qty } of need.values()) {
    const b = await env.DB.prepare(`SELECT qty FROM balances WHERE store_id = ? AND item_id = ?`).bind(s.id, item.item_id).first();
    if ((b?.qty || 0) < qty) short.push(`${item.name}: these rows need ${Math.round(qty * 1000) / 1000} ${item.uom}, and ${s.name} holds ${b?.qty || 0}.`);
  }
  const n = (st) => results.filter((x) => x.status === st).length;
  return { dryRun: true, received: results.length, ready: n('ready'), duplicates: n('duplicate'), dismissed: n('dismissed'), problems: n('problem'), short, results };
}

// ── The inbox ────────────────────────────────────────────────────────────────

export async function listInbox(env, user, { status = 'FAILED' } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT id, source, ext_ref, payload, status, error, received_at, tried_at, decided_by, decision_note FROM service_inbox
      WHERE unit_id = ? AND status = ? ORDER BY received_at DESC LIMIT 200`,
  ).bind(user.unitId, status).all();
  return (results || []).map((r) => { let p = {}; try { p = JSON.parse(r.payload); } catch { /* shown without its detail */ } return { ...r, payload: p }; });
}

const whoIs = (user) => ({ unitId: user.unitId, unitCode: user.unit.code, staffId: user.staffId, fullName: user.fullName, source: 'Retry' });

/** Try again what is waiting: one row, or all of them. The row keeps the source it came from. */
export async function retryInbox(env, user, id = null) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM service_inbox WHERE unit_id = ? AND status = 'FAILED' ${id ? 'AND id = ?' : ''} ORDER BY received_at LIMIT ${MAX_ROWS}`,
  ).bind(user.unitId, ...(id ? [id] : [])).all();
  if (id && !(results || []).length) refuse('NOT_FOUND', 'That is not waiting in this unit.', 404);
  const look = await lookups(env, user.unitId);
  const out = [];
  for (const row of results || []) {
    let payload = {};
    try { payload = JSON.parse(row.payload); } catch { /* fails below, with a reason */ }
    out.push(await takeOne(env, { ...whoIs(user), storeId: row.store_id }, look, payload, { retrying: row }));
  }
  return summary(out);
}

export async function dismissInbox(env, user, id, body) {
  const row = await env.DB.prepare(`SELECT id, ext_ref, source FROM service_inbox WHERE id = ? AND unit_id = ? AND status = 'FAILED'`).bind(id, user.unitId).first();
  if (!row) refuse('NOT_FOUND', 'That is not waiting in this unit.', 404);
  const note = text(body?.note, 300);
  if (!note) refuse('REASON_REQUIRED', 'Say why it is being dismissed: a test, a cancelled booking, recorded by hand.');
  await env.DB.batch([
    env.DB.prepare(`UPDATE service_inbox SET status = 'DISMISSED', decided_by = ?, decision_note = ?, tried_at = ? WHERE id = ?`).bind(user.fullName, note, nowIso(), row.id),
    auditStmt(env, user, 'LINK_DISMISS', row.ext_ref, `${row.source}: ${note}`),
  ]);
  return { ok: true };
}

// Today's line for services that could not be recorded is in waiting.js.
