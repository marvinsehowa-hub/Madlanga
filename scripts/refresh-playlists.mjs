#!/usr/bin/env node
/**
 * Rebuilds src/data/videos.json from the Newslive SA YouTube playlists.
 *
 * Source of record: https://www.youtube.com/@newslivesa/playlists
 * No API key needed - we read the `ytInitialData` blob that YouTube inlines
 * into the playlist page HTML.
 *
 * Usage: npm run refresh
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'data', 'videos.json');
const TODAY = new Date().toISOString().slice(0, 10);

export const PLAYLISTS = [
  {
    id: 'PLvdetPfnaevh-L2AVnwkwt6oS2HUk2xGM',
    key: 'inquiry',
    label: 'Madlanga Commission inquiry',
    blurb: 'Full hearing streams and testimony clips from the commission itself.',
  },
  {
    id: 'PLISj4lLmcqN4',
    key: 'inside',
    label: 'Inside the Madlanga Commission',
    blurb: 'Episode series breaking down key testimony and major exchanges.',
  },
  {
    id: 'PLvdetPfnaevh9ZnbCZKisTJhszgIzrCX1',
    key: 'adhoc',
    label: 'Ad Hoc Committee',
    blurb: "Parliament's parallel ad hoc committee probing the same allegations.",
  },
];

// Political rallies and marches mention the general but are not proceedings.
const NOT_A_PROCEEDING =
  /march|rally|manifesto|gala dinner|funeral|memorial|newsmaker/i;

/**
 * The Videos tab is mostly party-political reaction. Indexing all of it would
 * bury 49 sourced allegations under hundreds of talk-show clips, so a title has
 * to clear one of two bars:
 *
 *   FORUM   - it names the commission or the committee, so it covers the
 *             proceedings themselves.
 *   LEGAL   - it names someone in the register AND a formal legal step
 *             (arrest, bail, charge, subpoena...), which catches the criminal
 *             matters running alongside the inquiry. The Sibiya bail hearing
 *             reached us only through this bar.
 *
 * Everything else is commentary and is left out deliberately.
 */
const FORUM = /madlanga|ad hoc committee|commission of inquiry|pktt|idac/i;
const REGISTER_NAME =
  /mkhwanazi|sibiya|matlala|mogotsi|mchunu|sibanyoni|chaskalson|feroz khan|masemola|andrea johnson|molefe|sindane|padayachee|senona|mnisi|thobakgale/i;

// Deliberately a disjunction, not a conjunction. Requiring a formal legal
// keyword alongside the name looked tidier but silently dropped real testimony
// clips - "Andrea Johnson questioned about why IDAC was interested in the
// PKTT" names a witness and describes her evidence, yet contains no such word.
const ABOUT_THE_INQUIRY = {
  test: (title) => FORUM.test(title) || REGISTER_NAME.test(title),
};

/**
 * The two channel tabs worth reading, and why both are needed:
 *
 * - Streams carries the FULL sitting days, one video per day, titled by date.
 *   It is the primary record of WHEN the forums sat.
 * - Videos carries the editorialised cut-downs that actually name witnesses and
 *   quote what they said. Without it the index knows a sitting happened but
 *   nothing about its contents, which was this tool's biggest blind spot.
 *
 * Both carry a lot of unrelated broadcasting, so both are filtered.
 */
export const CHANNEL_TABS = [
  {
    key: 'streams',
    label: 'Full session streams',
    blurb:
      "Complete hearing days streamed from the channel's Streams tab - the primary record, most with an exact date in the title.",
    url: 'https://www.youtube.com/@newslivesa/streams?hl=en',
    relevant: ABOUT_THE_INQUIRY,
    exclude: NOT_A_PROCEEDING,
  },
  {
    key: 'clips',
    label: 'Testimony clips',
    blurb:
      "Cut-downs from the channel's Videos tab - the only source that names witnesses and quotes testimony in the title.",
    url: 'https://www.youtube.com/@newslivesa/videos?hl=en',
    relevant: ABOUT_THE_INQUIRY,
    exclude: NOT_A_PROCEEDING,
  },
];

/**
 * What kind of record a video is, so the UI can separate proceedings from
 * commentary.
 *
 * A full sitting is published under the forum's own name, optionally behind a
 * "(Sign Language)" prefix. An editorialised title that merely STARTS with the
 * forum name - "Madlanga Commission | Justice Madlanga SLAMS ..." - is a news
 * clip about the sitting, not the sitting itself, and must not be counted as
 * one.
 */
