import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

/*
 * The build's id — the commit and the time — compiled in as __BUILD_ID__ and published as
 * /version.json, so an open app can tell a newer build is live (src/update.js).
 */
function buildId() {
  let sha = 'nogit';
  try { sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || sha; } catch { /* not a checkout */ }
  return `${sha}-${Date.now().toString(36)}`;
}
const BUILD_ID = buildId();

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'hifive-version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: `${JSON.stringify({ build: BUILD_ID })}\n` });
      },
    },
  ],
  build: { outDir: 'dist', sourcemap: false },
});
