/**
 * One-time import from the old Google Sheet app (index.html at the root of this repo).
 *
 * Input is exactly what the old app's Apps Script returns for `?action=getAll`:
 *   { staff, items, linen, rooms, movements, requests }
 * with whatever column spellings the sheet had — read the same forgiving way the old app's
 * mapData() read them (lower-cased, spaces removed).
 *
 * What it does, in order, each step its own commit:
 *   1. items      → items, with the old reorder / critical levels on the main store. The old
 *                   app had one reorder figure for both stores; copying it onto the sub store
 *                   too would mark most of a spa cupboard "low" on day one, so sub store levels
 *                   are left for the unit to set item by item (the report says so).
 *   2. linen      → items marked linen, LIN-001...
 *   3. rooms      → areas
 *   4. balances   → one OPENING movement per item and store, so the ledger starts at the
 *                   numbers the sheet had; linen states are then moved into rooms and laundry
 *                   with LINEN movements so the ledger explains every piece
 *   5. history    → legacy_movements, as it was, for reference only
 *
 * What it does not do: create people. The sheet has names, not HiFive ID employee codes, and
 * sign-in finds people by employee code. The report lists them for the administrator to add.
 *
 * Refused once the unit has any movement: an import on top of live stock would double it.
 * `dryRun` returns the same report without writing anything.
 */

import { refuse } from '../lib/errors.js';
import { nowIso, q3, uuid } from '../lib/data.js';
import { actorOf, auditStmt } from '../lib/audit.js';
import { buildLinenMove, buildPosting, commit, loadItems } from './stock.js';

function norm(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = String(k).toLowerCase().trim().replace(/\s+/g, '');
    if (key) out[key] = v;
  }
  return out;
}
const str = (v) => String(v ?? '').trim();
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const codeOk = (c) => /^[A-Za-z0-9._\-/]+$/.test(c);

