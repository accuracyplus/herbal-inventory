/**
 * The person's HiFive appearance, followed here.
 *
 * Colours, style and light or dark are chosen once, in HiFive ID, and saved on the account
 * (Design Guide Part J: the choice travels with the person). The theme's boot script only
 * knows what this site's own storage holds, so a change made in HiFive ID would never arrive
 * by itself. This asks for it after sign-in and whenever the tab comes back into view (at most
 * once a minute), keeps it where the boot script reads it, and wears it.
 *
 * The page asks its own Worker, which asks HiFive ID with the person's session: the page may
 * only talk to that Worker. Anything that goes wrong leaves the page exactly as it is.
 */

import { get } from './api.js';

const CACHE_KEY = 'hifive-prefs'; // the key boot.js reads before first paint
const SKINS = ['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'];
// What Inventory wears until a person has chosen: the look its screens were approved in.
export const DEFAULTS = { skin: 'air', style: 'lit', mode: 'light' };

/** The cache after the account's answer: a choice replaces what was kept, and a choice the
 *  person cleared is removed, so the default comes back. An unknown value is dropped. */
export function mergePrefs(cached, fromAccount) {
  const out = { ...(cached || {}) };
  const p = fromAccount || {};
  const ok = { skin: SKINS.includes(p.skin), style: p.style === 'lit' || p.style === 'soft', mode: p.mode === 'light' || p.mode === 'dark' };
  for (const k of ['skin', 'style', 'mode']) { if (ok[k]) out[k] = p[k]; else delete out[k]; }
  return out;
}

export const shownFor = (cache) => ({
  skin: cache?.skin || DEFAULTS.skin, style: cache?.style || DEFAULTS.style, mode: cache?.mode || DEFAULTS.mode,
});

/** Give the phone's own bars the colour of the bar they sit against, in this palette and mode. */
export function syncChromeColour() {
  try {
    const meta = document.querySelector('meta[name=theme-color]');
    if (!meta) return;
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;background:var(--surface-1)';
    document.documentElement.appendChild(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    if (colour && colour !== 'rgba(0, 0, 0, 0)') meta.content = colour;
  } catch { /* the bars keep the colour index.html gave them */ }
}

function wear(cache) {
  const root = document.documentElement;
  const s = shownFor(cache);
  root.setAttribute('data-skin', s.skin);
  root.setAttribute('data-style', s.style);
  root.setAttribute('data-theme', s.mode);
  root.classList.toggle('dark', s.mode === 'dark');
  syncChromeColour();
}

let lastAsked = 0;

export async function followAppearance({ force = false, ask = () => get('/api/appearance') } = {}) {
  try {
    const now = Date.now();
    if (!force && now - lastAsked < 60000) return false;
    lastAsked = now;
    const answer = await ask();
    if (!answer?.known) return false; // an older HiFive ID, or it did not answer: keep what is worn
    let cached = {};
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch { cached = {}; }
    const next = mergePrefs(cached, answer.prefs);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* a private window: worn for this visit only */ }
    wear(next);
    return true;
  } catch {
    return false;
  }
}

/** Follow now, and again whenever the tab comes back into view. Returns how to stop. */
export function startFollowingAppearance() {
  followAppearance({ force: true });
  const onVisible = () => { if (document.visibilityState === 'visible') followAppearance(); };
  document.addEventListener('visibilitychange', onVisible);
  addEventListener('focus', onVisible);
  return () => { document.removeEventListener('visibilitychange', onVisible); removeEventListener('focus', onVisible); };
}
