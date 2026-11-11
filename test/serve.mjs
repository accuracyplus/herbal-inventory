/**
 * The app on this PC, for trying screens: the real Worker on a throwaway SQLite database, and the
 * built client from the same address. Nothing touches Cloudflare or HiFive ID, and everything is
 * gone when it stops.
 *
 *   cd client && node node_modules/vite/bin/vite.js build --mode localtest
 *   node test/serve.mjs [port]
 *
 * Sign in by asking for a test token (admin, manager, keeper, staff, buyer, viewer):
 *   localStorage['hifive-inventory.token'] = await (await fetch('/__token?as=keeper')).text()
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.js';
import { makeItem, receive, S, testEnv, tokenFor } from './helpers/http.js';

const port = Number(process.argv[2]) || 8791;
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
const env = testEnv({ APP_ORIGIN: `http://localhost:${port}` });
const ctx = { waitUntil: () => {} };

for (const [name, category] of [['Dhanwantharam thailam', 'Oils'], ['Kizhi powder', 'Herbs']]) {
  const id = await makeItem(env, { name, category });
  await receive(env, id, 40);
  await receive(env, id, 20, { storeId: S.sub });
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const isApi = (path) => /^\/(api|auth|pending|version|health)(\/|$)/.test(path);

function serveFile(path, res) {
  const safe = normalize(path).replace(/^(\.\.[\\/])+/, '');
  let file = join(dist, safe);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end('Build the client first: see the top of test/serve.mjs'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname === '/__token') { res.end(tokenFor(url.searchParams.get('as') || 'admin')); return; }
  if (!isApi(url.pathname)) { serveFile(url.pathname, res); return; }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const out = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined }), env, ctx);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(port, () => console.log(`HiFive Inventory (local test copy): http://localhost:${port}`));
