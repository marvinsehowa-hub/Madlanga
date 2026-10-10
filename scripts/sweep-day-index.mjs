#!/usr/bin/env node
/**
 * Detects newly posted commission materials by diffing material COUNTS
 * against the stored baseline.
 *
 * Counts alone are enough: if Day 113 went from 3 items to 5, that is the
 * signal to open Day 113 and see what appeared. It avoids having to classify
 * anything, and avoids expanding all 182 day cards, which is the fragile part.
 *
 * The site is a React SPA, so the capture itself has to happen in a browser.
 * Paste this into the console at
 * https://criminaljusticecommission.org.za/hearings with every month expanded:
 *
 *   (()=>{const t=document.body.innerText;
 *    const re=/Day (\d+)\n([A-Z][a-z]{2}, \d{1,2} \w{3} \d{4})\n·\s*(\d+)\s*materials?/g;
 *    const o=[],s=new Set();let m;
 *    while((m=re.exec(t))){const d=+m[1];if(s.has(d))continue;s.add(d);o.push(d+':'+m[3]);}
 *    return o.sort((a,b)=>+a.split(':')[0]-+b.split(':')[0]).join(',');})()
 *
 * Requiring the date line between "Day N" and the materials count matters:
 * a looser scan pairs counts with the wrong day, because stray "Day N" tokens
 * in the month navigation overwrite the current day first. That produced a
 * silent off-by-two once.
 *
 *   node scripts/sweep-day-index.mjs "1:4,2:3,3:7,..."
 *   node scripts/sweep-day-index.mjs --file today.txt
 *   node scripts/sweep-day-index.mjs "..." --save   # adopt as the new baseline
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = resolve(__dirname, '..', 'staging', 'commission-day-index.json');

const args = process.argv.slice(2);
const save = args.includes('--save');
const fileIdx = args.indexOf('--file');
const raw =
  fileIdx >= 0
    ? readFileSync(args[fileIdx + 1], 'utf8')
    : args.find((a) => !a.startsWith('--') && a.includes(':'));

if (!raw) {
  console.error('Pass the captured "day:count,..." string, or --file <path>.');
  console.error('See the header of this script for the browser snippet.');
  process.exit(1);
}

const now = new Map();
for (const pair of raw.trim().split(/[,\s]+/).filter(Boolean)) {
  const [d, c] = pair.split(':').map(Number);
  if (Number.isFinite(d) && Number.isFinite(c)) now.set(d, c);
}

const data = JSON.parse(readFileSync(INDEX, 'utf8'));
const before = new Map(data.days.map((d) => [d.day, d.materials ?? 0]));

const gained = [];
const lost = [];
const added = [];

for (const [day, count] of [...now].sort((a, b) => b[0] - a[0])) {
  if (!before.has(day)) {
    added.push({ day, count });
  } else if (count > before.get(day)) {
    gained.push({ day, from: before.get(day), to: count });
  } else if (count < before.get(day)) {
    lost.push({ day, from: before.get(day), to: count });
  }
}
const missing = [...before.keys()].filter((d) => !now.has(d));

const byDay = new Map(data.days.map((d) => [d.day, d]));
const label = (day) => {
  const d = byDay.get(day);
  return d ? `${d.date}  ${(d.witness ?? '').slice(0, 42)}` : '(new day)';
};

console.log(`baseline ${data.capturedAt}: ${before.size} days, ` +
  `${[...before.values()].reduce((a, b) => a + b, 0)} materials`);
console.log(`today:              ${now.size} days, ` +
  `${[...now.values()].reduce((a, b) => a + b, 0)} materials\n`);

if (added.length) {
  console.log(`NEW SITTING DAYS (${added.length}):`);
  for (const a of added) console.log(`  Day ${a.day}  ${a.count} materials`);
  console.log();
}
if (gained.length) {
  console.log(`MATERIALS ADDED (${gained.length}) - worth opening these:`);
  for (const g of gained) {
    console.log(`  Day ${String(g.day).padStart(3)}  ${g.from} -> ${g.to}   ${label(g.day)}`);
  }
  console.log();
}
if (lost.length) {
  console.log(`MATERIALS REMOVED (${lost.length}) - verify before believing:`);
  for (const l of lost) {
    console.log(`  Day ${String(l.day).padStart(3)}  ${l.from} -> ${l.to}   ${label(l.day)}`);
  }
  console.log();
}
if (missing.length) {
  console.log(`IN BASELINE BUT NOT CAPTURED (${missing.length}): ${missing.join(', ')}`);
  console.log('  Usually an incomplete capture, not a deletion. Re-run before acting.\n');
}
if (!added.length && !gained.length && !lost.length && !missing.length) {
  console.log('No change since the baseline.');
}

if (save) {
  for (const d of data.days) if (now.has(d.day)) d.materials = now.get(d.day);
  for (const a of added) {
    data.days.push({ day: a.day, date: null, materials: a.count, witness: null, evidenceLeader: null });
  }
  data.days.sort((x, y) => y.day - x.day);
  data.capturedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(INDEX, JSON.stringify(data, null, 2));
  console.log(`\nbaseline updated -> ${INDEX}`);
}
