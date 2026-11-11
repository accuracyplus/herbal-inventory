/**
 * Where stock was used and who used it: the one place both are decided.
 *
 * Every ISSUE goes through here, so the unit's setting (room, person, or both required) cannot be
 * missed by a second route added later. The department comes from the room, and is copied onto
 * the movement so that moving a room later does not rewrite past figures.
 */

import { refuse } from '../lib/errors.js';
import { areaFor, may } from './access.js';
import { setting } from './settings.js';

/** Somebody with a live seat in this unit. Another unit's person answers as if they did not exist. */
async function seatedPerson(env, user, personId) {
  const row = await env.DB.prepare(
    `SELECT s.id, s.full_name FROM staff_units su JOIN staff s ON s.id = su.staff_id
      WHERE su.unit_id = ? AND su.staff_id = ? AND su.active = 1 AND s.active = 1`,
  ).bind(user.unitId, personId).first();
  if (!row) refuse('NOT_FOUND', 'That person does not work in this unit.', 404);
  return { id: row.id, name: row.full_name };
}

async function personFor(env, user, personId, required) {
  if (personId && personId === user.staffId) return { id: user.staffId, name: user.fullName };
  const forOthers = may(user, 'use.for_others');
  if (personId) {
    if (!forOthers) refuse('NOT_YOURS', 'You can only record what you used yourself. Ask the store keeper to record it for somebody else.', 403);
    return seatedPerson(env, user, personId);
  }
  if (!required) return null;
  if (forOthers) refuse('PERSON_REQUIRED', 'Choose who used this stock.');
  return { id: user.staffId, name: user.fullName };
}

/**
 * @param areaId     the room or area, if one was chosen
 * @param personId   who it was used by, if one was chosen
 * @param requester  { id, name } when stock is given out against a request: the person who asked
 *                   is who it was for, and a decision already approved is not refused because the
 *                   room has since closed.
 * @returns { area, person, departmentId }
 */
export async function consumptionFor(env, user, { areaId, personId, requester = null }) {
  const mode = await setting(env, user.unitId, 'consumption.record');
  const area = await areaFor(env, user, areaId);
  if (mode !== 'person' && !area) refuse('ROOM_REQUIRED', 'Choose the room or area this stock was used in.');
  if (area && !area.active && !requester) refuse('AREA_CLOSED', `${area.name} is closed. Choose another room or area.`);
  const person = requester || await personFor(env, user, personId, mode !== 'room');
  return { area, person, departmentId: area?.department_id ?? null };
}
