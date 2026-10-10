#!/usr/bin/env node
/**
 * Creates the per-day folder scaffold and Witness.txt files from the official
 * sitting-day index, matching the naming already in use:
 *
 *   Day 3 19 Sep 2025/Witness.txt
 *
 * Existing Witness.txt files are never overwritten - hand-made ones win.
 *
 *   node scripts/make-witness-files.mjs --dry-run
 *   node scripts/make-witness-files.mjs
 *   node scripts/make-witness-files.mjs --dest "D:\\somewhere\\else"
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = resolve(__dirname, '..', 'staging', 'commission-day-index.json');

// Where the per-day folders live. Set MADLANGA_ARCHIVE, or pass --dest.
// Deliberately not hardcoded to anyone's personal drive layout.
const DEFAULT_DEST =
  process.env.MADLANGA_ARCHIVE ??
  resolve(__dirname, '..', 'transcripts', 'incoming');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const destIdx = args.indexOf('--dest');
const DEST = destIdx >= 0 ? args[destIdx + 1] : DEFAULT_DEST;

/** "Day 3 19 Sep 2025" - the convention already on disk. */
function folderName(day) {
  const [y, m, d] = day.date.split('-');
  return `Day ${day.day} ${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/**
 * Reproduce what the commission published. Where it published nothing, say so
 * plainly rather than leaving a blank that reads like an oversight.
 */
function witnessText(day) {
  const lines = [];
  lines.push(`Witness: ${day.witness?.trim() || 'not published'}`);
  lines.push(`Evidence leader: ${day.evidenceLeader?.trim() || 'not published'}`);
  lines.push('');
  lines.push(`Day ${day.day} — ${day.date} — ${day.materials ?? 0} materials`);
  lines.push('Source: https://criminaljusticecommission.org.za/hearings');
  return lines.join('\n') + '\n';
}

function main() {
  if (!existsSync(INDEX)) {
    console.error(`Missing ${INDEX}`);
    process.exit(1);
  }
  const { days } = JSON.parse(readFileSync(INDEX, 'utf8'));

  if (!existsSync(DEST)) {
    console.error(`Destination does not exist:\n  ${DEST}`);
    console.error('Pass --dest "<path>" if it has moved.');
    process.exit(1);
  }

  console.log(`${dryRun ? 'DRY RUN - ' : ''}destination:\n  ${DEST}\n`);

  let created = 0;
  let kept = 0;
  let foldersMade = 0;

  for (const day of [...days].sort((a, b) => a.day - b.day)) {
    const dir = join(DEST, folderName(day));
    const file = join(dir, 'Witness.txt');

    if (!existsSync(dir)) {
      if (!dryRun) mkdirSync(dir, { recursive: true });
      foldersMade++;
    }
    if (existsSync(file)) {
      kept++;
      continue;
    }
    if (!dryRun) writeFileSync(file, witnessText(day), 'utf8');
    created++;
  }

  const noWitness = days.filter((d) => !d.witness?.trim()).length;
  console.log(`folders created : ${foldersMade}`);
  console.log(`Witness.txt made: ${created}`);
  console.log(`left untouched  : ${kept}  (yours, not overwritten)`);
  console.log(`days with no witness published: ${noWitness}`);
  if (dryRun) console.log('\nNothing written. Re-run without --dry-run to apply.');
}

main();
