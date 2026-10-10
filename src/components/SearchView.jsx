import { useMemo, useState } from 'react';
import {
  people,
  allegations,
  timelineSorted,
  videos,
  peopleFor,
  formatDate,
  CATEGORY,
} from '../lib/data.js';

const norm = (s) => (s ?? '').toLowerCase();

/** One search box over every kind of record we hold. */
function searchAll(q) {
  const n = norm(q).trim();
  if (n.length < 2) return null;

  const matchedPeople = people.filter(
    (p) =>
      norm(p.name).includes(n) ||
      norm(p.aka).includes(n) ||
      norm(p.role).includes(n) ||
      norm(p.org).includes(n) ||
      norm(p.summary).includes(n) ||
      (p.notes ?? []).some((x) => norm(x).includes(n))
  );

  const matchedAllegations = allegations.filter(
    (a) =>
      norm(a.what).includes(n) ||
      norm(a.by).includes(n) ||
      norm(a.response).includes(n) ||
      norm(a.target.name).includes(n)
  );

  const matchedEvents = timelineSorted.filter(
    (e) => norm(e.title).includes(n) || norm(e.body).includes(n)
  );

  const matchedClips = videos.filter(
    (v) =>
      norm(v.title).includes(n) ||
      peopleFor(v.videoId).some((p) => norm(p.name).includes(n))
  );

  return {
    people: matchedPeople,
    allegations: matchedAllegations,
    events: matchedEvents,
    clips: matchedClips,
    total:
      matchedPeople.length +
      matchedAllegations.length +
      matchedEvents.length +
      matchedClips.length,
  };
}

const SUGGESTIONS = [
  'Matlala',
  'PKTT',
  'drugs',
  'docket',
  'polygraph',
  'IDAC',
  'self-incriminat',
  'arrested',
];

export default function SearchView({ onPerson }) {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('all');
  const results = useMemo(() => searchAll(q), [q]);

  const show = (kind) => scope === 'all' || scope === kind;

  return (
    <div className="stack">
      <div className="search-hero">
        <input
          className="search search-big"
          type="search"
          autoFocus
          placeholder="Search people, allegations, events and hearing footage…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="suggestions">
          <span>Try:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => setQ(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {!results && (
        <p className="empty">
          Type at least two characters. Search covers every field in the
          register — names, roles, what is alleged, who alleged it, responses,
          timeline entries and clip titles.
        </p>
      )}

      {results && results.total === 0 && (
        <p className="empty">Nothing in the record matches “{q}”.</p>
      )}

      {results && results.total > 0 && (
        <>
          <div className="segmented">
            {[
              ['all', 'Everything', results.total],
              ['people', 'People', results.people.length],
              ['allegations', 'Allegations', results.allegations.length],
              ['events', 'Timeline', results.events.length],
              ['clips', 'Footage', results.clips.length],
            ].map(([key, label, count]) => (
              <button
                key={key}
                className={`seg ${scope === key ? 'is-active' : ''}`}
                onClick={() => setScope(key)}
              >
                {label}
                <span className="seg-count">{count}</span>
              </button>
            ))}
          </div>

          {show('people') && results.people.length > 0 && (
            <section className="panel">
              <h2>People ({results.people.length})</h2>
              <ul className="rank-list">
                {results.people.map((p) => (
                  <li key={p.id}>
                    <button className="rank-row" onClick={() => onPerson(p.id)}>
                      <span className={`chip chip-${p.category}`}>
                        {CATEGORY[p.category].label}
                      </span>
                      <span className="rank-name">{p.name}</span>
                      <span className="rank-role">{p.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {show('allegations') && results.allegations.length > 0 && (
            <section className="panel">
              <h2>Allegations ({results.allegations.length})</h2>
              <ul className="hit-list">
                {results.allegations.map((a) => (
                  <li key={a.key}>
                    <div className="hit-meta">
                      <time>{formatDate(a.presented)}</time>
                      <button
                        className="chip chip-accused"
                        onClick={() => onPerson(a.target.id)}
                      >
                        {a.target.name}
                      </button>
                    </div>
                    <p>{a.what}</p>
                    <span className="hit-sub">
                      Alleged by {a.by} · {a.forum}
                      {a.clip && (
                        <>
                          {' · '}
                          <a href={a.clip.url} target="_blank" rel="noreferrer">
                            watch
                          </a>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {show('events') && results.events.length > 0 && (
            <section className="panel">
              <h2>Timeline ({results.events.length})</h2>
              <ul className="hit-list">
                {results.events.map((e) => (
                  <li key={e.date + e.title}>
                    <div className="hit-meta">
                      <time>{formatDate(e.date)}</time>
                    </div>
                    <p>
                      <strong>{e.title}</strong> — {e.body}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {show('clips') && results.clips.length > 0 && (
            <section className="panel">
              <h2>Footage ({results.clips.length})</h2>
              <ul className="hit-list">
                {results.clips.slice(0, 40).map((v) => (
                  <li key={v.videoId}>
                    <div className="hit-meta">
                      <time>{formatDate(v.date)}</time>
                      {v.duration && <span className="pill">{v.duration}</span>}
                    </div>
                    <p>
                      <a href={v.url} target="_blank" rel="noreferrer">
                        {v.title}
                      </a>
                    </p>
                  </li>
                ))}
                {results.clips.length > 40 && (
                  <li className="empty">
                    …and {results.clips.length - 40} more. Narrow the search or
                    use the Hearings tab.
                  </li>
                )}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
