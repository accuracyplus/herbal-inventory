/**
 * Bulk upload: items, suppliers, and rooms and areas, from an Excel or CSV sheet.
 *
 * The page reads the file and sends the headings and rows; everything is decided here. A check
 * (dry run) reports row by row what would be added, what would change and what is wrong, and
 * changes nothing. Applying runs the same check again and saves only a file with no problems, in
 * one batch: all of it or none of it.
 *
 *   - A row is matched to what exists by its code (items, rooms) or name (suppliers).
 *   - A blank cell leaves that field as it is. Clearing a value is done on its own screen.
 *   - Master data only. Nothing here touches balances, batches or movements; a change that would
 *     need to (expiry tracking on an item holding stock) is refused and sent to the item's screen.
 *   - An existing item's cost updates its last price only: average cost moves with deliveries.
 *
 * Excel is the reason for half the checks: it turns a long barcode into 6.29E+12, rounds
 * anything past 15 digits, and drops a leading zero. The template's code columns are text, and
 * what still gets through is said in the report rather than saved.
 */

import { refuse } from '../lib/errors.js';
import { nowIso, uuid } from '../lib/data.js';
import { commit } from './stock.js';

export const BULK_KINDS = {
  items: { may: 'items.edit', label: 'Items', sheet: 'Items' },
  suppliers: { may: 'supplier.edit', label: 'Suppliers', sheet: 'Suppliers' },
  areas: { may: 'admin', label: 'Rooms and areas', sheet: 'Rooms' },
};

const MAX_ROWS = 1000;
const MAX_STATEMENTS = 800;   // D1 allows 1,000 queries per request; the check itself uses a few
const AREA_KINDS = { ROOM: 'Treatment room', BENCH: 'Bench', DESK: 'Front desk', COUNTER: 'Counter', OFFICE: 'Office', OTHER: 'Other' };

const slug = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const blank = (v) => v === null || v === undefined || String(v).trim() === '';

// ── Cells ────────────────────────────────────────────────────────────────────
// Each returns { value } (null = blank, leave as it is), or { problem }, and sometimes { note }.

function textCell(v, max, what) {
  if (blank(v)) return { value: null };
  const s = String(v).trim();
  if (s.length > max) return { problem: `${what} is longer than ${max} characters.` };
  return { value: s };
}

/** A code, barcode, phone or registration number: digits Excel likes to treat as a quantity. */
function codeCell(v, max, what) {
  if (blank(v)) return { value: null };
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) return { problem: `${what} came through as the number ${v}. Format the column as Text and type it again.` };
    if (Math.abs(v) >= 1e15) return { problem: `${what} is a long number that Excel has rounded. Format the column as Text and type it again.` };
    return textCell(String(v), max, what);
  }
  const s = String(v).trim();
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) return { problem: `${what} reads ${s}: Excel has turned it into scientific notation. Format the column as Text and type it again.` };
  return textCell(s, max, what);
}

function yesNoCell(v, what) {
  if (blank(v)) return { value: null };
  const s = String(v).trim().toLowerCase();
  if (v === true || ['yes', 'y', 'true', '1', 'x'].includes(s)) return { value: 1 };
  if (v === false || ['no', 'n', 'false', '0'].includes(s)) return { value: 0 };
  return { problem: `${what}: write yes or no.` };
}

function numberCell(v, what, { whole = false } = {}) {
  if (blank(v)) return { value: null };
  const n = Number(typeof v === 'string' ? v.trim().replace(/,/g, '') : v);
  if (!Number.isFinite(n) || n < 0 || (whole && !Number.isInteger(n))) return { problem: `${what}: enter a ${whole ? 'whole number' : 'number'}, zero or more.` };
  return { value: Math.round(n * 1000) / 1000 };
}

// ── The sheet ────────────────────────────────────────────────────────────────

