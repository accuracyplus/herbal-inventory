/*
 * Defaults for this app. boot.js applies nothing until the person has chosen a look; until then
 * Inventory wears Air (teal), Lit, light — the Design Guide's in-app style.
 *
 * Also the stylesheet fallback: if the design system's theme.css never arrived, the tokens are
 * missing and every colour would be unset, so the local copy is added.
 */
(function () {
  try {
    var r = document.documentElement;
    if (!r.hasAttribute('data-skin')) r.setAttribute('data-skin', 'air');
    if (!r.hasAttribute('data-style')) r.setAttribute('data-style', 'lit');
    if (!r.hasAttribute('data-theme')) r.setAttribute('data-theme', 'light');
  } catch (e) {}
  function check() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--r-sm');
    if (v && v.trim()) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/theme-fallback/v1/theme.css';
    document.head.appendChild(l);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
})();
