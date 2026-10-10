import {
  people,
  peopleById,
  CATEGORY,
  SEVERITY,
  APPEARANCE,
} from '../data/people.js';
import { timeline, timelineSorted, STRANDS } from '../data/timeline.js';
import videoData from '../data/videos.json';
import articleData from '../data/articles.json';

export {
  people,
  peopleById,
  CATEGORY,
  SEVERITY,
  APPEARANCE,
  timeline,
  timelineSorted,
  STRANDS,
};

/**
 * People the commission expected to hear from whose appearance is still
 * unresolved - summoned, ordered, stood down or simply absent. Most severe
 * first, then most recent.
 */
export const outstandingAppearances = people
  .filter((p) => p.appearance && APPEARANCE[p.appearance.status]?.outstanding)
  .sort((a, b) => {
    const rank = {
      'subpoena-ignored': 4,
      'in-custody': 3,
      ordered: 2,
      'stood-down': 1,
      postponed: 1,
    };
    const d = (rank[b.appearance.status] ?? 0) - (rank[a.appearance.status] ?? 0);
    return d !== 0 ? d : b.appearance.date.localeCompare(a.appearance.date);
  });

/**
 * The commission's own sitting-day count, read from its official hearings
 * index. Update `count` and `asAt` together when that page moves on.
 * Source: https://criminaljusticecommission.org.za/hearings
 */
export const OFFICIAL_HEARING_DAYS = { count: 182, asAt: '2026-10-06' };

export const videos = videoData.videos;
export const articles = articleData.articles;
export const articleSource = articleData.source;

/**
 * Articles are linked to people the same way clips are - by matching curated
 * `matchers` - but against the headline AND the excerpt, since prose names
 * people a title would not.
 */
export const personArticles = new Map();
export const articlePeople = new Map();

for (const a of articles) {
  const hay = `${a.title} ${a.excerpt}`.toLowerCase().replace(/[‘’]/g, "'");
  const hits = people
    .filter((p) => p.matchers.some((m) => hay.includes(m.toLowerCase())))
    .map((p) => p.id);
  articlePeople.set(a.articleId, hits);
  for (const id of hits) {
    if (!personArticles.has(id)) personArticles.set(id, []);
    personArticles.get(id).push(a);
  }
}
for (const list of personArticles.values()) {
  list.sort((x, y) => (y.date ?? '').localeCompare(x.date ?? ''));
}

export const articlesFor = (personId) => personArticles.get(personId) ?? [];
export const peopleForArticle = (articleId) =>
  (articlePeople.get(articleId) ?? []).map((id) => peopleById[id]).filter(Boolean);
export const playlists = videoData.playlists;
export const scrapedAt = videoData.scrapedAt;
export const channelUrl = videoData.channel;

export const playlistByKey = Object.fromEntries(
  playlists.map((p) => [p.key, p])
);

export const videoById = Object.fromEntries(videos.map((v) => [v.videoId, v]));

/**
 * Every allegation, flattened out of the people register and ordered by the
 * date it was actually put on the record — the sequence a viewer of the
 * hearings would have seen it in, rather than the sequence of underlying
 * events.
 *
 * `dateApprox` is inherited from the clip the allegation is pinned to, so the
 * UI never presents a derived date as a documented one.
 */
export const allegations = people
  .filter((p) => p.allegations?.length)
  .flatMap((p) =>
    p.allegations.map((a, i) => {
      const clip = a.clip ? videoById[a.clip] : null;
      return {
        key: `${p.id}#${i}`,
        target: p,
        ...a,
        clip,
        responseClip: a.responseClip ? videoById[a.responseClip] : null,
        dateApprox: a.presentedNote ? true : clip ? clip.dateApprox : true,
      };
    })
  )
  .sort(
    (a, b) =>
      a.presented.localeCompare(b.presented) ||
      a.target.name.localeCompare(b.target.name)
  );

/** Allegations grouped into the sitting they were presented at. */
export function groupAllegationsByDate(list) {
  const groups = [];
  for (const a of list) {
    const last = groups[groups.length - 1];
    if (last && last.date === a.presented) last.items.push(a);
    else groups.push({ date: a.presented, approx: a.dateApprox, items: [a] });
  }
  for (const g of groups) g.approx = g.items.every((i) => i.dateApprox);
  return groups;
}

/** Forums an allegation can be filtered by. A few span both. */
export const FORUMS = [
  { key: 'Madlanga Commission', label: 'Madlanga Commission' },
  { key: 'Ad Hoc Committee', label: 'Ad Hoc Committee' },
  // By late 2026 the criminal prosecutions running alongside the inquiry are a
  // track of their own - a different forum, a different standard of proof.
  { key: 'Criminal courts', label: 'Criminal courts' },
];

/**
 * Link each video to the people it mentions, by matching the curated
 * `matchers` against the video title. Titles are the only text we have, so a
 * person is linked when their name (or a listed alias) appears in one.
 */
const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'");

export const videoPeople = new Map(); // videoId -> [personId]
export const personVideos = new Map(); // personId -> [video]

for (const v of videos) {
  const t = norm(v.title);
  const hits = [];
  for (const p of people) {
    if (p.matchers.some((m) => t.includes(norm(m)))) hits.push(p.id);
  }
  videoPeople.set(v.videoId, hits);
  for (const id of hits) {
    if (!personVideos.has(id)) personVideos.set(id, []);
    personVideos.get(id).push(v);
  }
}

for (const list of personVideos.values()) {
  list.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

export const videosFor = (personId) => personVideos.get(personId) ?? [];
export const peopleFor = (videoId) =>
  (videoPeople.get(videoId) ?? []).map((id) => peopleById[id]).filter(Boolean);

export const eventsFor = (personId) =>
  timelineSorted.filter((e) => e.people.includes(personId));

/** People ordered for display: most central first, then by footage volume. */
export function sortPeople(list) {
  return [...list].sort((a, b) => {
    const sa = a.severity ? SEVERITY[a.severity].rank : 0;
    const sb = b.severity ? SEVERITY[b.severity].rank : 0;
    if (sa !== sb) return sb - sa;
    const va = videosFor(a.id).length;
    const vb = videosFor(b.id).length;
    if (va !== vb) return vb - va;
    return a.name.localeCompare(b.name);
  });
}

export const accused = sortPeople(
  people.filter((p) => p.category === 'accused')
);

export const stats = {
  videos: videos.length,
  hoursOfFootage: Math.round(
    videos.reduce((acc, v) => acc + (v.seconds ?? 0), 0) / 3600
  ),
  accused: accused.length,
  allegations: people.reduce((acc, p) => acc + (p.allegations?.length ?? 0), 0),
  witnesses: people.filter((p) => p.category === 'witness').length,
  firstDate: videos.reduce(
    (min, v) => (v.date && v.date < min ? v.date : min),
    '2999-12-31'
  ),
  lastDate: videos.reduce(
    (max, v) => (v.date && v.date > max ? v.date : max),
    '0000-01-01'
  ),
  // The commission numbers its own sitting days, and that numbering is the
  // only authoritative count. Day 1 was 17 Sep 2025; Day 182 was 6 Oct 2026,
  // per criminaljusticecommission.org.za/hearings. Clip titles only ever
  // mentioned a day number in passing, so inferring the total from them
  // undercounted badly - it had this at "118+".
  hearingDays: Math.max(
    ...videos.map((v) => v.hearingDay ?? 0),
    OFFICIAL_HEARING_DAYS.count
  ),
  hearingDaysAsAt: OFFICIAL_HEARING_DAYS.asAt,
};

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

export function thumb(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}
