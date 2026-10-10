#!/usr/bin/env node
/**
 * Replaces derived (approximate) dates with the exact upload date, read from
 * each clip's own watch page.
 *
 * Playlist pages only expose a fuzzy age ("3 weeks ago"); watch pages carry a
 * real `uploadDate`. This costs one request per clip, so it is a separate,
 * deliberate step rather than part of `npm run refresh`.
 *
 *   node scripts/confirm-dates.mjs <videoId> [<videoId> ...]   # specific clips
 *   node scripts/confirm-dates.mjs --all                       # every approx date
 *   node scripts/confirm-dates.mjs --all --dry-run             # report only
 *
 * Confirmed dates are written with dateApprox:false, so the UI stops showing
 * the "approx" badge for them. If this moves a date that an allegation is
 * pinned to, `npm run verify` will say so — re-pin, do not ignore it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'data', 'videos.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function uploadDate(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m =
    html.match(/"uploadDate":"([0-9]{4}-[0-9]{2}-[0-9]{2})/) ??
    html.match(/itemprop="datePublished" content="([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  if (!m) throw new Error('no uploadDate on page');
  return m[1];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const ids = args.filter((a) => !a.startsWith('--'));

  const data = JSON.parse(readFileSync(OUT, 'utf8'));
  const targets = all
    ? data.videos.filter((v) => v.dateApprox)
    : data.videos.filter((v) => ids.includes(v.videoId));

  if (!targets.length) {
    console.error(
      ids.length ? 'None of those ids are in videos.json.' : 'Nothing to confirm.'
    );
    process.exit(1);
  }

  console.log(`confirming ${targets.length} clip(s)\n`);
  let changed = 0;
  let failed = 0;

  for (const v of targets) {
    try {
      const exact = await uploadDate(v.videoId);
      const moved = exact !== v.date;
      console.log(
        `  ${v.videoId}  ${v.date} -> ${exact}` +
          `${moved ? `  (moved ${moved ? 'yes' : ''})` : '  (unchanged)'}` +
          `  ${v.title.slice(0, 60)}`
      );
      if (!dryRun) {
        v.date = exact;
        v.dateApprox = false;
        v.dateConfirmedAt = new Date().toISOString().slice(0, 10);
      }
      if (moved) changed++;
    } catch (err) {
      failed++;
      console.log(`  ${v.videoId}  FAILED (${err.message})`);
    }
    await sleep(250);
  }

  if (dryRun) {
    console.log(`\ndry run - nothing written. ${changed} date(s) would move.`);
    return;
  }

  data.videos.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(
    `\nwrote ${targets.length - failed} confirmed date(s), ${changed} moved` +
      `${failed ? `, ${failed} failed` : ''}.\n` +
      `Run "npm run verify" - re-pin any allegation whose clip date moved.`
  );
}

main();
