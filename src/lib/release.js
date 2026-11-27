/**
 * What a deploy stamps into /version for HiFive ID's control room (suite architecture standard,
 * "The status report format", hifive-id cee2a42; Sinu, 27 Nov 2026: "Add").
 *
 * scripts/deploy.mjs counts the feature register (docs/feature-register.md) and reads the status
 * this chat keeps (docs/status.json), and passes each as a base64 JSON Worker variable:
 * RELEASE_FEATURES and RELEASE_STATUS. A deploy that did not stamp them (a bare `wrangler deploy`)
 * reports neither, so the control room says "Not reported" instead of showing a zero.
 */

const fromB64 = (s) => {
  const bin = atob(String(s));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
};
const count = (n) => Number.isInteger(n) && n >= 0;

/** Read one stamped value; anything missing or malformed is left out, never guessed. */
function stamped(env, name, ok) {
  try {
    if (!env[name]) return undefined;
    const v = fromB64(env[name]);
    return ok(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

const isFeatures = (f) => !!f && count(f.total) && count(f.untested) && f.untested <= f.total;
const isStatus = (s) => !!s && count(s.openWork) && count(s.waitingOnSinu) && s.waitingOnSinu <= s.openWork
  && Array.isArray(s.waiting) && s.waiting.length <= 5
  && s.waiting.every((w) => w && typeof w.text === 'string' && w.text.trim() && /^\d{4}-\d{2}-\d{2}$/.test(w.since));

/** { features?, status? } for /version. */
export function releaseReport(env) {
  const features = stamped(env, 'RELEASE_FEATURES', isFeatures);
  const status = stamped(env, 'RELEASE_STATUS', isStatus);
  return {
    ...(features ? { features: { total: features.total, untested: features.untested } } : {}),
    ...(status ? { status: { openWork: status.openWork, waitingOnSinu: status.waitingOnSinu, waiting: status.waiting.map((w) => ({ text: w.text.trim(), since: w.since })) } } : {}),
  };
}

/**
 * What a deploy stamps, from the register's text and the status file's content: { features, status }.
 * Counted, never typed in: the feature rows, the rows with no test, every open line, and the lines
 * waiting on Sinu (the first five sent, in the file's order).
 */
export function stampFrom(registerText, statusFile) {
  const rows = String(registerText).split(/\r?\n/).filter((l) => /^\| F-\d{3} \|/.test(l));
  const untested = rows.filter((l) => !(l.split('|').slice(1, -1)[4] || '').trim()).length;
  const items = Array.isArray(statusFile?.items) ? statusFile.items : [];
  const waits = items.filter((i) => i.waitingOnSinu === true);
  return {
    features: { total: rows.length, untested },
    status: { openWork: items.length, waitingOnSinu: waits.length, waiting: waits.slice(0, 5).map(({ text, since }) => ({ text, since })) },
  };
}

/** For scripts/deploy.mjs and the tests: a value as the Worker variable carries it. */
export const toB64 = (v) => Buffer.from(JSON.stringify(v), 'utf8').toString('base64');
