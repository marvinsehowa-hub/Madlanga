#!/usr/bin/env node
/**
 * Reads the title, exact upload date and DESCRIPTION for videos from their
 * watch pages, and caches them in src/data/descriptions.json.
 *
 * Full sitting days are titled only by date ("Madlanga Commission of Inquiry |
 * 26 August 2026"), so the description is the only published clue to who
 * actually testified. Since the caption API is closed to us, this is the best
 * content signal available short of transcribing the audio.
 *
 *   node scripts/fetch-descriptions.mjs <videoId> [...]
 *   node scripts/fetch-descriptions.mjs --since 2026-08-24
 *   node scripts/fetch-descriptions.mjs --since 2026-08-24 --print
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIDEOS = resolve(__dirname, '..', 'src', 'data', 'videos.json');
const OUT = resolve(__dirname, '..', 'src', 'data', 'descriptions.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** shortDescription is JSON-escaped inside the page; decode it properly. */
function decode(raw) {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
}

async function fetchOne(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  // Escape-aware and self-terminating: stop at the first UNescaped quote.
  // A lazy `.*?` up to a trailing key is not safe - on a live stream that key
  // is absent or far away, and the match swallows megabytes of player JSON.
  const STRING = (key) =>
    new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`);
  const desc = html.match(STRING('shortDescription'));
  const date = html.match(/"uploadDate":"([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  const title = html.match(STRING('title'));
  const isLive = /"isLiveNow":true|"isLive":true/.test(html);
  const description = desc ? decode(desc[1]).trim() : '';
  const titleText = title ? decode(title[1]) : null;
  // A field this long is not a title or a description - it is a failed match
  // that swallowed player JSON. Refuse it rather than poison the cache.
  for (const [field, value] of [
    ['description', description],
    ['title', titleText],
  ]) {
    if ((value?.length ?? 0) > 8000) {
      throw new Error(`${field} match ran away (${value.length} chars)`);
    }
  }
  return {
    videoId,
    title: titleText,
    uploadDate: date ? date[1] : null,
    description,
    isLive,
    fetchedAt: new Date().toISOString().slice(0, 10),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const print = args.includes('--print');
  const sinceIdx = args.indexOf('--since');
  const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;
  // Only skip the value that belongs to --since. Without the sinceIdx guard,
  // `sinceIdx + 1` is 0 when --since is absent and the first id is dropped.
  const ids = args.filter(
    (a, i) => !a.startsWith('--') && !(sinceIdx >= 0 && i === sinceIdx + 1)
  );

  const { videos } = JSON.parse(readFileSync(VIDEOS, 'utf8'));
  const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};

  const targets = since
    ? videos.filter((v) => v.date >= since).map((v) => v.videoId)
    : ids;

  if (!targets.length) {
    console.error('Nothing to fetch. Pass video ids or --since YYYY-MM-DD.');
    process.exit(1);
  }

  console.log(`fetching ${targets.length} description(s)\n`);
  for (const id of targets) {
    if (cache[id]?.description) {
      if (print) console.log(`  [cached] ${id}`);
      continue;
    }
    try {
      cache[id] = await fetchOne(id);
      console.log(
        `  ${id}  ${cache[id].uploadDate}  ${cache[id].description.length} chars`
      );
    } catch (err) {
      console.log(`  ${id}  FAILED (${err.message})`);
    }
    await sleep(250);
  }

  writeFileSync(OUT, JSON.stringify(cache, null, 2));
  console.log(`\ncached ${Object.keys(cache).length} description(s) -> ${OUT}`);

  if (print) {
    for (const id of targets) {
      const d = cache[id];
      if (!d) continue;
      console.log(`\n=== ${d.uploadDate}  ${id} ===`);
      console.log(d.title);
      console.log(d.description || '(no description)');
    }
  }
}

main();