export function classify(title) {
  const bare = title.replace(/^\s*\(?\s*sign language\s*\)?\s*/i, '').trim();
  // A real sitting is published under the forum's own name. An editorialised
  // title that merely starts with it - "Madlanga Commission | Madlanga SLAMS
  // ..." - is a news clip about the sitting, not the sitting itself.
  if (/^madlanga commission of inquiry\b/i.test(bare)) return 'session';
  if (/^madlanga commission\s*\(sign language\)/i.test(bare)) return 'session';
  if (/^ad hoc committee\b/i.test(bare)) return 'session';
  return 'clip';
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Pull every object with a given key out of a deeply nested structure. */
function collect(node, key, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const n of node) collect(n, key, out);
    return out;
  }
  if (key in node) out.push(node[key]);
  for (const k of Object.keys(node)) collect(node[k], key, out);
  return out;
}

const text = (t) =>
  t?.simpleText ?? t?.runs?.map((r) => r.text).join('') ?? undefined;

/**
 * YouTube only exposes fuzzy ages ("3 weeks ago") on playlist pages.
 * Turn that into an approximate ISO date, flagged as approximate so the UI
 * never presents a guess as a fact.
 */
function relativeToDate(rel, now = new Date()) {
  if (!rel) return null;

  // YouTube serves two forms and switches between them without warning:
  // the long one ("3 weeks ago") and a compact one ("12d ago", "2mo ago").
  // Handle both - a miss here silently yields a null date.
  // Note `mo` must be tested before `m`, or months parse as minutes.
  const long = rel.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/i);
  const short = rel.match(/(\d+)\s*(mo|s|m|h|d|w|y)\b/i);
  const m = long ?? short;
  if (!m) return null;

  const n = Number(m[1]);
  const raw = m[2].toLowerCase();
  const unit = long
    ? raw
    : { s: 'second', m: 'minute', h: 'hour', d: 'day', w: 'week', mo: 'month', y: 'year' }[raw];
  if (!unit) return null;

  const d = new Date(now);
  const days = { second: 0, minute: 0, hour: 0, day: 1, week: 7 };
  if (unit === 'month') d.setMonth(d.getMonth() - n);
  else if (unit === 'year') d.setFullYear(d.getFullYear() - n);
  else d.setDate(d.getDate() - n * days[unit]);
  return d.toISOString().slice(0, 10);
}

/** Some titles carry an explicit hearing date - always prefer that. */
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
function dateFromTitle(title) {
  const m = title.match(
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i
  );
  if (!m) return null;
  const [, d, mon, y] = m;
  return `${y}-${String(MONTHS[mon.toLowerCase()]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function dayNumberFromTitle(title) {
  const m = title.match(/\bDay\s+(\d{1,3})\b/i);
  return m ? Number(m[1]) : null;
}

function durationToSeconds(len) {
  if (!len) return null;
  const parts = len.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/**
 * Records are keyed by videoId across every source, and source membership is
 * merged - the same session often appears in a playlist AND on the Streams tab.
 */
function makePush(sourceKey, byId, frozen, seenNow) {
  return (raw) => {
    if (!raw.videoId) return;
    seenNow.add(raw.videoId);
    const existing = byId.get(raw.videoId);
    if (existing) {
      if (!existing.playlists.includes(sourceKey)) {
        existing.playlists.push(sourceKey);
      }
      // Titles get edited after publication; keep the current one, and keep
      // the classification in step with it.
      if (raw.title) {
        const t = raw.title.replace(/\s+/g, ' ').trim();
        if (t && t !== existing.title) {
          existing.title = t;
          existing.kind = classify(t);
          existing.hearingDay = dayNumberFromTitle(t);
        }
      }
      // A sitting that was on air last time has no duration; once it ends
      // YouTube starts reporting one. Without this the record stays stuck as
      // a live stream of unknown length forever.
      if (raw.duration && raw.duration !== existing.duration) {
        existing.duration = raw.duration;
        existing.seconds = durationToSeconds(raw.duration);
      }
      existing.liveNow = raw.liveNow ?? false;
      existing.lastSeen = TODAY;
      return;
    }
    const title = (raw.title ?? '').replace(/\s+/g, ' ').trim();
    const exact = dateFromTitle(title);

    // A clip's real publication date never changes - only our ESTIMATE of it
    // does, because YouTube gives a relative age ("3 weeks ago") that we read
    // against today's date. Re-deriving on every refresh would silently walk
    // every approximate date forward and break the allegation pins that point
    // at them. So a date, once derived, is frozen; only an exact date stated
    // in the title may override it.
    const prior = frozen.get(raw.videoId);
    const date = exact ?? prior?.date ?? relativeToDate(raw.relative);
    const dateApprox = exact ? false : (prior?.dateApprox ?? true);

    byId.set(raw.videoId, {
      videoId: raw.videoId,
      title,
      url: `https://www.youtube.com/watch?v=${raw.videoId}`,
      playlists: [sourceKey],
      duration: raw.duration ?? null,
      seconds: durationToSeconds(raw.duration),
      views: raw.views ?? null,
      // `isLive` means "was broadcast live at some point"; `liveNow` means
      // "still on air as of this refresh", which is why it has no duration.
      isLive: /streamed/i.test(raw.relative ?? ''),
      liveNow: raw.liveNow ?? false,
      // The channel runs a separate signed-language feed of the same sitting;
      // flagged so hearing-day counts do not double.
      signLanguage: /sign language/i.test(title),
      relative: raw.relative ?? null,
      date,
      dateApprox,
      dateFrozenAt: prior?.dateFrozenAt ?? new Date().toISOString().slice(0, 10),
      hearingDay: dayNumberFromTitle(title),
      kind: classify(title),
      firstSeen: TODAY,
      lastSeen: TODAY,
    });
  };
}

