/**
 * Is a newer build live? Each build compiles in its own id (__BUILD_ID__) and publishes the same
 * id as /version.json (vite.config.js). An app left open, as an app on a phone's home screen is,
 * otherwise runs the build it started with until it is closed. Sinu found one on 13 Nov 2026
 * still showing Help in English after the Malayalam had gone live.
 *
 * Checked when the app comes back to the front, and every five minutes while it is in front. A
 * newer build is only announced; the page reloads when the person presses Reload, so a
 * half-filled form is never lost.
 */

import { useEffect, useState } from 'react';

/* global __BUILD_ID__ */
export const BUILD = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '';
const EVERY = 5 * 60 * 1000;

export async function liveBuild() {
  const res = await fetch('/version.json', { cache: 'no-store' });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return typeof body?.build === 'string' ? body.build : null;
}

/** True once a build other than this one is live. */
export function useNewVersion() {
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    if (!BUILD) return undefined; // a development server has no build id to compare
    let gone = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const live = await liveBuild();
        if (!gone && live && live !== BUILD) setFresh(true);
      } catch { /* offline: ask again next time */ }
    };
    const onShow = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onShow);
    addEventListener('focus', onShow);
    const timer = setInterval(check, EVERY);
    check();
    return () => {
      gone = true;
      document.removeEventListener('visibilitychange', onShow);
      removeEventListener('focus', onShow);
      clearInterval(timer);
    };
  }, []);
  return fresh;
}
