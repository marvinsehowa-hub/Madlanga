#!/usr/bin/env node
/**
 * Builds src/data/transcripts.json from the parsed day files in
 * public/transcripts/.
 *
 * The index is deliberately compact - date, day number, counts, and which
 * people in the register the text actually names, plus one short locating
 * snippet per person. The full text stays in public/ and is fetched on demand,
 * so the app bundle does not swallow hundreds of pages per sitting day.
 *
 *   node scripts/index-transcripts.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { people } from '../src/data/people.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PARSED = resolve(ROOT, 'public', 'transcripts');
const OUT = resolve(ROOT, 'src', 'data', 'transcripts.json');

const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'");

/** A short window around the first hit, so the UI can show where a name lands. */
function snippet(text, needle) {
  const i = norm(text).indexOf(norm(needle));
  if (i < 0) return null;
  const start = Math.max(0, i - 90);
  return (
    (start > 0 ? '…' : '') +
    text.slice(start, i + needle.length + 110).replace(/\s+/g, ' ').trim() +
    '…'
  );
}

function main() {
  if (!existsSync(PARSED)) {
    mkdirSync(PARSED, { recursive: true });
  }
  const files = readdirSync(PARSED).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.log(`No parsed transcripts in ${PARSED}.`);
    console.log('Run:  python scripts/extract_transcripts.py');
    console.log('(and before that, drop the PDFs into transcripts/incoming/)');
    // Still write an empty index so the app has something well-formed to read.
    writeFileSync(
      OUT,
      JSON.stringify({ builtAt: new Date().toISOString(), days: [] }, null, 2)
    );
    return;
  }

  const days = [];
  for (const file of files) {
    const doc = JSON.parse(readFileSync(resolve(PARSED, file), 'utf8'));
    const full = doc.pages.map((p) => p.text).join('\n');
    const hay = norm(full);

    const mentions = [];
    for (const p of people) {
      if (p.institutional) continue;
      const hit = p.matchers.find((m) => m && hay.includes(norm(m)));
      if (!hit) continue;
      // Count occurrences of the matcher that actually landed.
      const count = hay.split(norm(hit)).length - 1;
      const page = doc.pages.find((pg) => norm(pg.text).includes(norm(hit)));
      mentions.push({
        personId: p.id,
        matched: hit,
        count,
        firstPage: page?.page ?? null,
        snippet: page ? snippet(page.text, hit) : null,
      });
    }
    mentions.sort((a, b) => b.count - a.count);

    days.push({
      date: doc.date,
      day: doc.day ?? null,
      kind: doc.kind,
      sourceFile: doc.sourceFile,
      textFile: `/transcripts/${file}`,
      pageCount: doc.pages.length,
      words: full.split(/\s+/).filter(Boolean).length,
      mentions,
    });
  }

  days.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        source: 'https://criminaljusticecommission.org.za/hearings',
        days,
      },
      null,
      2
    )
  );

  const totalWords = days.reduce((n, d) => n + d.words, 0);
  console.log(`indexed ${days.length} day(s), ${totalWords.toLocaleString()} words`);
  for (const d of days) {
    const top = d.mentions.slice(0, 5).map((m) => `${m.personId}(${m.count})`).join(' ');
    console.log(`  ${d.date}  ${String(d.pageCount).padStart(4)}pp  ${top}`);
  }
  console.log(`\nwrote ${OUT}`);
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
