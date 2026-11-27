// The feature register (docs/feature-register.md) is kept honest here (suite architecture
// standard, step 4, Sinu 27 Nov 2026: "a feature register built from what is live today, a test
// per feature, and a deploy blocked when one fails"). Every feature names at least one test; every
// test it names exists; every place it names exists. `npm run deploy` runs this with the rest, so
// a feature whose test is removed stops the deploy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rows = readFileSync(join(root, 'docs/feature-register.md'), 'utf8').split(/\r?\n/)
  .filter((l) => /^\| F-\d{3} \|/.test(l))
  .map((l) => {
    const [id, feature, decision, where, tests] = l.split('|').slice(1, -1).map((c) => c.trim());
    return { id, feature, decision, where, tests };
  });

/** Each test file's test titles, as written in the source (quotes undone). */
const titles = new Map();
for (const f of readdirSync(join(root, 'test')).filter((n) => n.endsWith('.test.js'))) {
  const src = readFileSync(join(root, 'test', f), 'utf8');
  titles.set(f, [...src.matchAll(/^test\((['"`])((?:\\.|(?!\1).)*)\1/gm)].map((m) => m[2].replace(/\\(.)/g, '$1')));
}

/** "client Record.jsx" is a screen; anything else is a path from the repository root. */
const place = (w) => (w.startsWith('client ') ? join('client/src/screens', w.slice(7)) : w);

test('every feature in the register names a test that exists, and a place that exists', () => {
  assert.ok(rows.length >= 70, `the register lists ${rows.length} features`);
  const ids = rows.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'each feature has its own number');
  const problems = [];
  for (const r of rows) {
    if (!r.feature || !r.decision || !r.where) problems.push(`${r.id}: a column is empty`);
    const refs = (r.tests || '').split(';').map((x) => x.trim()).filter(Boolean);
    if (!refs.length) problems.push(`${r.id} (${r.feature}) names no test`);
    for (const ref of refs) {
      const m = /^([\w-]+\.test\.js): (.+)$/.exec(ref);
      if (!m) { problems.push(`${r.id}: "${ref}" is not "file.test.js: title"`); continue; }
      const [, file, start] = m;
      if (!titles.has(file)) { problems.push(`${r.id}: no test file ${file}`); continue; }
      if (!titles.get(file).some((t) => t.startsWith(start))) problems.push(`${r.id}: no test in ${file} starts "${start}"`);
    }
    for (const w of r.where.split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!existsSync(join(root, place(w)))) problems.push(`${r.id}: ${w} does not exist`);
    }
  }
  assert.deepEqual(problems, []);
});
