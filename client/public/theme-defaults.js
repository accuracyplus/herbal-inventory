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
  // The icon in the tab and on a phone's home screen, in the palette kept from the last visit, before
  // first paint (Design Guide D-091: one icon system, from the design site's /icons/v2). The same
  // addresses as @hifive/ui's syncAppIcons, which takes over once the app runs (src/appearance.js);
  // Water keeps the files that ship with the app. test/app-icon.test.js keeps the two alike.
  try {
    var SKINS = ['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'];
    var skin = document.documentElement.getAttribute('data-skin');
    if (SKINS.indexOf(skin) > 0) {
      var AT = 'https://hifive-design.pages.dev/icons/v2/' + skin + '/inventory';
      var links = document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]');
      for (var i = 0; i < links.length; i++) {
        var l = links[i];
        var href = l.getAttribute('href') || '';
        if (l.getAttribute('data-hf-local') === null) l.setAttribute('data-hf-local', href);
        if (l.getAttribute('rel') === 'apple-touch-icon') l.setAttribute('href', AT + '-180.png');
        else if (/\.svg$/.test(href)) l.setAttribute('href', AT + '.svg');
        else if (/\.ico$/.test(href)) l.setAttribute('href', AT + '.ico');
        else l.setAttribute('href', AT + '-192.png');
      }
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
