#!/usr/bin/env node
/**
 * Removes channel-tab records that no longer pass the relevance filter.
 *
 * `refresh` is deliberately additive so a flaky page of results can never
 * delete the archive. The cost is that TIGHTENING a filter leaves the old,
 * over-broad records in place forever. This is the deliberate counterpart:
 * an explicit, reviewable cleanup rather than silent loss.
 *
 * It will never drop a record that came from a curated playlist, or one that
 * anything in people.js points at — those are referenced evidence.
 *
 *   node scripts/prune-irrelevant.mjs --dry-run
 *   node scripts/prune-irrelevant.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANNEL_TABS, PLAYLISTS } from './refresh-playlists.mjs';
import { people } from '../src/data/people.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'data', 'videos.json');

const dryRun = process.argv.includes('--dry-run');
const data = JSON.parse(readFileSync(OUT, 'utf8'));
const tabKeys = new Set(CHANNEL_TABS.map((t) => t.key));
const playlistKeys = new Set(PLAYLISTS.map((p) => p.key));

// Any clip an allegation or appearance points at is cited evidence - keep it
// regardless of what the filter now says.
const cited = new Set();
for (const p of people) {
  for (const a of p.allegations ?? []) {
    if (a.clip) cited.add(a.clip);
    if (a.responseClip) cited.add(a.responseClip);
  }
  if (p.appearance?.clip) cited.add(p.appearance.clip);
}

const keep = [];
const drop = [];
for (const v of data.videos) {
  const fromPlaylist = v.playlists.some((k) => playlistKeys.has(k));
  const fromTabOnly = v.playlists.every((k) => tabKeys.has(k));
  const tab = CHANNEL_TABS.find((t) => v.playlists.includes(t.key));

  if (fromPlaylist || !fromTabOnly || cited.has(v.videoId)) {
    keep.push(v);
    continue;
  }
  const relevant = tab?.relevant?.test(v.title) ?? true;
  const excluded = tab?.exclude?.test(v.title) ?? false;
  if (relevant && !excluded) keep.push(v);
  else drop.push(v);
}

console.log(`${data.videos.length} records -> keep ${keep.length}, drop ${drop.length}`);
if (drop.length) {
  console.log('\nsample of what would be dropped:');
  for (const v of drop.slice(0, 12)) {
    console.log(`  ${v.date}  ${v.title.slice(0, 78)}`);
  }
}

if (dryRun) {
  console.log('\ndry run - nothing written.');
} else {
  data.videos = keep;
  writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`\nwrote ${keep.length} records -> ${OUT}`);
}
