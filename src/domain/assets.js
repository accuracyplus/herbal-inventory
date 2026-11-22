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
import { areaFor, may, requireMay } from './access.js';
import { filesFor } from '../lib/files.js';
import { CONDITIONS, isIt, IT_KINDS, IT_STATES, itHistory, refuseKeys, seesPrice, simDigits } from './itassets.js';
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

const KIND_FILTERS = { equipment: ['EQUIPMENT'], it: ['DEVICE', 'SIM', 'LICENCE'], DEVICE: ['DEVICE'], SIM: ['SIM'], LICENCE: ['LICENCE'] };

export async function listAssets(env, user, { q, show, kind } = {}) {
  await requireFeature(env, user.unitId, 'assets.on');
  const today = gstDate();
  const warn = Number(await setting(env, user.unitId, 'assets.warn_days')) || 14;
  const { results } = await env.DB.prepare(
    `SELECT a.*, ar.name AS area_name, d.name AS department_name, s.name AS supplier_name,
            CASE WHEN a.kind = 'LICENCE' THEN (SELECT COUNT(*) FROM licence_seats ls WHERE ls.asset_id = a.id AND ls.until_at IS NULL) END AS seats_used
       FROM assets a LEFT JOIN areas ar ON ar.id = a.area_id LEFT JOIN departments d ON d.id = a.department_id
       LEFT JOIN suppliers s ON s.id = a.supplier_id
      WHERE a.unit_id = ? ORDER BY CASE WHEN a.next_service_on IS NULL THEN 1 ELSE 0 END, a.next_service_on, a.name`,
  ).bind(user.unitId).all();
  const t = String(q || '').trim().toLowerCase();
  // Devices, SIMs and licences are for the roles that run or oversee IT (D-086), not everybody
  // who sees stock: who holds which laptop is not for the whole unit.
  const it = may(user, 'it.view');
  const kinds = KIND_FILTERS[kind] || null;
  return (results || []).filter((a) => (!isIt(a.kind) || it) && (!kinds || kinds.includes(a.kind || 'EQUIPMENT'))).map((a) => ({
    ...a,
    kind: a.kind || 'EQUIPMENT',
    cost: seesPrice(user, a.kind) ? a.cost : undefined,
    kind_label: IT_KINDS[a.kind] || null,
    state_label: IT_STATES[a.state] || null,
    condition_label: CONDITIONS[a.condition] || null,
    standing: a.status === 'RETIRED' ? 'NONE' : serviceStanding(a.next_service_on, today, warn),
    warranty: a.warranty_until ? (a.warranty_until < today ? 'ENDED' : serviceStanding(a.warranty_until, today, warn) === 'DUE' ? 'ENDING' : 'OK') : null,
    renewal: a.renews_on ? (a.renews_on < today ? 'ENDED' : serviceStanding(a.renews_on, today, warn) === 'DUE' ? 'ENDING' : 'OK') : null,
  })).filter((a) => {
    if (show === 'any') return true;
    if (show === 'retired') return a.status === 'RETIRED';
    if (a.status === 'RETIRED') return false;
    if (show === 'due' && !['PAST', 'DUE'].includes(a.standing)) return false;
    if (IT_STATES[show] && a.state !== show) return false;
    return !t || `${a.tag} ${a.name} ${a.serial_no || ''} ${a.make || ''} ${a.model || ''} ${a.area_name || ''} ${a.category || ''} ${a.holder_name || ''} ${a.holder_code || ''} ${a.sim_last4 || ''} ${a.network || ''}`.toLowerCase().includes(t);
  });
}

export async function getAsset(env, user, id) {
  await requireFeature(env, user.unitId, 'assets.on');
  const a = (await listAssets(env, user, { show: 'any' })).find((x) => x.id === id);
  if (!a) refuse('NOT_FOUND', 'That equipment is not in this unit.', 404);
  const { results } = await env.DB.prepare(`SELECT * FROM asset_services WHERE asset_id = ? ORDER BY on_date DESC, recorded_at DESC`).bind(a.id).all();
  const money = seesPrice(user, a.kind);
  const out = { ...a, services: (results || []).map((s) => ({ ...s, cost: money ? s.cost : undefined, kind_label: SERVICE_KINDS[s.kind] })) };
  if (!isIt(a.kind)) return out;
  // An invoice shows the price, so it is for the people who see IT prices.
  const files = money ? await filesFor(env, 'ASSET', a.id) : [];
  return { ...out, ...(await itHistory(env, a)), files };
}

