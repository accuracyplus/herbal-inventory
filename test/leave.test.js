/**
 * The HiFive corner button and the suite's leave guard (Design Guide C21; D-053, D-060 to D-062),
 * as Inventory uses them: client/src/leave.js, index.html, public/_headers.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { hasUnsaved, isUnsaved, markSaved, mayClose, mayLeave, pressedGuard, savesSomething } from '../client/src/leave.js';
import ml from '../client/src/i18n/ml.js';

const read = (p) => readFileSync(new URL(`../client/${p}`, import.meta.url), 'utf8');
const QUESTION = 'You have changes that are not saved. Leave this page and lose them?';

test('writes that save nothing never stop the asking; every other write does', () => {
  for (const p of ['/api/use', '/api/transfers', '/api/receipts', '/api/pos/abc', '/api/counts/abc/lines', '/api/settings', '/api/items/abc']) {
    assert.equal(savesSomething(p, {}), true, p);
  }
  for (const p of ['/api/me/prefs', '/api/prices/guide', '/api/receipts/read', '/api/scan/sessions', '/api/scan/sessions/abc/close']) {
    assert.equal(savesSomething(p, {}), false, p);
  }
  assert.equal(savesSomething('/api/bulk/items', { dryRun: true }), false, 'a check before saving');
  assert.equal(savesSomething('/api/bulk/items', { dryRun: false }), true, 'the save itself');
  assert.equal(savesSomething('/api/import', { dryRun: true }), false);
  assert.equal(savesSomething('/api/link/sheet', { dryRun: true }), false);
});

test('without the HiFive script, nothing asks and nothing breaks', () => {
  delete globalThis.window;
  assert.equal(mayLeave(), true);
  assert.equal(isUnsaved(), false);
  markSaved({});
  assert.equal(pressedGuard(), null, 'no page, so no press');
});

test('with the script: asks in the screen\'s words, and marks saved only what it is given', () => {
  const asked = [];
  const saved = [];
  let answer = false;
  globalThis.window = { HiFiveSuite: { confirmLeave: (m) => { asked.push(m); return answer; }, saved: (el) => saved.push(el), isUnsaved: () => true } };
  try {
    assert.equal(mayLeave(), false);
    answer = true;
    assert.equal(mayLeave(), true);
    assert.deepEqual(asked, [QUESTION, QUESTION]);
    assert.equal(isUnsaved(), true);
    markSaved(null);
    const el = {};
    markSaved(el);
    assert.deepEqual(saved, [el]);
  } finally { delete globalThis.window; }
});

test('the question has its Malayalam', () => {
  assert.ok(ml[QUESTION] && ml[QUESTION] !== QUESTION);
});

test('index.html loads the one shared script, and the page keeps a submitted form unsaved until it is saved', () => {
  const html = read('index.html');
  assert.match(html, /<script src="https:\/\/hifive-id-portal\.pages\.dev\/hub-button\.js" defer><\/script>/);
  assert.match(html, /<body data-hf-keep-on-submit>/);
});

test('the CSP lets in that one file and nothing else from HiFive ID', () => {
  const csp = read('public/_headers').match(/Content-Security-Policy: (.*)/)[1];
  const script = csp.split(';').find((d) => d.trim().startsWith('script-src')).trim().split(/\s+/);
  assert.ok(script.includes('https://hifive-id-portal.pages.dev/hub-button.js'));
  assert.ok(!script.some((s) => s === 'https://hifive-id-portal.pages.dev' || s === 'https://hifive-id-portal.pages.dev/'), 'the file, not the whole site');
  assert.ok(!script.includes("'unsafe-inline'"));
  assert.match(csp, /connect-src 'self' https:\/\/hifive-inventory\.sinusuresh\.workers\.dev;/, 'the script calls nothing, so connect-src is unchanged');
});

test('every window is guarded, except the four that only offer choices', () => {
  const files = ['App.jsx', 'tour.jsx', 'scan/ScanSheets.jsx', ...readdirSync(new URL('../client/src/screens/', import.meta.url)).map((f) => `screens/${f}`)];
  const off = [];
  for (const f of files) {
    const src = read(`src/${f}`);
    // Line by line: an arrow function's `=>` inside the tag would end a [^>]* match early.
    for (const line of src.split(/\r?\n/)) if (/<Sheet\b/.test(line) && line.includes('guard={false}')) off.push(`${f}: ${line.trim().slice(0, 60)}`);
  }
  assert.equal(off.length, 4, off.join('\n'));
  assert.ok(off.some((o) => o.startsWith('App.jsx: <Sheet title={me.name}')), 'the person\'s menu');
  assert.ok(off.some((o) => o.startsWith("App.jsx: <Sheet title={t('Choose a unit')}")), 'the unit switch');
  assert.ok(off.some((o) => o.startsWith('tour.jsx')), 'the welcome');
  assert.ok(off.some((o) => o.startsWith('scan/ScanSheets.jsx')), 'the scanner opened from a page');
});

test('the on-page forms are marked', () => {
  const marks = {
    'screens/Record.jsx': ['guard="record-use"', 'guard="transfer"'],
    'screens/Receive.jsx': ['guard="receive"'],
    'screens/WithMe.jsx': ['guard="take-stock"'],
    'screens/Services.jsx': ['<Guard name="treatment">'],
    'screens/Admin.jsx': ['<Guard name="settings">', '<Guard name="import">'],
    'screens/Levels.jsx': ['<Guard name="levels">'],
    'screens/Accounts.jsx': ['<Guard name="month-close">'],
    'screens/Deliveries.jsx': ['guard="delivery"'],
    'screens/ServiceLink.jsx': ['<Guard name="services-waiting">', '<Guard name="services-sheet">', '<Guard name="connections">'],
    'screens/Bulk.jsx': ['data-hf-unsaved={file && !report?.applied'],
    'lines.jsx': ['data-hf-unsaved={changed && lines.length > 0'],
  };
  for (const [f, want] of Object.entries(marks)) {
    const src = read(`src/${f}`);
    for (const w of want) assert.ok(src.includes(w), `${f}: ${w}`);
  }
});

test('a save that works marks its form saved; a refusal does not', () => {
  const api = read('src/api.js');
  const refused = api.indexOf('throw new ApiError(said');
  const marked = api.indexOf('markSaved(from)');
  assert.ok(refused > 0 && marked > refused, 'marked only after the refusal has been thrown');
  assert.match(api, /const from = method !== 'GET' && savesSomething\(path, body\) \? pressedGuard\(\) : null;/);
});

/** A stand-in for a window's element: connected, and holding unsaved lines or not. */
const fakeWindow = (unsaved) => ({ isConnected: true, matches: () => false, querySelector: () => (unsaved ? {} : null), contains: () => false });

