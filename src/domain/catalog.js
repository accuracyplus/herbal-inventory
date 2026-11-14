/**
 * Reading stock, and keeping the item list.
 */

import { refuse } from '../lib/errors.js';
import { gstDate, nonNegative, nowIso, q3, text, uuid } from '../lib/data.js';
import { auditStmt } from '../lib/audit.js';
import { may } from './access.js';
import { barcodeOwner, findByCode } from './scanning.js';
import { commit } from './stock.js';
import { featureOn, setting } from './settings.js';
import { locationsByItem, locationStatements, packsByItem, packStatements } from './packs.js';

/** OUT, CRITICAL, LOW or OK, for one store's quantity against its levels. */
export function levelStatus(qty, lv) {
  if (!lv) return qty <= 0 ? 'OUT' : 'OK';
  if (qty <= 0 && (lv.reorder > 0 || lv.critical > 0 || lv.par > 0)) return 'OUT';
  if (lv.critical > 0 && qty <= lv.critical) return 'CRITICAL';
  if (lv.reorder > 0 && qty <= lv.reorder) return 'LOW';
  return qty <= 0 ? 'OUT' : 'OK';
}

export async function listStores(env, user, { all = false } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT id, code, name, kind, sort, active FROM stores WHERE unit_id = ? ${all ? '' : 'AND active = 1'} ORDER BY kind, sort, name`,
  ).bind(user.unitId).all();
  return (results || []).map((s) => ({ ...s, mine: !user.stores || user.stores.includes(s.id) }));
}

export async function listAreas(env, user, { all = false } = {}) {
  const { results } = await env.DB.prepare(
    `SELECT a.id, a.code, a.name, a.kind, a.active, a.department_id, d.name AS department_name
       FROM areas a LEFT JOIN departments d ON d.id = a.department_id
      WHERE a.unit_id = ? ${all ? '' : 'AND a.active = 1'} ORDER BY a.name`,
  ).bind(user.unitId).all();
  return results || [];
}

/**
 * The stock list: one row per item, with each store's quantity, levels and status, the nearest
 * expiry, and linen states. Costs only for roles that may see them.
 */
export async function stockList(env, user, { includeInactive = false } = {}) {
  const showCost = may(user, 'cost.view');
  const [{ results: items }, { results: bals }, { results: levels }, { results: exp }, { results: heldRows }] = await Promise.all([
    env.DB.prepare(
      `SELECT id, code, name, category, uom, barcode, tracks_expiry, is_linen, avg_cost, last_cost, supplier_id, active, notes,
              storage, open_life_days
         FROM items WHERE unit_id = ? ${includeInactive ? '' : 'AND active = 1'} ORDER BY category, name`,
    ).bind(user.unitId).all(),
    env.DB.prepare(
      `SELECT b.store_id, b.item_id, b.qty, b.in_use, b.in_wash, b.on_hold FROM balances b JOIN stores s ON s.id = b.store_id
        WHERE s.unit_id = ?`,
    ).bind(user.unitId).all(),
    env.DB.prepare(
      `SELECT lv.item_id, lv.store_id, lv.reorder, lv.critical, lv.par FROM item_levels lv JOIN stores s ON s.id = lv.store_id
        WHERE s.unit_id = ?`,
    ).bind(user.unitId).all(),
    env.DB.prepare(
      `SELECT bt.item_id, bt.store_id, MIN(bt.expiry) AS next_expiry,
              SUM(CASE WHEN bt.expiry = '' THEN bt.qty ELSE 0 END) AS unknown_expiry_qty
         FROM batches bt JOIN stores s ON s.id = bt.store_id
        WHERE s.unit_id = ? AND bt.qty > 0
        GROUP BY bt.item_id, bt.store_id`,
    ).bind(user.unitId).all(),
    env.DB.prepare(`SELECT item_id, store_id, SUM(qty) AS qty FROM custody WHERE unit_id = ? AND qty > 0 GROUP BY item_id, store_id`).bind(user.unitId).all(),
  ]);
  const { results: extraCodes } = await env.DB.prepare(`SELECT item_id, barcode FROM item_barcodes WHERE unit_id = ?`).bind(user.unitId).all();
  const codesOf = new Map();
  for (const b of extraCodes || []) codesOf.set(b.item_id, [...(codesOf.get(b.item_id) || []), b.barcode]);
  const key = (a, b) => `${a}|${b}`;
  const balMap = new Map((bals || []).map((b) => [key(b.item_id, b.store_id), b]));
  const heldMap = new Map((heldRows || []).map((h) => [key(h.item_id, h.store_id), h.qty]));
  const lvMap = new Map((levels || []).map((l) => [key(l.item_id, l.store_id), l]));
  const expMap = new Map();
  for (const e of exp || []) {
    // MIN('') is '', so a store with an unknown-expiry batch must look past it for a real date.
    expMap.set(key(e.item_id, e.store_id), e);
  }
  const realExpiry = await env.DB.prepare(
    `SELECT bt.item_id, bt.store_id, MIN(bt.expiry) AS next_expiry FROM batches bt JOIN stores s ON s.id = bt.store_id
      WHERE s.unit_id = ? AND bt.qty > 0 AND bt.expiry <> '' GROUP BY bt.item_id, bt.store_id`,
  ).bind(user.unitId).all();
  for (const e of realExpiry.results || []) {
    const k = key(e.item_id, e.store_id);
    expMap.set(k, { ...(expMap.get(k) || {}), next_expiry: e.next_expiry });
  }
  const stores = await listStores(env, user);
  const today = gstDate();
  const warnDays = Number(await setting(env, user.unitId, 'expiry.warn_days')) || 60;
  const warnBy = gstDate(Date.now() + warnDays * 864e5);
  const packs = (await featureOn(env, user.unitId, 'packs.on')) ? await packsByItem(env, user.unitId) : null;
  const places = await locationsByItem(env, user.unitId);

  const rows = (items || []).map((it) => {
    const per = stores.map((s) => {
      const b = balMap.get(key(it.id, s.id));
      const lv = lvMap.get(key(it.id, s.id)) || null;
      const e = expMap.get(key(it.id, s.id));
      const qty = b?.qty ?? 0;
      return {
        storeId: s.id, qty, inUse: b?.in_use ?? 0, inWash: b?.in_wash ?? 0, withPeople: heldMap.get(key(it.id, s.id)) ?? 0,
        onHold: b?.on_hold ?? 0,
        ...(places ? { location: places.get(key(it.id, s.id)) || null } : {}),
        level: lv ? { reorder: lv.reorder, critical: lv.critical, par: lv.par } : null,
        status: levelStatus(qty, lv),
        nextExpiry: e?.next_expiry && e.next_expiry !== '' ? e.next_expiry : null,
        unknownExpiryQty: e?.unknown_expiry_qty || 0,
        held: !!b || !!lv,
      };
    });
    const total = q3(per.reduce((s, p) => s + p.qty + p.inUse + p.inWash + p.onHold + p.withPeople, 0));
    const expiries = per.map((p) => p.nextExpiry).filter(Boolean).sort();
    const next = expiries[0] || null;
    const worst = ['OUT', 'CRITICAL', 'LOW', 'OK'].find((st) => per.some((p) => p.held && p.status === st)) || 'OK';
    return {
      id: it.id, code: it.code, name: it.name, category: it.category, uom: it.uom, barcode: it.barcode, barcodes: codesOf.get(it.id) || [],
      tracksExpiry: !!it.tracks_expiry, isLinen: !!it.is_linen, active: !!it.active, notes: it.notes,
      supplierId: it.supplier_id, storage: it.storage || null, openLifeDays: it.open_life_days ?? null,
      ...(packs ? { packs: packs.get(it.id) || [] } : {}),
      avgCost: showCost ? it.avg_cost : undefined,
      lastCost: showCost ? it.last_cost : undefined,
      value: showCost ? Math.round(total * (it.avg_cost || 0) * 100) / 100 : undefined,
      total, stores: per, status: worst,
      nextExpiry: next,
      expiry: next ? (next < today ? 'EXPIRED' : next <= warnBy ? 'SOON' : 'OK') : null,
    };
  });
  return { stores, items: rows, warnDays, showCost };
}

export async function itemDetail(env, user, id) {
  const it = await env.DB.prepare(`SELECT * FROM items WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
  if (!it) refuse('NOT_FOUND', 'That item does not exist in this unit.', 404);
  const showCost = may(user, 'cost.view');
  const [{ results: bals }, { results: levels }, { results: batches }, { results: moves }, sup] = await Promise.all([
    env.DB.prepare(`SELECT b.*, s.name AS store_name FROM balances b JOIN stores s ON s.id = b.store_id WHERE b.item_id = ? ORDER BY s.kind, s.sort, s.name`).bind(id).all(),
    env.DB.prepare(`SELECT lv.*, s.name AS store_name FROM item_levels lv JOIN stores s ON s.id = lv.store_id WHERE lv.item_id = ?`).bind(id).all(),
    env.DB.prepare(
      `SELECT bt.id, bt.store_id, s.name AS store_name, bt.batch_no, bt.expiry, bt.qty, bt.received_at
         FROM batches bt JOIN stores s ON s.id = bt.store_id
        WHERE bt.item_id = ? AND bt.qty > 0
        ORDER BY CASE WHEN bt.expiry = '' THEN 1 ELSE 0 END, bt.expiry`,
    ).bind(id).all(),
    env.DB.prepare(
      `SELECT m.id, m.at, m.kind, m.qty, m.balance_after, m.from_state, m.to_state, m.unit_cost, m.value, m.doc_type, m.doc_ref,
              m.reason, m.note, m.actor_name, m.actor_id, s.name AS store_name, a.name AS area_name, cs.name AS counterpart_name,
              bt.batch_no, bt.expiry
         FROM movements m JOIN stores s ON s.id = m.store_id
         LEFT JOIN areas a ON a.id = m.area_id
         LEFT JOIN stores cs ON cs.id = m.counterpart_store_id
         LEFT JOIN batches bt ON bt.id = m.batch_id
        WHERE m.item_id = ? ORDER BY m.at DESC LIMIT 60`,
    ).bind(id).all(),
    it.supplier_id ? env.DB.prepare(`SELECT id, name FROM suppliers WHERE id = ?`).bind(it.supplier_id).first() : null,
  ]);
  const usage = await env.DB.prepare(
    `SELECT COALESCE(SUM(-qty), 0) AS used FROM movements
      WHERE item_id = ? AND kind = 'ISSUE' AND at > datetime('now', '-30 days')`,
  ).bind(id).first();
  // Who did what is for the store and the managers: somebody without reports (a therapist) sees
  // their own name on their own lines and nobody else's, as on their treatments list.
  const others = !may(user, 'reports');
  const strip = ({ actor_id, ...m }) => {
    if (others && actor_id !== user.staffId) m = { ...m, actor_name: null };
    return showCost
      ? (['ISSUE', 'TAKE', 'RETURN'].includes(m.kind) && !may(user, 'cost.people') ? { ...m, actor_name: null } : m)
      : { ...m, unit_cost: undefined, value: undefined };
  };
  // How much, never who: this sheet is open to everybody who can see stock.
  const out = await env.DB.prepare(`SELECT COALESCE(SUM(qty), 0) AS n FROM custody WHERE item_id = ? AND qty > 0`).bind(id).first();
  const packs = (await featureOn(env, user.unitId, 'packs.on')) ? (await packsByItem(env, user.unitId, [id])).get(id) || [] : undefined;
  const places = await locationsByItem(env, user.unitId);
  return {
    ...it,
    packs,
    locations: places ? (bals || []).map((b) => ({ store_id: b.store_id, location: places.get(`${id}|${b.store_id}`) || null })) : undefined,
    with_people: q3(out?.n || 0),
    avg_cost: showCost ? it.avg_cost : undefined,
    last_cost: showCost ? it.last_cost : undefined,
    supplier: sup,
    balances: bals || [], levels: levels || [], batches: batches || [],
    movements: (moves || []).map(strip),
    used30: q3(usage?.used || 0),
  };
}