/** Match the file's headings to the columns, and refuse a file that cannot be read as this list. */
function readSheet(body, columns, label) {
  const headers = Array.isArray(body?.headers) ? body.headers : null;
  const raw = Array.isArray(body?.rows) ? body.rows : null;
  if (!headers || !raw) refuse('BAD_FILE', 'That file could not be read. Download the template and fill that in.');
  const at = new Map();
  const ignored = [];
  headers.forEach((h, i) => {
    const s = slug(h);
    if (!s) return;
    const col = columns.find((c) => slug(c.header) === s || c.aliases?.includes(s));
    if (!col) { ignored.push(String(h).trim()); return; }
    if (at.has(col.key)) refuse('BAD_FILE', `The heading “${col.header}” appears twice. Keep one.`);
    at.set(col.key, i);
  });
  const key = columns.find((c) => c.required);
  if (!at.has(key.key)) refuse('BAD_FILE', `This does not look like the ${label} sheet: there is no “${key.header}” column. Download the template and use its headings.`);
  const rows = [];
  raw.forEach((r, i) => {
    if (!Array.isArray(r) || r.every(blank)) return;
    rows.push({ row: i + 2, get: (k) => (at.has(k) ? r[at.get(k)] : undefined), has: (k) => at.has(k) });
  });
  if (!rows.length) refuse('EMPTY_FILE', 'The file has headings but no rows.');
  if (rows.length > MAX_ROWS) refuse('TOO_MANY', `At most ${MAX_ROWS} rows at a time; this file has ${rows.length}. Split it into two files.`);
  return { rows, ignored };
}

/** One row's verdict, built up as its cells are read. */
function verdict(row, existing) {
  const v = { row: row.row, key: null, name: null, problems: [], notes: [], changes: [], isNew: !existing };
  v.take = (cell) => { if (cell.problem) v.problems.push(cell.problem); if (cell.note) v.notes.push(cell.note); return cell.problem ? null : cell.value; };
  v.set = (label, was, now, show = (x) => x) => { if (!existing) return; if ((was ?? null) !== (now ?? null)) v.changes.push(`${label}: ${blank(was) ? 'empty' : show(was)} → ${show(now)}`); };
  return v;
}

function multi(env, head, cols, rows, tail = '') {
  const per = Math.floor(100 / cols);   // D1 binds at most 100 values in one statement
  const out = [];
  for (let i = 0; i < rows.length; i += per) {
    const part = rows.slice(i, i + per);
    out.push(env.DB.prepare(`${head} VALUES ${part.map(() => `(${Array(cols).fill('?').join(',')})`).join(',')} ${tail}`).bind(...part.flat()));
  }
  return out;
}

const auditRows = (env, user, entries) => multi(env,
  `INSERT INTO audit_log (id, at, actor_id, actor_name, unit_id, action, subject, detail)`, 8,
  entries.map(([action, subject, detail]) => [uuid(), nowIso(), user.staffId, user.fullName, user.unitId, action, subject, String(detail || '').slice(0, 1000) || null]));

// ── Items ────────────────────────────────────────────────────────────────────

async function itemColumns(env, user) {
  const { results: stores } = await env.DB.prepare(`SELECT id, code, name FROM stores WHERE unit_id = ? AND active = 1 ORDER BY kind, sort, name`).bind(user.unitId).all();
  const columns = [
    { key: 'code', header: 'Code', required: true, text: true, width: 14, hint: 'Your own short code for the item. This is what matches a row to an item already here.' },
    { key: 'name', header: 'Name', width: 34, hint: 'Needed for a new item.' },
    { key: 'category', header: 'Category', width: 18, hint: 'For example Oils, Herbs, Reagents. General if left empty on a new item.' },
    { key: 'uom', header: 'Unit', aliases: ['uom', 'countedin', 'unitofmeasure'], width: 10, hint: 'What it is counted in: bottle, box, kg, pcs.' },
    { key: 'barcode', header: 'Barcode', text: true, width: 18, hint: 'The main barcode on the pack. Keep the column as Text so Excel does not change it.' },
    { key: 'tracksExpiry', header: 'Tracks expiry', aliases: ['expiry', 'expirytracking', 'tracksexpirydates'], width: 13, hint: 'yes or no. Yes for oils, medicines and reagents with a date on the pack.' },
    { key: 'isLinen', header: 'Linen', width: 8, hint: 'yes or no. Yes for towels and sheets that go to the laundry and come back.' },
    { key: 'supplier', header: 'Supplier', width: 26, hint: 'The usual supplier, by its name here. Upload suppliers first.' },
    { key: 'cost', header: 'Cost', aliases: ['unitcost', 'price'], width: 10, hint: 'Per unit. On an item already here it updates the last price only; average cost moves with deliveries.' },
    { key: 'notes', header: 'Notes', width: 30 },
  ];
  for (const s of stores || []) {
    for (const [f, word, hint] of [['reorder', 'reorder', 'shows as low at or below this'], ['critical', 'critical', 'shows red at or below this'], ['par', 'top up', 'what the store is topped up to']]) {
      columns.push({ key: `lv:${s.id}:${f}`, header: `${s.code} ${word}`, width: 13, level: { storeId: s.id, field: f }, hint: `${s.name}: ${hint}.` });
    }
  }
  return { columns, stores: stores || [] };
}