test('closing a window asks only when something in it is unsaved, and only once after a yes', () => {
  const asked = [];
  let answer = false;
  globalThis.window = { confirm: (m) => { asked.push(m); return answer; } };
  try {
    assert.equal(mayClose(fakeWindow(false)), true, 'nothing changed: closes without a word');
    assert.equal(asked.length, 0);
    const w = fakeWindow(true);
    assert.equal(hasUnsaved(w), true);
    assert.equal(mayClose(w), false, '"stay" keeps it open');
    answer = true;
    assert.equal(mayClose(w), true);
    assert.deepEqual(asked, ['You have changes that are not saved. Close this window and lose them?', 'You have changes that are not saved. Close this window and lose them?']);
    assert.equal(hasUnsaved(w), false, 'once dropped, the X and then Back do not ask twice');
    assert.equal(mayClose(w), true);
    assert.equal(asked.length, 2);
    assert.equal(mayClose(null), true);
  } finally { delete globalThis.window; }
});

test('every window Cancel asks first: none is a plain button any more', () => {
  const files = readdirSync(new URL('../client/src/screens/', import.meta.url)).map((f) => `screens/${f}`);
  let cancels = 0;
  for (const f of files) {
    const src = read(`src/${f}`);
    assert.ok(!/>Cancel<\/Button>/.test(src), `${f} has a Cancel that does not ask`);
    cancels += (src.match(/<CancelButton /g) || []).length;
  }
  assert.equal(cancels, 17);
  assert.ok(ml['You have changes that are not saved. Close this window and lose them?']);
});
