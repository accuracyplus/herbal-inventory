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
 * Without the script (HiFive ID unreachable, or a test), every function here is a no-op that
 * lets the person go, and Inventory is exactly as it was.
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

/** A save from this element worked: what was typed there is no longer at risk. */
export function markSaved(el) {
  if (el) suite()?.saved?.(el);
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
