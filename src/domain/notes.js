/**
 * Reading a delivery note from its photograph, and remembering each supplier's wording.
 *
 * Two rules, the same as Transport's odometer reading (lib/dial.js):
 *
 *   IT IS A SUGGESTION, NEVER A RECORD. What the model reads fills in the Receive form; the
 *   receiver checks it against the goods and saves. Nothing here reaches a receipt by itself.
 *
 *   A MODEL THAT CANNOT BE REACHED COSTS NOTHING BUT TYPING. Cloudflare retires models on its own
 *   schedule (one died on 30 May 2026 and a feature failed quietly for four months), so the model
 *   is a list tried in order, and when none answers the person is told to type the note in.
 *
 * Models, checked against the account's live catalogue on 11 November 2026 (`wrangler ai models`):
 * Llama 4 Scout first (reads pictures, holds a JSON shape, no licence step), then Mistral Small
 * 3.1, then Llama 3.2 Vision. Cost on Scout: USD 0.27 per million tokens in, USD 0.85 out.
 * Measured that day on a printed four-line note, 1200 px wide: 2,673 tokens in, 226 out, 83
 * neurons, about 5.5 seconds, so under a tenth of a US cent a note; the account's free 10,000
 * neurons a day cover roughly the first hundred notes. Mistral read the same note the same way.
 * Not yet tried on a real phone photo of a creased or handwritten note.
 *
 * The supplier's wording is remembered per supplier (supplier_item_map): the line text as
 * printed, which item it is, and how many of the item's unit "1 on the note" means. Saved when
 * the receiver records the delivery, so a correction replaces what was remembered.
 */

import { refuse } from '../lib/errors.js';
import { isoDate, nonNegative, nowIso, positive, text } from '../lib/data.js';
import { auditNow } from '../lib/audit.js';
import { setting } from './settings.js';

export const NOTE_MODELS = [
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/mistralai/mistral-small-3.1-24b-instruct',
  '@cf/meta/llama-3.2-11b-vision-instruct',
];

const PROMPT = 'This is a photograph of a supplier\'s delivery note or invoice. Read it and reply with JSON only, in exactly this shape: '
  + '{"supplier": string or null, "note_no": string or null, "date": "YYYY-MM-DD" or null, '
  + '"lines": [{"text": string, "qty": number or null, "unit": string or null, "unit_price": number or null}]}. '
  + '"supplier" is the company that issued the note, not the customer it is addressed to. "note_no" is the delivery note or invoice number. '
  + 'Give one entry in "lines" for each item line, copying the description exactly as printed, including any pack size. '
  + '"qty" is the quantity delivered and "unit_price" the price for one, without currency. Dates on the note are day first. '
  + 'Use null for anything that is not printed or cannot be read. Do not add lines for totals, tax or delivery charges, and do not guess.';

