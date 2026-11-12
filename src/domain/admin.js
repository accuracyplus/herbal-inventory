/**
 * Unit administration: stores, rooms and areas, suppliers, people and their roles, settings,
 * and — for group administrators — the units themselves.
 */

import { AuthError, refuse } from '../lib/errors.js';
import { jsonList, nowIso, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { ROLES } from '../lib/auth.js';
import { commit } from './stock.js';
import { checkNewSeat } from './people.js';
import { validSetting } from './settings.js';

const CODE = /^[A-Za-z0-9._-]{1,20}$/;

function codeOf(v, what) {
  const c = text(v, 20);
  if (!c || !CODE.test(c)) refuse('BAD_CODE', `The ${what} needs a short code: letters, numbers, dot, dash or underscore.`);
  return c.toUpperCase();
}

// ── Stores ───────────────────────────────────────────────────────────────────

export async function saveStore(env, user, body, id = null) {
  const code = codeOf(body.code, 'store');
  const name = text(body.name, 80);
  if (!name) refuse('NAME_REQUIRED', 'The store needs a name.');
  const kind = body.kind === 'MAIN' ? 'MAIN' : 'SUB';
  const clash = await env.DB.prepare(`SELECT id FROM stores WHERE unit_id = ? AND code = ? AND id <> ?`).bind(user.unitId, code, id || '').first();
  if (clash) refuse('CODE_TAKEN', `Another store already uses the code ${code}.`, 409);
  const now = nowIso();
  if (id) {
    const s = await env.DB.prepare(`SELECT * FROM stores WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!s) refuse('NOT_FOUND', 'That store does not exist in this unit.', 404);
    if (body.active === false && s.active) {
      const held = await env.DB.prepare(`SELECT 1 FROM balances WHERE store_id = ? AND (qty > 0 OR in_use > 0 OR in_wash > 0) LIMIT 1`).bind(id).first();
      if (held) refuse('HAS_STOCK', `${s.name} still holds stock. Transfer it out before closing the store.`);
      const out = await env.DB.prepare(`SELECT 1 FROM custody WHERE store_id = ? AND qty > 0 LIMIT 1`).bind(id).first();
      if (out) refuse('HAS_HELD_STOCK', `Stock taken from ${s.name} is still with people. It has to be used or returned before the store can close.`);
    }
    await commit(env, [
      env.DB.prepare(`UPDATE stores SET code = ?, name = ?, kind = ?, sort = ?, active = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
        .bind(code, name, kind, Number(body.sort) || 0, body.active === false ? 0 : 1, now, user.fullName, id),
      auditStmt(env, user, 'STORE_EDIT', code, name),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO stores (id, unit_id, code, name, kind, sort, active, updated_at, updated_by) VALUES (?,?,?,?,?,?,1,?,?)`)
      .bind(newId, user.unitId, code, name, kind, Number(body.sort) || 0, now, user.fullName),
    auditStmt(env, user, 'STORE_CREATE', code, name),
  ]);
  return { ok: true, id: newId };
}

// ── Departments ──────────────────────────────────────────────────────────────

export async function listDepartments(env, user, { all = false } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.code, d.name, d.active,
            (SELECT COUNT(*) FROM areas WHERE department_id = d.id AND active = 1) AS rooms
       FROM departments d WHERE d.unit_id = ? ${all ? '' : 'AND d.active = 1'} ORDER BY d.name`,
  ).bind(user.unitId).all();
  return results || [];
}

export async function saveDepartment(env, user, body, id = null) {
  const code = codeOf(body.code, 'department');
  const name = text(body.name, 80);
  if (!name) refuse('NAME_REQUIRED', 'The department needs a name.');
  const clash = await env.DB.prepare(`SELECT id FROM departments WHERE unit_id = ? AND code = ? AND id <> ?`).bind(user.unitId, code, id || '').first();
  if (clash) refuse('CODE_TAKEN', `Another department already uses the code ${code}.`, 409);
  const now = nowIso();
  if (id) {
    const d = await env.DB.prepare(`SELECT * FROM departments WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!d) refuse('NOT_FOUND', 'That department does not exist in this unit.', 404);
    if (body.active === false && d.active) {
      const open = await env.DB.prepare(`SELECT 1 FROM areas WHERE department_id = ? AND active = 1 LIMIT 1`).bind(id).first();
      if (open) refuse('HAS_ROOMS', `${d.name} still has open rooms or areas. Move or close them first.`);
    }
    await commit(env, [
      env.DB.prepare(`UPDATE departments SET code = ?, name = ?, active = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
        .bind(code, name, body.active === false ? 0 : 1, now, user.fullName, id),
      auditStmt(env, user, 'DEPARTMENT_EDIT', code, name),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO departments (id, unit_id, code, name, active, updated_at, updated_by) VALUES (?,?,?,?,1,?,?)`)
      .bind(newId, user.unitId, code, name, now, user.fullName),
    auditStmt(env, user, 'DEPARTMENT_CREATE', code, name),
  ]);
  return { ok: true, id: newId };
}

/**
 * The department a room belongs to. Optional only until the unit has set up departments: rooms
 * brought over by the import have none, and must not stop the unit working.
 */
async function departmentFor(env, user, departmentId) {
  if (departmentId) {
    const d = await env.DB.prepare(`SELECT id, name, active FROM departments WHERE id = ? AND unit_id = ?`).bind(departmentId, user.unitId).first();
    if (!d) refuse('NOT_FOUND', 'That department does not exist in this unit.', 404);
    if (!d.active) refuse('DEPARTMENT_CLOSED', `${d.name} is closed. Choose another department.`);
    return d.id;
  }
  const any = await env.DB.prepare(`SELECT 1 FROM departments WHERE unit_id = ? AND active = 1 LIMIT 1`).bind(user.unitId).first();
  if (any) refuse('DEPARTMENT_REQUIRED', 'Choose the department this room or area belongs to.');
  return null;
}

// ── Rooms and areas ──────────────────────────────────────────────────────────

export async function saveArea(env, user, body, id = null) {
  const code = codeOf(body.code, 'room or area');
  const name = text(body.name, 80);
  if (!name) refuse('NAME_REQUIRED', 'The room or area needs a name.');
  const kind = text(body.kind, 30) || 'ROOM';
  const clash = await env.DB.prepare(`SELECT id FROM areas WHERE unit_id = ? AND code = ? AND id <> ?`).bind(user.unitId, code, id || '').first();
  if (clash) refuse('CODE_TAKEN', `Another room or area already uses the code ${code}.`, 409);
  const departmentId = await departmentFor(env, user, body.departmentId);
  const now = nowIso();
  if (id) {
    const a = await env.DB.prepare(`SELECT id FROM areas WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!a) refuse('NOT_FOUND', 'That room or area does not exist in this unit.', 404);
    await commit(env, [
      env.DB.prepare(`UPDATE areas SET code = ?, name = ?, kind = ?, department_id = ?, active = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
        .bind(code, name, kind, departmentId, body.active === false ? 0 : 1, now, user.fullName, id),
      auditStmt(env, user, 'AREA_EDIT', code, name),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO areas (id, unit_id, code, name, kind, department_id, active, updated_at, updated_by) VALUES (?,?,?,?,?,?,1,?,?)`)
      .bind(newId, user.unitId, code, name, kind, departmentId, now, user.fullName),
    auditStmt(env, user, 'AREA_CREATE', code, name),
  ]);
  return { ok: true, id: newId };
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export async function listSuppliers(env, user, { all = false } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT s.*, (SELECT COUNT(*) FROM items WHERE supplier_id = s.id AND active = 1) AS item_count,
            (SELECT MAX(at) FROM receipts WHERE supplier_id = s.id AND status = 'APPROVED') AS last_delivery
       FROM suppliers s WHERE s.unit_id = ? ${all ? '' : 'AND s.active = 1'} ORDER BY s.name`,
  ).bind(user.unitId).all();
  return results || [];
}

export async function saveSupplier(env, user, body, id = null) {
  const name = text(body.name, 120);
  if (!name) refuse('NAME_REQUIRED', 'The supplier needs a name.');
  const email = text(body.email, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) refuse('BAD_EMAIL', 'That email address does not look right.');
  const clash = await env.DB.prepare(`SELECT id FROM suppliers WHERE unit_id = ? AND LOWER(name) = LOWER(?) AND id <> ?`).bind(user.unitId, name, id || '').first();
  if (clash) refuse('NAME_TAKEN', `There is already a supplier called ${name}.`, 409);
  const f = [name, text(body.contact, 80), text(body.phone, 30), email, text(body.trn, 20), text(body.terms, 80),
    Number.isInteger(Number(body.leadDays)) && body.leadDays !== '' && body.leadDays !== null ? Number(body.leadDays) : null, text(body.notes, 500)];
  const now = nowIso();
  if (id) {
    const s = await env.DB.prepare(`SELECT id FROM suppliers WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!s) refuse('NOT_FOUND', 'That supplier does not exist in this unit.', 404);
    await commit(env, [
      env.DB.prepare(`UPDATE suppliers SET name = ?, contact = ?, phone = ?, email = ?, trn = ?, terms = ?, lead_days = ?, notes = ?,
                        active = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
        .bind(...f, body.active === false ? 0 : 1, now, user.fullName, id),
      auditStmt(env, user, 'SUPPLIER_EDIT', name),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO suppliers (id, unit_id, name, contact, phone, email, trn, terms, lead_days, notes, active, updated_at, updated_by)
                    VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`).bind(newId, user.unitId, ...f, now, user.fullName),
    auditStmt(env, user, 'SUPPLIER_CREATE', name),
  ]);
  return { ok: true, id: newId };
}

// ── People ───────────────────────────────────────────────────────────────────

export async function listPeople(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.code, s.full_name, s.active AS staff_active, s.hfid_sub IS NOT NULL AS signed_in, s.group_summary,
            su.roles, su.stores, su.active, su.updated_at, su.updated_by,
            (SELECT MAX(at) FROM audit_log WHERE action = 'SIGN_IN_HFID' AND actor_id = s.id) AS last_sign_in
       FROM staff_units su JOIN staff s ON s.id = su.staff_id
      WHERE su.unit_id = ? ORDER BY su.active DESC, s.full_name`,
  ).bind(user.unitId).all();
  return (results || []).map((r) => ({ ...r, roles: jsonList(r.roles), stores: r.stores ? jsonList(r.stores) : null }));
}

/** Who stock can be recorded against: names only, for the picker on Record use. */
export async function listPeopleToPick(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.code, s.full_name AS name, su.roles
       FROM staff_units su JOIN staff s ON s.id = su.staff_id
      WHERE su.unit_id = ? AND su.active = 1 AND s.active = 1 ORDER BY s.full_name`,
  ).bind(user.unitId).all();
  return (results || [])
    .filter((p) => jsonList(p.roles).some((r) => r !== 'VIEWER'))
    .map(({ id, code, name }) => ({ id, code, name }));
}

/**
 * Give somebody a seat in this unit, or change it. The person is created by employee code if
 * this app has never held them — the code must be their HiFive ID employee code, because that
 * is how sign-in finds them.
 */
export async function savePerson(env, user, body, { bearer } = {}) {
  const code = text(body.code, 30)?.toUpperCase();
  if (!code || !/^[A-Z0-9._-]+$/.test(code)) refuse('BAD_CODE', 'Enter their HiFive ID employee code, for example HPAHC040.');
  const roles = [...new Set((body.roles || []).filter((r) => ROLES.includes(r)))];
  if (!roles.length) refuse('ROLE_REQUIRED', 'Choose at least one role.');
  if (roles.includes('VIEWER') && roles.length > 1) refuse('VIEWER_ALONE', 'Viewer is read-only, so it cannot be combined with another role.');
  let stores = null;
  if (Array.isArray(body.stores) && body.stores.length) {
    const { results } = await env.DB.prepare(
      `SELECT id FROM stores WHERE unit_id = ? AND id IN (${body.stores.map(() => '?').join(',')})`,
    ).bind(user.unitId, ...body.stores).all();
    if ((results || []).length !== body.stores.length) refuse('BAD_STORE', 'One of the stores is not in this unit.');
    stores = JSON.stringify(body.stores);
  }
  const now = nowIso();
  const stmts = [];
  let staff = await env.DB.prepare(`SELECT id, full_name FROM staff WHERE UPPER(TRIM(code)) = ?`).bind(code).first();
  const active = body.active === false ? 0 : 1;
  // A new seat is checked against HiFive ID: the code must be there, and not somebody who has left.
  const seatedHere = staff && await env.DB.prepare(`SELECT 1 FROM staff_units WHERE staff_id = ? AND unit_id = ? AND active = 1`).bind(staff.id, user.unitId).first();
  const hfid = active && !seatedHere ? await checkNewSeat(env, code, bearer) : { checked: false, skipped: true };
  if (!staff) {
    const name = hfid.name || text(body.name, 120);
    if (!name) refuse('NAME_REQUIRED', `${code} is new here: enter their full name as it is in HiFive ID.`);
    staff = { id: uuid(), full_name: name };
    stmts.push(env.DB.prepare(`INSERT INTO staff (id, code, full_name, active, updated_at, updated_by) VALUES (?,?,?,1,?,?)`)
      .bind(staff.id, code, name, now, user.fullName));
  }
  if (staff.id === user.staffId && !roles.includes('UNIT_ADMIN') && !user.groupAdmin) {
    refuse('SELF_DEMOTE', 'You cannot remove your own administrator role. Ask another administrator.');
  }
  if (!active || !roles.includes('UNIT_ADMIN')) await refuseLastAdmin(env, user, staff.id);
  stmts.push(env.DB.prepare(
    `INSERT INTO staff_units (staff_id, unit_id, roles, stores, active, updated_at, updated_by) VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(staff_id, unit_id) DO UPDATE SET roles = excluded.roles, stores = excluded.stores, active = excluded.active,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).bind(staff.id, user.unitId, JSON.stringify(roles), stores, active, now, user.fullName));
  if (body.groupSummary !== undefined) {
    requireGroupAdmin(user);
    stmts.push(env.DB.prepare(`UPDATE staff SET group_summary = ?, updated_at = ?, updated_by = ? WHERE id = ?`)
      .bind(body.groupSummary ? 1 : 0, now, user.fullName, staff.id));
    stmts.push(auditStmt(env, user, 'GROUP_SUMMARY', code, `${staff.full_name}: ${body.groupSummary ? 'can see' : 'cannot see'} the group monthly summary`));
  }
  stmts.push(auditStmt(env, user, active ? 'SEAT_SET' : 'SEAT_REMOVE', code,
    `${staff.full_name}: ${roles.join(', ')}${!hfid.checked && !hfid.skipped ? ' (HiFive ID could not be checked)' : ''}`));
  await commit(env, stmts);
  return { ok: true, staffId: staff.id };
}

/** Never leave a unit with nobody who can manage its people. */
async function refuseLastAdmin(env, user, staffId) {
  const held = await env.DB.prepare(`SELECT roles FROM staff_units WHERE staff_id = ? AND unit_id = ? AND active = 1`).bind(staffId, user.unitId).first();
  if (!held || !jsonList(held.roles).includes('UNIT_ADMIN')) return;
  const other = await env.DB.prepare(
    `SELECT 1 FROM staff_units su JOIN staff s ON s.id = su.staff_id
      WHERE su.unit_id = ? AND su.staff_id <> ? AND su.active = 1 AND s.active = 1 AND su.roles LIKE '%UNIT_ADMIN%' LIMIT 1`,
  ).bind(user.unitId, staffId).first();
  if (!other) refuse('LAST_ADMIN', 'This is the only unit administrator. Make someone else an administrator first.');
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function saveSettings(env, user, values) {
  const stmts = [];
  for (const [key, value] of Object.entries(values || {})) {
    const v = validSetting(key, value);
    stmts.push(env.DB.prepare(
      `INSERT INTO settings (unit_id, key, value) VALUES (?,?,?) ON CONFLICT(unit_id, key) DO UPDATE SET value = excluded.value`,
    ).bind(user.unitId, key, v));
    stmts.push(auditStmt(env, user, 'SETTING', key, v));
  }
  if (!stmts.length) refuse('NOTHING', 'Nothing to save.');
  await commit(env, stmts);
  return { ok: true };
}

// ── Units (group administrators only) ───────────────────────────────────────

export function requireGroupAdmin(user) {
  if (!user.groupAdmin) throw new AuthError('Only a group administrator can manage units.', 403);
}

export async function listUnits(env) {
  const { results } = await env.DB.prepare(
    `SELECT u.*, (SELECT COUNT(*) FROM staff_units WHERE unit_id = u.id AND active = 1) AS people,
            (SELECT COUNT(*) FROM stores WHERE unit_id = u.id AND active = 1) AS stores,
            (SELECT COUNT(*) FROM items WHERE unit_id = u.id AND active = 1) AS items
       FROM units u ORDER BY u.active DESC, u.name`,
  ).all();
  return results || [];
}

/**
 * A new unit starts ready to use: one main store, so a delivery can be received on day one.
 */
export async function saveUnit(env, user, body, id = null) {
  requireGroupAdmin(user);
  const code = codeOf(body.code, 'unit');
  const name = text(body.name, 120);
  if (!name) refuse('NAME_REQUIRED', 'The unit needs a name: the same name HiFive ID uses for it.');
  const clash = await env.DB.prepare(`SELECT id FROM units WHERE code = ? AND id <> ?`).bind(code, id || '').first();
  if (clash) refuse('CODE_TAKEN', `Another unit already uses the code ${code}.`, 409);
  const now = nowIso();
  if (id) {
    await commit(env, [
      env.DB.prepare(`UPDATE units SET code = ?, name = ?, city = ?, active = ? WHERE id = ?`)
        .bind(code, name, text(body.city, 60), body.active === false ? 0 : 1, id),
      auditStmt(env, user, 'UNIT_EDIT', code, name, id),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(`INSERT INTO units (id, code, name, city, active, created_at, created_by) VALUES (?,?,?,?,1,?,?)`)
      .bind(newId, code, name, text(body.city, 60), now, user.fullName),
    env.DB.prepare(`INSERT INTO stores (id, unit_id, code, name, kind, sort, active, updated_at, updated_by) VALUES (?,?,'MAIN','Main store','MAIN',0,1,?,?)`)
      .bind(uuid(), newId, now, user.fullName),
    auditStmt(env, user, 'UNIT_CREATE', code, name, newId),
  ]);
  return { ok: true, id: newId };
}

// ── Audit log ────────────────────────────────────────────────────────────────

export async function auditLog(env, user, { q, limit = 200 }) {
  const args = [user.unitId];
  let filter = '';
  if (q) { filter = 'AND (action LIKE ? OR subject LIKE ? OR actor_name LIKE ? OR detail LIKE ?)'; const p = `%${q}%`; args.push(p, p, p, p); }
  const { results } = await env.DB.prepare(
    `SELECT at, actor_name, action, subject, detail FROM audit_log WHERE unit_id = ? ${filter} ORDER BY at DESC LIMIT ?`,
  ).bind(...args, Math.min(Number(limit) || 200, 1000)).all();
  return results || [];
}
