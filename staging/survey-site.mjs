/**
 * READ-ONLY survey of newslivesa.co.za via its WordPress REST API.
 * Writes only to the path given on the command line - never into src/data.
 */
import { writeFileSync } from 'node:fs';

const BASE = 'https://newslivesa.co.za/wp-json/wp/v2';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36';
const OUT = process.argv[2] ?? 'site-survey.json';

const strip = (html) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#8217;|&#039;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();

const TERMS = [
  'madlanga',
  'mkhwanazi',
  'sibiya',
  'matlala',
  'mogotsi',
  'mchunu',
  'sibanyoni',
  'chaskalson',
  'masemola',
  'feroz khan',
  'ad hoc committee',
  'pktt',
  'idac',
];

const byId = new Map();
let probe = null;

for (const term of TERMS) {
  for (let page = 1; page <= 6; page++) {
    const url = `${BASE}/posts?search=${encodeURIComponent(term)}&per_page=100&page=${page}&_fields=id,date,link,title,excerpt,categories`;
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (probe === null) {
      probe = {
        status: res.status,
        total: res.headers.get('x-wp-total'),
        totalPages: res.headers.get('x-wp-totalpages'),
      };
    }
    if (!res.ok) break;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const r of rows) {
      if (byId.has(r.id)) {
        byId.get(r.id).terms.add(term);
        continue;
      }
      byId.set(r.id, {
        id: r.id,
        date: r.date?.slice(0, 10) ?? null,
        link: r.link,
        title: strip(r.title?.rendered),
        excerpt: strip(r.excerpt?.rendered).slice(0, 400),
        terms: new Set([term]),
      });
    }
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? 1);
    if (page >= totalPages) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  process.stdout.write(`${term}:${byId.size} `);
}

const items = [...byId.values()]
  .map((v) => ({ ...v, terms: [...v.terms] }))
  .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

writeFileSync(
  OUT,
  JSON.stringify(
    { source: 'https://newslivesa.co.za', api: BASE, probe, surveyedAt: new Date().toISOString(), items },
    null,
    2
  )
);
console.log(`\n\nfirst-call probe: ${JSON.stringify(probe)}`);
console.log(`${items.length} matching articles -> ${OUT}`);
