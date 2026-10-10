# Transcript drop folder

Put downloaded commission material in `incoming/`. Nothing else is needed —
filenames carry everything the pipeline needs.

## Where to get it

<https://criminaljusticecommission.org.za/hearings> → expand a month → click a
day → **Materials**. Each sitting day carries up to ~7 items.

The file that matters most is the daily record:

```
MADLANGA_COMMISSION_RECORD_YYYYMMDD.pdf     <- the transcript
```

Also useful, and handled:

```
Madlanga_Commission_of_Inquiry_Day_N.mp3    <- full audio (not parsed, just catalogued)
..._Witness_Statement_..._Redacted.pdf      <- witness statement
..._ANNEXURES.pdf                           <- exhibits
```

**Download links are signed and expire after about 24 hours**, so fetch them in
the session you intend to use them. There is no need to rename anything.

## Ingesting

```bash
npm run ingest-transcripts
```

That runs two steps:

1. `scripts/extract_transcripts.py` — reads every PDF in `incoming/`, pulls the
   text with pdfplumber, and writes one JSON per sitting day to
   `public/transcripts/`. Those are served on demand rather than bundled, because
   a single day's record runs to hundreds of pages and would bloat the app.
2. `scripts/index-transcripts.mjs` — builds the compact searchable index at
   `src/data/transcripts.json`: date, day number, page and word counts, and
   which people in the register the text actually names.

Re-running is safe. Already-parsed days are skipped unless `--force` is passed.

## A note on what gets stored

These are public records of a judicial commission. The full text is kept
locally so it can be searched; the app surfaces matching passages with a link
back to the official source rather than republishing records wholesale.
