/**
 * Feature 14: enterprise features, each behind a per-unit setting. Part 1: approval limits by
 * amount, and month close.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { HP, PEOPLE, S, bal, call, makeItem, receive, testEnv } from './helpers/http.js';

export const settings = (env, values, as = 'admin') => call(env, 'PUT', '/api/settings', { as, body: values });

async function withStock(cost = 100, qty = 100) {
  const env = testEnv();
  env.oil = await makeItem(env);
  await receive(env, env.oil, qty, { unitCost: cost });
  return env;
}

const correction = async (env, qty) => {
  const r = await call(env, 'POST', '/api/adjustments', { as: 'keeper', body: { storeId: S.main, reason: 'DAMAGED', lines: [{ itemId: env.oil, qty }] } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body.id;
};
const approveCorrection = (env, id, as) => call(env, 'POST', `/api/adjustments/${id}/decide`, { as, body: { action: 'APPROVE' } });

test('approval limits: off, a manager approves any amount', async () => {
  const env = await withStock();
  const id = await correction(env, -60); // AED 6,000
  assert.equal((await approveCorrection(env, id, 'manager')).status, 200);
});

test('approval limits: above the amount a correction needs a unit administrator or a director', async () => {
  const env = await withStock();
  await settings(env, { 'limits.on': 'on', 'limits.writeoff': '1000' });
  const small = await correction(env, -5); // AED 500
  assert.equal((await approveCorrection(env, small, 'manager')).status, 200, 'under the limit: a manager');

  const big = await correction(env, -20); // AED 2,000
  const refused = await approveCorrection(env, big, 'manager');
  assert.equal(refused.status, 403);
  assert.equal(refused.body.error.code, 'OVER_LIMIT');
  assert.match(refused.body.error.message, /AED 2000\.00, above the AED 1000\.00 a manager may approve/);
  assert.equal(bal(env, S.main, env.oil).qty, 95, 'nothing moved');

  env.DB.db.prepare(`UPDATE staff SET group_summary = 1 WHERE id = ?`).run(PEOPLE.manager.id);
  assert.equal((await approveCorrection(env, big, 'manager')).status, 200, 'a manager ticked Director may');
  assert.equal(bal(env, S.main, env.oil).qty, 75);

  const me = (await call(env, 'GET', '/api/me', { as: 'keeper' })).body;
  assert.deepEqual(me.limits, { po: 5000, writeoff: 1000, count: 1000, anyAmount: false });
});

test('approval limits: a count counts shortages and surpluses together', async () => {
  const env = await withStock();
  const other = await makeItem(env, { name: 'Towel soap' });
  await receive(env, other, 100, { unitCost: 100 });
  await settings(env, { 'limits.on': 'on', 'limits.count': '1500' });
  const c = await call(env, 'POST', '/api/counts', { as: 'keeper', body: { storeId: S.main } });
  await call(env, 'PUT', `/api/counts/${c.body.id}/lines`, { as: 'keeper', body: { lines: [{ itemId: env.oil, counted: 90 }, { itemId: other, counted: 110 }] } });
  await call(env, 'POST', `/api/counts/${c.body.id}/submit`, { as: 'keeper' });
  const refused = await call(env, 'POST', `/api/counts/${c.body.id}/approve`, { as: 'manager' });
  assert.equal(refused.body.error?.code, 'OVER_LIMIT', 'AED 1,000 short and 1,000 over is 2,000 of difference, not nothing');
  assert.equal((await call(env, 'POST', `/api/counts/${c.body.id}/approve`, { as: 'admin' })).status, 200, 'a unit administrator may');
});

test('approval limits: a purchase order above the amount', async () => {
  const env = await withStock();
  env.DB.db.prepare(`INSERT INTO suppliers (id, unit_id, name, active) VALUES ('sp-1', ?, 'Kerala Oils', 1)`).run(HP);
  await settings(env, { 'limits.on': 'on', 'limits.po': '5000' });
  const po = await call(env, 'POST', '/api/pos', { as: 'buyer', body: { supplierId: 'sp-1', storeId: S.main, lines: [{ itemId: env.oil, qty: 60, unitCost: 100 }] } });
  await call(env, 'POST', `/api/pos/${po.body.id}/submit`, { as: 'buyer' });
  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'manager' })).body.error?.code, 'OVER_LIMIT');
  assert.equal((await call(env, 'POST', `/api/pos/${po.body.id}/approve`, { as: 'admin' })).status, 200);
});

// ── Month close ──────────────────────────────────────────────────────────────────────────

const close = (env, month, as = 'admin') => call(env, 'POST', '/api/periods/close', { as, body: { month } });

test('month close: off, the routes say where to switch it on', async () => {
  const env = testEnv();
  const r = await close(env, '2026-01');
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'FEATURE_OFF');
  assert.match(r.body.error.message, /Admin, Settings/);
});

test('month close: only a past month, only a unit administrator, and nothing dated in it can be posted', async () => {
  const env = await withStock();
  await settings(env, { 'accounting.on': 'on' });
  const thisMonth = new Date(Date.now() + 4 * 36e5).toISOString().slice(0, 7);
  assert.equal((await close(env, thisMonth)).body.error.code, 'NOT_OVER');
  assert.equal((await close(env, '2026-01', 'manager')).status, 403);
  assert.equal((await close(env, '2026-01')).status, 200);
  assert.equal((await close(env, '2026-01')).body.error.code, 'ALREADY_CLOSED');

  // The database refuses a movement dated in the closed month, whatever writes it.
  const insert = (at) => env.DB.db.prepare(
    `INSERT INTO movements (id, unit_id, at, kind, item_id, store_id, qty) VALUES (?, ?, ?, 'ADJUST', ?, ?, 1)`,
  ).run(`m-${at}`, HP, at, env.oil, S.main);
  assert.throws(() => insert('2026-01-15T10:00:00.000Z'), /PERIOD_CLOSED/);
  assert.throws(() => insert('2025-12-31T21:00:00.000Z'), /PERIOD_CLOSED/, '01:00 on 1 January in the Gulf');
  insert('2025-12-31T19:00:00.000Z'); // 23:00 on 31 December in the Gulf: open
  insert('2026-02-01T08:00:00.000Z');

  // Today's work goes on.
  const id = await correction(env, -1);
  assert.equal((await approveCorrection(env, id, 'manager')).status, 200);

  const list = (await call(env, 'GET', '/api/periods', { as: 'manager' })).body;
  assert.deepEqual(list.map((p) => p.month), ['2026-01']);
  assert.equal((await call(env, 'POST', '/api/periods/reopen', { as: 'admin', body: { month: '2026-01' } })).body.error.code, 'REASON_REQUIRED');
  assert.equal((await call(env, 'POST', '/api/periods/reopen', { as: 'admin', body: { month: '2026-01', reason: 'Late invoice' } })).status, 200);
  insert('2026-01-20T10:00:00.000Z');
  const log = env.DB.db.prepare(`SELECT action, detail FROM audit_log WHERE action LIKE 'PERIOD_%' ORDER BY at`).all();
  assert.deepEqual(log.map((l) => l.action), ['PERIOD_CLOSE', 'PERIOD_REOPEN']);
});
