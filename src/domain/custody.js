/**
 * Accountability: what somebody has taken, and what has become of it.
 *
 * Stock taken leaves the shelf and is held by a named person until it is recorded as used or
 * returned. Held for longer than the unit allows, it is "unaccounted for" and flagged to the
 * person and to the people who manage them.
 *
 * Nobody is ranked (Design Guide rule 5): a person sees their own, managers see their unit's in
 * name order, and there is no total, average or league table anywhere in here.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, nowIso, positive, q3, text, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { may, storeFor } from './access.js';
import { consumptionFor, holderFor } from './consumption.js';
import { parseLines } from './operations.js';
import { setting } from './settings.js';
import { buildCustodyReturn, buildCustodyUse, buildTake, commit, loadItems } from './stock.js';

const MAX_LOTS = 100;

export async function takeStock(env, user, body) {
  const store = await storeFor(env, user, body.storeId);
  const { area, person, departmentId } = await holderFor(env, user, { areaId: body.areaId, personId: body.personId });
  const lines = parseLines(body.lines);
  const items = await loadItems(env, user.unitId, lines.map((l) => l.itemId));
  for (const it of items.values()) {
    if (!it.active) refuse('ITEM_INACTIVE', `${it.name} has been retired. Ask a manager to reactivate it first.`);
    if (it.is_linen) refuse('USE_LINEN_SCREEN', `${it.name} is linen. Use the Linen screen to send it to a room.`);
  }
  const docId = uuid();
  const { statements } = await buildTake(env, {
    unitId: user.unitId, actor: actorOf(user), store, person, areaId: area?.id, departmentId, docId, note: text(body.note, 300),
    lines: lines.map((l) => ({ item: items.get(l.itemId), qty: l.qty, batchId: l.batchId })),
  });
  await commit(env, [...statements, auditStmt(env, user, 'CUSTODY_TAKE', docId,
    `${lines.length} line(s) from ${store.name} held by ${person.name}${area ? ` in ${area.name}` : ''}`)]);
  return { ok: true, id: docId, person: person.name };
}

/**
 * The held rows named in a request, checked: they exist in this unit, they are this person's to
 * settle, and there is that much left. Somebody else's stock answers as not found unless the
 * person manages the unit, and a manager settling for somebody must say why.
 */
async function settling(env, user, body) {
  const raw = body.lines;
  if (!Array.isArray(raw) || !raw.length) refuse('NO_LINES', 'Choose what you are accounting for.');
  if (raw.length > MAX_LOTS) refuse('TOO_MANY', `At most ${MAX_LOTS} lines at a time.`);
  const ids = raw.map((l) => String(l?.custodyId || ''));
  if (ids.some((x) => !x) || new Set(ids).size !== ids.length) refuse('BAD_LINE', 'A line was sent twice or names nothing.');
  const { results } = await env.DB.prepare(
    `SELECT c.*, b.expiry FROM custody c LEFT JOIN batches b ON b.id = c.batch_id
      WHERE c.unit_id = ? AND c.id IN (${ids.map(() => '?').join(',')})`,
  ).bind(user.unitId, ...ids).all();
  const rows = new Map((results || []).map((r) => [r.id, r]));
  const manages = may(user, 'custody.team');
  const items = await loadItems(env, user.unitId, (results || []).map((r) => r.item_id));
  const note = text(body.note, 300);
  return {
    note,
    lots: raw.map((l) => {
      const lot = rows.get(String(l.custodyId));
      if (!lot || (lot.person_id !== user.staffId && !manages)) refuse('NOT_FOUND', 'That stock is not with you.', 404);
      const item = items.get(lot.item_id);
      const qty = positive(l.qty);
      if (qty === null) refuse('BAD_QTY', `${item.name}: enter a quantity above zero.`);
      if (qty > lot.qty) {
        refuse('OVER_HELD', `${item.name}: only ${q3(lot.qty)} ${item.uom} ${lot.person_id === user.staffId ? 'is with you' : `is with ${lot.person_name}`}.`);
      }
      if (lot.person_id !== user.staffId && !note) {
        refuse('NOTE_REQUIRED', `Say why you are accounting for this on behalf of ${lot.person_name}.`);
      }
      return { lot, item, qty };
    }),
  };
}

