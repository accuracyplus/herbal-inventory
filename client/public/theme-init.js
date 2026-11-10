/*
 * Runs straight after the design system's boot.js. If that did not load (the design site is
 * down, or blocked on a clinic network), the local copy is written in its place — synchronously,
 * so it still runs before first paint. A file rather than an inline onerror attribute because
 * the page's CSP allows no inline script at all.
 */
(function () {
  if (!window.hifiveTheme) document.write('<script src="/theme-fallback/v1/boot.js"><\/script>');
})();
