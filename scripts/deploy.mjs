/**
 * `npm run deploy` for the Worker: the commit is stamped into /version, so one curl says which
 * code is live (build.commit). Refuses with uncommitted changes, because then the stamp would
 * name a commit that is not what is deployed. Tests run first (predeploy).
 *
 * A bare `wrangler deploy` still works, but /version then reads "commit": null.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { stampFrom, toB64 } from '../src/lib/release.js';

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
// HiFive ID's control room (suite standard, the status report format): the feature register counted
// as it stands in this commit, and the open work this chat keeps in docs/status.json. The tests that
// ran first (predeploy) check both files, so what is stamped is what was checked.
const { features, status: report } = stampFrom(readFileSync('docs/feature-register.md', 'utf8'), JSON.parse(readFileSync('docs/status.json', 'utf8')));
console.log(`Deploying ${sha} (${git('rev-parse', '--abbrev-ref', 'HEAD')}): ${features.total} features, ${features.untested} untested; ${report.openWork} open, ${report.waitingOnSinu} waiting on Sinu`);
const run = spawnSync(process.execPath, [wrangler, 'deploy', '--var', `BUILD_COMMIT:${sha}`,
  '--var', `RELEASE_FEATURES:${toB64(features)}`, '--var', `RELEASE_STATUS:${toB64(report)}`, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(run.status ?? 1);
