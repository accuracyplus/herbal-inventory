/**
 * The equipment register (feature 14, `assets.on`).
 *
 * Equipment is not stock: an analyser or a massage table is not used up, so it never goes
 * through the ledger. Each piece has its tag (the unit's own number, on the sticker), serial
 * number, where it is (one of the unit's rooms or benches, so its department follows), its
 * warranty, and how often it is serviced. Recording a service moves the next date on; Today
 * flags what is past its service date or due within the warning days, and warranties ending.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, isoDate, m2, nonNegative, nowIso, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { areaFor } from './access.js';
import { requireFeature, setting } from './settings.js';
import { commit } from './stock.js';

export const SERVICE_KINDS = { SERVICE: 'Service', REPAIR: 'Repair', CALIBRATION: 'Calibration', INSPECTION: 'Inspection' };
export const ASSET_STATUS = { ACTIVE: 'In use', IN_REPAIR: 'Out for repair', RETIRED: 'Retired' };

/** A date some months on, clamped to the month's last day (31 Jan + 1 month = 28 Feb). Pure. */
export function addMonths(iso, months) {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, last))).toISOString().slice(0, 10);
}

/** PAST, DUE (within the warning days), OK, or NONE when it has no service date. Pure. */
export function serviceStanding(next, today, warnDays) {
  if (!next) return 'NONE';
  if (next < today) return 'PAST';
  const soon = new Date(Date.parse(`${today}T00:00:00Z`) + warnDays * 864e5).toISOString().slice(0, 10);
  return next <= soon ? 'DUE' : 'OK';
}

const dateOrNull = (v, what) => {
  if (v === undefined || v === null || v === '') return null;
  const d = isoDate(v);
  if (!d) refuse('BAD_DATE', `${what} is not a real date.`);
  return d;
};

export async function listAssets(env, user, { q, show } = {}) {
  await requireFeature(env, user.unitId, 'assets.on');
  const today = gstDate();
  const warn = Number(await setting(env, user.unitId, 'assets.warn_days')) || 14;
  const { results } = await env.DB.prepare(
    `SELECT a.*, ar.name AS area_name, d.name AS department_name, s.name AS supplier_name
       FROM assets a LEFT JOIN areas ar ON ar.id = a.area_id LEFT JOIN departments d ON d.id = a.department_id
       LEFT JOIN suppliers s ON s.id = a.supplier_id
      WHERE a.unit_id = ? ORDER BY CASE WHEN a.next_service_on IS NULL THEN 1 ELSE 0 END, a.next_service_on, a.name`,
  ).bind(user.unitId).all();
  const t = String(q || '').trim().toLowerCase();
  return (results || []).map((a) => ({
    ...a,
    standing: a.status === 'RETIRED' ? 'NONE' : serviceStanding(a.next_service_on, today, warn),
    warranty: a.warranty_until ? (a.warranty_until < today ? 'ENDED' : serviceStanding(a.warranty_until, today, warn) === 'DUE' ? 'ENDING' : 'OK') : null,
  })).filter((a) => {
    if (show === 'any') return true;
    if (show === 'retired') return a.status === 'RETIRED';
    if (a.status === 'RETIRED') return false;
    if (show === 'due' && !['PAST', 'DUE'].includes(a.standing)) return false;
    return !t || `${a.tag} ${a.name} ${a.serial_no || ''} ${a.make || ''} ${a.model || ''} ${a.area_name || ''}`.toLowerCase().includes(t);
  });
}

export async function getAsset(env, user, id) {
  await requireFeature(env, user.unitId, 'assets.on');
  const a = (await listAssets(env, user, { show: 'any' })).find((x) => x.id === id);
  if (!a) refuse('NOT_FOUND', 'That equipment is not in this unit.', 404);
  const { results } = await env.DB.prepare(`SELECT * FROM asset_services WHERE asset_id = ? ORDER BY on_date DESC, recorded_at DESC`).bind(a.id).all();
  return { ...a, services: (results || []).map((s) => ({ ...s, kind_label: SERVICE_KINDS[s.kind] })) };
}