async function itemState(env, user) {
  const u = user.unitId;
  const [items, extra, suppliers, levels, held] = await Promise.all([
    env.DB.prepare(`SELECT id, code, name, category, uom, barcode, tracks_expiry, is_linen, last_cost, supplier_id, notes, active FROM items WHERE unit_id = ?`).bind(u).all(),
    env.DB.prepare(`SELECT barcode, item_id FROM item_barcodes WHERE unit_id = ?`).bind(u).all(),
    env.DB.prepare(`SELECT id, name FROM suppliers WHERE unit_id = ? AND active = 1`).bind(u).all(),
    env.DB.prepare(`SELECT lv.item_id, lv.store_id, lv.reorder, lv.critical, lv.par FROM item_levels lv JOIN stores s ON s.id = lv.store_id WHERE s.unit_id = ?`).bind(u).all(),
    env.DB.prepare(
      `SELECT b.item_id FROM balances b JOIN stores s ON s.id = b.store_id WHERE s.unit_id = ?1 AND (b.qty > 0 OR b.in_use > 0 OR b.in_wash > 0)
       UNION SELECT item_id FROM custody WHERE unit_id = ?1 AND qty > 0`,
    ).bind(u).all(),
  ]);
  const barcodes = new Map();
  for (const i of items.results || []) if (i.barcode) barcodes.set(i.barcode, i.id);
  for (const b of extra.results || []) barcodes.set(b.barcode, b.item_id);
  return {
    byCode: new Map((items.results || []).map((i) => [String(i.code).toUpperCase(), i])),
    byId: new Map((items.results || []).map((i) => [i.id, i])),
    barcodes,
    supplierByName: new Map((suppliers.results || []).map((s) => [s.name.trim().toLowerCase(), s])),
    supplierById: new Map((suppliers.results || []).map((s) => [s.id, s])),
    levels: new Map((levels.results || []).map((l) => [`${l.item_id}|${l.store_id}`, l])),
    held: new Set((held.results || []).map((h) => h.item_id)),
  };
}

