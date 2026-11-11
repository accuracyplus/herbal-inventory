/**
 * Services and their recipes: what one Abhyanga, one Kizhi or one lab test normally uses, and
 * recording a service so that its items leave the shelf together.
 *
 * The recipe is where the form starts, not a rule: the person can use less of one thing, leave
 * one out, or add another before saving. What the recipe said and what was used are both kept on
 * the record, which is what "actual against standard" is made of.
 *
 * Use recorded this way is ordinary use: ISSUE movements through the stock engine, with the
 * room, the person and the department decided where every other use decides them
 * (consumption.js). Linen is not part of a recipe: it is not used up, and has its own screen.
 */

import { refuse } from '../lib/errors.js';
import { m2, nextRef, nonNegative, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { may, storeFor } from './access.js';
import { consumptionFor } from './consumption.js';
import { buildPosting, commit, loadItems } from './stock.js';

const MAX_ITEMS = 60;
const MAX_TIMES = 50;
const CODE = /^[A-Za-z0-9._-]{1,20}$/;

/** [{ itemId, qty }] from a request body, one line per item. */
function parseItems(raw, { allowZero }) {
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_ITEMS) refuse('TOO_MANY', `At most ${MAX_ITEMS} items.`);
  const seen = new Set();
  return raw.map((l, i) => {
    const itemId = String(l?.itemId || '');
    if (!itemId) refuse('BAD_LINE', `Line ${i + 1}: choose an item.`);
    if (seen.has(itemId)) refuse('DUPLICATE_LINE', `Line ${i + 1}: that item is already listed — change its quantity instead.`);
    seen.add(itemId);
    const qty = allowZero ? nonNegative(l?.qty) : positive(l?.qty);
    if (qty === null) refuse('BAD_QTY', `Line ${i + 1}: enter a quantity${allowZero ? ', zero or more' : ' above zero'}.`);
    return { itemId, qty };
  });
}

export async function listServices(env, user, { all = false } = {}) {
  const showCost = may(user, 'cost.view');
  const [{ results: services }, { results: lines }] = await Promise.all([
    env.DB.prepare(`SELECT id, code, name, active, updated_at, updated_by FROM services WHERE unit_id = ? ${all ? '' : 'AND active = 1'} ORDER BY name`).bind(user.unitId).all(),
    env.DB.prepare(
      `SELECT si.service_id, si.item_id, si.qty, i.code, i.name, i.uom, i.avg_cost, i.active
         FROM service_items si JOIN services s ON s.id = si.service_id JOIN items i ON i.id = si.item_id
        WHERE s.unit_id = ? ORDER BY i.name`,
    ).bind(user.unitId).all(),
  ]);
  return (services || []).map((s) => {
    const items = (lines || []).filter((l) => l.service_id === s.id);
    return {
      ...s,
      items: items.map((l) => ({ itemId: l.item_id, code: l.code, name: l.name, uom: l.uom, qty: l.qty, retired: !l.active })),
      stdCost: showCost ? m2(items.reduce((t, l) => t + l.qty * (l.avg_cost || 0), 0)) : undefined,
    };
  });
}

