/**
 * Small shared helpers: time, ids, references, rounding.
 */

export const nowIso = () => new Date().toISOString();
export const uuid = () => crypto.randomUUID();

/** Today's date in the Gulf (UTC+4, no daylight saving), as YYYY-MM-DD. */
export function gstDate(ms = Date.now()) {
  return new Date(ms + 4 * 3600e3).toISOString().slice(0, 10);
}

/** Quantities are kept to three decimals (kg, litres) and money to two. */
export const q3 = (n) => Math.round(Number(n) * 1000) / 1000;
export const m2 = (n) => Math.round(Number(n) * 100) / 100;

/** A positive number from a request body, or null. */
export function positive(n) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? q3(v) : null;
}

/** A number that is zero or more, or null. */
export function nonNegative(n) {
  if (n === '' || n === null || n === undefined) return null;
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 ? q3(v) : null;
}

/** Trimmed text, capped, or null when empty. */
export function text(v, max = 500) {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
}

/**
 * A date as a person reads it: "24-11-2026" (Design Guide D-090, Sinu 24 Nov 2026: "date in
 * dd-mm-yyyy format always"), in PDFs, emails and refusals alike. A calendar day is read as
 * written; a moment is its day in the Gulf. "" without a date.
 */
export function dmy(v) {
  if (!v) return '';
  const s = String(v);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : (Number.isNaN(Date.parse(s)) ? '' : gstDate(Date.parse(s)));
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/** A month as a person reads it: "November 2026". */
export function monthWords(ym) {
  const m = /^(\d{4})-(\d{2})/.exec(String(ym || ''));
  if (!m) return '';
  return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(m[2]) - 1]} ${m[1]}`;
}

/** YYYY-MM-DD, or null. */
export function isoDate(v) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : s;
}

/**
 * The next reference for a document kind in a unit: HP-PO-0001.
 *
 * Compare-and-swap on the counter row rather than read-then-write, so two people raising a
 * request at the same moment cannot both get HP-REQ-0042. The row is created on first use.
 */
export async function nextRef(env, unitId, unitCode, kind, pad = 4) {
  await env.DB.prepare(
    `INSERT INTO counters (unit_id, name, next) VALUES (?,?,1) ON CONFLICT(unit_id, name) DO NOTHING`,
  ).bind(unitId, kind).run();
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await env.DB.prepare(`SELECT next FROM counters WHERE unit_id = ? AND name = ?`)
      .bind(unitId, kind).first();
    const res = await env.DB.prepare(
      `UPDATE counters SET next = ? WHERE unit_id = ? AND name = ? AND next = ?`,
    ).bind(row.next + 1, unitId, kind, row.next).run();
    if (res.meta.changes === 1) return `${unitCode}-${kind}-${String(row.next).padStart(pad, '0')}`;
  }
  throw new Error(`could not allocate a ${kind} reference`);
}

/** Read a JSON list column; anything unreadable is an empty list. */
export function jsonList(s) {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function sha256Hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
