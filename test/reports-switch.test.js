/**
 * Reports: moving from any report to any other never takes the app down (13 Nov 2026: tapping
 * "Old app history" after another report white-screened Inventory, because the history panel was
 * drawn once with the previous report's answer before its own arrived).
 *
 * The real Reports screen, built from client/src with esbuild and drawn with React's own server
 * renderer, is handed the real Worker's answer for every report. Three things are proved:
 *   1. each report's own answer has the shape its panel expects, and the panel draws;
 *   2. what the page holds after one report is never handed to the next one's panel;
 *   3. every panel, given any other report's answer, draws nothing rather than failing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, FOR, HP, makeItem, receive, S, testEnv } from './helpers/http.js';

const client = join(dirname(fileURLToPath(import.meta.url)), '..', 'client');
const ready = existsSync(join(client, 'node_modules', 'react-dom'));
const skip = ready ? false : 'the client is not installed here (cd client && npm ci)';

/** The client's Reports screen and its pieces, built for Node. */
async function loadClient() {
  const { build } = await import('esbuild');
  const out = await build({
    stdin: {
      contents: `
        export { ALL, FITS, ReportBody, reportPath, startingReport } from './src/screens/Reports.jsx';
        export { AppCtx, dataFor } from './src/ui.jsx';
        export { renderToString } from 'react-dom/server';
        export { createElement } from 'react';`,
      resolveDir: client, loader: 'js',
    },
    bundle: true, platform: 'node', format: 'cjs', write: false, jsx: 'automatic', logLevel: 'silent',
    loader: { '.jsx': 'jsx', '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
    define: { 'import.meta.env': '{}' },
  });
  const dir = mkdtempSync(join(tmpdir(), 'inv-reports-'));
  const file = join(dir, 'reports.cjs');
  writeFileSync(file, out.outputFiles[0].text);
  try { return createRequire(import.meta.url)(file); } finally { rmSync(dir, { recursive: true, force: true }); }
}

/** A unit with something in every report, and the Worker's answer to each. */
async function answers(c) {
  const env = testEnv();
  const oil = await makeItem(env, { code: 'OIL-1', name: 'Dhanwantharam thailam', category: 'Oils', tracksExpiry: true });
  const cloth = await makeItem(env, { code: 'CON-1', name: 'Kizhi cloth', category: 'Consumables', uom: 'pcs' });
  await receive(env, oil, 12, { expiry: new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10), batchNo: 'N-1' });
  await receive(env, cloth, 30);
  const use = await call(env, 'POST', '/api/use', { as: 'keeper', body: { storeId: S.main, ...FOR, lines: [{ itemId: cloth, qty: 4 }] } });
  assert.equal(use.status, 201, JSON.stringify(use.body));
  env.DB.db.prepare(`INSERT INTO legacy_movements (id, unit_id, at, type, item_name, qty, store, staff, purpose, remarks) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run('lg-1', HP, '2025-03-02 10:15', 'OUT', 'Kizhi cloth', 2, 'Main store', 'Sara', 'Treatment room 1', null);

  const today = new Date().toISOString().slice(0, 10);
  const range = { from: new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10), to: today, month: today.slice(0, 7), storeId: '' };
  const tabs = c.ALL.map(([k]) => k);
  const paths = Object.fromEntries(tabs.map((k) => [k, c.reportPath(k, range)]));
  const got = {};
  for (const k of tabs) {
    const r = await call(env, 'GET', paths[k], { as: 'admin' });
    assert.equal(r.status, 200, `${k}: ${JSON.stringify(r.body)}`);
    got[k] = r.body;
  }
  return { tabs, paths, got };
}

const ctx = {
  me: { settings: {}, groupSummary: true }, can: () => true, currency: 'AED',
  lists: { stores: [], areas: [] }, route: { query: new URLSearchParams() }, toast: () => {}, navigate: () => {},
};

test('reports: switching between every report never hands one report another\'s answer, and nothing fails to draw', { skip }, async () => {
  const c = await loadClient();
  const { tabs, paths, got } = await answers(c);
  assert.equal(tabs.length, 11, 'every report, including the group summary and the old app history');
  const draw = (tab, data) => c.renderToString(c.createElement(c.AppCtx.Provider, { value: ctx }, c.createElement(c.ReportBody, { tab, data })));

  // 1. Each report's own answer fits its panel, and the panel draws.
  const marks = { legacy: 'History from the old Google Sheet app', expiry: 'Dhanwantharam thailam', ledger: 'Every movement', valuation: 'On hand', consumption: 'Kizhi cloth' };
  for (const k of tabs) {
    assert.ok(c.FITS[k](got[k]), `${k}: its own answer has the shape its panel expects`);
    const html = draw(k, got[k]);
    assert.ok(html.length > 0, `${k}: draws`);
    if (marks[k]) assert.ok(html.includes(marks[k]), `${k}: shows "${marks[k]}"`);
  }

  for (const from of tabs) {
    const held = { data: got[from], error: null, loading: false, for: paths[from] };
    for (const to of tabs) {
      // 2. The render straight after the switch: what the page still holds is not passed on.
      const shown = c.dataFor(held, paths[to]);
      if (from === to) assert.equal(shown.data, got[from]);
      else {
        assert.equal(shown.data, null, `${from} → ${to}: the old answer is not handed on`);
        assert.equal(shown.loading, true, `${from} → ${to}: the page says it is loading`);
      }
      // 3. Even if it were, the panel draws nothing rather than failing.
      let html;
      assert.doesNotThrow(() => { html = draw(to, got[from]); }, `${to} drawn with the ${from} answer`);
      if (from !== to && !c.FITS[to](got[from])) assert.equal(html, '', `${to} with the ${from} answer: nothing drawn`);
    }
  }

  // The exact crash of 13 Nov 2026: Usage, then Old app history.
  assert.doesNotThrow(() => draw('legacy', got.consumption));
  assert.equal(draw('legacy', got.consumption), '');
  for (const odd of [null, undefined, {}, [], 'text', 0]) for (const k of tabs) assert.doesNotThrow(() => draw(k, odd), `${k} with ${JSON.stringify(odd)}`);
});

test('reports: other dates for the same report keep the table up until the new answer comes', { skip }, async () => {
  const c = await loadClient();
  const held = { data: { rows: [] }, error: null, loading: false, for: '/api/reports/ledger?from=2026-10-01&to=2026-10-30' };
  assert.equal(c.dataFor(held, '/api/reports/ledger?from=2026-09-01&to=2026-10-30').data, held.data);
  assert.equal(c.dataFor(held, '/api/reports/variance?from=2026-09-01&to=2026-10-30').data, null);
  assert.equal(c.dataFor(held, null).data, null);
  assert.equal(c.dataFor({ ...held, data: null, error: new Error('x') }, '/api/legacy').error, null, 'nor is another report\'s error');
});

test('reports: a link to a report opens it; one the person does not have, or no such report, opens the first', { skip }, async () => {
  const c = await loadClient();
  const tabs = c.ALL.filter(([k]) => k !== 'group');
  assert.equal(c.startingReport('legacy', tabs), 'legacy');
  assert.equal(c.startingReport('expiry', tabs), 'expiry');
  assert.equal(c.startingReport('group', tabs), 'consumption');
  assert.equal(c.startingReport('nonsense', tabs), 'consumption');
  assert.equal(c.startingReport(null, tabs), 'consumption');
});