async function planItems(env, user, body) {
  const { columns, stores } = await itemColumns(env, user);
  const { rows, ignored } = readSheet(body, columns, 'items');
  const st = await itemState(env, user);
  const seenCode = new Map();
  const seenBarcode = new Map();
  const out = [];
  const plan = { inserts: [], updates: [], levelUpserts: [], levelDeletes: [], audit: [] };
  const yn = (x) => (x ? 'yes' : 'no');

  for (const r of rows) {
    const rawCode = codeCell(r.get('code'), 40, 'The code');
    const code = rawCode.value ? rawCode.value.toUpperCase() : null;
    const old = code ? st.byCode.get(code) : null;
    const v = verdict(r, old);
    v.take(rawCode);
    v.key = code;
    if (!code && !rawCode.problem) v.problems.push('There is no code on this row.');
    if (code && !/^[A-Za-z0-9._\-/]+$/.test(code)) v.problems.push('Use letters, numbers, dot, dash, slash or underscore in the code.');
    if (code && seenCode.has(code)) v.problems.push(`Row ${seenCode.get(code)} has the same code. Keep one.`);
    else if (code) seenCode.set(code, r.row);

    const cell = { name: v.take(textCell(r.get('name'), 120, 'The name')), category: v.take(textCell(r.get('category'), 60, 'The category')),
      uom: v.take(textCell(r.get('uom'), 20, 'The unit')), barcode: v.take(codeCell(r.get('barcode'), 64, 'The barcode')),
      tracks: v.take(yesNoCell(r.get('tracksExpiry'), 'Tracks expiry')), linen: v.take(yesNoCell(r.get('isLinen'), 'Linen')),
      supplier: v.take(textCell(r.get('supplier'), 120, 'The supplier')), cost: v.take(numberCell(r.get('cost'), 'Cost')),
      notes: v.take(textCell(r.get('notes'), 500, 'The notes')) };

    const next = {
      id: old?.id || uuid(), code,
      name: cell.name ?? old?.name ?? null,
      category: cell.category ?? old?.category ?? 'General',
      uom: cell.uom ?? old?.uom ?? 'pcs',
      barcode: cell.barcode ?? old?.barcode ?? null,
      tracks_expiry: cell.tracks ?? old?.tracks_expiry ?? 0,
      is_linen: cell.linen ?? old?.is_linen ?? 0,
      supplier_id: old?.supplier_id ?? null,
      last_cost: cell.cost ?? old?.last_cost ?? null,
      notes: cell.notes ?? old?.notes ?? null,
    };
    v.name = next.name;
    if (!next.name) v.problems.push('A new item needs a name.');
    if (old && !old.active) v.notes.push('This item is retired. It stays retired; reactivate it on its own screen.');

    if (cell.supplier) {
      const s = st.supplierByName.get(cell.supplier.toLowerCase());
      if (!s) v.problems.push(`The supplier “${cell.supplier}” is not in this unit. Add it first, or upload suppliers.`);
      else next.supplier_id = s.id;
    }
    if (cell.barcode) {
      const owner = st.barcodes.get(cell.barcode);
      if (owner && owner !== next.id) v.problems.push(`The barcode ${cell.barcode} already belongs to ${st.byId.get(owner)?.name || 'another item'}.`);
      else if (seenBarcode.has(cell.barcode)) v.problems.push(`Row ${seenBarcode.get(cell.barcode)} has the same barcode.`);
      else seenBarcode.set(cell.barcode, r.row);
      if (typeof r.get('barcode') === 'number' && [7, 11, 12].includes(cell.barcode.length)) {
        v.notes.push(`The barcode has ${cell.barcode.length} digits. If the pack shows one more, starting with 0, Excel dropped it: format the column as Text.`);
      }
    }
    if (next.is_linen && next.tracks_expiry) v.problems.push('Linen does not expire. Choose linen or tracks expiry, not both.');
    if (old && st.held.has(old.id)) {
      if (!!old.is_linen !== !!next.is_linen) v.problems.push(`${old.name} holds stock. Linen can only be switched while it holds none.`);
      else if (!!old.tracks_expiry !== !!next.tracks_expiry) v.problems.push(`${old.name} holds stock. Switch expiry tracking on the item's own screen, where the shelf is turned into a batch.`);
    }

    // Levels: a blank cell keeps what the store has; three zeros remove the store's levels.
    for (const s of stores) {
      const given = ['reorder', 'critical', 'par'].map((f) => v.take(numberCell(r.get(`lv:${s.id}:${f}`), `${s.code} ${f === 'par' ? 'top up' : f}`)));
      if (given.every((g) => g === null)) continue;
      const was = st.levels.get(`${next.id}|${s.id}`) || { reorder: 0, critical: 0, par: 0 };
      const lv = { reorder: given[0] ?? was.reorder, critical: given[1] ?? was.critical, par: given[2] ?? was.par };
      if (lv.critical > lv.reorder && lv.reorder > 0) v.problems.push(`${s.code}: the critical level should be at or below the reorder level.`);
      else if (lv.par > 0 && lv.par < lv.reorder) v.problems.push(`${s.code}: the top-up level should be above the reorder level.`);
      if (lv.reorder === was.reorder && lv.critical === was.critical && lv.par === was.par) continue;
      v.set(`${s.code} levels`, `${was.reorder}/${was.critical}/${was.par}`, `${lv.reorder}/${lv.critical}/${lv.par}`);
      v.levelsChanged = true;
      if (!lv.reorder && !lv.critical && !lv.par) plan.levelDeletes.push([next.id, s.id]);
      else plan.levelUpserts.push([next.id, s.id, lv.reorder, lv.critical, lv.par]);
    }

    if (old) {
      v.set('Name', old.name, next.name); v.set('Category', old.category, next.category); v.set('Unit', old.uom, next.uom);
      v.set('Barcode', old.barcode, next.barcode); v.set('Tracks expiry', !!old.tracks_expiry, !!next.tracks_expiry, yn);
      v.set('Linen', !!old.is_linen, !!next.is_linen, yn);
      v.set('Supplier', st.supplierById.get(old.supplier_id)?.name ?? null, st.supplierById.get(next.supplier_id)?.name ?? null);
      v.set('Last price', old.last_cost, next.last_cost); v.set('Notes', old.notes, next.notes);
    }
    v.action = v.problems.length ? 'problem' : !old ? 'add' : v.changes.length ? 'change' : 'same';
    out.push(v);
    if (v.action === 'add') {
      plan.inserts.push([next.id, user.unitId, code, next.name, next.category, next.uom, next.barcode, next.tracks_expiry, next.is_linen,
        next.last_cost ?? 0, next.last_cost, next.supplier_id, next.notes, 1, null, null]);
      plan.audit.push(['ITEM_CREATE', code, `${next.name} (bulk upload)`]);
    } else if (v.action === 'change') {
      if (v.changes.some((c) => !/ levels: /.test(c))) plan.updates.push(next);
      plan.audit.push(['ITEM_EDIT', code, `${next.name} (bulk upload): ${v.changes.join('; ')}`]);
    }
  }

  const build = () => {
    const now = nowIso();
    for (const row of plan.inserts) { row[14] = now; row[15] = user.fullName; }
    return [
      ...multi(env, `INSERT INTO items (id, unit_id, code, name, category, uom, barcode, tracks_expiry, is_linen, avg_cost, last_cost, supplier_id, notes, active, updated_at, updated_by)`, 16, plan.inserts),
      ...plan.updates.map((n) => env.DB.prepare(
        `UPDATE items SET name = ?, category = ?, uom = ?, barcode = ?, tracks_expiry = ?, is_linen = ?, supplier_id = ?, last_cost = ?, notes = ?,
                          updated_at = ?, updated_by = ? WHERE id = ? AND unit_id = ?`,
      ).bind(n.name, n.category, n.uom, n.barcode, n.tracks_expiry, n.is_linen, n.supplier_id, n.last_cost, n.notes, now, user.fullName, n.id, user.unitId)),
      ...multi(env, `INSERT INTO item_levels (item_id, store_id, reorder, critical, par)`, 5, plan.levelUpserts,
        `ON CONFLICT(item_id, store_id) DO UPDATE SET reorder = excluded.reorder, critical = excluded.critical, par = excluded.par`),
      ...plan.levelDeletes.map(([i, s]) => env.DB.prepare(`DELETE FROM item_levels WHERE item_id = ? AND store_id = ?`).bind(i, s)),
      ...auditRows(env, user, plan.audit),
    ];
  };
  return { rows: out, ignored, build };
}

