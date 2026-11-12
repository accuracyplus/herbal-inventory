/**
 * Inventory's logo in the browser tab and on a phone's home screen, in the palette being worn
 * (Design Guide D-042: the tile is the palette's colour). The design system's site holds an image
 * per palette; the files in public/ are the Water ones, for the first paint and for a day that
 * site cannot be reached.
 *
 * public/theme-defaults.js does the same before first paint, as a plain script: keep the two alike
 * (test/app-icon.test.js checks they are).
 */

export const ICONS = 'https://hifive-design.pages.dev/icons/v1/';
const SKINS = ['water', 'air', 'earth', 'fire', 'luna', 'sol', 'aami', 'aadi'];

/** The two images for a palette; an unknown palette gets the Water ones that ship with the app. */
export function iconsFor(skin) {
  if (!SKINS.includes(skin) || skin === 'water') return { icon: '/icon-192.png', apple: '/apple-touch-icon.png' };
  return { icon: ICONS + skin + '/inventory-192.png', apple: ICONS + skin + '/inventory-180.png' };
}

/** Point the page's icon links at the palette's images. Anything that goes wrong leaves them as they are. */
export function syncIcons(skin, doc = globalThis.document) {
  try {
    const { icon, apple } = iconsFor(skin);
    const put = (rel, href) => {
      const link = doc.querySelector(`link[rel="${rel}"]`);
      if (link && link.getAttribute('href') !== href) link.setAttribute('href', href);
    };
    put('icon', icon);
    put('apple-touch-icon', apple);
  } catch { /* the tab keeps the icon it has */ }
}
