#!/usr/bin/env python
"""
Extracts text from commission PDFs and writes one JSON per document to
public/transcripts/.

Reads either a flat drop folder (transcripts/incoming/) or the nested
"Day N DD Mon YYYY/" layout used in the Drive archive - in the nested case the
folder name supplies the day number and date that the filename may lack.

Output goes to public/ rather than src/ deliberately: a day's record runs to
hundreds of pages, so the app fetches them on demand instead of bundling them.

  python scripts/extract_transcripts.py --src "G:\\...\\Transcripts"
  python scripts/extract_transcripts.py --src "..." --only RECORD
  python scripts/extract_transcripts.py --max-mb 40
"""
import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("pdfplumber is required:  pip install pdfplumber")

ROOT = Path(__file__).resolve().parent.parent
DAY_INDEX = ROOT / "staging" / "commission-day-index.json"
OUT_DIR = ROOT / "public" / "transcripts"
CATALOGUE = ROOT / "transcripts" / "catalogue.json"

# Tolerates an intervening token: RECORD_20250919 and RECORD_1_20250929 both match.
RECORD = re.compile(r"RECORD[_\s-]*(?:\d{1,2}[_\s-]+)?(\d{4})(\d{2})(\d{2})", re.I)
LOOSE_DATE = re.compile(r"(20\d{2})[-_]?(\d{2})[-_]?(\d{2})")
# "Day 3 19 Sep 2025"
FOLDER = re.compile(r"^Day\s+(\d{1,3})\s+(\d{1,2})\s+([A-Za-z]{3})\w*\s+(20\d{2})", re.I)
MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def official_days():
    """date -> official sitting-day number. The commission's own numbering is
    authoritative; a folder name can be wrong (a record filed under the wrong
    day), whereas the date inside the filename is reliable."""
    if not DAY_INDEX.exists():
        return {}
    data = json.loads(DAY_INDEX.read_text(encoding="utf-8"))
    return {d["date"]: d["day"] for d in data.get("days", []) if d.get("date")}


# Later downloads name the daily record "<uuid>-day_95.pdf" instead of
# "MADLANGA_COMMISSION_RECORD_20250919.pdf". Both are the same document.
DAY_FILE = re.compile(r"day[_\s-]?\d{1,3}\.pdf$", re.I)
# An explicit day label inside the filename, e.g. "..._RECORD_20260202_Day_52.pdf"
DAY_LABEL = re.compile(r"day[_\s-]?(\d{1,3})(?:[_\s.-]|$)", re.I)


def classify(name: str) -> str:
    low = name.lower()
    if RECORD.search(name) or DAY_FILE.search(name):
        return "transcript"
    if low.endswith((".mp3", ".m4a", ".wav")):
        return "audio"
    if "annexure" in low or "exhibit" in low or "bundle" in low:
        return "annexure"
    if "statement" in low or "address" in low:
        return "statement"
    if low.endswith(".pdf"):
        return "document"
    return "other"


def from_folder(path: Path):
    """Day number and ISO date carried by the parent folder name."""
    m = FOLDER.match(path.parent.name)
    if not m:
        return None, None
    day, dd, mon, yyyy = int(m.group(1)), int(m.group(2)), m.group(3).lower(), int(m.group(4))
    if mon not in MONTHS:
        return day, None
    try:
        return day, datetime(yyyy, MONTHS[mon], dd).strftime("%Y-%m-%d")
    except ValueError:
        return day, None


def date_from_name(name: str):
    m = RECORD.search(name) or LOOSE_DATE.search(name)
    if not m:
        return None
    try:
        return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).strftime("%Y-%m-%d")
    except ValueError:
        return None


def resolve_day_date(path: Path, day_by_date: dict, date_by_day: dict):
    """Work out which sitting day a file belongs to.

    The commission's own filenames are not always self-consistent: one record
    is named "..._RECORD_20260202_Day_52.pdf", but 2 Feb is officially Day 51
    and Day 52 is 3 Feb. One of those two fields has to be wrong.

    So prefer agreement. When the day label inside the filename matches the
    folder it was filed under, that is two independent signals against one, and
    the official date for that day number wins over the date in the filename.
    Otherwise fall back to the filename date, which is normally reliable.
    """
    folder_day, folder_date = from_folder(path)
    name_date = date_from_name(path.name)
    m = DAY_LABEL.search(path.name)
    label_day = int(m.group(1)) if m else None

    if label_day and folder_day and label_day == folder_day:
        return label_day, date_by_day.get(label_day) or name_date or folder_date, True

    date = name_date or folder_date
    return day_by_date.get(date) or folder_day, date, False


