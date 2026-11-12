/**
 * Approval limits by amount (feature 14, `limits.on`).
 *
 * A manager approves up to the unit's amount; above it, a unit administrator or a director
 * (somebody ticked Director on People, or a group administrator) does. Off, any manager approves
 * any amount, as before. The four-eyes rule still applies on top: nobody approves their own.
 *
 * The amount is what the decision moves: an order's total; for a correction or a count, every
 * line's value added up without signs, so five bottles short and five over is ten bottles' worth
 * of difference, not nothing.
 */

import { refuse } from '../lib/errors.js';
import { m2 } from '../lib/data.js';
import { setting } from './settings.js';

const WHAT = { po: 'purchase order', writeoff: 'correction', count: 'count' };

/** The limit in force for a kind, or null when there is none. */
export async function limitFor(env, unitId, kind) {
  if ((await setting(env, unitId, 'limits.on')) !== 'on') return null;
  const n = Number(await setting(env, unitId, `limits.${kind}`));
  return n > 0 ? n : null;
}

/** May this person approve above every limit? */
export const approvesAnyAmount = (user) => user.roles.includes('UNIT_ADMIN') || !!user.groupSummary || !!user.groupAdmin;

/** Value moved by a posting, without signs. */
export const grossOf = (moved) => m2(moved.reduce((s, m) => s + Math.abs(m.qty * (m.unitCost || 0)), 0));

export async function requireLimit(env, user, kind, amount) {
  const limit = await limitFor(env, user.unitId, kind);
  if (limit === null || m2(Math.abs(amount)) <= limit || approvesAnyAmount(user)) return;
  refuse('OVER_LIMIT',
    `This ${WHAT[kind]} is AED ${m2(Math.abs(amount)).toFixed(2)}, above the AED ${limit.toFixed(2)} a manager may approve. A unit administrator or a director approves it.`,
    403, { limit, amount: m2(Math.abs(amount)) });
}