function itemFields(body) {
  const name = text(body.name, 120);
  if (!name) refuse('NAME_REQUIRED', 'The item needs a name.');
  const code = text(body.code, 40);
  if (!code) refuse('CODE_REQUIRED', 'The item needs a code.');
  if (!/^[A-Za-z0-9._\-/]+$/.test(code)) refuse('BAD_CODE', 'Use letters, numbers, dot, dash, slash or underscore in the code.');
  const isLinen = body.isLinen ? 1 : 0;
  const tracksExpiry = body.tracksExpiry ? 1 : 0;
  if (isLinen && tracksExpiry) refuse('LINEN_EXPIRY', 'Linen does not expire. Choose one or the other.');
  return {
    code: code.toUpperCase(), name, category: text(body.category, 60) || 'General', uom: text(body.uom, 20) || 'pcs',
    barcode: text(body.barcode, 64), tracks_expiry: tracksExpiry, is_linen: isLinen,
    supplier_id: body.supplierId || null, notes: text(body.notes, 500),
  };
}

export const STORAGE = { ROOM: 'Room temperature', FRIDGE: 'Fridge, 2 to 8 °C', FREEZER: 'Freezer' };

/**
 * Storage and life once opened, only when the form sent them: a form or a sheet that does not
 * know about them leaves what is set alone. Returns the statement, or null.
 */
