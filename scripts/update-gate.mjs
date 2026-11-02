#!/usr/bin/env node
/**
 * Decides whether a sweep's changes are allowed to publish themselves.
 *
 * The daily update runs unattended. Scrape output keeping itself current is
 * routine and can go live; anything that changes what this index *says about
 * a person* is not, because the site publishes untested allegations about
 * named living people and a push is live in under a minute.
 *
 * That distinction has to be mechanical. Left to a judgment call each
 * morning it will eventually be got wrong on exactly the day it matters, so
 * this is a git question - which files moved - and nothing else.
 *
 *   node scripts/update-gate.mjs
 *
 * Exit 0 and prints ALLOW: only machine-written files changed, safe to push.
 * Exit 0 and prints HOLD:  a human needs to read it first.
 * Exit 1:                  something is wrong; do not commit at all.
 */
import { execSync } from 'node:child_process';

/** Files a scraper owns. Everything else is editorial by definition. */
const MACHINE_WRITTEN = new Set([
  'src/data/videos.json',
  'src/data/articles.json',
  'staging/commission-day-index.json',
]);

const git = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

const changed = lines(git('git diff --name-only HEAD'));
const untracked = lines(git('git ls-files --others --exclude-standard'));
const touched = [...new Set([...changed, ...untracked])];

if (!touched.length) {
  console.log('NOTHING — no files changed; nothing to commit.');
  process.exit(0);
}

/**
 * Record counts must never fall.
 *
 * The archive shrank once before, from 469 clips to 444, when a flaky
 * pagination run rebuilt the file instead of merging into it. The refresh is
 * additive now, but a silent shrink is the one failure that would quietly
 * delete evidence, so it blocks the commit outright rather than merely
 * holding it for review.
 */
function recordCount(path, pick) {
  const read = (text) => {
    try {
      return pick(JSON.parse(text));
    } catch {
      return null;
    }
  };
  let before = null;
  try {
    before = read(git(`git show HEAD:${path}`));
  } catch {
    before = null; // new file
  }
  const after = read(execSync(`cat ${path}`, { encoding: 'utf8' }));
  return { before, after };
}

const COUNTED = [
  ['src/data/videos.json', (j) => j.videos?.length ?? null],
  ['src/data/articles.json', (j) => (Array.isArray(j) ? j.length : j.articles?.length ?? null)],
];

const shrunk = [];
for (const [path, pick] of COUNTED) {
  if (!touched.includes(path)) continue;
  const { before, after } = recordCount(path, pick);
  if (before != null && after != null && after < before) {
    shrunk.push(`${path}: ${before} -> ${after}`);
  }
}

if (shrunk.length) {
  console.log('REFUSE — a record count fell. Do not commit; investigate first.');
  for (const s of shrunk) console.log(`  ${s}`);
  process.exit(1);
}

const editorial = touched.filter((f) => !MACHINE_WRITTEN.has(f));

console.log(`files touched (${touched.length}):`);
for (const f of touched) {
  console.log(`  ${MACHINE_WRITTEN.has(f) ? 'machine ' : 'EDITORIAL'}  ${f}`);
}
console.log();

if (editorial.length) {
  console.log('HOLD — editorial files changed. Commit locally, do not push.');
  console.log('  A person needs to read these before they are public:');
  for (const f of editorial) console.log(`    ${f}`);
} else {
  console.log('ALLOW — only machine-written files changed. Safe to push.');
}
