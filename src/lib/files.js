/**
 * Files attached to a document: the delivery note, the supplier's invoice, the LPO.
 *
 * The bytes go to R2 (the FILES binding), private, and are only ever served back through this
 * Worker to somebody signed in to the same unit. D1 keeps the record: what it is, who attached
 * it, when, and its SHA-256. The digest is checked again whenever the file is read, so a file
 * changed in storage is refused rather than shown as the delivery note.
 *
 * R2 rather than OneDrive (which Transport uses for photographs): no Microsoft secret to hold
 * and renew, no tenant boundary, and the file never leaves Cloudflare.
 */

import { refuse } from './errors.js';
import { nowIso, uuid } from './data.js';
import { auditStmt } from './audit.js';

export const FILE_KINDS = { NOTE: 'Delivery note', INVOICE: 'Supplier invoice', LPO: 'LPO', OTHER: 'Other' };
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_PER_DOC = 12;

/** What the bytes really are, whatever the file was called. */
export function sniff(b) {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  if (b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  return null;
}

export async function digestHex(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const bucket = (env) => env.FILES || refuse('FILES_OFF', 'File storage is not set up for this app yet. Ask your administrator.', 503);

/** A file from a form, as bytes of a kind this app keeps. */
export async function bytesOf(file, { images = false, max = MAX_BYTES } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') refuse('NO_FILE', 'Choose a photo or a PDF to attach.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) refuse('NO_FILE', 'That file is empty.');
  if (bytes.length > max) refuse('FILE_TOO_BIG', `That file is ${(bytes.length / 1048576).toFixed(1)} MB; the most is ${Math.round(max / 1048576)} MB. Take the photo again a little further back, or scan at a lower quality.`);
  const mime = sniff(bytes);
  if (!mime || (images && mime === 'application/pdf')) {
    refuse('FILE_TYPE', images ? 'Reading works from a photo (JPEG or PNG). Take a picture of the note.' : 'Attach a photo (JPEG or PNG) or a PDF.');
  }
  return { bytes, mime };
}

export async function attachFile(env, user, { docType, docId, docRef, kind, file }) {
  if (!FILE_KINDS[kind]) refuse('BAD_KIND', 'Say what this file is: the delivery note, the invoice or the LPO.');
  const store = bucket(env);
  const { bytes, mime } = await bytesOf(file);
  const sha256 = await digestHex(bytes);
  const { results } = await env.DB.prepare(`SELECT sha256 FROM files WHERE doc_type = ? AND doc_id = ? AND removed_at IS NULL`).bind(docType, docId).all();
  if ((results || []).some((f) => f.sha256 === sha256)) refuse('ALREADY_ATTACHED', 'That file is already attached here.', 409);
  if ((results || []).length >= MAX_PER_DOC) refuse('TOO_MANY', `At most ${MAX_PER_DOC} files on one delivery.`);
  const key = `${user.unitId}/${docType.toLowerCase()}/${docId}/${sha256}.${EXT[mime]}`;
  await store.put(key, bytes, { httpMetadata: { contentType: mime } });
  const row = {
    id: uuid(), kind, name: String(file.name || `${FILE_KINDS[kind]}.${EXT[mime]}`).replace(/[\\/\u0000-\u001f]/g, ' ').trim().slice(0, 120) || `file.${EXT[mime]}`,
    mime, bytes: bytes.length, sha256, uploaded_by_name: user.fullName, uploaded_at: nowIso(),
  };
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO files (id, unit_id, doc_type, doc_id, kind, name, mime, bytes, sha256, r2_key, uploaded_by, uploaded_by_name, uploaded_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(row.id, user.unitId, docType, docId, kind, row.name, mime, row.bytes, sha256, key, user.staffId, user.fullName, row.uploaded_at),
    auditStmt(env, user, 'FILE_ATTACH', docRef, `${FILE_KINDS[kind]}: ${row.name}, ${Math.round(row.bytes / 1024)} KB, sha256 ${sha256.slice(0, 16)}`),
  ]);
  return row;
}

export async function filesFor(env, docType, docId) {
  const { results } = await env.DB.prepare(
    `SELECT id, kind, name, mime, bytes, sha256, uploaded_by, uploaded_by_name, uploaded_at FROM files
      WHERE doc_type = ? AND doc_id = ? AND removed_at IS NULL ORDER BY uploaded_at`,
  ).bind(docType, docId).all();
  return results || [];
}

/** The record of one file in this person's unit. Another unit's answers as if it did not exist. */
export async function fileRow(env, user, id) {
  const f = await env.DB.prepare(`SELECT * FROM files WHERE id = ? AND unit_id = ? AND removed_at IS NULL`).bind(id, user.unitId).first();
  if (!f) refuse('NOT_FOUND', 'That file does not exist in this unit.', 404);
  return f;
}

export async function readFile(env, f) {
  const obj = await bucket(env).get(f.r2_key);
  if (!obj) refuse('FILE_MISSING', 'That file is recorded but could not be found in storage. Tell your administrator.', 404);
  const bytes = new Uint8Array(await obj.arrayBuffer());
  if (await digestHex(bytes) !== f.sha256) {
    refuse('FILE_CHANGED', 'That file is not the one that was attached: its contents have changed in storage. Tell your administrator.', 409);
  }
  return bytes;
}

export async function removeFile(env, user, f, docRef) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE files SET removed_at = ?, removed_by_name = ? WHERE id = ? AND removed_at IS NULL`).bind(nowIso(), user.fullName, f.id),
    auditStmt(env, user, 'FILE_REMOVE', docRef, `${FILE_KINDS[f.kind] || f.kind}: ${f.name}`),
  ]);
  return { ok: true };
}
