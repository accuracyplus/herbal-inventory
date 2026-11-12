/*
 * Defaults for this app. boot.js applies nothing until the person has chosen a look; until then
 * Inventory wears what every HiFive app opens in: Water, Soft, light (Design Guide D-005;
 * Sinu's decision for Inventory, 12 Nov 2026). src/appearance.js holds the same three words.
 *
 * Also the stylesheet fallback: if the design system's theme.css never arrived, the tokens are
 * missing and every colour would be unset, so the local copy is added.
 */
(function () {
  try {
    var r = document.documentElement;
    if (!r.hasAttribute('data-skin')) r.setAttribute('data-skin', 'water');
    if (!r.hasAttribute('data-style')) r.setAttribute('data-style', 'soft');
    if (!r.hasAttribute('data-theme')) r.setAttribute('data-theme', 'light');
  } catch (e) {}
  // The logo in the tab and on a phone's home screen, in the palette kept from the last visit
  // (D-042). The same as src/appIcon.js; Water uses the files that ship with the app.
  try {
    var SKINS = ['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'];
    var skin = document.documentElement.getAttribute('data-skin');
    if (SKINS.indexOf(skin) > 0) {
      var ICONS = 'https://hifive-design.pages.dev/icons/v1/';
      var put = function (rel, href) { var l = document.querySelector('link[rel="' + rel + '"]'); if (l) l.setAttribute('href', href); };
      put('icon', ICONS + skin + '/inventory-192.png');
      put('apple-touch-icon', ICONS + skin + '/inventory-180.png');
    }
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
