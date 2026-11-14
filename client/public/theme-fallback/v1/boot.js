/* @hifive/tokens 1.2.8 — built 2026-11-14. Edit packages/tokens/src, not this file. */
/* HiFive theme boot — served at /theme/v1/boot.js. Replaces hub-theme-hook.js.
 *
 * Load it SYNCHRONOUSLY in <head>, before the two stylesheet links, in every app:
 *
 *   <script src="https://hifive-design.pages.dev/theme/v1/boot.js"></script>
 *   <link rel="stylesheet" href="https://hifive-design.pages.dev/theme/v1/theme.css">
 *   <link rel="stylesheet" href="https://hifive-design.pages.dev/theme/v1/alias-<app>.css">
 *
 * It runs before first paint and does four things, none of which touch the DOM body:
 *   1. Reads ?skin=&style=&mode= from the URL (the landing page appends them to app
 *      links until preferences live on the HiFive ID profile), stores them, strips them.
 *   2. Applies the stored preference as data-skin / data-style / data-theme on <html>,
 *      plus the .dark class some apps key on. Defaults inside apps: water · lit · light.
 *      Dark is never inherited from the OS (Design Guide Part B).
 *   3. Decides the performance tier (Part K) and sets data-tier="full|lite".
 *   4. Exposes window.hifiveTheme so an app's own appearance control can read and
 *      write the same preference instead of keeping a second one.
 *
 * The stylesheets are plain <link> tags written by the app, so there is no flash of
 * unstyled content; this script only sets attributes.
 */
(function () {
  var root = document.documentElement;
  var KEY = 'hifive-prefs';
  var SKINS = ['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'];
  var DEFAULTS = { skin: 'water', style: 'lit', mode: 'light' };

  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function write(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  function clean(p) {
    var out = {};
    if (SKINS.indexOf(p.skin) >= 0) out.skin = p.skin;
    if (p.style === 'lit' || p.style === 'soft') out.style = p.style;
    if (p.mode === 'light' || p.mode === 'dark') out.mode = p.mode;
    if (p.anim === 'on' || p.anim === 'off' || p.anim === 'auto') out.anim = p.anim;
    return out;
  }

  // 1. URL hand-off from the landing page (handoff Step 17), then strip the params.
  var prefs = read();
  try {
    var u = new URL(location.href), touched = false, q = {};
    ['skin', 'style', 'mode'].forEach(function (k) { var v = u.searchParams.get(k); if (v) { q[k] = v; u.searchParams.delete(k); touched = true; } });
    if (touched) {
      var incoming = clean(q);
      for (var k in incoming) prefs[k] = incoming[k];
      write(prefs);
      history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash);
    }
  } catch (e) {}

  // 2. Apply. Only when the person has a HiFive preference: with none stored, no data-skin is
  //    set, every alias rule (scoped to html[data-skin]) stays inert, and the app looks exactly
  //    as it did. Once the landing page writes a preference (or hands one over in the URL) the
  //    app follows. Inside apps Soft is opt-in per card, so style defaults to lit.
  //    Only the keys the person chose are set. A palette choice alone must not drag
  //    the style to 'lit' on a page whose default is 'soft' (the landing page); each
  //    page fills in its own defaults for whatever is still unset.
  function apply(p) {
    if (p.skin) root.setAttribute('data-skin', p.skin);
    if (p.style) root.setAttribute('data-style', p.style);
    if (p.mode) { root.setAttribute('data-theme', p.mode); root.classList.toggle('dark', p.mode === 'dark'); }
  }
  apply(prefs);

  // 3. Tier (Design Guide Part K). Decided before first paint; a person's override wins.
  (function tier() {
    if (prefs.anim === 'on') { root.setAttribute('data-tier', 'full'); return; }
    if (prefs.anim === 'off') { root.setAttribute('data-tier', 'lite'); return; }
    var n = navigator, c = n.connection || {};
    var lite = (n.hardwareConcurrency && n.hardwareConcurrency < 4)
      || (n.deviceMemory && n.deviceMemory < 4)
      || /(^|-)2g$/.test(c.effectiveType || '') || c.saveData === true
      || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    root.setAttribute('data-tier', lite ? 'lite' : 'full');
    if (!lite && window.requestAnimationFrame) {
      var drops = 0, last = performance.now(), t0 = last;
      (function tick(now) {
        if (now - last > 34) drops++;
        last = now;
        if (now - t0 < 1000) requestAnimationFrame(tick); else if (drops > 3) root.setAttribute('data-tier', 'lite');
      })(last);
    }
  })();

  // 4. One preference, shared with the app's own controls.
  window.hifiveTheme = {
    get: function () { var p = read(); return { skin: p.skin || DEFAULTS.skin, style: p.style || DEFAULTS.style, mode: p.mode || DEFAULTS.mode, anim: p.anim || 'auto' }; },
    set: function (patch) { var p = read(), c = clean(patch || {}); for (var k in c) p[k] = c[k]; write(p); apply(p); return window.hifiveTheme.get(); },
    skins: SKINS.slice()
  };

  // Another tab (the landing page) changed the preference: follow it.
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(read()); });
})();