function labStatement(env, itemId, body) {
  const hasStorage = Object.prototype.hasOwnProperty.call(body, 'storage');
  const hasLife = Object.prototype.hasOwnProperty.call(body, 'openLifeDays');
  if (!hasStorage && !hasLife) return null;
  const storage = body.storage ? String(body.storage).toUpperCase() : null;
  if (storage && !STORAGE[storage]) refuse('BAD_STORAGE', 'Choose room temperature, fridge or freezer.');
  const raw = body.openLifeDays;
  const life = raw === '' || raw === null || raw === undefined ? null : Number(raw);
  if (life !== null && !(Number.isInteger(life) && life >= 1 && life <= 3650)) refuse('BAD_OPEN_LIFE', 'Days usable once opened: a whole number from 1 to 3650, or leave it empty.');
  const sets = [];
  const args = [];
  if (hasStorage) { sets.push('storage = ?'); args.push(storage); }
  if (hasLife) { sets.push('open_life_days = ?'); args.push(life); }
  return env.DB.prepare(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`).bind(...args, itemId);
}

/** "Inspect on arrival", only when the form sent it. */
const inspectStatement = (env, itemId, body) => (Object.prototype.hasOwnProperty.call(body, 'inspect')
  ? env.DB.prepare(`UPDATE items SET inspect = ? WHERE id = ?`).bind(body.inspect ? 1 : 0, itemId)
  : null);

export async function saveItem(env, user, body, id = null) {
  const f = itemFields(body);
  if (f.supplier_id) {
    const s = await env.DB.prepare(`SELECT 1 FROM suppliers WHERE id = ? AND unit_id = ?`).bind(f.supplier_id, user.unitId).first();
    if (!s) refuse('NOT_FOUND', 'That supplier is not in this unit.', 404);
  }
  const clash = await env.DB.prepare(`SELECT id FROM items WHERE unit_id = ? AND UPPER(code) = ? AND id <> ?`)
    .bind(user.unitId, f.code, id || '').first();
  if (clash) refuse('CODE_TAKEN', `Another item already uses the code ${f.code}.`, 409);
  if (f.barcode) {
    const owner = await barcodeOwner(env, user.unitId, f.barcode, id || '');
    if (owner) refuse('BARCODE_TAKEN', `${f.barcode} already belongs to ${owner.name}.`, 409);
  }
  const now = nowIso();
  if (id) {
    const it = await env.DB.prepare(`SELECT * FROM items WHERE id = ? AND unit_id = ?`).bind(id, user.unitId).first();
    if (!it) refuse('NOT_FOUND', 'That item does not exist in this unit.', 404);
    // Switching expiry tracking or linen on an item that already holds stock would leave the
    // batches or linen states disagreeing with the shelf.
    const held = await env.DB.prepare(
      `SELECT 1 FROM balances WHERE item_id = ?1 AND (qty > 0 OR in_use > 0 OR in_wash > 0)
       UNION ALL SELECT 1 FROM custody WHERE item_id = ?1 AND qty > 0 LIMIT 1`,
    ).bind(id).first();
    if (held && it.is_linen !== f.is_linen) {
      refuse('HAS_STOCK', `${it.name} has stock. Linen can only be switched on or off while it holds none.`);
    }
    // Expiry tracking can be switched on with stock on the shelf (the usual case after the
    // import): what is there becomes one batch per store with no date, which the expiry report
    // and Today show as "no date" until a count or correction puts the real dates in.
    // Switched off, the batches are dropped and the shelf quantity stands as it is.
    const batchStmts = [];
    if (!it.tracks_expiry && f.tracks_expiry) {
      batchStmts.push(env.DB.prepare(
        `INSERT INTO batches (id, store_id, item_id, batch_no, expiry, qty, received_at)
         SELECT lower(hex(randomblob(16))), store_id, item_id, '', '', qty, ? FROM balances WHERE item_id = ? AND qty > 0`,
      ).bind(now, id));
    } else if (it.tracks_expiry && !f.tracks_expiry) {
      batchStmts.push(env.DB.prepare(`DELETE FROM batches WHERE item_id = ?`).bind(id));
    }
    await commit(env, [
      ...batchStmts,
      env.DB.prepare(
        `UPDATE items SET code = ?, name = ?, category = ?, uom = ?, barcode = ?, tracks_expiry = ?, is_linen = ?,
                          supplier_id = ?, notes = ?, active = ?, updated_at = ?, updated_by = ? WHERE id = ?`,
      ).bind(f.code, f.name, f.category, f.uom, f.barcode, f.tracks_expiry, f.is_linen, f.supplier_id, f.notes,
             body.active === false ? 0 : 1, now, user.fullName, id),
      ...levelStatements(env, id, body.levels),
      ...[labStatement(env, id, body), inspectStatement(env, id, body)].filter(Boolean),
      ...await packStatements(env, user, id, body),
      ...await locationStatements(env, user, id, body.levels),
      auditStmt(env, user, 'ITEM_EDIT', f.code, f.name),
    ]);
    return { ok: true, id };
  }
  const newId = uuid();
  await commit(env, [
    env.DB.prepare(
      `INSERT INTO items (id, unit_id, code, name, category, uom, barcode, tracks_expiry, is_linen, avg_cost, last_cost,
                          supplier_id, notes, active, updated_at, updated_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    ).bind(newId, user.unitId, f.code, f.name, f.category, f.uom, f.barcode, f.tracks_expiry, f.is_linen,
           nonNegative(body.unitCost) ?? 0, nonNegative(body.unitCost), f.supplier_id, f.notes, now, user.fullName),
    ...levelStatements(env, newId, body.levels),
    ...[labStatement(env, newId, body), inspectStatement(env, newId, body)].filter(Boolean),
    ...await packStatements(env, user, newId, body),
    ...await locationStatements(env, user, newId, body.levels),
    auditStmt(env, user, 'ITEM_CREATE', f.code, f.name),
  ]);
  return { ok: true, id: newId };
}

