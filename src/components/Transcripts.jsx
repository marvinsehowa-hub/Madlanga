import { useMemo, useState } from 'react';
import {
  transcriptDays,
  transcriptStats,
  transcriptSource,
  hasTranscripts,
  loadAllDays,
  searchLoaded,
  dayPeople,
  TranscriptTextUnavailable,
} from '../lib/transcripts.js';
import { formatDate } from '../lib/data.js';

const SUGGESTIONS = ['task team', 'docket', 'syndicate', 'tender', 'izinkabi', 'polygraph'];

export default function Transcripts({ onPerson }) {
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([0, 0]);
  const [error, setError] = useState(null);
  const [openDay, setOpenDay] = useState(null);

  async function ensureLoaded() {
    if (docs || loading) return docs;
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadAllDays((n, total) => setProgress([n, total]));
      setDocs(loaded);
      return loaded;
    } catch (err) {
      setError(
        err instanceof TranscriptTextUnavailable ? 'index-only' : err.message
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function run(q) {
    setQuery(q);
    if (q.trim().length >= 3) await ensureLoaded();
  }

  const results = useMemo(() => {
    if (!docs || query.trim().length < 3) return null;
    return searchLoaded(docs, query);
  }, [docs, query]);

  if (!hasTranscripts) {
    return (
      <div className="stack">
        <p className="empty">
          No transcripts ingested yet. Drop the commission&apos;s daily record
          PDFs into <code>transcripts/incoming/</code> and run{' '}
          <code>npm run ingest-transcripts</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="cat-blurb tone-green">
        Full text of {transcriptStats.days} sitting days —{' '}
        {transcriptStats.words.toLocaleString()} words across{' '}
        {transcriptStats.pages.toLocaleString()} pages, covering{' '}
        {formatDate(transcriptStats.span[0])} to{' '}
        {formatDate(transcriptStats.span[1])}. This is the only part of the
        index that searches what was actually <em>said</em>, rather than how a
        clip was captioned. Official records from{' '}
        <a href={transcriptSource} target="_blank" rel="noreferrer">
          the commission
        </a>
        .
      </p>

      <div className="search-hero">
        <input
          className="search search-big"
          type="search"
          placeholder="Search the testimony — a phrase, a name, a term…"
          value={query}
          onChange={(e) => run(e.target.value)}
        />
        <div className="suggestions">
          <span>Try:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => run(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="result-count">
          Loading transcripts… {progress[0]}/{progress[1]} days
        </p>
      )}
      {error === 'index-only' && (
        <p className="cat-blurb tone-amber">
          <strong>This build ships the index, not the verbatim text.</strong>{' '}
          You can still browse every sitting day below — who testified, who was
          named and how often, with a locating snippet each. Full-text search
          needs the commission&apos;s daily records ingested locally:{' '}
          <code>npm run ingest-transcripts</code>. The records themselves are
          published by{' '}
          <a href={transcriptSource} target="_blank" rel="noreferrer">
            the commission
          </a>
          .
        </p>
      )}
      {error && error !== 'index-only' && (
        <p className="empty">Could not load transcripts: {error}</p>
      )}

      {results && (
        <>
          <p className="result-count">
            {results.hits.length}
            {results.truncated ? '+ (showing the first ' + results.hits.length + ')' : ''}{' '}
            passage{results.hits.length === 1 ? '' : 's'} for “{query.trim()}”
          </p>
          <ul className="passages">
            {results.hits.map((h, i) => (
              <li key={`${h.date}-${h.page}-${i}`}>
                <div className="passage-meta">
                  <time>{formatDate(h.date)}</time>
                  {h.day && <span className="pill">Day {h.day}</span>}
                  <span className="passage-page">p.{h.page}</span>
                </div>
                <p className="passage">
                  {h.before}
                  <mark>{h.match}</mark>
                  {h.after}
                </p>
              </li>
            ))}
            {results.hits.length === 0 && (
              <p className="empty">Nothing in the transcripts matches that.</p>
            )}
          </ul>
        </>
      )}

      {/* The day list comes from the bundled index, so it renders even when
          the verbatim text was not deployed. */}
      {!results && !loading && (
        <section className="panel">
          <div className="panel-head">
            <h2>Sitting days held</h2>
            <span className="result-count">
              {transcriptStats.days} days · {transcriptStats.people} people named
            </span>
          </div>
          <ul className="tdays">
            {transcriptDays.map((d) => {
              const named = dayPeople(d).slice(0, 6);
              const isOpen = openDay === d.date;
              return (
                <li key={d.date}>
                  <button
                    className="tday-head"
                    onClick={() => setOpenDay(isOpen ? null : d.date)}
                  >
                    <time>{formatDate(d.date)}</time>
                    {d.day && <span className="pill">Day {d.day}</span>}
                    <span className="tday-size">
                      {d.pageCount}pp · {d.words.toLocaleString()}w
                    </span>
                  </button>
                  {isOpen && (
                    <div className="chips tday-chips">
                      {named.map((m) => (
                        <button
                          key={m.personId}
                          className={`chip chip-${m.person.category}`}
                          onClick={() => onPerson(m.personId)}
                          title={m.snippet ?? ''}
                        >
                          {m.person.name}
                          <span className="chip-count">{m.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
