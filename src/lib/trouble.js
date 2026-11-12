/**
 * An unexpected error, given a reference somebody can quote back.
 *
 * Same shape as HiFive Transport: one structured console line (kept by Workers Logs), one
 * audit row with the same reference, and a sentence for the person that says what to do.
 */

import { uuid, nowIso } from './data.js';

export const reference = () => uuid().replace(/-/g, '').slice(0, 6).toUpperCase();

export const troubleMessage = (ref) =>
  `Something went wrong. Try again, and if it keeps happening, quote reference ${ref}.`;

export function recordTrouble(env, ctx, error, detail = {}) {
  const ref = reference();
  const message = String(error?.message || error || 'unknown').slice(0, 300);
  try {
    console.error(JSON.stringify({
      level: 'error', ref, at: nowIso(), message, stack: String(error?.stack || '').slice(0, 1500), ...detail,
    }));
  } catch { /* logging must never be the thing that fails */ }
  try {
    const write = env?.DB?.prepare(
      `INSERT INTO audit_log (id, at, actor_id, actor_name, unit_id, action, subject, detail)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).bind(uuid(), nowIso(), detail.staffId || null, detail.actorName || null, detail.unitId || null,
           'SERVER_ERROR', ref, `${detail.method || ''} ${detail.path || ''}: ${message}`.trim().slice(0, 400))
      .run().catch(() => {});
    if (ctx?.waitUntil && write) ctx.waitUntil(write);
  } catch { /* an error about an error is still only the first error */ }
  return ref;
}