export async function saveAsset(env, user, body, id = null) {
  await requireFeature(env, user.unitId, 'assets.on');
  const tag = text(body.tag, 40);
  if (!tag) refuse('TAG_REQUIRED', 'Give it an asset number: the one on its sticker, or a new one such as EQ-014.');
  const name = text(body.name, 120);
  if (!name) refuse('NAME_REQUIRED', 'Say what it is.');
  const area = body.areaId ? await areaFor(env, user, body.areaId) : null;
  if (body.supplierId) {
    const s = await env.DB.prepare(`SELECT 1 FROM suppliers WHERE id = ? AND unit_id = ?`).bind(body.supplierId, user.unitId).first();
    if (!s) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
  }
  const every = body.serviceEveryMonths === '' || body.serviceEveryMonths === null || body.serviceEveryMonths === undefined ? null : Number(body.serviceEveryMonths);
  if (every !== null && !(Number.isInteger(every) && every >= 1 && every <= 120)) refuse('BAD_INTERVAL', 'Service every: a whole number of months, 1 to 120, or leave it empty.');
  const cost = body.cost === '' || body.cost === null || body.cost === undefined ? null : nonNegative(body.cost);
  const status = ['ACTIVE', 'IN_REPAIR', 'RETIRED'].includes(body.status) ? body.status : 'ACTIVE';
  const f = {
    tag: tag.toUpperCase(), name, category: text(body.category, 60), make: text(body.make, 60), model: text(body.model, 60),
    serial_no: text(body.serialNo, 80), area_id: area?.id ?? null, department_id: area?.department_id ?? null, location: text(body.location, 120),
    supplier_id: body.supplierId || null, purchased_on: dateOrNull(body.purchasedOn, 'The purchase date'), cost: cost === null ? null : m2(cost),
    warranty_until: dateOrNull(body.warrantyUntil, 'The warranty date'), service_every_months: every,
    last_service_on: dateOrNull(body.lastServiceOn, 'The last service date'), status, notes: text(body.notes, 500),
  };
  // The next service: as given, or the last service (or purchase) plus the interval.
  const given = dateOrNull(body.nextServiceOn, 'The next service date');
  const from = f.last_service_on || f.purchased_on;
  f.next_service_on = given || (every && from ? addMonths(from, every) : null);
  const clash = await env.DB.prepare(`SELECT id FROM assets WHERE unit_id = ? AND tag = ? AND id <> ?`).bind(user.unitId, f.tag, id || '').first();
  if (clash) refuse('TAG_TAKEN', `${f.tag} is already another piece of equipment's number.`, 409);
  const now = nowIso();
  const cols = Object.keys(f);
  if (id) {
    const a = await env.DB.prepare(`SELECT id FROM assets WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!a) refuse('NOT_FOUND', 'That equipment is not in this unit.', 404);
    await commit(env, [
      env.DB.prepare(`UPDATE assets SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = ?, updated_by = ? WHERE id = ?`)
        .bind(...cols.map((c) => f[c]), now, user.fullName, id),
      auditStmt(env, user, 'ASSET_EDIT', f.tag, `${f.name}${status !== 'ACTIVE' ? `, ${ASSET_STATUS[status]}` : ''}`),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO assets (id, unit_id, ${cols.join(', ')}, created_at, updated_at, updated_by) VALUES (?, ?, ${cols.map(() => '?').join(', ')}, ?, ?, ?)`)
      .bind(newId, user.unitId, ...cols.map((c) => f[c]), now, now, user.fullName),
    auditStmt(env, user, 'ASSET_CREATE', f.tag, f.name),
  ]);
  return { ok: true, id: newId };
}

export async function recordService(env, user, id, body) {
  await requireFeature(env, user.unitId, 'assets.on');
  const a = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!a) refuse('NOT_FOUND', 'That equipment is not in this unit.', 404);
  if (a.status === 'RETIRED') refuse('RETIRED', `${a.tag} is retired. Bring it back into use first.`);
  const kind = SERVICE_KINDS[body.kind] ? body.kind : null;
  if (!kind) refuse('KIND_REQUIRED', 'Service, repair, calibration or inspection?');
  const on = dateOrNull(body.onDate, 'The date');
  if (!on) refuse('DATE_REQUIRED', 'When was it done?');
  if (on > gstDate()) refuse('FUTURE', 'That date has not happened yet.');
  const cost = body.cost === '' || body.cost === null || body.cost === undefined ? null : nonNegative(body.cost);
  // A repair does not move the service date; a service, calibration or inspection does.
  const moves = kind !== 'REPAIR';
  const next = dateOrNull(body.nextDue, 'The next date') || (moves && a.service_every_months ? addMonths(on, a.service_every_months) : null);
  const latest = !a.last_service_on || on >= a.last_service_on;
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO asset_services (id, unit_id, asset_id, on_date, kind, done_by, cost, note, next_due, recorded_by_name, recorded_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(uuid(), user.unitId, a.id, on, kind, text(body.doneBy, 120), cost === null ? null : m2(cost), text(body.note, 500), next, user.fullName, nowIso()),
    ...(moves && latest ? [env.DB.prepare(
      `UPDATE assets SET last_service_on = ?, next_service_on = COALESCE(?, next_service_on), status = CASE WHEN status = 'IN_REPAIR' THEN 'ACTIVE' ELSE status END,
              updated_at = ?, updated_by = ? WHERE id = ?`,
    ).bind(on, next, nowIso(), user.fullName, a.id)] : []),
    ...(!moves && body.backInUse ? [env.DB.prepare(`UPDATE assets SET status = 'ACTIVE' WHERE id = ?`).bind(a.id)] : []),
    auditStmt(env, user, 'ASSET_SERVICE', a.tag, `${SERVICE_KINDS[kind]} on ${on}${next ? `, next ${next}` : ''}`),
  ]);
  return { ok: true, nextServiceOn: moves && latest ? (next || a.next_service_on) : a.next_service_on };
}