/** levels: [{ storeId, reorder, critical, par }] — a row of zeros removes the store's levels. */
function levelStatements(env, itemId, levels) {
  if (!Array.isArray(levels)) return [];
  return levels.map((l) => {
    const reorder = nonNegative(l.reorder) ?? 0;
    const critical = nonNegative(l.critical) ?? 0;
    const par = nonNegative(l.par) ?? 0;
    if (critical > reorder && reorder > 0) refuse('BAD_LEVELS', 'The critical level should be at or below the reorder level.');
    if (par > 0 && par < reorder) refuse('BAD_LEVELS', 'The top-up (par) level should be above the reorder level.');
    if (!reorder && !critical && !par) {
      return env.DB.prepare(`DELETE FROM item_levels WHERE item_id = ? AND store_id = ?`).bind(itemId, l.storeId);
    }
    return env.DB.prepare(
      `INSERT INTO item_levels (item_id, store_id, reorder, critical, par)
       SELECT ?, id, ?, ?, ? FROM stores WHERE id = ? AND unit_id = (SELECT unit_id FROM items WHERE id = ?)
       ON CONFLICT(item_id, store_id) DO UPDATE SET reorder = excluded.reorder, critical = excluded.critical, par = excluded.par`,
    ).bind(itemId, reorder, critical, par, l.storeId, itemId);
  });
}

export async function categories(env, user) {
  const { results } = await env.DB.prepare(
    `SELECT category, COUNT(*) AS n FROM items WHERE unit_id = ? AND active = 1 GROUP BY category ORDER BY category`,
  ).bind(user.unitId).all();
  return results || [];
}

/** Find by any of an item's barcodes, or its exact code — for the scanners. */
export async function lookup(env, user, codeOrBarcode) {
  return findByCode(env, user.unitId, codeOrBarcode);
}