const SCHEMA = {
  type: 'object',
  properties: {
    supplier: { type: ['string', 'null'] }, note_no: { type: ['string', 'null'] }, date: { type: ['string', 'null'] },
    lines: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, qty: { type: ['number', 'null'] }, unit: { type: ['string', 'null'] }, unit_price: { type: ['number', 'null'] } }, required: ['text', 'qty', 'unit', 'unit_price'] } },
  },
  // Every field is required, with null allowed. Left optional, Llama 4 Scout read a real note
  // perfectly and returned no quantities at all (11 November 2026): it skips what it may skip.
  required: ['supplier', 'note_no', 'date', 'lines'],
};

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** A date as the note prints it (day first), as YYYY-MM-DD, or null. */
export function noteDate(v) {
  const s = String(v ?? '').trim();
  if (isoDate(s)) return s;
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/.exec(s);
  if (!m) return null;
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  return isoDate(`${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
}

/**
 * What a model answered, as a note, or null when there is nothing usable in it. Pure. Models wrap
 * JSON in prose or code fences when they feel like it; the first { to the last } is tried.
 */
export function parseNote(raw) {
  let o = raw;
  if (typeof raw === 'string') {
    const a = raw.indexOf('{');
    const b = raw.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { o = JSON.parse(raw.slice(a, b + 1)); } catch { return null; }
  }
  if (!o || typeof o !== 'object' || !Array.isArray(o.lines)) return null;
  const num = (v) => nonNegative(typeof v === 'string' ? v.replace(/[, ]/g, '').replace(/^[A-Za-z$]+/, '') : v);
  const lines = o.lines.slice(0, 80).map((l) => ({
    text: text(l?.text, 200), qty: positive(typeof l?.qty === 'string' ? l.qty.replace(/[, ]/g, '') : l?.qty), unit: text(l?.unit, 20), unitPrice: num(l?.unit_price),
  })).filter((l) => l.text);
  const note = { supplier: text(o.supplier, 120), noteNo: text(o.note_no, 60), date: noteDate(o.date), lines };
  return note.lines.length || note.supplier || note.noteNo ? note : null;
}

/** Ask the models in turn. Returns { note, model }, or throws a refusal the person can act on. */
export async function readNote(env, bytes, mime) {
  if (!env.AI?.run) refuse('READING_OFF', 'Reading a note from a photo is not switched on for this app yet. Type the note in.', 503);
  const url = `data:${mime};base64,${toBase64(bytes)}`;
  const messages = [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url } }] }];
  for (const model of NOTE_MODELS) {
    let out;
    try {
      try {
        out = await env.AI.run(model, { messages, max_tokens: 1800, temperature: 0, response_format: { type: 'json_schema', json_schema: SCHEMA } });
      } catch (e) {
        // Not every model takes a schema; asking in words works often enough to try on the same one.
        if (/deprecat|no such model|not found|5028|5016/i.test(String(e?.message || e))) throw e;
        out = await env.AI.run(model, { messages, max_tokens: 1800, temperature: 0 });
      }
    } catch (e) {
      console.error('[notes] model failed:', model, String(e?.message || e).slice(0, 160));
      continue;
    }
    const note = parseNote(out?.response !== undefined ? out.response : out);
    if (note) return { note, model };
    console.error('[notes] nothing usable from', model, JSON.stringify(out ?? null).slice(0, 300));
  }
  refuse('NOTE_UNREADABLE', 'The note could not be read from that photo. Type it in, or try again with a sharper photo taken straight on, in good light.');
}

// ── Matching what was read to this unit ──────────────────────────────────────

/** A supplier's line wording, reduced to what makes it the same line next time. */
export const mapKey = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 200);
const nameKey = (s) => mapKey(s).replace(/\b(llc|l l c|fzc|fze|fzco|est|co|ltd|trading|general|company|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => mapKey(s).split(' ').filter((w) => w.length >= 3 && !/^\d+$/.test(w));

export async function matchNote(env, user, note, supplierId = null) {
  const u = user.unitId;
  const [{ results: suppliers }, { results: items }, { results: extra }] = await Promise.all([
    env.DB.prepare(`SELECT id, name FROM suppliers WHERE unit_id = ? AND active = 1`).bind(u).all(),
    env.DB.prepare(`SELECT id, code, name, uom, barcode FROM items WHERE unit_id = ? AND active = 1 AND is_linen = 0`).bind(u).all(),
    env.DB.prepare(`SELECT barcode, item_id FROM item_barcodes WHERE unit_id = ?`).bind(u).all(),
  ]);
  let supplier = supplierId ? (suppliers || []).find((s) => s.id === supplierId) : null;
  if (!supplier && note.supplier) {
    const k = nameKey(note.supplier);
    const hits = k.length >= 4 ? (suppliers || []).filter((s) => { const n = nameKey(s.name); return n === k || (n.length >= 4 && (n.includes(k) || k.includes(n))); }) : [];
    if (hits.length === 1) [supplier] = hits;
  }
  const remembered = new Map();
  if (supplier) {
    const { results } = await env.DB.prepare(`SELECT text_key, item_id, factor FROM supplier_item_map WHERE unit_id = ? AND supplier_id = ?`).bind(u, supplier.id).all();
    for (const m of results || []) remembered.set(m.text_key, m);
  }
  const byId = new Map((items || []).map((i) => [i.id, i]));
  const byCode = new Map();
  for (const i of items || []) { byCode.set(i.code.toLowerCase(), i.id); if (i.barcode) byCode.set(i.barcode.toLowerCase(), i.id); }
  for (const b of extra || []) if (byId.has(b.item_id)) byCode.set(b.barcode.toLowerCase(), b.item_id);
  const itemWords = (items || []).map((i) => ({ id: i.id, words: new Set(words(i.name)) })).filter((i) => i.words.size);

  const lines = note.lines.map((l) => {
    let match = null;
    const known = remembered.get(mapKey(l.text));
    if (known && byId.has(known.item_id)) match = { itemId: known.item_id, factor: known.factor, source: 'remembered' };
    if (!match) {
      // An item code or barcode printed on the line settles it.
      const token = l.text.toLowerCase().split(/[^a-z0-9._\-/]+/).find((t) => t.length >= 3 && byCode.has(t));
      if (token) match = { itemId: byCode.get(token), factor: 1, source: 'code' };
    }
    if (!match) {
      // Otherwise the one item whose whole name is in the wording. Two that fit are no guess at all.
      const w = new Set(words(l.text));
      const fits = itemWords.filter((i) => [...i.words].every((x) => w.has(x)));
      const most = Math.max(0, ...fits.map((i) => i.words.size));
      const best = fits.filter((i) => i.words.size === most);
      if (best.length === 1) match = { itemId: best[0].id, factor: 1, source: 'guess' };
    }
    return { ...l, match };
  });
  return { supplier: { text: note.supplier, id: supplier?.id ?? null, name: supplier?.name ?? null }, noteNo: note.noteNo, date: note.date, lines };
}

export async function readAndMatch(env, user, { bytes, mime, supplierId }) {
  if (await setting(env, user.unitId, 'receipts.read_notes') === 'off') refuse('READING_OFF', 'Reading notes from a photo is switched off for this unit. Type the note in.', 403);
  const { note, model } = await readNote(env, bytes, mime);
  const out = await matchNote(env, user, note, supplierId);
  await auditNow(env, user, 'NOTE_READ', out.supplier.name || note.supplier || null,
    `${note.lines.length} line(s), ${out.lines.filter((l) => l.match).length} matched, ${model}`, user.unitId);
  return { ...out, model };
}

/** What the receiver confirmed, remembered for this supplier's next note. */
export function mappingStatements(env, user, supplierId, lines) {
  const now = nowIso();
  const seen = new Set();
  return lines.filter((l) => l.noteText && mapKey(l.noteText) && !seen.has(mapKey(l.noteText)) && seen.add(mapKey(l.noteText))).map((l) => env.DB.prepare(
    `INSERT INTO supplier_item_map (unit_id, supplier_id, text_key, note_text, item_id, factor, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(unit_id, supplier_id, text_key) DO UPDATE SET note_text = excluded.note_text, item_id = excluded.item_id, factor = excluded.factor,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).bind(user.unitId, supplierId, mapKey(l.noteText), l.noteText, l.itemId, l.factor || 1, now, user.fullName));
}
