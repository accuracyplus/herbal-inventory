/**
 * HiFive ID's side of who holds what here: "Can access" at first sign-in, and the console's
 * role dropdown. The same rule as HiFive Transport (hifive-id-admin CLAUDE.md, rule 3).
 *
 * GRANT AT FIRST SIGN-IN
 *   Somebody HiFive ID has let into Inventory, and who has no seat here, is given one at the
 *   role HFID_GRANT_ROLE names, in the unit whose name matches their HiFive ID entity. With no
 *   matching unit (and more than one unit active) nothing is guessed: they are told to ask.
 *
 * CONSOLE
 *   The console has one dropdown and a person here can hold several roles in several units.
 *   A person with exactly one seat holding one role is a straight replacement. Anything more is
 *   read-only from the console and changed on Inventory's People screen — replacing a list
 *   with one choice silently drops roles nobody chose to drop.
 */

import { ROLES } from '../lib/auth.js';
import { jsonList, nowIso, uuid } from '../lib/data.js';
import { ROLE_LABELS } from './access.js';

/** Roles that can be given without opening Inventory: never UNIT_ADMIN. */
export const PICK_ROLES = ['STAFF', 'STOREKEEPER', 'PURCHASER', 'MANAGER', 'VIEWER'];

export const roleOptions = () => PICK_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }));

export function grantRole(env) {
  return PICK_ROLES.includes(env.HFID_GRANT_ROLE) ? env.HFID_GRANT_ROLE : null;
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

/** The unit HiFive ID's entity name points at, or the only one while there is only one. */
export async function unitFor(env, names) {
  const { results } = await env.DB.prepare(`SELECT id, code, name FROM units WHERE active = 1`).all();
  const active = results || [];
  for (const n of names) {
    const hit = norm(n) && active.find((u) => norm(u.name) === norm(n) || norm(u.code) === norm(n));
    if (hit) return hit;
  }
  return active.length === 1 ? active[0] : null;
}

export async function findHeld(env, code) {
  return env.DB.prepare(`SELECT id, code, full_name, active FROM staff WHERE UPPER(TRIM(code)) = ?`)
    .bind(String(code).trim().toUpperCase()).first();
}

export async function seatsFor(env, staffId) {
  const { results } = await env.DB.prepare(
    `SELECT su.unit_id, su.roles, su.active, u.name AS unit FROM staff_units su JOIN units u ON u.id = su.unit_id WHERE su.staff_id = ?`,
  ).bind(staffId).all();
  return (results || []).map((r) => ({ ...r, roles: jsonList(r.roles) }));
}

export async function enrolFromGrant(env, claims) {
  const role = grantRole(env);
  if (!role || claims.svc || !claims.emp_code) return false;
  if (await findHeld(env, claims.emp_code)) return false;
  const unit = await unitFor(env, [claims.scope_entity, claims.entity]);
  if (!unit) return false;
  const id = uuid();
  const now = nowIso();
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO staff (id, code, full_name, active, updated_at, updated_by) VALUES (?,?,?,1,?,?)`)
        .bind(id, String(claims.emp_code).trim().toUpperCase(), claims.name || claims.emp_code, now, 'HiFive ID grant'),
      env.DB.prepare(`INSERT INTO staff_units (staff_id, unit_id, roles, active, updated_at, updated_by) VALUES (?,?,?,1,?,?)`)
        .bind(id, unit.id, JSON.stringify([role]), now, 'HiFive ID grant'),
      env.DB.prepare(`INSERT INTO audit_log (id, at, actor_name, unit_id, action, subject, detail) VALUES (?,?,?,?,?,?,?)`)
        .bind(uuid(), now, 'HiFive ID grant', unit.id, 'SEAT_GRANT', claims.emp_code,
              `${role}; HiFive ID entity ${claims.entity || 'none'}, placed in ${unit.name}`),
    ]);
    return true;
  } catch {
    return false;   // lost a race with an administrator adding them: read again
  }
}

export { ROLES };
