/**
 * `npm run setup:db`: a new database, from nothing to ready, in order: schema.sql, every file in
 * migrations/ by number, then the seed. Stops at the first failure and says which file, because
 * the next one depends on it. Run it ONCE, on a new, empty database; later migrations are run one
 * file at a time, as DEPLOY.md says.
 *
 *   npm run setup:db             the remote (production) database
 *   npm run setup:db -- --local  the local one, for wrangler dev
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const where = process.argv.includes('--local') ? '--local' : '--remote';
const wrangler = 'node_modules/wrangler/bin/wrangler.js';
const files = [
  'schema.sql',
  ...readdirSync('migrations').filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort().map((f) => `migrations/${f}`),
  'seed/0001-herbal-park.sql',
];

console.log(`${files.length} files into hifive-inventory (${where.slice(2)}):`);
for (const [i, file] of files.entries()) {
  console.log(`\n[${i + 1}/${files.length}] ${file}`);
  const run = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'hifive-inventory', where, '--yes', `--file=${file}`], { stdio: 'inherit' });
  if (run.status !== 0) {
    console.error(`\nStopped: ${file} did not finish. Nothing after it was run. Do not run it again before checking: a file can report failure after it has applied.`);
    process.exit(run.status || 1);
  }
}
console.log('\nDatabase ready.');
