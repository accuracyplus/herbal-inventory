/**
 * One icon system in every app (Design Guide D-091, Sinu 27 Nov 2026: "the icon system for favicon,
 * module, solution etc are dispersed, standardize in all solutions"). Inventory ships the glass Water
 * set under the suite's file names; the person's palette comes from the design site's /icons/v2,
 * before first paint (public/theme-defaults.js) and once the app runs (@hifive/ui syncAppIcons).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appIconFiles, syncAppIcons } from '../client/vendor/hifive-ui/dist/hifive-ui.js';

const at = (p) => new URL(`../client/${p}`, import.meta.url);
const read = (p) => readFileSync(at(p), 'utf8');
const PNG = [0x89, 0x50, 0x4e, 0x47];

test('the standard files are there, under the standard names, and are what they say', () => {
  for (const f of ['apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png']) {
    assert.deepEqual([...readFileSync(at(`public/${f}`)).subarray(0, 4)], PNG, `${f} is a PNG`);
  }
  assert.deepEqual([...readFileSync(at('public/favicon.ico')).subarray(0, 4)], [0, 0, 1, 0], 'favicon.ico is an icon file');
  const svg = read('public/favicon.svg');
  assert.match(svg, /^<svg /);
  assert.doesNotMatch(svg, /<script|href="http/i, 'the svg draws, and loads nothing');
  for (const old of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) assert.ok(!existsSync(at(`public/${old}`)), `the old /${old} is gone`);
});

test('every page links the same set, and the manifest agrees with the page', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="any" \/>/);
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png" \/>/);
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest" \/>/);
  const man = JSON.parse(read('public/manifest.webmanifest'));
  assert.deepEqual(man.icons.map((i) => [i.src, i.purpose]), [['/icons/icon-192.png', 'any'], ['/icons/icon-512.png', 'any'], ['/icons/icon-maskable-512.png', 'maskable']]);
  assert.equal(man.theme_color, /<meta name="theme-color" content="([^"]+)"/.exec(html)[1], 'one bar colour');
});

test('the library points the links at the palette; Water keeps the shipped files', () => {
  const link = (rel, href, type) => {
    const a = { rel, href, type };
    return { getAttribute: (n) => a[n] ?? null, setAttribute: (n, v) => { a[n] = v; }, a };
  };
  const links = [link('icon', '/favicon.ico'), link('icon', '/favicon.svg', 'image/svg+xml'), link('apple-touch-icon', '/apple-touch-icon.png')];
  const doc = { querySelectorAll: () => links };
  const sol = appIconFiles('inventory', 'sol');
  syncAppIcons('inventory', 'sol', { doc });
  assert.deepEqual(links.map((l) => l.a.href), [sol.ico, sol.svg, sol.touch]);
  syncAppIcons('inventory', 'water', { doc });
  assert.deepEqual(links.map((l) => l.a.href), ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png']);
});

test('the first-paint script uses the same palettes and the same addresses as the library', () => {
  const boot = read('public/theme-defaults.js');
  assert.match(boot, /\['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'\]/);
  const files = appIconFiles('inventory', 'sol');
  assert.ok(files.ico.startsWith('https://hifive-design.pages.dev/icons/v2/sol/inventory'));
  assert.ok(boot.includes("'https://hifive-design.pages.dev/icons/v2/' + skin + '/inventory'"));
  for (const end of ["'-180.png'", "'.svg'", "'.ico'", "'-192.png'"]) assert.ok(boot.includes(`AT + ${end}`), `first paint uses ${end}`);
});

test('no old app mark anywhere: the only pictures kept are the glass set, every page links it', () => {
  // Recruitment found its old hand-drawn mark on pages the icon switch had missed (28 Nov 2026);
  // Inventory's old app page and logo.png were still in this branch, and are gone.
  const files = execFileSync('git', ['ls-files'], { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' })
    .split('\n').filter((f) => f && !f.startsWith('client/vendor/'));
  const pictures = files.filter((f) => /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(f)).sort();
  assert.deepEqual(pictures, ['client/public/apple-touch-icon.png', 'client/public/favicon.ico', 'client/public/favicon.svg',
    'client/public/icons/icon-192.png', 'client/public/icons/icon-512.png', 'client/public/icons/icon-maskable-512.png']);
  for (const page of files.filter((f) => f.endsWith('.html'))) {
    assert.match(readFileSync(new URL(`../${page}`, import.meta.url), 'utf8'), /href="\/favicon\.svg"/, `${page} wears the glass icon`);
  }
  for (const f of files.filter((x) => /^(src|client\/src|client\/public)\/.*\.(js|jsx|css|html)$/.test(x))) {
    assert.doesNotMatch(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), /logo\.(png|svg|jpe?g)|<img[^>]+logo/i, `${f}: no old logo`);
  }
});

test('the page may load those images', () => {
  assert.match(read('public/_headers'), /img-src [^;]*https:\/\/hifive-design\.pages\.dev/);
});
