/**
 * Items scanned on the Scan screen, handed to the screen chosen next (Record use, Request…).
 * Kept for ten minutes in this tab only, and taken once.
 */

const KEY = 'hifive-inventory.handoff';

export function giveHandoff(to, lines) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ to, lines, at: Date.now() })); } catch { /* private window */ }
}

export function takeHandoff(to) {
  try {
    const h = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!h || h.to !== to || Date.now() - h.at > 10 * 60e3) return null;
    sessionStorage.removeItem(KEY);
    return h.lines;
  } catch {
    return null;
  }
}
