import transcriptIndex from '../data/transcripts.json';
import { peopleById } from './data.js';

/**
 * Transcript access.
 *
 * The compact index ships with the app; the full text of each sitting day is
 * fetched on demand from /transcripts/ and cached in memory. A day's record
 * runs to a couple of hundred pages, so bundling them all would be a few
 * megabytes of JavaScript nobody asked for.
 */
export const transcriptDays = [...transcriptIndex.days].sort((a, b) =>
  (b.date ?? '').localeCompare(a.date ?? '')
);

export const transcriptSource = transcriptIndex.source;
export const hasTranscripts = transcriptDays.length > 0;

export const transcriptStats = {
  days: transcriptDays.length,
  pages: transcriptDays.reduce((n, d) => n + (d.pageCount ?? 0), 0),
  words: transcriptDays.reduce((n, d) => n + (d.words ?? 0), 0),
  people: new Set(transcriptDays.flatMap((d) => d.mentions.map((m) => m.personId)))
    .size,
  span: [
    transcriptDays[transcriptDays.length - 1]?.date ?? null,
    transcriptDays[0]?.date ?? null,
  ],
};

/** Index-only lookup: which days name this person, newest first. */
export function transcriptMentionsFor(personId) {
  return transcriptDays
    .map((d) => {
      const m = d.mentions.find((x) => x.personId === personId);
      return m ? { ...m, date: d.date, day: d.day, textFile: d.textFile } : null;
    })
    .filter(Boolean);
}

const cache = new Map();

/**
 * The index stores textFile as "/transcripts/<name>.json". On GitHub Pages the
 * app is served from /<repo>/, so that leading slash would resolve to the
 * domain root and 404. Re-root it against Vite's BASE_URL.
 */
function textUrl(day) {
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/$/, '') + day.textFile;
}

/** Thrown when the full text was not deployed alongside the app. */
export class TranscriptTextUnavailable extends Error {}

async function loadDay(day) {
  if (cache.has(day.date)) return cache.get(day.date);
  const res = await fetch(textUrl(day));
  if (!res.ok) {
    // A 404 here means the verbatim text is not published with this build -
    // the repo deliberately ships only the index. That is a different thing
    // from a broken deployment, and the UI says so.
    if (res.status === 404) {
      throw new TranscriptTextUnavailable(
        'Full transcript text is not published with this build.'
      );
    }
    throw new Error(`${day.date}: HTTP ${res.status}`);
  }
  const doc = await res.json();
  cache.set(day.date, doc);
  return doc;
}

export async function loadAllDays(onProgress) {
  const docs = [];
  for (const [i, day] of transcriptDays.entries()) {
    docs.push(await loadDay(day));
    onProgress?.(i + 1, transcriptDays.length);
  }
  return docs;
}

const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'");

/**
 * Passage search across loaded days.
 *
 * Returns a bounded window around each hit rather than whole pages - enough to
 * judge relevance and locate it in the official record, not a republication of
 * it. `limit` caps total hits so one common word cannot lock the UI up.
 */
export function searchLoaded(docs, query, { limit = 120, window = 160 } = {}) {
  const q = norm(query).trim();
  if (q.length < 3) return { hits: [], truncated: false };

  const hits = [];
  let truncated = false;

  outer: for (const doc of docs) {
    for (const page of doc.pages) {
      const hay = norm(page.text);
      let from = 0;
      for (;;) {
        const i = hay.indexOf(q, from);
        if (i < 0) break;
        const start = Math.max(0, i - window);
        const end = Math.min(page.text.length, i + q.length + window);
        hits.push({
          date: doc.date,
          day: doc.day,
          page: page.page,
          before: (start > 0 ? '…' : '') + page.text.slice(start, i),
          match: page.text.slice(i, i + q.length),
          after: page.text.slice(i + q.length, end) + (end < page.text.length ? '…' : ''),
        });
        if (hits.length >= limit) {
          truncated = true;
          break outer;
        }
        from = i + q.length;
      }
    }
  }
  return { hits, truncated };
}

/** Day metadata joined to the register, for display. */
export function dayPeople(day) {
  return day.mentions
    .map((m) => ({ ...m, person: peopleById[m.personId] }))
    .filter((m) => m.person);
}
