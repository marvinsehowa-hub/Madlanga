# Madlanga Commission Tracker

A research index for the Madlanga Commission of Inquiry — the judicial inquiry
into Lt-Gen Nhlanhla Mkhwanazi's July 2025 allegations that a criminal syndicate
had infiltrated the South African police, intelligence services and parts of the
criminal justice system.

It is built as a document-explorer in the mould of
[epstein-file-explorer.org](https://epstein-file-explorer.org) — global search,
an entity graph, analytics and side-by-side comparison — over a much smaller,
hand-verified corpus.

It answers three questions:

1. **Who is implicated, and with what?** Every named person, what is alleged
   against them, who alleged it, in which forum, and what they said back.
2. **When was each allegation actually made?** An *Allegations* ledger ordered
   by the day each one was put on the record, grouped by sitting, with a link
   straight to the session where it was aired.
3. **How did it unfold?** A filterable *Case timeline* of the matters under
   investigation, from the disbandment of the Political Killings Task Team to
   the most recent hearing.

Note the difference between 2 and 3: the ledger is the sequence a viewer of the
hearings saw, the case timeline is the sequence of the underlying events.

## What is in it

| | |
|---|---|
| People indexed | 61 — implicated, witnesses, commissioners, counsel, political actors |
| Allegations tracked | 51, each attributed, dated and pinned to a sitting |
| Relationships | 247, every one justified by a record in the data |
| Timeline events | 34, across five strands |
| Hearing footage | 837 videos, 242 full sittings (~2,391 hours) |

## The views

| Tab | What it does |
|---|---|
| Overview | Coverage notice, outstanding appearances, recent sittings, headline counts, latest developments |
| Search | One box across people, allegations, timeline entries and clip titles |
| People | The register, faceted by role — implicated, witness, commission, political |
| Allegations | The 51 allegations ordered by the day each went on the record |
| Case timeline | The underlying events, filterable by strand |
| Graph | Relationship network with curated investigation paths |
| Analytics | Rankings and distributions across the register |
| Compare | Two people side by side, with the shortest chain between them |
| Hearings | Every indexed clip, filterable by source |

### What the graph edges mean

Nothing in the graph is inferred. An edge exists only where:

- **alleges** — one person put an allegation against another on the record
- **co-event** — both are named in the same timeline event
- **co-clip** — both are named in the same clip title

Allegations put by "the commission" or "evidence leaders" generally, with no
named individual, attach to an explicit institutional node rather than being
dropped or guessed at. `npm run verify` fails if any alleger fails to resolve,
so the graph cannot silently lose part of the record.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5183.

Other scripts:

```bash
npm run refresh          # re-scrape the YouTube playlists into src/data/videos.json
npm run verify           # sanity-check the curated data
npm run confirm-dates -- --all --dry-run   # see which approx dates are wrong
node scripts/fetch-descriptions.mjs --since 2026-08-24 --print   # session blurbs
npm run build            # production build into dist/
```

## Where the data comes from

**Footage** comes from five [Newslive SA](https://www.youtube.com/@newslivesa)
sources: three playlists (*Madlanga Commission inquiry*, *Inside the Madlanga
Commission*, *Ad Hoc Committee*) plus two channel tabs. The **Videos tab**
carries the editorialised cut-downs that name witnesses and quote testimony in
the title — for a long time this index did not read it, and so knew when a
sitting happened but nothing about its contents. The **Streams tab**
carries the complete sitting days — one video per hearing day, most with an
exact date in the title. `scripts/refresh-playlists.mjs` reads the
`ytInitialData` blob YouTube inlines into each page and follows continuation
tokens to page through the whole Streams tab; no API key is needed.

Streams are filtered to those matching `madlanga|ad hoc|mkhwanazi` and are then
classified as `session`, `briefing` or `clip`. Political marches and rallies are
excluded — they mention the general but are not proceedings. The channel runs a
parallel signed-language feed of some sittings; those carry `signLanguage: true`
so hearing-day counts do not double.

## Tracking who was *meant* to appear

A register built only from people who testified quietly omits the ones who were
summoned and did not turn up — often the sharper fact. Any person may carry an
`appearance`:

```js
appearance: { status, date, clip, detail }
```

`status` is one of `appeared`, `ordered`, `postponed`, `stood-down` or
`subpoena-ignored`; everything but `appeared` is treated as outstanding and
surfaces in the **Meant to appear** panel on the Overview until resolved. Being
listed there is a statement about attendance, not about conduct, and the panel
says so.

### Sittings still on air

A sitting that is still broadcasting carries no duration badge, which is
otherwise indistinguishable from a missing value. Records therefore carry both
`isLive` (was broadcast live at some point) and `liveNow` (still on air as of
the last refresh); the Recent sittings panel shows **on air** instead of a
runtime. When the stream ends, the next refresh picks up the real duration —
the merge path updates `duration`/`seconds` in place rather than leaving the
record stuck as a live stream of unknown length.

### The criminal track

By late 2026 the prosecutions running alongside the inquiry are a thread of
their own, with a different forum and a different standard of proof. Allegations
may therefore carry `forum: 'Criminal courts'`, and charges brought by the
prosecution attach to an institutional `the-state` node the same way the bench's
own questions attach to `the-commission`.

## Transcripts

The commission publishes a daily record for each sitting day. Those are the
primary source, and they are the only part of this index that searches what was
actually **said** rather than how a broadcaster captioned a clip.

Drop the downloaded PDFs in `transcripts/incoming/`, or point the extractor at
an existing archive, then:

```bash
npm run ingest-transcripts
# or, against a folder of "Day N DD Mon YYYY" subfolders:
python scripts/extract_transcripts.py --src "<path>" --only RECORD
node scripts/index-transcripts.mjs
```

Full text is written to `public/transcripts/` and fetched on demand — a day's
record runs to a couple of hundred pages, so bundling them all would add
megabytes of JavaScript. Only a compact index ships with the app: date, day
number, page and word counts, and which people in the register the text names,
with a short locating snippet each.

### Things the extractor has to handle

- **Nested day folders.** `Day 3 19 Sep 2025/` supplies the day number when the
  filename does not. The date inside the filename always wins over the folder,
  because records do get filed under the wrong day — one did.
- **Official day numbers.** Day numbers are reconciled against
  `staging/commission-day-index.json`, the commission's own numbering, and
  corrections are reported rather than applied silently.
- **Filename variants.** `RECORD_20250919` and `RECORD_1_20250929` both parse.
- **Cloud-sync flakiness.** Files in a synced Drive folder intermittently raise
  `OSError` mid-read while the local copy materialises. Reads are retried.
- **Scanned bundles.** Large annexure bundles are images with no text layer.
  They are skipped above `--max-mb` and reported, not silently dropped. They
  would need OCR.

### A caution on matchers

Matchers tuned for short video titles are too loose for prose. `dlamini` — one
of the commonest surnames in South Africa — matched an unrelated account name
in the transcripts and had to be narrowed to `umashi`. Bare common surnames
should be avoided as matchers now that the corpus includes hundreds of
thousands of words of running text.

## YouTube captions: still closed

Worth recording so nobody re-treads it. YouTube **does** auto-caption the
streams, but `api/timedtext` returns HTTP 200 with a zero-byte body — server
side and from inside a credentialed page — because it is gated behind a
player-generated token. The *Show transcript* button renders nothing when
driven programmatically. Local ASR works (`faster-whisper` transcribed a short
clip accurately) but `torch` is CPU-only on 8 cores, so the multi-thousand-hour
footage corpus is out of reach. None of that matters for sittings the
commission has published a record for; it only matters for the ones it has not.

**People and timeline** are hand-curated in `src/data/people.js` and
`src/data/timeline.js`. Each allegation carries a `basis`:

- `video` — directly evidenced by a clip in the indexed playlists
- `public-record` — widely reported, but not re-verified against a primary
  document in this repo

Each allegation is also pinned to the sitting where it was presented:

- `presented` — the date it went on the record
- `clip` — the videoId of the session where it was aired (42 of 43 have one)
- `responseClip` — where the person answered it, when that is on film
- `presentedNote` — required whenever `presented` deliberately differs from the
  clip's own date, explaining why

Videos are linked to people by matching each person's `matchers` against clip
titles. Titles are all the text available, so a person is linked when their name
or a listed alias appears in one — good coverage, but not exhaustive.

### Date accuracy

**Derived dates are frozen once written.** YouTube reports a relative age
("3 weeks ago"), which we read against today's date — so re-deriving on every
refresh would silently walk every approximate date forward and break the
allegation pins that point at them. `refresh-playlists.mjs` therefore keeps any
date already in `videos.json` and only derives dates for genuinely new clips.
Refreshing twice in a row produces byte-identical dates.

To replace an approximate date with the real one, `npm run confirm-dates --
<videoId>` reads the exact `uploadDate` from that clip's own watch page and
clears its `approx` flag. `--all` does every approximate date (one request per
clip); `--dry-run` reports without writing. If a confirmed date moves a clip an
allegation is pinned to, `npm run verify` fails until the pin is corrected.

YouTube only exposes fuzzy ages ("3 weeks ago") on playlist pages. Where a
hearing date appears in the title it is used verbatim; otherwise the date is
derived from the clip's publication age and shown with an `approx` badge. Those
are accurate to roughly ±2 weeks.

## Editorial rules

The commission has **not reported**. Nothing in this repo is a finding of guilt.

1. Every entry under `allegations` is an allegation, phrased as one.
2. Every allegation names who made it and in which forum.
3. Where a person has denied something on the record, the denial is recorded
   alongside the allegation — never left standing alone.
4. Everyone named is presumed innocent.

`npm run verify` enforces 1–3 mechanically, and also catches dangling person
ids, matchers that hit nothing, and matchers so loose they over-link.

## Adding to the data

Add a person to `src/data/people.js` (see the schema comment at the top of the
file), add events to `src/data/timeline.js` referencing their `id`, then run
`npm run verify` before `npm run dev`.

## Caveat

This is a research index built from public broadcast footage, not a legal
record. Verify against the commission's own transcripts and rulings before
relying on anything here.