def extract(pdf_path: Path, attempts: int = 3):
    """Cloud-synced files occasionally raise OSError mid-read while the local
    copy is still being materialised. Retrying clears it."""
    last = None
    for attempt in range(1, attempts + 1):
        try:
            pages = []
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages, start=1):
                    text = (page.extract_text() or "").strip()
                    if text:
                        pages.append({"page": i, "text": text})
            return pages
        except OSError as exc:
            last = exc
            if attempt < attempts:
                print(f"       retry {attempt}/{attempts - 1} after {type(exc).__name__}")
                time.sleep(2)
    raise last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT / "transcripts" / "incoming"))
    ap.add_argument("--only", help="substring filter on filename, e.g. RECORD")
    ap.add_argument("--max-mb", type=float, default=40.0,
                    help="skip files larger than this; scanned exhibit bundles "
                         "are images and yield no text without OCR")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.exists():
        sys.exit(f"Source does not exist: {src}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CATALOGUE.parent.mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in src.rglob("*") if p.is_file() and p.suffix.lower() != ".txt")
    if args.only:
        files = [p for p in files if args.only.lower() in p.name.lower()]
    if not files:
        print(f"Nothing matching in {src}")
        return

    day_by_date = official_days()
    date_by_day = {d: k for k, d in day_by_date.items()}
    corrected = 0
    seen_hashes = {}
    duplicates = 0
    catalogue, parsed, skipped, failed, oversize = [], 0, 0, 0, 0

    for path in files:
        mb = path.stat().st_size / 1_048_576
        kind = classify(path.name)
        folder_day, _ = from_folder(path)
        day, date, by_agreement = resolve_day_date(path, day_by_date, date_by_day)
        if by_agreement and date_from_name(path.name) and date != date_from_name(path.name):
            print(f"       {path.name[-44:]}")
            print(f"         filename date {date_from_name(path.name)} disagrees with "
                  f"its own 'Day {day}' label; folder agrees with the label, so using {date}")
            corrected += 1
        elif folder_day and day and folder_day != day:
            print(f"       day {folder_day} (folder) -> {day} (official) for {date}")
            corrected += 1

        # The same record sometimes arrives twice - saved under two names, or
        # re-read after a classifier change. Hash the bytes so one document
        # cannot become two entries.
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16] if mb <= 60 else None
        if digest and digest in seen_hashes:
            print(f"  [dup ] {path.name[-44:]}  same bytes as {seen_hashes[digest][-40:]}")
            catalogue.append({"file": path.name, "folder": path.parent.name,
                              "kind": kind, "date": date, "day": day,
                              "note": f"duplicate of {seen_hashes[digest]}"})
            duplicates += 1
            continue
        if digest:
            seen_hashes[digest] = path.name

        entry = {"file": path.name, "folder": path.parent.name, "kind": kind,
                 "date": date, "day": day, "mb": round(mb, 1)}

        if kind in ("audio", "other"):
            catalogue.append(entry)
            continue

        if not date:
            entry["note"] = "no date from filename or folder"
            catalogue.append(entry)
            print(f"  [skip] {path.name}  (undated)")
            skipped += 1
            continue

        if mb > args.max_mb:
            entry["note"] = f"skipped: {mb:.0f} MB exceeds --max-mb {args.max_mb:.0f}"
            catalogue.append(entry)
            print(f"  [big ] {path.name}  ({mb:.0f} MB) - skipped")
            oversize += 1
            continue

        stem = f"{date}-{kind}"
        out = OUT_DIR / f"{stem}.json"
        n = 2
        while out.exists() and not args.force and out.stat().st_size > 0:
            prior = json.loads(out.read_text(encoding="utf-8"))
            if prior.get("sourceFile") == path.name:
                break
            out = OUT_DIR / f"{stem}-{n}.json"
            n += 1

        if out.exists() and not args.force:
            catalogue.append({**entry, "parsedTo": out.name})
            skipped += 1
            continue

        try:
            pages = extract(path)
        except Exception as exc:  # noqa: BLE001
            entry["note"] = f"extraction failed: {exc}"
            catalogue.append(entry)
            print(f"  [FAIL] {path.name}: {exc}")
            failed += 1
            continue

        words = sum(len(p["text"].split()) for p in pages)
        if words == 0:
            entry["note"] = "no extractable text (likely a scanned image; needs OCR)"
            catalogue.append(entry)
            print(f"  [scan] {path.name}  no text layer")
            skipped += 1
            continue

        out.write_text(json.dumps({
            "date": date, "day": day, "kind": kind,
            "sourceFile": path.name, "sourceFolder": path.parent.name,
            "source": "criminaljusticecommission.org.za",
            "pages": pages,
        }, ensure_ascii=False), encoding="utf-8")
        catalogue.append({**entry, "parsedTo": out.name, "pageCount": len(pages), "words": words})
        print(f"  [ok] Day {day or '?':>3}  {date}  {len(pages):>4}pp {words:>8,}w  {kind}")
        parsed += 1

    CATALOGUE.write_text(json.dumps(
        {"extractedAt": datetime.now().isoformat(timespec="seconds"),
         "source": str(src), "items": catalogue}, indent=1, ensure_ascii=False),
        encoding="utf-8")
    print(f"\nparsed {parsed}, skipped {skipped}, oversize {oversize}, failed {failed}")
    if parsed:
        print("next:  node scripts/index-transcripts.mjs")


if __name__ == "__main__":
    main()
