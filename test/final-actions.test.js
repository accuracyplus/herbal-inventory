/**
 * Four patterns from the HiFive ID admin console audit (21 Nov 2026), fixed in Inventory: final
 * actions ask first, a key shown once is not lost by leaving, no real person's code in examples,
 * and a "last" date is the last. (The laundry date has its own test in stock.test.js.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ml from '../client/src/i18n/ml.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the nine hardest-to-undo actions ask first, and each question has its Malayalam', () => {
  const want = {
    'client/src/screens/Counts.jsx': ['Cancel count'],
    'client/src/screens/Deliveries.jsx': ['Cancel it', 'Remove'],
    'client/src/screens/Purchasing.jsx': ['Cancel order', 'Close short'],
    'client/src/screens/Returns.jsx': ['Reject', 'Close without credit'],
    'client/src/screens/ServiceLink.jsx': ['Revoke'],
    'client/src/screens/Accounts.jsx': ['Close {month}'],
  };
  let n = 0;
  for (const [f, labels] of Object.entries(want)) {
    const src = read(f);
    for (const l of labels) {
      const plain = new RegExp(`<Button[^\n]*>${l.replace(/[{}]/g, '.')}</Button>`);
      assert.ok(!plain.test(src), `${f}: "${l}" is still a plain button`);
    }
    for (const m of src.matchAll(/<ConfirmButton[^\n]*?ask=(?:"([^"]+)"|\{t\('([^']+)')[^\n]*?yes=(?:"([^"]+)"|\{t\('([^']+)')/g)) {
      n++;
      const ask = m[1] || m[2]; const yes = m[3] || m[4];
      assert.ok(ml[ask], `Malayalam for "${ask}"`);
      assert.ok(ml[yes], `Malayalam for "${yes}"`);
    }
  }
  assert.equal(n, 9);
  assert.ok(ml['Keep it']);
});

test('a connection key shown once counts as unsaved while it is on screen', () => {
  const src = read('client/src/screens/ServiceLink.jsx');
  const i = src.indexOf("t('The key for {name}. It will not be shown again.'");
  assert.ok(i > 0);
  assert.match(src.slice(i - 400, i), /data-hf-unsaved="true"/);
});

test('no real employee code in the app as an example', () => {
  const files = ['src/domain/admin.js', 'client/src/screens/ServiceLink.jsx', 'test/serve.mjs',
    ...readdirSync(new URL('../client/src/i18n/ml-parts/', import.meta.url)).map((f) => `client/src/i18n/ml-parts/${f}`)];
  for (const f of files) assert.ok(!/HPAHC040/.test(read(f)), f);
  assert.match(read('src/domain/admin.js'), /for example ABC123\./);
});