/** Read the sheet the way the old app did, and say what it found. */
export function readSheet(data) {
  if (!data || typeof data !== 'object') refuse('BAD_FILE', 'That is not the old app\'s data. Open the export link again and save what it shows.');
  const problems = [];
  const items = [];
  const seen = new Set();
  for (const raw of data.items || []) {
    const r = norm(raw);
    let code = str(r.code || r.itemcode).toUpperCase().replace(/\s+/g, '-');
    const name = str(r.name || r.itemname || r.item);
    if (!code && !name) continue;
    if (!name) { problems.push(`Item ${code}: no name, skipped.`); continue; }
    if (!code || !codeOk(code)) { problems.push(`${name}: code "${code}" is not usable, skipped.`); continue; }
    if (seen.has(code)) { problems.push(`${name}: code ${code} appears twice; the second is skipped.`); continue; }
    seen.add(code);
    const main = num(r.mainstock || r.main);
    const sub = num(r.substock || r.sub);
    if (main < 0 || sub < 0) problems.push(`${name}: a negative stock figure was read as zero.`);
    items.push({
      code, name, category: str(r.cat || r.category) || 'General', uom: str(r.unit) || 'pcs',
      main: Math.max(0, q3(main)), sub: Math.max(0, q3(sub)),
      reorder: Math.max(0, num(r.reorder || r.reorderlevel)), critical: Math.max(0, num(r.critical || r.criticallevel)),
    });
  }
  const linen = [];
  let n = 0;
  for (const raw of data.linen || []) {
    const r = norm(raw);
    const name = str(r.name || r.item);
    if (!name) continue;
    n += 1;
    const available = Math.max(0, num(r.available));
    const inUse = Math.max(0, num(r.inuse));
    const inWash = Math.max(0, num(r.inwash));
    const total = num(r.total);
    if (total && total !== available + inUse + inWash) {
      problems.push(`${name}: total ${total} does not equal available + in use + in wash (${available + inUse + inWash}); the three parts were used.`);
    }
    linen.push({ code: `LIN-${String(n).padStart(3, '0')}`, name, available, inUse, inWash });
  }
  const rooms = [];
  const roomCodes = new Set();
  for (const raw of data.rooms || []) {
    const r = norm(raw);
    const num_ = str(r.num || r.roomno || r.roomnumber || r.number);
    const name = str(r.name || r.roomname || r.room);
    if (!num_ && !name) continue;
    let code = (num_ || name).toUpperCase().replace(/[^A-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || `R${rooms.length + 1}`;
    while (roomCodes.has(code)) code = `${code}-2`.slice(0, 20);
    roomCodes.add(code);
    rooms.push({
      code, name: name ? (num_ && !name.includes(num_) ? `${num_} · ${name}` : name) : `Room ${num_}`,
      kind: str(r.type || r.roomtype || 'Treatment').toUpperCase().slice(0, 30),
      active: !/inactive|closed/i.test(str(r.status)),
    });
  }
  const staff = (data.staff || []).map((raw) => {
    const r = norm(raw);
    return { name: str(r.name || r.fullname || r.staffname || r.therapist), roles: str(r.roles || r.role), store: str(r.store || r.storeaccess) };
  }).filter((s) => s.name);
  const history = (data.movements || []).map((raw) => {
    const r = norm(raw);
    return {
      at: str(r.datetime || r.date || r.timestamp), type: str(r.type), item: str(r.itemname || r.item || r.name),
      qty: num(r.qty || r.quantity), store: str(r.store), staff: str(r.staff), purpose: str(r.purpose || r.room), remarks: str(r.remarks),
    };
  }).filter((m) => m.item);
  const pendingRequests = (data.requests || []).map(norm).filter((r) => /pending/i.test(str(r.status))).length;
  return { items, linen, rooms, staff, history, pendingRequests, problems };
}

export function summarise(sheet) {
  return {
    items: sheet.items.length,
    withStock: sheet.items.filter((i) => i.main > 0 || i.sub > 0).length,
    linen: sheet.linen.length,
    linenPieces: sheet.linen.reduce((s, l) => s + l.available + l.inUse + l.inWash, 0),
    rooms: sheet.rooms.length,
    history: sheet.history.length,
    pendingRequests: sheet.pendingRequests,
    levels: 'The old reorder and critical levels were set on the main store. Set sub store levels item by item (Stock → item → Edit).',
    staffToAdd: sheet.staff,
    problems: sheet.problems,
  };
}

export async function runImport(env, user, body) {
  const sheet = readSheet(body.data);
  const report = summarise(sheet);
  const main = await env.DB.prepare(`SELECT * FROM stores WHERE id = ? AND unit_id = ?`).bind(body.mainStoreId, user.unitId).first();
  const sub = await env.DB.prepare(`SELECT * FROM stores WHERE id = ? AND unit_id = ?`).bind(body.subStoreId, user.unitId).first();
  const linenStore = await env.DB.prepare(`SELECT * FROM stores WHERE id = ? AND unit_id = ?`).bind(body.linenStoreId || body.subStoreId, user.unitId).first();
  if (!main || !sub || !linenStore) refuse('STORES', 'Choose which of this unit\'s stores were the old Main and Sub stores.');
  if (main.id === sub.id) refuse('STORES', 'The old Main and Sub stores must be two different stores here.');

  const used = await env.DB.prepare(`SELECT 1 FROM movements WHERE unit_id = ? LIMIT 1`).bind(user.unitId).first();
  if (used) refuse('ALREADY_LIVE', 'This unit already has stock movements. The import only runs into an empty unit, so nothing is counted twice.', 409);
  if (body.dryRun) return { dryRun: true, report };

  const now = nowIso();
  const actor = actorOf(user);

  // 1–3. Master data. Existing codes are left as they are (a re-run after a failure).
  const { results: existing } = await env.DB.prepare(`SELECT code FROM items WHERE unit_id = ?`).bind(user.unitId).all();
  const have = new Set((existing || []).map((r) => r.code));
  const itemStmts = [];
  const ids = new Map();
  for (const it of [...sheet.items, ...sheet.linen.map((l) => ({ ...l, category: 'Linen', uom: 'pcs', linen: true }))]) {
    if (have.has(it.code)) continue;
    const id = uuid();
    ids.set(it.code, id);
    itemStmts.push(env.DB.prepare(
      `INSERT INTO items (id, unit_id, code, name, category, uom, is_linen, active, updated_at, updated_by)
       VALUES (?,?,?,?,?,?,?,1,?,?)`,
    ).bind(id, user.unitId, it.code, it.name, it.category, it.uom, it.linen ? 1 : 0, now, `Import by ${user.fullName}`));
    if (!it.linen && (it.reorder || it.critical)) {
      const critical = Math.min(it.critical, it.reorder || it.critical);
      itemStmts.push(env.DB.prepare(`INSERT INTO item_levels (item_id, store_id, reorder, critical, par) VALUES (?,?,?,?,0)`)
        .bind(id, main.id, it.reorder || it.critical, critical));
    }
  }
  const { results: areasHave } = await env.DB.prepare(`SELECT code FROM areas WHERE unit_id = ?`).bind(user.unitId).all();
  const areaCodes = new Set((areasHave || []).map((a) => a.code));
  for (const r of sheet.rooms) {
    if (areaCodes.has(r.code)) continue;
    itemStmts.push(env.DB.prepare(`INSERT INTO areas (id, unit_id, code, name, kind, active, updated_at, updated_by) VALUES (?,?,?,?,?,?,?,?)`)
      .bind(uuid(), user.unitId, r.code, r.name, r.kind || 'ROOM', r.active ? 1 : 0, now, `Import by ${user.fullName}`));
  }
  for (let i = 0; i < itemStmts.length; i += 80) await commit(env, itemStmts.slice(i, i + 80));

  // 4. Opening balances.
  const { results: all } = await env.DB.prepare(`SELECT id, code FROM items WHERE unit_id = ?`).bind(user.unitId).all();
  const byCode = new Map((all || []).map((r) => [r.code, r.id]));
  const items = await loadItems(env, user.unitId, [...byCode.values()]);
  const lines = [];
  for (const it of sheet.items) {
    const item = items.get(byCode.get(it.code));
    if (it.main > 0) lines.push({ item, store: main, qty: it.main, unitCost: 0, note: 'Opening balance from the old app' });
    if (it.sub > 0) lines.push({ item, store: sub, qty: it.sub, unitCost: 0, note: 'Opening balance from the old app' });
  }
  for (const l of sheet.linen) {
    const total = l.available + l.inUse + l.inWash;
    if (total > 0) lines.push({ item: items.get(byCode.get(l.code)), store: linenStore, qty: total, unitCost: 0, note: 'Opening linen count from the old app' });
  }
  const doc = { type: 'IMPORT', id: uuid(), ref: 'IMPORT' };
  for (let i = 0; i < lines.length; i += 40) {
    const p = await buildPosting(env, { kind: 'OPENING', unitId: user.unitId, actor, doc }, lines.slice(i, i + 40));
    await commit(env, p.statements);
  }
  for (const l of sheet.linen) {
    const item = items.get(byCode.get(l.code));
    const out = l.inUse + l.inWash;
    if (out > 0) {
      const a = await buildLinenMove(env, { unitId: user.unitId, actor, store: linenStore, item, flow: 'ISSUE', qty: out, note: 'Opening: out of the store in the old app' });
      await commit(env, a.statements);
    }
    if (l.inWash > 0) {
      const b = await buildLinenMove(env, { unitId: user.unitId, actor, store: linenStore, item, flow: 'WASH', qty: l.inWash, note: 'Opening: at the laundry in the old app' });
      await commit(env, b.statements);
    }
  }

  // 5. History, as it was.
  const hist = sheet.history.map((m) => env.DB.prepare(
    `INSERT INTO legacy_movements (id, unit_id, at, type, item_name, qty, store, staff, purpose, remarks) VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).bind(uuid(), user.unitId, m.at, m.type, m.item, m.qty, m.store, m.staff, m.purpose, m.remarks));
  for (let i = 0; i < hist.length; i += 100) await commit(env, hist.slice(i, i + 100));

  await commit(env, [auditStmt(env, user, 'IMPORT', 'old app',
    `${report.items} items, ${report.linen} linen, ${report.rooms} rooms, ${report.history} history rows`)]);
  return { ok: true, report };
}
