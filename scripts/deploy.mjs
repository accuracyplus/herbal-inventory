/**
 * `npm run deploy` for the Worker: the commit is stamped into /version, so one curl says which
 * code is live (build.commit). Refuses with uncommitted changes, because then the stamp would
 * name a commit that is not what is deployed. Tests run first (predeploy).
 *
 * A bare `wrangler deploy` still works, but /version then reads "commit": null.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('status', '--porcelain')) {
  console.error('There are uncommitted changes. Commit (or set them aside) first, so /version names what is really deployed.');
  process.exit(1);
}
const sha = git('rev-parse', '--short=12', 'HEAD');
const wrangler = 'node_modules/wrangler/bin/wrangler.js';
if (!existsSync(wrangler)) {
  console.error('Wrangler is not installed here. Run npm install first.');
  process.exit(1);
}
console.log(`Deploying ${sha} (${git('rev-parse', '--abbrev-ref', 'HEAD')})`);
const run = spawnSync(process.execPath, [wrangler, 'deploy', '--var', `BUILD_COMMIT:${sha}`, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(run.status ?? 1);
