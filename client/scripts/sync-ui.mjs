/**
 * Copy a built @hifive/ui into client/vendor/hifive-ui, so the client can depend on it as
 * `file:vendor/hifive-ui` (package.json), and refresh the local copy of the HiFive theme.
 *
 * Why a copy: @hifive/ui is private and lives in the hifive-design repo; there is no package
 * registry for the group, and a git address cannot point at one package of a workspace. The
 * built files, pinned by version and committed here, give every machine and the Pages build
 * the same bytes with nothing to sign in to. The version moves on purpose (Design Guide
 * Part R): run this, then `npm install`, and commit the result.
 *
 *   node scripts/sync-ui.mjs                 # from C:\GitHub\hifive-design
 *   node scripts/sync-ui.mjs ../path/to/ui   # another checkout of packages/ui
 *
 * Build the library first: `npm run build -w @hifive/ui` in hifive-design.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(process.argv[2] ?? 'C:/GitHub/hifive-design/packages/ui');
const dest = join(here, '..', 'vendor', 'hifive-ui');

if (!existsSync(join(src, 'dist', 'hifive-ui.js')) || !existsSync(join(src, 'dist', 'hifive-ui.css'))) {
  console.error(`No built library at ${src}/dist. Run \`npm run build -w @hifive/ui\` in hifive-design first.`);
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'));

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
// The source map is three times the bundle and no use to the app: left behind.
cpSync(join(src, 'dist'), join(dest, 'dist'), { recursive: true, filter: (f) => !f.endsWith('.map') });
writeFileSync(join(dest, 'package.json'), `${JSON.stringify({
  name: pkg.name, version: pkg.version, private: true, type: 'module',
  main: pkg.main, module: pkg.module, types: pkg.types, exports: pkg.exports,
  peerDependencies: pkg.peerDependencies,
  vendoredFrom: 'https://github.com/accuracyplus/hifive-design/tree/main/packages/ui',
}, null, 2)}\n`);
console.log(`${pkg.name} ${pkg.version} -> client/vendor/hifive-ui`);

// index.html loads the theme from the design system's site; public/theme-defaults.js falls
// back to this copy when that site does not answer. It moves with the library, on purpose.
const site = resolve(src, '..', '..', 'site', 'theme', 'v1');
if (existsSync(join(site, 'theme.css'))) {
  const fb = join(here, '..', 'public', 'theme-fallback', 'v1');
  mkdirSync(fb, { recursive: true });
  for (const f of ['boot.js', 'theme.css']) cpSync(join(site, f), join(fb, f));
  console.log('theme fallback -> client/public/theme-fallback/v1');
} else {
  console.warn(`No theme at ${site}: the fallback copy was not refreshed.`);
}