export async function useHeld(env, user, body) {
  const { lots, note } = await settling(env, user, body);
  const reason = text(body.purpose, 120);
  const today = gstDate();
  const docId = uuid();
  const stmts = [];
  for (const { lot, item, qty } of lots) {
    if (lot.expiry && lot.expiry < today) {
      refuse('ONLY_EXPIRED', `This ${item.name} expired on ${lot.expiry}. Return it to the store instead of using it.`);
    }
    const { area, person, departmentId } = await consumptionFor(env, user, {
      areaId: body.areaId || lot.area_id, requester: { id: lot.person_id, name: lot.person_name },
    });
    stmts.push(...buildCustodyUse(env, { lot, qty, actor: actorOf(user), areaId: area?.id, departmentId, reason, note, docId }).statements);
    stmts.push(auditStmt(env, user, 'CUSTODY_USE', item.code, `${q3(qty)} × ${item.name} used by ${person.name}${area ? ` in ${area.name}` : ''}${note ? ` — ${note}` : ''}`));
  }
  await commit(env, stmts);
  return { ok: true, id: docId };
}

export async function returnHeld(env, user, body) {
  const { lots, note } = await settling(env, user, body);
  const docId = uuid();
  const stmts = [];
  for (const { lot, item, qty } of lots) {
    const store = await env.DB.prepare(`SELECT id, unit_id, code, name, kind, active FROM stores WHERE id = ? AND unit_id = ?`).bind(lot.store_id, user.unitId).first();
    const { statements } = await buildCustodyReturn(env, { lot, item, store, qty, actor: actorOf(user), note, docId });
    stmts.push(...statements);
    stmts.push(auditStmt(env, user, 'CUSTODY_RETURN', item.code, `${q3(qty)} × ${item.name} back to ${store.name} from ${lot.person_name}${note ? ` — ${note}` : ''}`));
  }
  await commit(env, stmts);
  return { ok: true, id: docId };
}

const LOT_COLUMNS = `c.id, c.person_id, c.person_name, c.qty, c.taken_at, c.taken_by_name, c.area_id,
                     i.name AS item_name, i.code AS item_code, i.uom, s.name AS store_name, a.name AS area_name,
                     b.batch_no, b.expiry`;
const LOT_JOINS = `FROM custody c JOIN items i ON i.id = c.item_id JOIN stores s ON s.id = c.store_id
                   LEFT JOIN areas a ON a.id = c.area_id LEFT JOIN batches b ON b.id = c.batch_id`;

export async function accountHours(env, unitId) {
  return Number(await setting(env, unitId, 'custody.account_hours')) || 24;
}
const cutoffFor = (hours) => new Date(Date.now() - hours * 36e5).toISOString();

const shape = (r, cutoff) => {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(r.taken_at).getTime()) / 36e5));
  return { ...r, ageHours: hours, unaccounted: r.taken_at < cutoff };
};

/** What is with this person, oldest first. */
export async function heldByMe(env, user) {
  const hours = await accountHours(env, user.unitId);
  const cutoff = cutoffFor(hours);
  const { results } = await env.DB.prepare(
    `SELECT ${LOT_COLUMNS} ${LOT_JOINS} WHERE c.unit_id = ? AND c.person_id = ? AND c.qty > 0 ORDER BY c.taken_at`,
  ).bind(user.unitId, user.staffId).all();
  return { accountHours: hours, serverNow: nowIso(), rows: (results || []).map((r) => shape(r, cutoff)) };
}

/** What is unaccounted for in the unit, person by person, in name order: a list, not a ranking. */
export async function unaccountedInUnit(env, user) {
  const hours = await accountHours(env, user.unitId);
  const cutoff = cutoffFor(hours);
  const { results } = await env.DB.prepare(
    `SELECT ${LOT_COLUMNS} ${LOT_JOINS} WHERE c.unit_id = ? AND c.qty > 0 AND c.taken_at < ? ORDER BY c.person_name, c.person_id, c.taken_at`,
  ).bind(user.unitId, cutoff).all();
  const people = [];
  for (const r of results || []) {
    let p = people[people.length - 1];
    if (!p || p.personId !== r.person_id) people.push(p = { personId: r.person_id, name: r.person_name, rows: [] });
    p.rows.push(shape(r, cutoff));
  }
  return { accountHours: hours, people };
}

// Today's lines for held stock are in waiting.js, with the rest of the waiting list.
