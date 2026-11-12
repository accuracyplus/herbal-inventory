/**
 * Suggested levels from real use. The rule is tested alone, then end to end: what counts as
 * use, where the days to restock come from, and that nothing changes until a manager accepts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { call, FOR, HV, makeItem, receive, S, testEnv } from './helpers/http.js';
import { differs, suggest } from '../src/domain/forecast.js';

const T = { leadDays: 7, safetyDays: 3, coverDays: 14 };
// The ledger refuses edits (a trigger). These throwaway databases switch it off to back-date
// their own made-up history; nothing in the app can.
const daysAgo = (env, n, where) => {
  env.DB.db.exec('DROP TRIGGER IF EXISTS movements_no_update');
  env.DB.db.prepare(`UPDATE movements SET at = ? WHERE ${where}`).run(new Date(Date.now() - n * 864e5).toISOString());
};
const use = (env, itemId, qty, storeId = S.main) => call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId, ...FOR, lines: [{ itemId, qty }] } });
const rowFor = (out, itemId) => out.rows.find((r) => r.itemId === itemId);

// ── The rule ─────────────────────────────────────────────────────────────────

test('rule: steady use gives critical for the wait, reorder with days to spare, top up for the days an order lasts', () => {
  // 30 in 30 days and 90 in 90 days: one a day.
  assert.deepEqual(suggest({ used30: 30, used90: 90, daysKnown: 200, ...T }), { rate: 1, critical: 7, reorder: 10, par: 24 });
});

test('rule: recent use counts, but one busy month does not swing it all the way', () => {
  // 60 in the last 30 days, nothing before that: two a day lately, two-thirds a day over 90.
  const s = suggest({ used30: 60, used90: 60, daysKnown: 200, ...T });
  assert.equal(s.rate, 1.333);
  assert.deepEqual([s.critical, s.reorder, s.par], [10, 14, 33]);
});

test('rule: an item new to the store is not judged over days it was not there', () => {
  // 20 used in the 40 days it has been here: half a day, not 20 / 90.
  const s = suggest({ used30: 15, used90: 20, daysKnown: 40, ...T });
  assert.equal(s.rate, 0.5);
  // Fewer than 30 days known still divides by at least 30.
  assert.equal(suggest({ used30: 6, used90: 6, daysKnown: 3, ...T }).rate, 0.2);
});

test('rule: slow items still get a reorder level of one, and top up always sits above reorder', () => {
  const s = suggest({ used30: 0, used90: 1, daysKnown: 200, ...T }); // one in 90 days
  assert.deepEqual([s.critical, s.reorder, s.par], [1, 1, 2]);
  assert.equal(suggest({ used30: 0, used90: 0, daysKnown: 200, ...T }), null, 'nothing used, nothing suggested');
  assert.equal(suggest({ used30: -2, used90: -2, daysKnown: 200, ...T }), null, 'more came back than went out is not use');
});

test('rule: a suggestion is worth a look when it is a fifth away from what is set, or nothing is set', () => {
  const next = { reorder: 10, critical: 7, par: 24 };
  assert.equal(differs(null, next), true);
  assert.equal(differs({ reorder: 10, critical: 7, par: 24 }, next), false);
  assert.equal(differs({ reorder: 9, critical: 7, par: 22 }, next), false, 'close enough');
  assert.equal(differs({ reorder: 5, critical: 7, par: 24 }, next), true);
});

// ── From the ledger ──────────────────────────────────────────────────────────

test('forecast: use, taking (less what came back) and transfers out count; corrections and held stock used do not', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  await receive(env, oil, 200);
  daysAgo(env, 100, `item_id = '${oil}'`); // the item has been in the store a long while
  await use(env, oil, 10);
  await call(env, 'POST', '/api/transfers', { as: 'keeper', body: { fromStoreId: S.main, toStoreId: S.sub, lines: [{ itemId: oil, qty: 5 }] } });
  const took = await call(env, 'POST', '/api/custody/take', { as: 'keeper', body: { storeId: S.main, areaId: FOR.areaId, personId: 'p-keeper', lines: [{ itemId: oil, qty: 4 }] } });
  assert.equal(took.status, 201, JSON.stringify(took.body));
  const lot = env.DB.db.prepare(`SELECT id FROM custody WHERE item_id = ?`).get(oil).id;
  const settle = (action, qty) => call(env, 'POST', `/api/custody/${action}`, { as: 'keeper', body: { areaId: FOR.areaId, lines: [{ custodyId: lot, qty }] } });
  assert.equal((await settle('return', 1)).status, 200);
  const usedHeld = await settle('use', 3);
  assert.equal(usedHeld.status, 200, JSON.stringify(usedHeld.body));
  // A write-off is not use.
  const adj = await call(env, 'POST', '/api/adjustments', { as: 'keeper', body: { storeId: S.main, reason: 'DAMAGED', lines: [{ itemId: oil, qty: -20 }] } });
  assert.ok([200, 201].includes(adj.status), JSON.stringify(adj.body));
  const posted = await call(env, 'POST', `/api/adjustments/${adj.body.id}/decide`, { as: 'manager', body: { action: 'APPROVE' } });
  assert.equal(posted.status, 200, JSON.stringify(posted.body));
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM movements WHERE kind = 'ADJUST' AND item_id = ?`).get(oil).n, 1, 'the write-off is on the ledger');

  const out = (await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'manager' })).body;
  const r = rowFor(out, oil);
  assert.equal(r.used30, 18, '10 used + 5 sent + 4 taken − 1 returned; the 3 used from what was held is not counted again');
  assert.equal(r.used90, 18);
  assert.equal(r.leadFrom, 'unit');
  assert.equal(r.leadDays, 7);
  assert.equal(r.now, null);
  assert.equal(r.differs, true);
  assert.equal(out.noLevels, 1);
});

test('forecast: a main store waits for the supplier, a sub store for the main store', async () => {
  const env = testEnv();
  const sup = (await call(env, 'POST', '/api/suppliers', { as: 'buyer', body: { name: 'Alpha', leadDays: 12 } })).body.id;
  const oil = await makeItem(env, { supplierId: sup });
  await receive(env, oil, 100);
  await receive(env, oil, 50, { storeId: S.sub });
  daysAgo(env, 120, `item_id = '${oil}'`);
  await use(env, oil, 30);
  await use(env, oil, 30, S.sub);

  const main = rowFor((await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'manager' })).body, oil);
  assert.deepEqual([main.leadFrom, main.leadDays, main.supplierName], ['supplier', 12, 'Alpha']);
  const sub = rowFor((await call(env, 'GET', `/api/forecast?store=${S.sub}`, { as: 'manager' })).body, oil);
  assert.deepEqual([sub.leadFrom, sub.leadDays], ['restock', 2]);

  // The unit's settings move the numbers.
  assert.equal((await call(env, 'PUT', '/api/settings', { body: { 'forecast.restock_days': '5', 'forecast.cover_days': '30' } })).status, 200);
  const again = rowFor((await call(env, 'GET', `/api/forecast?store=${S.sub}`, { as: 'manager' })).body, oil);
  assert.equal(again.leadDays, 5);
  assert.ok(again.suggested.par > sub.suggested.par);
});

test('forecast: items not used, linen and retired items get nothing; unused items with levels are counted', async () => {
  const env = testEnv();
  const idle = await makeItem(env, { levels: [{ storeId: S.main, reorder: 5, critical: 1, par: 10 }] });
  const sheet = await makeItem(env, { name: 'Bed sheet', isLinen: true });
  await receive(env, idle, 20);
  const out = (await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'manager' })).body;
  assert.equal(rowFor(out, idle), undefined);
  assert.equal(rowFor(out, sheet), undefined);
  assert.equal(out.unusedWithLevels, 1);
});

// ── Accepting ────────────────────────────────────────────────────────────────

test('accept: a manager sets the levels as suggested or changed, in one go, and What to buy uses them', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const rice = await makeItem(env, { name: 'Rice' });
  await receive(env, oil, 40);
  await receive(env, rice, 40);
  daysAgo(env, 100, `kind = 'RECEIPT'`);
  await use(env, oil, 30);
  await use(env, rice, 15);
  const out = (await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'manager' })).body;
  const o = rowFor(out, oil).suggested;

  const ok = await call(env, 'POST', '/api/forecast/accept', { as: 'manager', body: { storeId: S.main, rows: [
    { itemId: oil, ...o },
    { itemId: rice, reorder: 30, critical: 3, par: 60 }, // changed by the manager
  ] } });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  const lv = (id) => ({ ...env.DB.db.prepare(`SELECT reorder, critical, par FROM item_levels WHERE item_id = ? AND store_id = ?`).get(id, S.main) });
  assert.deepEqual(lv(oil), { reorder: o.reorder, critical: o.critical, par: o.par });
  assert.deepEqual(lv(rice), { reorder: 30, critical: 3, par: 60 });
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM audit_log WHERE action = 'LEVELS_FROM_FORECAST'`).get().n, 1);

  // Rice has 25 left against a reorder level of 30: What to buy now offers it, topped up to 60.
  const buy = (await call(env, 'GET', `/api/pos/suggestions?store=${S.main}`, { as: 'buyer' })).body;
  assert.equal(buy.find((r) => r.item_id === rice).suggest, 35);
  const after = rowFor((await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'manager' })).body, oil);
  assert.equal(after.differs, false, 'accepted: nothing more to look at');
});

test('accept: refused whole when any line is wrong, with the item named; nothing is half saved', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const rice = await makeItem(env, { name: 'Rice' });
  const bad = async (row, code, words) => {
    const r = await call(env, 'POST', '/api/forecast/accept', { as: 'manager', body: { storeId: S.main, rows: [{ itemId: oil, reorder: 5, critical: 1, par: 10 }, { itemId: rice, ...row }] } });
    assert.equal(r.status, 422, JSON.stringify(r.body));
    assert.equal(r.body.error.code, code);
    if (words) assert.match(r.body.error.message, words);
  };
  await bad({ reorder: 5, critical: 6, par: 10 }, 'BAD_LEVELS', /Rice: the critical level/);
  await bad({ reorder: 5, critical: 1, par: 5 }, 'BAD_LEVELS', /Rice: the top-up level/);
  await bad({ reorder: 0, critical: 0, par: 4 }, 'BAD_LEVELS', /reorder level must be above zero/);
  await bad({ reorder: 'lots', critical: 1, par: 9 }, 'BAD_LEVELS');
  assert.equal(env.DB.db.prepare(`SELECT COUNT(*) AS n FROM item_levels`).get().n, 0, 'oil was not saved either');
  const none = await call(env, 'POST', '/api/forecast/accept', { as: 'manager', body: { storeId: S.main, rows: [] } });
  assert.equal(none.body.error.code, 'NOTHING_CHOSEN');
});

test('accept and view: who may, and never another unit', async () => {
  const env = testEnv();
  const oil = await makeItem(env);
  const row = { itemId: oil, reorder: 5, critical: 1, par: 10 };
  assert.equal((await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'buyer' })).status, 200, 'the buyer sees the suggestions');
  assert.equal((await call(env, 'POST', '/api/forecast/accept', { as: 'buyer', body: { storeId: S.main, rows: [row] } })).status, 403, 'but a manager sets them');
  assert.equal((await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'staff' })).status, 403);
  assert.equal((await call(env, 'GET', `/api/forecast?store=${S.main}`, { as: 'hv', unit: HV })).status, 404, "another unit's store");
  // A manager in the other unit, in their own store, still cannot reach this unit's item.
  const other = await call(env, 'POST', '/api/forecast/accept', { as: 'hv', unit: HV, body: { storeId: S.hvMain, rows: [row] } });
  assert.equal(other.status, 404);
  assert.equal((await call(env, 'POST', '/api/forecast/accept', { as: 'hv', unit: HV, body: { storeId: S.main, rows: [row] } })).status, 404, "nor this unit's store");
});
