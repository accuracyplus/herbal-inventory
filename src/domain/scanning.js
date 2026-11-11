/**
 * Scanning: barcodes to items, and a computer screen paired with the same person's phone.
 *
 * The computer opens a pairing and shows it as a QR code. The phone, signed in as the same
 * person in the same unit, sends each scan here; the computer asks for new ones every second or
 * so and adds them to its list. Polling, not a socket: it needs nothing beyond D1, runs in the
 * tests as it runs in production, and reads the database only while a pairing is open.
 *
 * A pairing ends when the computer closes it, 15 minutes after the last scan, or four hours after
 * it opened, whichever comes first. Scans fill in a form; nothing here moves stock.
 */

import { refuse } from '../lib/errors.js';
import { nowIso, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { commit } from './stock.js';

export const PURPOSES = ['use', 'take', 'transfer', 'receive', 'request', 'count'];
const IDLE_MS = 15 * 60e3;
const CAP_MS = 4 * 3600e3;
const KEEP_MS = 2 * 864e5;

const cleanBarcode = (v) => {
  const b = text(v, 64);
  if (!b) refuse('NO_CODE', 'There was no barcode to look up.');
  return b;
};

/** The active item a code or barcode belongs to in a unit, wherever the barcode is kept. */
export async function findByCode(env, unitId, code) {
  const v = String(code || '').trim();
  if (!v) return null;
  return env.DB.prepare(
    `SELECT id, code, name, uom, tracks_expiry, is_linen FROM items
      WHERE unit_id = ?1 AND active = 1
        AND (barcode = ?2 OR UPPER(code) = UPPER(?2)
             OR id IN (SELECT item_id FROM item_barcodes WHERE unit_id = ?1 AND barcode = ?2))
      ORDER BY CASE WHEN barcode = ?2 THEN 0 ELSE 1 END LIMIT 1`,
  ).bind(unitId, v).first();
}

/** Which item, active or not, already owns a barcode in this unit. */
export async function barcodeOwner(env, unitId, barcode, exceptItemId = '') {
  return env.DB.prepare(
    `SELECT id, name FROM items WHERE unit_id = ?1 AND barcode = ?2 AND id <> ?3
     UNION ALL
     SELECT i.id, i.name FROM item_barcodes b JOIN items i ON i.id = b.item_id
      WHERE b.unit_id = ?1 AND b.barcode = ?2 AND b.item_id <> ?3 LIMIT 1`,
  ).bind(unitId, barcode, exceptItemId).first();
}

/** "Which item is this?" answered: the barcode is saved to the item, the first as its main one. */
export async function linkBarcode(env, user, itemId, body) {
  const barcode = cleanBarcode(body?.barcode);
  const item = await env.DB.prepare(`SELECT id, code, name, barcode FROM items WHERE id = ? AND unit_id = ?`).bind(itemId, user.unitId).first();
  if (!item) refuse('NOT_FOUND', 'That item does not exist in this unit.', 404);
  const owner = await barcodeOwner(env, user.unitId, barcode, item.id);
  if (owner) refuse('BARCODE_TAKEN', `${barcode} already belongs to ${owner.name}.`, 409);
  const known = item.barcode === barcode || await env.DB.prepare(`SELECT 1 FROM item_barcodes WHERE unit_id = ? AND barcode = ?`).bind(user.unitId, barcode).first();
  if (known) return { ok: true, unchanged: true };
  await commit(env, [
    item.barcode
      ? env.DB.prepare(`INSERT INTO item_barcodes (unit_id, barcode, item_id, added_at, added_by) VALUES (?,?,?,?,?)`)
        .bind(user.unitId, barcode, item.id, nowIso(), user.fullName)
      : env.DB.prepare(`UPDATE items SET barcode = ?, updated_at = ?, updated_by = ? WHERE id = ?`).bind(barcode, nowIso(), user.fullName, item.id),
    auditStmt(env, user, 'BARCODE_LINK', item.code, `${barcode} → ${item.name}`),
  ]);
  return { ok: true };
}

const live = (s) => !s.closed_at && s.expires_at > nowIso();
const nextExpiry = (s) => new Date(Math.min(new Date(s.created_at).getTime() + CAP_MS, Date.now() + IDLE_MS)).toISOString();

export async function openSession(env, user, body) {
  const purpose = PURPOSES.includes(body?.purpose) ? body.purpose : null;
  if (!purpose) refuse('BAD_PURPOSE', 'Say what the scans are for.');
  const old = new Date(Date.now() - KEEP_MS).toISOString();
  const now = nowIso();
  const id = uuid();
  const s = { created_at: now };
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM scan_events WHERE session_id IN (SELECT id FROM scan_sessions WHERE expires_at < ?)`).bind(old),
    env.DB.prepare(`DELETE FROM scan_sessions WHERE expires_at < ?`).bind(old),
    env.DB.prepare(`INSERT INTO scan_sessions (id, unit_id, staff_id, purpose, created_at, last_at, expires_at) VALUES (?,?,?,?,?,?,?)`)
      .bind(id, user.unitId, user.staffId, purpose, now, now, nextExpiry(s)),
  ]);
  return { id, purpose, expiresAt: nextExpiry(s) };
}

/**
 * The pairing, if it is this person's and in the unit they are working in. Anybody else's, even
 * with the link, answers as if it did not exist.
 */
async function sessionFor(env, user, id) {
  const s = await env.DB.prepare(`SELECT * FROM scan_sessions WHERE id = ? AND staff_id = ? AND unit_id = ?`).bind(id, user.staffId, user.unitId).first();
  if (!s) refuse('NOT_FOUND', 'That pairing is not yours, or it is for another unit.', 404);
  return s;
}

function requireLive(s) {
  if (!live(s)) refuse('PAIRING_ENDED', 'This pairing has ended. Start a new one on the computer.', 410);
}

const touch = (env, s) => env.DB.prepare(`UPDATE scan_sessions SET last_at = ?, expires_at = ? WHERE id = ?`).bind(nowIso(), nextExpiry(s), s.id);

/** The phone arrives. */
export async function pairSession(env, user, id) {
  const s = await sessionFor(env, user, id);
  requireLive(s);
  await env.DB.batch([
    touch(env, s),
    env.DB.prepare(`UPDATE scan_sessions SET paired_at = COALESCE(paired_at, ?) WHERE id = ?`).bind(nowIso(), s.id),
  ]);
  return { id: s.id, purpose: s.purpose, unitName: user.unit.name, expiresAt: nextExpiry(s) };
}

/**
 * One scan from the phone. An unknown barcode is answered, not stored: the phone asks which item
 * it is and sends the scan again with `itemId`, having linked the barcode if the person may.
 */
export async function addScan(env, user, id, body) {
  const s = await sessionFor(env, user, id);
  requireLive(s);
  const barcode = cleanBarcode(body?.barcode);
  let item;
  if (body?.itemId) {
    item = await env.DB.prepare(`SELECT id, code, name, uom FROM items WHERE id = ? AND unit_id = ? AND active = 1`).bind(body.itemId, s.unit_id).first();
    if (!item) refuse('NOT_FOUND', 'That item is not in this unit.', 404);
  } else {
    item = await findByCode(env, s.unit_id, barcode);
    if (!item) return { known: false, barcode };
  }
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO scan_events (session_id, at, barcode, item_id) VALUES (?,?,?,?)`).bind(s.id, nowIso(), barcode, item.id),
    touch(env, s),
  ]);
  return { known: true, item: { id: item.id, code: item.code, name: item.name, uom: item.uom } };
}

/** What the computer asks for: scans after the last one it has. */
export async function sessionEvents(env, user, id, after) {
  const s = await sessionFor(env, user, id);
  const { results } = await env.DB.prepare(
    `SELECT seq, item_id AS itemId, at FROM scan_events WHERE session_id = ? AND seq > ? ORDER BY seq LIMIT 100`,
  ).bind(s.id, Number(after) || 0).all();
  return { open: live(s), paired: !!s.paired_at, expiresAt: s.expires_at, events: results || [] };
}

export async function closeSession(env, user, id) {
  const s = await sessionFor(env, user, id);
  if (!s.closed_at) await env.DB.prepare(`UPDATE scan_sessions SET closed_at = ? WHERE id = ?`).bind(nowIso(), s.id).run();
  return { ok: true };
}
