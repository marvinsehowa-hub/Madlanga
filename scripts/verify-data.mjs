#!/usr/bin/env node
/**
 * Sanity checks on the curated data. Run after editing people.js/timeline.js:
 *   npm run verify
 *
 * Catches the mistakes that are easy to make by hand and invisible in the UI:
 * dangling person ids, matchers that never hit any footage, matchers so loose
 * they link a person to clips that are not about them, and missing denials.
 */
import { people, peopleById } from '../src/data/people.js';
import { resolveAlleger } from '../src/lib/resolve.js';
import { timeline } from '../src/data/timeline.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { videos } = require('../src/data/videos.json');
const { articles } = require('../src/data/articles.json');
const articleById = new Map(articles.map((a) => [a.articleId, a]));

let warnings = 0;
let errors = 0;
const err = (m) => { errors++; console.error(`  ERROR  ${m}`); };
const warn = (m) => { warnings++; console.warn(`  warn   ${m}`); };

console.log('\nchecking person ids referenced by the timeline');
for (const e of timeline) {
  for (const id of e.people) {
    if (!peopleById[id]) err(`${e.date} "${e.title}" -> unknown person id "${id}"`);
  }
}

console.log('checking for duplicate person ids');
const seen = new Set();
for (const p of people) {
  if (seen.has(p.id)) err(`duplicate id "${p.id}"`);
  seen.add(p.id);
}

console.log('checking matcher coverage against footage');
const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'");
for (const p of people) {
  const hits = videos.filter((v) =>
    p.matchers.some((m) => norm(v.title).includes(norm(m)))
  );
  if (hits.length === 0 && !p.institutional && !p.evidenceOnly) {
    warn(`"${p.name}" matches no clip title - is a matcher misspelled?`);
  }
  // `evidenceOnly` says the absence is the point: the person surfaced inside
  // evidence described in a clip, never in a title. Flag it if that stops
  // being true, so the marker gets removed rather than quietly going stale.
  if (hits.length > 0 && p.evidenceOnly) {
    warn(
      `"${p.name}" is marked evidenceOnly but now matches ${hits.length} clip title(s) - drop the flag`
    );
  }
  if (hits.length > videos.length * 0.25) {
    warn(`"${p.name}" matches ${hits.length}/${videos.length} clips - matcher too loose?`);
  }
}

console.log('checking allegations are attributed and answered');
for (const p of people) {
  for (const [i, a] of (p.allegations ?? []).entries()) {
    if (!a.by) err(`${p.name} allegation ${i + 1} has no "by"`);
    if (!a.forum) err(`${p.name} allegation ${i + 1} has no "forum"`);
    if (!['video', 'public-record', 'article'].includes(a.basis))
      err(`${p.name} allegation ${i + 1} has invalid basis "${a.basis}"`);
    if (a.basis === 'article' && !articleById.has(a.article))
      err(
        `${p.name} allegation ${i + 1} claims an article basis but article ` +
          `"${a.article}" is not in articles.json`
      );
    if (a.article && !articleById.has(a.article))
      err(`${p.name} allegation ${i + 1} cites unknown article "${a.article}"`);
    if (!a.response) warn(`${p.name} allegation ${i + 1} records no response`);
  }
  if (p.category === 'accused' && (p.allegations ?? []).length === 0)
    err(`${p.name} is filed under "accused" but lists no allegation`);
}

console.log('checking allegations are pinned to a sitting');
const videoById = Object.fromEntries(videos.map((v) => [v.videoId, v]));
for (const p of people) {
  for (const [i, a] of (p.allegations ?? []).entries()) {
    const where = `${p.name} allegation ${i + 1}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.presented ?? ''))
      err(`${where} has no valid "presented" date`);
    for (const [field, id] of [['clip', a.clip], ['responseClip', a.responseClip]]) {
      if (id && !videoById[id]) err(`${where} ${field} "${id}" is not in videos.json`);
    }
    // A pinned date must match the clip it is pinned to, unless the entry
    // explains why it deliberately differs.
    const clip = a.clip ? videoById[a.clip] : null;
    if (clip && !a.presentedNote && clip.date !== a.presented)
      err(
        `${where} presented ${a.presented} but clip ${a.clip} is dated ` +
          `${clip.date} - fix the date or add a presentedNote explaining`
      );
    if (a.basis === 'video' && !a.clip && !a.presentedNote)
      warn(`${where} claims video basis but names no clip`);
  }
}

console.log('checking every alleger resolves to a node');
for (const p of people) {
  for (const [i, a] of (p.allegations ?? []).entries()) {
    const from = resolveAlleger(a.by, p.id);
    if (!from)
      err(
        `${p.name} allegation ${i + 1}: "${a.by}" resolves to nobody, so it ` +
          `will be missing from the relationship graph`
      );
    else if (!peopleById[from])
      err(`${p.name} allegation ${i + 1}: resolves to unknown id "${from}"`);
  }
}

console.log('checking video dates');
const undated = videos.filter((v) => !v.date);
if (undated.length) warn(`${undated.length} clips have no date`);

console.log(
  `\n${errors} error(s), ${warnings} warning(s) · ${people.length} people, ` +
    `${timeline.length} timeline events, ${videos.length} clips\n`
);
process.exit(errors ? 1 : 0);