async function fetchPlaylist(pl, byId, frozen, seenNow) {
  const url = `https://www.youtube.com/playlist?list=${pl.id}&hl=en`;
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`${pl.label}: HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
  if (!m) throw new Error(`${pl.label}: ytInitialData not found (layout changed?)`);
  const data = JSON.parse(m[1]);

  // YouTube's current playlist layout renders each item as a `lockupViewModel`;
  // older responses used `playlistVideoRenderer`. Handle both.
  const lockups = collect(data, 'lockupViewModel').filter(
    (l) => l.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && l.contentId
  );
  const legacy = collect(data, 'playlistVideoRenderer');

  const push = makePush(pl.key, byId, frozen, seenNow);
  for (const l of lockups) {
    const meta = l.metadata?.lockupMetadataViewModel;
    const parts = collect(meta?.metadata, 'metadataParts')
      .flat()
      .map((p) => p?.text?.content)
      .filter(Boolean);
    const { duration, liveNow } = badgeInfo(l);
    push({
      videoId: l.contentId,
      title: meta?.title?.content,
      duration,
      liveNow,
      views: parts.find((p) => /views?$/i.test(p)),
      relative: parts.find((p) => /ago$/i.test(p)),
    });
  }

  for (const r of legacy) {
    push({
      videoId: r.videoId,
      title: text(r.title),
      duration: text(r.lengthText),
      relative: text(r.videoInfo)?.match(/Streamed .*|\d+ \w+ ago/)?.[0],
    });
  }

  return lockups.length + legacy.length;
}

/**
 * A thumbnail carries EITHER a duration badge or a LIVE badge. A sitting that
 * is still on air has no duration, which would otherwise be indistinguishable
 * from a missing value - so read both and say which it is.
 */
function badgeInfo(l) {
  const texts = collect(l.contentImage, 'thumbnailBadgeViewModel')
    .map((b) => b?.text)
    .filter(Boolean);
  return {
    duration: texts.find((t) => /^\d+(:\d{2})+$/.test(t)),
    liveNow: texts.some((t) => /^live$/i.test(t.trim())),
  };
}

/** Turn a lockupViewModel into the flat shape `push` consumes. */
function fromLockup(l) {
  const meta = l.metadata?.lockupMetadataViewModel;
  const parts = collect(meta?.metadata, 'metadataParts')
    .flat()
    .map((p) => p?.text?.content)
    .filter(Boolean);
  const { duration, liveNow } = badgeInfo(l);
  return {
    videoId: l.contentId,
    title: meta?.title?.content,
    duration,
    liveNow,
    views: parts.find((p) => /views?$/i.test(p)),
    relative: parts.find((p) => /ago$/i.test(p)),
  };
}

/**
 * Read a channel tab, following continuation tokens to the end. The Streams
 * tab returns 30 items per page, so the full hearing record needs paging.
 */
async function fetchChannelTab(src, byId, frozen, seenNow) {
  const push = makePush(src.key, byId, frozen, seenNow);
  const res = await fetch(src.url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
  if (!m) throw new Error('ytInitialData not found');

  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion =
    html.match(/"clientVersion":"([\d.]+)"/)?.[1] ?? '2.20240101.00.00';

  let data = JSON.parse(m[1]);
  let seen = 0;
  let pages = 0;

  while (data && pages < 40) {
    pages++;
    const lockups = collect(data, 'lockupViewModel').filter(
      (l) => l.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && l.contentId
    );
    for (const l of lockups) {
      const raw = fromLockup(l);
      if (!raw.title || !src.relevant.test(raw.title)) continue;
      if (src.exclude?.test(raw.title)) continue;
      push(raw);
      seen++;
    }

    const token = collect(data, 'continuationItemRenderer')
      .map((c) => c?.continuationEndpoint?.continuationCommand?.token)
      .find(Boolean);
    if (!token || !apiKey) break;

    const next = await fetch(
      `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}&prettyPrint=false`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': UA },
        body: JSON.stringify({
          context: { client: { clientName: 'WEB', clientVersion, hl: 'en' } },
          continuation: token,
        }),
      }
    );
    if (!next.ok) break;
    data = await next.json();
    await new Promise((r) => setTimeout(r, 200));
  }

  return seen;
}

/** The previous run's records, keyed by videoId. */
function loadPrevious() {
  if (!existsSync(OUT)) return [];
  try {
    return JSON.parse(readFileSync(OUT, 'utf8')).videos ?? [];
  } catch {
    return [];
  }
}

/** Dates already committed to disk, so refreshes cannot walk them forward. */
function loadFrozenDates(prev) {
  return new Map(
    prev.map((v) => [
      v.videoId,
      { date: v.date, dateApprox: v.dateApprox, dateFrozenAt: v.dateFrozenAt },
    ])
  );
}

async function main() {
  const prev = loadPrevious();
  const frozen = loadFrozenDates(prev);

  // Seed from the previous run so a flaky page of results can never DELETE a
  // video we already have. YouTube's pagination is not stable between calls;
  // rebuilding from scratch silently shrank the archive by 25 records once.
  // An archive should only ever grow, so refreshes merge rather than replace.
  const byId = new Map(prev.map((v) => [v.videoId, { ...v }]));
  const seenNow = new Set();
  for (const pl of PLAYLISTS) {
    process.stdout.write(`fetching ${pl.label} ... `);
    try {
      const n = await fetchPlaylist(pl, byId, frozen, seenNow);
      console.log(`${n} items`);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
  }
  for (const tab of CHANNEL_TABS) {
    process.stdout.write(`fetching ${tab.label} ... `);
    try {
      const n = await fetchChannelTab(tab, byId, frozen, seenNow);
      console.log(`${n} relevant items`);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
  }

  const all = [...byId.values()];
  if (!all.length) {
    console.error('No videos fetched - leaving existing videos.json untouched.');
    process.exit(1);
  }
  all.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        channel: 'https://www.youtube.com/@newslivesa/playlists',
        playlists: [
          ...PLAYLISTS,
          ...CHANNEL_TABS.map((t) => ({
            ...t,
            relevant: undefined,
            exclude: undefined,
          })),
        ],
        videos: all,
      },
      null,
      2
    )
  );
  const fresh = all.filter((v) => !frozen.has(v.videoId));
  if (fresh.length) {
    console.log(`
${fresh.length} new clip(s) since the last refresh:`);
    for (const v of fresh) console.log(`  ${v.date}  ${v.title}`);
  }
  const carried = all.filter((v) => !seenNow.has(v.videoId)).length;
  if (carried) {
    console.log(
      `
${carried} record(s) not returned by YouTube this run were carried ` +
        `over from the previous archive rather than dropped.`
    );
  }
  const shared = all.filter((v) => v.playlists.length > 1).length;
  console.log(
    `\nwrote ${all.length} unique videos (${shared} in more than one ` +
      `playlist) -> ${OUT}`
  );
}

// Only scrape when run directly. Without this guard, any script that imports
// PLAYLISTS or CHANNEL_TABS from here kicks off a full network scrape as a
// side effect of the import.
const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
