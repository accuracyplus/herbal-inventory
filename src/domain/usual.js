/**
 * The person's own habits, so Record use asks less (approved prototype, 13 Nov 2026): the items
 * they use most from a store, offered as one-tap chips, and the room they used last, chosen for
 * them. Only their own recorded use is read (person_id = them), over the last 30 days; nothing
 * about anyone else is returned.
 *
 * Use of stock they were holding (from_state 'custody') is left out: it never came off this
 * shelf at the moment of recording, so it says nothing about what they pick here.
 */

const DAY = 864e5;

export async function usualFor(env, user, storeId, now = Date.now()) {
  const since = new Date(now - 30 * DAY).toISOString();
  const { results: items } = await env.DB.prepare(
    `SELECT m.item_id AS itemId, COUNT(DISTINCT COALESCE(m.doc_id, m.id)) AS times
       FROM movements m JOIN items i ON i.id = m.item_id AND i.active = 1
      WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.person_id = ? AND m.store_id = ? AND m.at >= ?
        AND COALESCE(m.from_state, '') <> 'custody'
      GROUP BY m.item_id ORDER BY times DESC, MAX(m.at) DESC LIMIT 6`,
  ).bind(user.unitId, user.staffId, storeId || '', since).all();
  const last = await env.DB.prepare(
    `SELECT m.area_id FROM movements m JOIN areas a ON a.id = m.area_id AND a.active = 1
      WHERE m.unit_id = ? AND m.kind = 'ISSUE' AND m.person_id = ? AND m.area_id IS NOT NULL
      ORDER BY m.at DESC LIMIT 1`,
  ).bind(user.unitId, user.staffId).first();
  return { items: items || [], lastAreaId: last?.area_id || null };
}

/** How many times the person recorded use today (Gulf time), for their own Today. */
export async function usesToday(env, user, dayStartIso) {
  const row = await env.DB.prepare(
    `SELECT COUNT(DISTINCT COALESCE(doc_id, id)) AS n FROM movements
      WHERE unit_id = ? AND kind = 'ISSUE' AND person_id = ? AND at >= ?`,
  ).bind(user.unitId, user.staffId, dayStartIso).first();
  return row?.n || 0;
}
