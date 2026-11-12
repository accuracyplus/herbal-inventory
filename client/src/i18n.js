/**
 * The interface language (Design Guide D-043, amending D-041).
 *
 * A person chooses it once, in HiFive ID like their colours; Inventory keeps its own copy for
 * when HiFive ID has none. The order a language is decided in:
 *   1. the choice saved in HiFive ID (passed on by /api/appearance);
 *   2. Inventory's own copy on the person (/api/me `lang`);
 *   3. the phone or computer's own language, when it is Malayalam;
 *   4. English.
 *
 * Wording is looked up by its English: `t('Record use')`. A phrase with no Malayalam yet stays in
 * English, so the screen is never blank and a missing line costs nothing but a word. Phrases with
 * a number or a name in them carry `{name}` slots: `t('{n} items with you', { n: 3 })`. `tn()` picks
 * the singular or plural English phrase first, then translates that one.
 *
 * Dates take the language (12 നവം 2026); numbers stay 0 to 9 everywhere, as people write them on
 * the shelf and in Excel. Item names, people, stores and everything else people type are never
 * translated: they are data.
 */

import { useSyncExternalStore } from 'react';
import ml from './i18n/ml.js';

export const LANGS = { en: 'English', ml: 'മലയാളം' };
const DICT = { ml };
const KEY = 'hifive-inventory.lang';

let current = 'en';
const listeners = new Set();
const notify = () => listeners.forEach((f) => f());

/** The language the screen is in now. */
export const lang = () => current;

/** Malayalam letters are on the page only in Malayalam; its typefaces load only then (Part B, Type). */
function loadFonts(code) {
  if (code !== 'ml' || document.getElementById('inv-lang-css')) return;
  const link = document.createElement('link');
  link.id = 'inv-lang-css';
  link.rel = 'stylesheet';
  link.href = '/lang.css';
  document.head.appendChild(link);
}

export function setLang(code) {
  const next = code === 'ml' ? 'ml' : 'en';
  try { localStorage.setItem(KEY, next); } catch { /* private window: this visit only */ }
  if (next === current) return;
  current = next;
  document.documentElement.lang = next;
  loadFonts(next);
  notify();
}

/** Decide, in the order above. `hfid` and `own` are null when not chosen there. */
export function chooseLang({ hfid = null, own = null } = {}) {
  if (hfid && LANGS[hfid]) return hfid;
  if (own && LANGS[own]) return own;
  const device = (navigator.languages || [navigator.language || '']).find(Boolean) || '';
  return /^ml\b/i.test(device) ? 'ml' : 'en';
}

/** The last language used on this device, so the first paint is already in it. */
export function lastLang() {
  try { return localStorage.getItem(KEY) === 'ml' ? 'ml' : null; } catch { return null; }
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k]))) : s);

/** A phrase in the screen's language. */
export function t(english, vars) {
  if (english === null || english === undefined) return english;
  const d = DICT[current];
  return fill((d && d[english]) || english, vars);
}

/** One of two English phrases by the number, then translated. `{n}` is filled with the number. */
export const tn = (n, one, many, vars = {}) => t(Number(n) === 1 ? one : many, { n, ...vars });

/** Is there Malayalam for this phrase? For tests and the wording check. */
export const has = (english) => !!(DICT[current] && DICT[current][english]);

/** Re-render when the language changes. */
export function useLang() {
  return useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, () => current, () => current);
}

/** The locale dates are written in. */
export const dateLocale = () => (current === 'ml' ? 'ml-IN' : 'en-GB');

// First paint in the last language this device used, before /api/me answers.
const remembered = lastLang();
if (remembered) { current = remembered; document.documentElement.lang = remembered; loadFonts(remembered); }