// ── Suppliers ────────────────────────────────────────────────────────────────

const SUPPLIER_COLUMNS = [
  { key: 'name', header: 'Name', required: true, width: 32, hint: 'This is what matches a row to a supplier already here.' },
  { key: 'contact', header: 'Contact', aliases: ['contactperson'], width: 22 },
  { key: 'phone', header: 'Phone', text: true, width: 18, hint: 'Keep the column as Text, or Excel drops the + or the leading 0.' },
  { key: 'email', header: 'Email', width: 28 },
  { key: 'trn', header: 'TRN', aliases: ['vatnumber', 'taxregistrationnumber'], text: true, width: 18, hint: 'The 15-digit UAE VAT registration number. Text, or Excel rounds it.' },
  { key: 'terms', header: 'Payment terms', aliases: ['terms'], width: 20 },
  { key: 'leadDays', header: 'Lead days', aliases: ['leadtime', 'leadtimedays'], width: 10, hint: 'Days from order to delivery.' },
  { key: 'notes', header: 'Notes', width: 30 },
];

async function planSuppliers(env, user, body) {
  const { rows, ignored } = readSheet(body, SUPPLIER_COLUMNS, 'suppliers');
  const { results } = await env.DB.prepare(`SELECT id, name, contact, phone, email, trn, terms, lead_days, notes, active FROM suppliers WHERE unit_id = ?`).bind(user.unitId).all();
  const byName = new Map((results || []).map((s) => [s.name.trim().toLowerCase(), s]));
  const seen = new Map();
  const out = [];
  const plan = { inserts: [], updates: [], audit: [] };
  for (const r of rows) {
    const nameCell = textCell(r.get('name'), 120, 'The name');
    const name = nameCell.value;
    const old = name ? byName.get(name.toLowerCase()) : null;
    const v = verdict(r, old);
    v.take(nameCell);
    v.key = name; v.name = old?.name || name;
    if (!name && !nameCell.problem) v.problems.push('There is no name on this row.');
    if (name && seen.has(name.toLowerCase())) v.problems.push(`Row ${seen.get(name.toLowerCase())} has the same name. Keep one.`);
    else if (name) seen.set(name.toLowerCase(), r.row);
    const cell = { contact: v.take(textCell(r.get('contact'), 80, 'The contact')), phone: v.take(codeCell(r.get('phone'), 30, 'The phone number')),
      email: v.take(textCell(r.get('email'), 120, 'The email')), trn: v.take(codeCell(r.get('trn'), 20, 'The TRN')),
      terms: v.take(textCell(r.get('terms'), 80, 'The payment terms')), lead: v.take(numberCell(r.get('leadDays'), 'Lead days', { whole: true })),
      notes: v.take(textCell(r.get('notes'), 500, 'The notes')) };
    if (cell.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cell.email)) v.problems.push('That email address does not look right.');
    if (typeof r.get('phone') === 'number') v.notes.push('The phone number came through as a number: check it has not lost a + or a leading 0.');
    if (old && !old.active) v.notes.push('This supplier is closed. It stays closed; reopen it on the Suppliers screen.');
    const next = { id: old?.id || uuid(), name: old?.name || name, contact: cell.contact ?? old?.contact ?? null, phone: cell.phone ?? old?.phone ?? null,
      email: cell.email ?? old?.email ?? null, trn: cell.trn ?? old?.trn ?? null, terms: cell.terms ?? old?.terms ?? null,
      lead_days: cell.lead ?? old?.lead_days ?? null, notes: cell.notes ?? old?.notes ?? null };
    if (old) {
      for (const [label, f] of [['Contact', 'contact'], ['Phone', 'phone'], ['Email', 'email'], ['TRN', 'trn'], ['Payment terms', 'terms'], ['Lead days', 'lead_days'], ['Notes', 'notes']]) v.set(label, old[f], next[f]);
    }
    v.action = v.problems.length ? 'problem' : !old ? 'add' : v.changes.length ? 'change' : 'same';
    out.push(v);
    if (v.action === 'add') { plan.inserts.push(next); plan.audit.push(['SUPPLIER_CREATE', next.name, 'bulk upload']); }
    if (v.action === 'change') { plan.updates.push(next); plan.audit.push(['SUPPLIER_EDIT', next.name, `bulk upload: ${v.changes.join('; ')}`]); }
  }
  const build = () => {
    const now = nowIso();
    const vals = (n) => [n.contact, n.phone, n.email, n.trn, n.terms, n.lead_days, n.notes];
    return [
      ...multi(env, `INSERT INTO suppliers (id, unit_id, name, contact, phone, email, trn, terms, lead_days, notes, active, updated_at, updated_by)`, 13,
        plan.inserts.map((n) => [n.id, user.unitId, n.name, ...vals(n), 1, now, user.fullName])),
      ...plan.updates.map((n) => env.DB.prepare(
        `UPDATE suppliers SET contact = ?, phone = ?, email = ?, trn = ?, terms = ?, lead_days = ?, notes = ?, updated_at = ?, updated_by = ? WHERE id = ? AND unit_id = ?`,
      ).bind(...vals(n), now, user.fullName, n.id, user.unitId)),
      ...auditRows(env, user, plan.audit),
    ];
  };
  return { rows: out, ignored, build };
}

