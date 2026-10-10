#!/usr/bin/env node
/**
 * Builds src/data/articles.json from newslivesa.co.za's WordPress REST API.
 *
 * Why a separate record type from videos: an article is a different MEDIUM,
 * not just a different channel. It carries prose rather than a title, and an
 * exact publication timestamp rather than a fuzzy age - so it can settle facts
 * the footage record cannot, and it never needs the `approx` machinery.
 *
 * We store title, the site's own excerpt, link and date. Not the article body:
 * the index needs a pointer and a gist, not a copy of someone else's reporting.
 *
 *   npm run refresh-articles
 *   npm run refresh-articles -- --dry-run
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'data', 'articles.json');

export const ARTICLE_SOURCE = {
  key: 'newslivesa-site',
  label: 'Newslive SA (website)',
  channel: 'https://newslivesa.co.za',
  api: 'https://newslivesa.co.za/wp-json/wp/v2',
  blurb:
    'Written reporting from the same publisher as the video record. Small but factual, and the only source here that settles the criminal-track facts titles cannot carry.',
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Search terms chosen to span the inquiry and the cases running beside it. */
const TERMS = [
  'madlanga', 'mkhwanazi', 'sibiya', 'matlala', 'mogotsi', 'mchunu',
  'sibanyoni', 'chaskalson', 'masemola', 'feroz khan', 'ad hoc committee',
  'pktt', 'idac', 'political killings task team',
];

const ENTITIES = {
  '&#8217;': "'", '&#039;': "'", '&rsquo;': "'", '&lsquo;': "'",
  '&#8220;': '"', '&#8221;': '"', '&ldquo;': '"', '&rdquo;': '"',
  '&amp;': '&', '&nbsp;': ' ', '&hellip;': '…', '&#8211;': '–', '&#8212;': '—',
};

function strip(html) {
  let s = (html ?? '').replace(/<[^>]*>/g, ' ');
  for (const [k, v] of Object.entries(ENTITIES)) s = s.split(k).join(v);
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function search(term, byId) {
  for (let page = 1; page <= 6; page++) {
    const url =
      `${ARTICLE_SOURCE.api}/posts?search=${encodeURIComponent(term)}` +
      `&per_page=100&page=${page}&_fields=id,date,link,title,excerpt`;
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return;

    for (const r of rows) {
      const existing = byId.get(r.id);
      if (existing) {
        if (!existing.terms.includes(term)) existing.terms.push(term);
        continue;
      }
      byId.set(r.id, {
        articleId: r.id,
        // WordPress gives a real timestamp, so an article date is never a guess.
        date: r.date?.slice(0, 10) ?? null,
        publishedAt: r.date ?? null,
        title: strip(r.title?.rendered),
        excerpt: strip(r.excerpt?.rendered).slice(0, 500),
        url: r.link,
        source: ARTICLE_SOURCE.key,
        terms: [term],
      });
    }
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1)) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // Same additive contract as the video archive: a thin result set must never
  // delete articles we already hold.
  const prev = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, 'utf8')).articles ?? []
    : [];
  const byId = new Map(prev.map((a) => [a.articleId, { ...a }]));
  const before = byId.size;

  for (const term of TERMS) {
    process.stdout.write(`searching "${term}" ... `);
    try {
      await search(term, byId);
      console.log(`${byId.size} total`);
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
  }

  const articles = [...byId.values()].sort((a, b) =>
    (b.date ?? '').localeCompare(a.date ?? '')
  );
  const added = articles.length - before;
  console.log(`\n${added} new article(s); ${articles.length} held in total`);
  for (const a of articles.filter((x) => !prev.some((p) => p.articleId === x.articleId))) {
    console.log(`  ${a.date}  ${a.title.slice(0, 76)}`);
  }

  if (dryRun) {
    console.log('\ndry run - nothing written.');
    return;
  }
  writeFileSync(
    OUT,
    JSON.stringify(
      { source: ARTICLE_SOURCE, scrapedAt: new Date().toISOString(), articles },
      null,
      2
    )
  );
  console.log(`\nwrote ${articles.length} articles -> ${OUT}`);
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
