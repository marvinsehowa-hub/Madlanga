# Daily update runbook

The routine this index is kept current by. It is written to be run either by
hand or as a scheduled Claude Code task, so it assumes no memory of previous
runs.

Project: `C:\Users\Agent47\apps\madlanga-tracker`, branch `main`, remote
`github.com/marvinsehowa-hub/Madlanga`. **A push auto-deploys the live site in
under a minute.**

---

## 1. Mechanical sources

```bash
npm run refresh          # YouTube archive (additive; never drops records)
npm run refresh-articles # newslivesa.co.za via the WordPress API
```

Note any new clip titles. They are often the first sign that something
happened — the Johnson and Khan arrests surfaced as a clip title before any
search found the story.

## 2. Commission site

Open <https://criminaljusticecommission.org.za/hearings> and run the capture
snippet documented in the header of `sweep-day-index.mjs`. Read that header
first; two things in it are load-bearing and have each produced a wrong result:

- The month list is an **accordion** — opening one closes others, so each
  month's rows must be banked before moving on. Scraping after "expanding
  everything" returned 9 of 182 days.
- Each month must be read **twice and banked only when both reads agree**. A
  half-rendered month reports its days with counts of 0, which is
  indistinguishable from the commission withdrawing material. One run came
  back 322 instead of 402 this way.

Run two full sweeps and confirm they match. Then:

```bash
node scripts/sweep-day-index.mjs --file <captured-pairs-file>
```

- **MATERIALS ADDED on an old day** — open that day and say what appeared. The
  commission backfills: Day 176 gained Prof Fikeni's statement and annexures
  five weeks after the sitting.
- **Removals, or many days at 0** — re-capture. Do not report a takedown.

When clean, adopt it with `--save`, and fill in the date, witness and evidence
leader for any new day from the page.

## 3. Developments

Search for anything since the last commit touching the commission, Sibiya,
Carrim, Sindane, Sibanyoni, Feroz Khan, Andrea Johnson, Masemola, Mogotsi,
Matlala, Mchunu or Mkhwanazi.

The scrapers watch one YouTube channel, one news site and the commission's own
index. **None of them covers a court or the Presidency**, which is where most
of the consequential developments have happened — so search is not a
supplement here, it is the main instrument.

Verify every claim against a primary or named-outlet report. Never write from
a search summary alone; fetch the article. Where sources conflict, record the
conflict rather than choosing.

## 4. Writing entries

`src/data/people.js` (register) and `src/data/timeline.js`. Match the existing
shape and tone.

These rules are not stylistic. The site publishes untested allegations about
named living people.

- **Allegations are allegations.** Attribute each to who made it and in what
  forum. Never imply a finding.
- **Record the response.** An allegation with an empty response field is the
  worst thing this register can carry.
- **Keep separate matters separate.** Several people here face charges with
  nothing to do with the inquiry. Say so, or a reader will assume the
  commission caused the charge — Khan's 2018 assault charge is not the
  subpoena he ignored.
- **Never resolve an unnamed person.** When a report says someone was not
  identified, say so and do not guess, however obvious the candidate. The
  Cabonge recording refers to an unnamed "judge president"; the register
  contains a judge.
- **Watch shared surnames.** Preggy Padayachee, killed on the R21, is not
  Brian Padayachee, who testified in July. State it plainly.
- **A withdrawal is not an acquittal**, and it is not guilt either. Say which
  happened — Masemola's charges were withdrawn, not tried.
- Use `certainty: 'approx'` when a date comes from a clip's relative
  publication age.

## 5. Checks, then the gate

```bash
npm run verify   # 0 errors required; investigate warnings, never silence them
npm run build
node scripts/update-gate.mjs
```

| Verdict | Meaning | Action |
|---|---|---|
| `REFUSE` (exit 1) | a record count fell | **do not commit**; investigate |
| `NOTHING` | no files changed | report and stop |
| `ALLOW` | only scrape output changed | commit **and push** |
| `HOLD` | register or timeline changed | commit **locally only** |

The split is deliberate. Routine archive upkeep publishing itself costs
nothing if it is wrong. An entry about a person does, so a human reads those
first.

Commit messages: plain summary of what changed and why, with judgment calls
stated. End with the project's attribution line.

Before any push, scan the outgoing diff for secrets and local paths, and
confirm `.env`, `public/transcripts/`, `transcripts/incoming/` and
`transcripts/catalogue.json` are still ignored. After a push, confirm the
deploy with `gh run list --limit 1`.

## 6. Report

What each source returned, what was written and why, and — on `HOLD` — exactly
what is waiting locally, so it can be released with a one-word reply. Flag
anything uncertain rather than smoothing it over.
