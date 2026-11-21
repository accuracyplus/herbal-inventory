/**
 * Ask before leaving unsaved work: the suite's guard (HiFive ID's hub-button.js; Design Guide C21,
 * D-060 to D-062), as Inventory uses it. Sinu, 20 Nov 2026: "if any form is open or they are
 * filling in some details, ask before moving out of the page, let this be universal standard".
 *
 * The script does the counting: anything a person types or chooses inside an element marked
 * `data-hf-guard` (every editing window, through <Sheet>, and the on-page forms, through <Guard>)
 * counts as unsaved until that element leaves the page or is marked saved. The page root carries
 * `data-hf-keep-on-submit`, so a submitted form is not taken as saved before the server says so.
 *
 * This file adds the two things the script leaves to the app:
 *
 *  - A save that works stops the asking (D-062). Inventory saves with buttons, not form submits,
 *    and many windows stay open after a save (a request just approved, a count's progress). So
 *    the button pressed is noted with the guarded element it sits in, and when a write that
 *    starts within a few seconds of that press comes back accepted, api.js marks that element
 *    saved. A refused write marks nothing, so the work keeps counting until a save works.
 *    Writes that change nothing (a check before saving, reading a delivery note, the price
 *    guide, the scanner, the person's own settings) never mark anything.
 *  - Moving between screens inside the app asks first (App.jsx: links, navigate(), Back).
 *
 * Without the script (HiFive ID unreachable, or a test), leaving a screen asks nothing and
 * Inventory is as it was before 21 Nov 2026. Closing a window still asks: that check is
 * Inventory's own (below), so work in a window is safe whether or not HiFive ID answers.
 */
import { t } from './i18n.js';

const suite = () => (typeof window === 'undefined' ? undefined : window.HiFiveSuite);

/** How long after a press a write still counts as coming from it. Long enough for a photo to be made small first. */
const PRESS_MS = 4000;
let pressed = null;

function notePress(e) {
  if (!e.isTrusted) return;
  if (e.type === 'keydown' && e.key !== 'Enter') return;
  const g = e.target && e.target.closest ? e.target.closest('[data-hf-guard]') : null;
  pressed = g ? { guard: g, at: Date.now() } : null;
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', notePress, true);
  document.addEventListener('keydown', notePress, true);
}

/** The guarded element whose button was pressed just now, if a write starting now comes from it. */
export function pressedGuard(now = Date.now()) {
  return pressed && now - pressed.at < PRESS_MS && pressed.guard.isConnected ? pressed.guard : null;
}

/** Writes that save nothing: they must never stop the asking. */
const SAVES_NOTHING = [/^\/api\/me\/prefs$/, /^\/api\/prices\/guide$/, /^\/api\/receipts\/read$/, /^\/api\/scan\//];
export function savesSomething(path, body) {
  if (body && typeof body === 'object' && body.dryRun === true) return false;
  return !SAVES_NOTHING.some((re) => re.test(String(path).split('?')[0]));
}

/**
 * Closing a window asks too (Sinu, 21 Nov 2026: "Ask on window close"). The script keeps one list
 * for the whole page, and its "yes" drops everything, a form on the page behind the window
 * included. So each guarded element's own edits are noted here as well, by the same rules as the
 * script's: only a person's typing or choosing, a text field's late change not counted, nothing
 * inside [data-hf-no-guard]. A window then asks only about what was typed in it, and a "yes"
 * drops only that.
 */
const TEXTY = /^(text|search|email|tel|url|number|password)$/;
const edited = new Set();
const released = new WeakSet();   // a window the person agreed to close: never asked about again
function noteEdit(e) {
  if (!e.isTrusted) return;
  const el = e.target;
  if (!el || !el.closest) return;
  if (e.type === 'change' && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && TEXTY.test(el.type || 'text')))) return;
  if (el.closest('[data-hf-no-guard]')) return;
  const g = el.closest('[data-hf-guard]');
  if (g) edited.add(g);
}
if (typeof document !== 'undefined') {
  document.addEventListener('input', noteEdit, true);
  document.addEventListener('change', noteEdit, true);
}

/** Has anything in this element been changed and not saved: typed, chosen, or lines added? */
export function hasUnsaved(el) {
  if (!el || !el.isConnected || released.has(el)) return false;
  for (const g of edited) {
    if (!g.isConnected) edited.delete(g);
    else if (g === el || el.contains(g)) return true;
  }
  return el.matches('[data-hf-unsaved="true"]') || !!el.querySelector('[data-hf-unsaved="true"]');
}

/** A save from this element worked: what was typed there is no longer at risk. */
export function markSaved(el) {
  if (!el) return;
  suite()?.saved?.(el);
  for (const g of edited) if (g === el || el.contains(g)) edited.delete(g);
}

const CLOSE_WORDS = 'You have changes that are not saved. Close this window and lose them?';
function askToClose(els) {
  // The browser's own question, as the script's is: it stops everything until answered.
  if (!window.confirm(t(CLOSE_WORDS))) return false;
  for (const el of els) { markSaved(el); released.add(el); }
  return true;
}

/** Before a window closes (its X, Escape, a tap outside it, Cancel): true to close it. */
export function mayClose(el) {
  return hasUnsaved(el) ? askToClose([el]) : true;
}

/** Back or Forward within a screen closes any window open on it: ask about those with unsaved work. */
export function mayCloseOpenWindows() {
  if (typeof document === 'undefined') return true;
  const open = [...document.querySelectorAll('[data-inv-window]')].filter(hasUnsaved);
  return open.length ? askToClose(open) : true;
}

export function isUnsaved() {
  return !!suite()?.isUnsaved?.();
}

/**
 * Before leaving a screen: true to go on. Asks in the screen's language only when something is
 * unsaved; a "yes" drops that work, so the browser does not ask a second time on the way out.
 */
export function mayLeave() {
  const s = suite();
  if (!s || !s.confirmLeave) return true;
  return s.confirmLeave(t('You have changes that are not saved. Leave this page and lose them?'));
}