export async function saveService(env, user, body, id = null) {
  const code = text(body.code, 20)?.toUpperCase();
  if (!code || !CODE.test(code)) refuse('BAD_CODE', 'It needs a short code: letters, numbers, dot, dash or underscore.');
  const name = text(body.name, 80);
  if (!name) refuse('NAME_REQUIRED', 'It needs a name.');
  const lines = parseItems(body.items, { allowZero: false });
  if (!lines?.length) refuse('NO_LINES', 'Add at least one item it normally uses.');
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  for (const it of items.values()) {
    if (it.is_linen) refuse('LINEN', `${it.name} is linen: it is sent to a room and comes back, on the Linen screen, and is not part of a recipe.`);
    if (!it.active) refuse('ITEM_INACTIVE', `${it.name} has been retired, so it cannot be in a recipe.`);
  }
  const clash = await env.DB.prepare(`SELECT id FROM services WHERE unit_id = ? AND code = ? AND id <> ?`).bind(user.unitId, code, id || '').first();
  if (clash) refuse('CODE_TAKEN', `The code ${code} is already used.`, 409);
  const now = nowIso();
  const sid = id || uuid();
  if (id) {
    const s = await env.DB.prepare(`SELECT id FROM services WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!s) refuse('NOT_FOUND', 'That does not exist in this unit.', 404);
  }
  const about = `${name}: ${lines.map((l) => `${q3(l.qty)} ${items.get(l.itemId).uom} ${items.get(l.itemId).name}`).join(', ')}`;
  await commit(env, [
    id
      ? env.DB.prepare(`UPDATE services SET code = ?, name = ?, active = ?, updated_at = ?, updated_by = ? WHERE id = ?`).bind(code, name, body.active === false ? 0 : 1, now, user.fullName, sid)
      : env.DB.prepare(`INSERT INTO services (id, unit_id, code, name, active, updated_at, updated_by) VALUES (?,?,?,?,1,?,?)`).bind(sid, user.unitId, code, name, now, user.fullName),
    env.DB.prepare(`DELETE FROM service_items WHERE service_id = ?`).bind(sid),
    ...lines.map((l) => env.DB.prepare(`INSERT INTO service_items (service_id, item_id, qty) VALUES (?,?,?)`).bind(sid, l.itemId, l.qty)),
    auditStmt(env, user, id ? 'SERVICE_EDIT' : 'SERVICE_CREATE', code, about),
  ]);
  return { ok: true, id: sid };
}

/**
 * A service was done, `times` times. With no `lines`, exactly the recipe is used. With `lines`,
 * those quantities are used instead: an item of the recipe that is not among them was not used,
 * and one that is not in the recipe was used as well. Everything leaves the store in one batch.
 */
export async function recordService(env, user, body) {
  const svc = await env.DB.prepare(`SELECT id, code, name, active FROM services WHERE id = ? AND unit_id = ?`).bind(String(body.serviceId || ''), user.unitId).first();
  if (!svc) refuse('NOT_FOUND', 'Choose what was done.', 404);
  if (!svc.active) refuse('SERVICE_INACTIVE', `${svc.name} is no longer offered. Ask a manager to reactivate it.`);
  const times = Number(body.times ?? 1);
  if (!Number.isInteger(times) || times < 1 || times > MAX_TIMES) refuse('BAD_TIMES', `Say how many were done: a whole number from 1 to ${MAX_TIMES}.`);
  const store = await storeFor(env, user, body.storeId);
  const { area, person, departmentId } = await consumptionFor(env, user, { areaId: body.areaId, personId: body.personId });

  const { results: recipe } = await env.DB.prepare(`SELECT item_id, qty FROM service_items WHERE service_id = ?`).bind(svc.id).all();
  const standard = new Map((recipe || []).map((r) => [r.item_id, q3(r.qty * times)]));
  const given = parseItems(body.lines, { allowZero: true });
  const used = new Map(given ? given.map((l) => [l.itemId, l.qty]) : standard);
  const ids = [...new Set([...standard.keys(), ...used.keys()])];
  const items = await loadItems(env, user.unitId, ids);
  const rows = ids.map((itemId) => ({ item: items.get(itemId), std: standard.get(itemId) || 0, qty: used.get(itemId) || 0 }));
  for (const r of rows.filter((x) => x.qty > 0)) {
    if (r.item.is_linen) refuse('USE_LINEN_SCREEN', `${r.item.name} is linen. Use the Linen screen to send it to a room.`);
    if (!r.item.active) refuse('ITEM_INACTIVE', `${r.item.name} has been retired. Ask a manager to reactivate it, or take it out of the recipe.`);
  }
  if (!rows.some((r) => r.qty > 0)) refuse('NOTHING_USED', 'Nothing is marked as used. Enter what was used.');

  const id = uuid();
  const ref = await nextRef(env, user.unitId, user.unit.code, 'SVC');
  const note = text(body.note, 300);
  const { statements } = await buildPosting(env, {
    kind: 'ISSUE', unitId: user.unitId, actor: actorOf(user), doc: { type: 'SERVICE', id, ref },
  }, rows.filter((r) => r.qty > 0).map((r) => ({
    item: r.item, store, qty: -r.qty, areaId: area?.id, reason: svc.name, note,
    personId: person?.id, personName: person?.name, departmentId,
  })));
  const cost = (r) => r.item.avg_cost || 0;
  const stdValue = m2(rows.reduce((t, r) => t + r.std * cost(r), 0));
  const actualValue = m2(rows.reduce((t, r) => t + r.qty * cost(r), 0));
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO service_records (id, unit_id, ref, service_id, service_name, times, store_id, area_id, department_id, person_id, person_name,
                                    note, std_value, actual_value, by_id, by_name, at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(id, user.unitId, ref, svc.id, svc.name, times, store.id, area?.id ?? null, departmentId, person?.id ?? null, person?.name ?? null,
           note, stdValue, actualValue, user.staffId, user.fullName, nowIso()),
    ...rows.map((r) => env.DB.prepare(`INSERT INTO service_record_lines (id, record_id, item_id, std_qty, qty, unit_cost) VALUES (?,?,?,?,?,?)`)
      .bind(uuid(), id, r.item.id, r.std, r.qty, cost(r))),
    ...statements,
    auditStmt(env, user, 'SERVICE_RECORD', ref, `${times} × ${svc.name} from ${store.name}${area ? ` in ${area.name}` : ''}${person ? ` by ${person.name}` : ''}`),
  ]);
  return { ok: true, id, ref, times, name: svc.name, differs: rows.some((r) => q3(r.qty) !== q3(r.std)), value: may(user, 'cost.view') ? actualValue : undefined };
}

/** What was recorded lately: a person's own, or the unit's for those who see reports. */
export async function recentServices(env, user) {
  const all = may(user, 'reports') || may(user, 'services.edit');
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.ref, r.service_name, r.times, r.at, r.person_name, r.by_name, a.name AS area_name,
            (SELECT COUNT(*) FROM service_record_lines l WHERE l.record_id = r.id AND l.qty <> l.std_qty) AS differences
       FROM service_records r LEFT JOIN areas a ON a.id = r.area_id
      WHERE r.unit_id = ? ${all ? '' : 'AND (r.person_id = ? OR r.by_id = ?)'} ORDER BY r.at DESC LIMIT 30`,
  ).bind(user.unitId, ...(all ? [] : [user.staffId, user.staffId])).all();
  return results || [];
}
