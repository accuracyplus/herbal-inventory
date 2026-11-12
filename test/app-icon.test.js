/**
 * Inventory's logo in the tab and on the home screen follows the palette worn (D-042).
 * The page's helper and the first-paint script must say the same thing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { iconsFor, syncIcons, ICONS } from '../client/src/appIcon.js';

const SKINS = ['air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'];

test('each palette but Water takes the design site’s images; Water and anything unknown keep the shipped files', () => {
  for (const s of SKINS) assert.deepEqual(iconsFor(s), { icon: `${ICONS}${s}/inventory-192.png`, apple: `${ICONS}${s}/inventory-180.png` });
  for (const s of ['water', undefined, '', 'maroon', '../x']) assert.deepEqual(iconsFor(s), { icon: '/icon-192.png', apple: '/apple-touch-icon.png' });
});

test('the links are repointed, and a page without them is left alone', () => {
  const links = { icon: { href: '/icon-192.png' }, 'apple-touch-icon': { href: '/apple-touch-icon.png' } };
  const el = (l) => l && { getAttribute: () => l.href, setAttribute: (_, v) => { l.href = v; } };
  const doc = { querySelector: (sel) => el(links[sel.match(/rel="([^"]+)"/)[1]]) };
  syncIcons('sol', doc);
  assert.equal(links.icon.href, `${ICONS}sol/inventory-192.png`);
  assert.equal(links['apple-touch-icon'].href, `${ICONS}sol/inventory-180.png`);
  syncIcons('water', doc);
  assert.equal(links.icon.href, '/icon-192.png');
  assert.doesNotThrow(() => syncIcons('sol', { querySelector: () => null }));
  assert.doesNotThrow(() => syncIcons('sol', undefined));
});

test('the first-paint script names the same palettes, site and files', () => {
  const boot = readFileSync(new URL('../client/public/theme-defaults.js', import.meta.url), 'utf8');
  assert.match(boot, /\['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'\]/);
  assert.ok(boot.includes(`'${ICONS}'`));
  assert.ok(boot.includes("'/inventory-192.png'") && boot.includes("'/inventory-180.png'"));
});

test('the page may load those images', () => {
  const headers = readFileSync(new URL('../client/public/_headers', import.meta.url), 'utf8');
  assert.match(headers, /img-src [^;]*https:\/\/hifive-design\.pages\.dev/);
});