// ── Rooms and areas ──────────────────────────────────────────────────────────

const AREA_COLUMNS = [
  { key: 'code', header: 'Code', required: true, text: true, width: 12, hint: 'A short code, such as R1. This is what matches a row to a room already here.' },
  { key: 'name', header: 'Name', width: 30, hint: 'Needed for a new room.' },
  { key: 'kind', header: 'Kind', aliases: ['type'], width: 16, hint: `One of: ${Object.values(AREA_KINDS).join(', ')}. Treatment room if left empty on a new one.` },
  { key: 'department', header: 'Department', width: 22, hint: 'By its name or code. Add departments in Admin first.' },
];

async function planAreas(env, user, body) {
  const { rows, ignored } = readSheet(body, AREA_COLUMNS, 'rooms and areas');
  const [{ results: areas }, { results: depts }] = await Promise.all([
    env.DB.prepare(`SELECT id, code, name, kind, department_id, active FROM areas WHERE unit_id = ?`).bind(user.unitId).all(),
    env.DB.prepare(`SELECT id, code, name FROM departments WHERE unit_id = ? AND active = 1`).bind(user.unitId).all(),
  ]);
  const byCode = new Map((areas || []).map((a) => [String(a.code).toUpperCase(), a]));
  const deptBy = new Map();
  for (const d of depts || []) { deptBy.set(d.name.trim().toLowerCase(), d); deptBy.set(d.code.toLowerCase(), d); }
  const deptName = (id) => (depts || []).find((d) => d.id === id)?.name ?? null;
  const kindOf = new Map(Object.entries(AREA_KINDS).flatMap(([k, l]) => [[slug(k), k], [slug(l), k]]));
  const seen = new Map();
  const out = [];
  const plan = { inserts: [], updates: [], audit: [] };
  for (const r of rows) {
    const rawCode = codeCell(r.get('code'), 20, 'The code');
    const code = rawCode.value ? rawCode.value.toUpperCase() : null;
    const old = code ? byCode.get(code) : null;
    const v = verdict(r, old);
    v.take(rawCode);
    v.key = code;
    if (!code && !rawCode.problem) v.problems.push('There is no code on this row.');
    if (code && !/^[A-Za-z0-9._-]{1,20}$/.test(code)) v.problems.push('The code can use letters, numbers, dot, dash or underscore.');
    if (code && seen.has(code)) v.problems.push(`Row ${seen.get(code)} has the same code. Keep one.`);
    else if (code) seen.set(code, r.row);
    const name = v.take(textCell(r.get('name'), 80, 'The name'));
    const kindText = v.take(textCell(r.get('kind'), 30, 'The kind'));
    const deptText = v.take(textCell(r.get('department'), 80, 'The department'));
    let kind = old?.kind ?? 'ROOM';
    if (kindText) {
      if (kindOf.has(slug(kindText))) kind = kindOf.get(slug(kindText));
      else v.problems.push(`The kind “${kindText}” is not one of: ${Object.values(AREA_KINDS).join(', ')}.`);
    }
    let departmentId = old?.department_id ?? null;
    if (deptText) {
      const d = deptBy.get(deptText.toLowerCase());
      if (!d) v.problems.push(`The department “${deptText}” is not in this unit. Add it in Admin → Departments first.`);
      else departmentId = d.id;
    } else if (!old && (depts || []).length) {
      v.problems.push('Say which department this room or area belongs to.');
    }
    const next = { id: old?.id || uuid(), code, name: name ?? old?.name ?? null, kind, departmentId };
    v.name = next.name;
    if (!next.name) v.problems.push('A new room or area needs a name.');
    if (old && !old.active) v.notes.push('This room is closed. It stays closed; reopen it in Admin → Rooms & areas.');
    if (old) {
      v.set('Name', old.name, next.name); v.set('Kind', AREA_KINDS[old.kind] || old.kind, AREA_KINDS[kind]);
      v.set('Department', deptName(old.department_id), deptName(departmentId));
    }
    v.action = v.problems.length ? 'problem' : !old ? 'add' : v.changes.length ? 'change' : 'same';
    out.push(v);
    if (v.action === 'add') { plan.inserts.push(next); plan.audit.push(['AREA_CREATE', code, `${next.name} (bulk upload)`]); }
    if (v.action === 'change') { plan.updates.push(next); plan.audit.push(['AREA_EDIT', code, `${next.name} (bulk upload): ${v.changes.join('; ')}`]); }
  }
  const build = () => {
    const now = nowIso();
    return [
      ...multi(env, `INSERT INTO areas (id, unit_id, code, name, kind, department_id, active, updated_at, updated_by)`, 9,
        plan.inserts.map((n) => [n.id, user.unitId, n.code, n.name, n.kind, n.departmentId, 1, now, user.fullName])),
      ...plan.updates.map((n) => env.DB.prepare(`UPDATE areas SET name = ?, kind = ?, department_id = ?, updated_at = ?, updated_by = ? WHERE id = ? AND unit_id = ?`)
        .bind(n.name, n.kind, n.departmentId, now, user.fullName, n.id, user.unitId)),
      ...auditRows(env, user, plan.audit),
    ];
  };
  return { rows: out, ignored, build };
}