export async function saveAsset(env, user, body, id = null) {
  await requireFeature(env, user.unitId, 'assets.on');
  const was = id ? await env.DB.prepare(`SELECT * FROM assets WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first() : null;
  if (id && (!was || (isIt(was.kind) && !may(user, 'it.view')))) refuse('NOT_FOUND', 'That equipment is not in this unit.', 404);
  // What it is is set when it is added: a laptop does not become a licence.
  const kind = was ? (was.kind || 'EQUIPMENT') : (IT_KINDS[body.kind] ? body.kind : 'EQUIPMENT');
  requireMay(user, isIt(kind) ? 'it.edit' : 'assets.edit');
  const tag = text(body.tag, 40);
  if (!tag) refuse('TAG_REQUIRED', 'Give it an asset number: the one on its sticker, or a new one such as EQ-014.');
  const name = text(body.name, 120);
  if (!name) refuse('NAME_REQUIRED', kind === 'LICENCE' ? 'Say which product it is: Microsoft 365 Business Standard.' : 'Say what it is.');
  refuseKeys(name, body.serialNo, body.model, body.notes);
  const area = body.areaId ? await areaFor(env, user, body.areaId) : null;
  if (body.supplierId) {
    const s = await env.DB.prepare(`SELECT 1 FROM suppliers WHERE id = ? AND unit_id = ?`).bind(body.supplierId, user.unitId).first();
    if (!s) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
  }
  const every = body.serviceEveryMonths === '' || body.serviceEveryMonths === null || body.serviceEveryMonths === undefined ? null : Number(body.serviceEveryMonths);
  if (every !== null && !(Number.isInteger(every) && every >= 1 && every <= 120)) refuse('BAD_INTERVAL', 'Service every: a whole number of months, 1 to 120, or leave it empty.');
  // Somebody who may not see costs never sees this one, so their edit leaves it as it was.
  const keepCost = id && !seesPrice(user, kind);
  const cost = keepCost || body.cost === '' || body.cost === null || body.cost === undefined ? null : nonNegative(body.cost);
  // An IT asset's status follows its hand-overs (itassets.js); only equipment sets it here.
  const status = isIt(kind) ? (was?.status || 'ACTIVE') : (['ACTIVE', 'IN_REPAIR', 'RETIRED'].includes(body.status) ? body.status : 'ACTIVE');
  const f = {
    tag: tag.toUpperCase(), name, category: text(body.category, 60), make: text(body.make, 60), model: text(body.model, 60),
    serial_no: text(body.serialNo, 80), area_id: area?.id ?? null, department_id: area?.department_id ?? null, location: text(body.location, 120),
    supplier_id: body.supplierId || null, purchased_on: dateOrNull(body.purchasedOn, 'The purchase date'), cost: cost === null ? null : m2(cost),
    warranty_until: dateOrNull(body.warrantyUntil, 'The warranty date'), service_every_months: every,
    last_service_on: dateOrNull(body.lastServiceOn, 'The last service date'), status, notes: text(body.notes, 500),
  };
  if (kind === 'SIM') {
    f.sim_last4 = simDigits(body.simLast4);
    f.network = text(body.network, 40);
  }
  if (kind === 'LICENCE') {
    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 10000) refuse('SEATS_REQUIRED', 'How many seats (users) the licence covers: a whole number.');
    if (was) {
      const used = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM licence_seats WHERE asset_id = ? AND until_at IS NULL`).bind(id).first())?.n || 0;
      if (seats < used) refuse('SEATS_IN_USE', `${used} people hold a seat now. End some seats before lowering it to ${seats}.`);
    }
    f.seats = seats;
    f.renews_on = dateOrNull(body.renewsOn, 'The renewal date');
  }
  // The next service: as given, or the last service (or purchase) plus the interval.
  const given = dateOrNull(body.nextServiceOn, 'The next service date');
  const from = f.last_service_on || f.purchased_on;
  f.next_service_on = given || (every && from ? addMonths(from, every) : null);
  const clash = await env.DB.prepare(`SELECT id FROM assets WHERE unit_id = ? AND tag = ? AND id <> ?`).bind(user.unitId, f.tag, id || '').first();
  if (clash) refuse('TAG_TAKEN', `${f.tag} is already another piece of equipment's number.`, 409);
  const now = nowIso();
  if (keepCost) delete f.cost;
  if (id) {
    const cols = Object.keys(f);
    await commit(env, [
      env.DB.prepare(`UPDATE assets SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = ?, updated_by = ? WHERE id = ?`)
        .bind(...cols.map((c) => f[c]), now, user.fullName, id),
      auditStmt(env, user, 'ASSET_EDIT', f.tag, `${f.name}${status !== 'ACTIVE' ? `, ${ASSET_STATUS[status]}` : ''}`),
    ]);
    return { ok: true, id };
  }
  // A new IT asset starts in stock, in the condition it came in.
  if (isIt(kind)) Object.assign(f, { kind, state: 'IN_STOCK', state_since: now, condition: CONDITIONS[body.condition] ? body.condition : (kind === 'LICENCE' ? null : 'NEW') });
  const cols = Object.keys(f);
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO assets (id, unit_id, ${cols.join(', ')}, created_at, updated_at, updated_by) VALUES (?, ?, ${cols.map(() => '?').join(', ')}, ?, ?, ?)`)
      .bind(newId, user.unitId, ...cols.map((c) => f[c]), now, now, user.fullName),
    auditStmt(env, user, isIt(kind) ? `IT_${kind}_CREATE` : 'ASSET_CREATE', f.tag, f.name),
  ]);
  return { ok: true, id: newId };
}

export async function recordService(env, user, id, body) {
  await requireFeature(env, user.unitId, 'assets.on');
  const a = await env.DB.prepare(`SELECT * FROM assets WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!a || (isIt(a.kind) && !may(user, 'it.view'))) refuse('NOT_FOUND', 'That equipment is not in this unit.', 404);
  requireMay(user, isIt(a.kind) ? 'it.edit' : 'assets.edit');
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
