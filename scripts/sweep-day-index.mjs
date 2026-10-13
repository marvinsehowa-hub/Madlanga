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
 * https://criminaljusticecommission.org.za/hearings and let it run - it takes
 * about fifteen seconds:
 *
 *   (async()=>{
 *    const M=/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d/;
 *    const grab=()=>{const t=document.body.innerText;
 *      const re=/Day (\d+)\n([A-Z][a-z]{2}, \d{1,2} \w{3} \d{4})\n·\s*(\d+)\s*materials?/g;
 *      const o=[];let m;while((m=re.exec(t)))o.push([+m[1],+m[3]]);return o;};
 *    const acc=new Map();
 *    for(const b of [...document.querySelectorAll('button')].filter(b=>M.test(b.textContent.trim()))){
 *      for(let i=0;i<4;i++){
 *        b.click();await new Promise(r=>setTimeout(r,1100));const a=grab();
 *        await new Promise(r=>setTimeout(r,400));const c=grab();
 *        if(c.length&&JSON.stringify(a)===JSON.stringify(c)){
 *          for(const[d,n]of c)acc.set(d,n);break;}}}
 *    return [...acc.entries()].sort((a,b)=>a[0]-b[0]).map(([d,c])=>d+':'+c).join(',');})()
 *
 * Three things about that snippet are load-bearing.
 *
 * It opens each month and banks that month's rows before moving on, rather
 * than expanding everything and reading the page once. The months are an
 * accordion: opening one closes others, so "expand them all, then scrape"
 * silently returns whichever few happen to be open. It read 9 of 182 days
 * that way and would have reported the archive as nearly empty.
 *
 * It reads each month twice and only banks the rows when both reads agree.
 * A month that is still rendering reports days with their counts not yet
 * filled in - the day is there, the materials line reads 0. A single read
 * returned 322 materials instead of 402, with about forty days showing 0
 * that in fact hold two or three items each. That is the dangerous failure,
 * because unlike a missing month it looks exactly like the commission
 * having withdrawn material.
 *
 * And it requires the date line between "Day N" and the materials count. A
 * looser scan pairs counts with the wrong day, because stray "Day N" tokens
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
  // A half-rendered month reports its days with the materials line not yet
  // filled in, so the count reads 0. That is indistinguishable, day by day,
  // from the commission having pulled the material down - except that it
  // happens to many days at once and always lands on exactly 0. Say so
  // loudly rather than letting the list be read as a takedown.
  const toZero = lost.filter((l) => l.to === 0);
  if (toZero.length >= 5) {
    console.log(
      `LIKELY A BAD CAPTURE: ${toZero.length} days dropped to exactly 0.\n` +
        '  That is the signature of a page read while it was still rendering,\n' +
        '  not of material being withdrawn. Re-run the capture before believing\n' +
        '  any of the removals below.\n'
    );
  }
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