// ── Check, apply, template ───────────────────────────────────────────────────

const PLANNERS = { items: planItems, suppliers: planSuppliers, areas: planAreas };

export async function bulkUpload(env, user, kind, body) {
  const dryRun = body?.dryRun !== false;
  const { rows, ignored, build } = await PLANNERS[kind](env, user, body);
  const count = (a) => rows.filter((r) => r.action === a).length;
  const summary = { add: count('add'), change: count('change'), same: count('same'), problems: count('problem') };
  const report = {
    kind, dryRun, applied: false, summary, ignored,
    rows: rows.map(({ row, key, name, action, changes, problems, notes }) => ({ row, key, name, action, changes, problems, notes })),
  };
  if (dryRun) return report;
  if (summary.problems) {
    refuse('BULK_PROBLEMS', `${summary.problems} row${summary.problems > 1 ? 's have' : ' has'} a problem, so nothing was saved. Fix the file and check it again.`, 422, { report });
  }
  if (!summary.add && !summary.change) refuse('NOTHING', 'The file matches what is already here. There is nothing to save.');
  const statements = build();
  if (statements.length > MAX_STATEMENTS) {
    refuse('TOO_MANY', `This file makes ${summary.add + summary.change} changes, which is more than can be saved in one go. Split it into two files.`);
  }
  await commit(env, [
    ...statements,
    ...auditRows(env, user, [['BULK_UPLOAD', BULK_KINDS[kind].label, `${summary.add} added, ${summary.change} changed, ${summary.same} unchanged`]]),
  ]);
  return { ...report, applied: true };
}

/** The template: this list's columns, and what the unit already has, to edit and send back. */
export async function bulkTemplate(env, user, kind) {
  const u = user.unitId;
  let columns;
  let rows;
  if (kind === 'items') {
    const c = await itemColumns(env, user);
    const st = await itemState(env, user);
    columns = c.columns;
    rows = [...st.byCode.values()].filter((i) => i.active).sort((a, b) => a.code.localeCompare(b.code)).map((i) => columns.map((col) => {
      if (col.level) return st.levels.get(`${i.id}|${col.level.storeId}`)?.[col.level.field] ?? null;
      return ({
        code: i.code, name: i.name, category: i.category, uom: i.uom, barcode: i.barcode, tracksExpiry: i.tracks_expiry ? 'yes' : 'no', isLinen: i.is_linen ? 'yes' : 'no',
        supplier: st.supplierById.get(i.supplier_id)?.name ?? null, cost: i.last_cost, notes: i.notes,
      })[col.key];
    }));
  } else if (kind === 'suppliers') {
    columns = SUPPLIER_COLUMNS;
    const { results } = await env.DB.prepare(`SELECT name, contact, phone, email, trn, terms, lead_days, notes FROM suppliers WHERE unit_id = ? AND active = 1 ORDER BY name`).bind(u).all();
    rows = (results || []).map((s) => [s.name, s.contact, s.phone, s.email, s.trn, s.terms, s.lead_days, s.notes]);
  } else {
    columns = AREA_COLUMNS;
    const { results } = await env.DB.prepare(
      `SELECT a.code, a.name, a.kind, d.name AS department FROM areas a LEFT JOIN departments d ON d.id = a.department_id WHERE a.unit_id = ? AND a.active = 1 ORDER BY a.code`,
    ).bind(u).all();
    rows = (results || []).map((a) => [a.code, a.name, AREA_KINDS[a.kind] || a.kind, a.department]);
  }
  return {
    kind, sheet: BULK_KINDS[kind].sheet, fileName: `inventory-${kind}-${user.unit.code}`,
    columns: columns.map(({ header, text, width, hint, required }) => ({ header, text: !!text, width: width || 14, hint: hint || null, required: !!required })),
    rows,
  };
}
