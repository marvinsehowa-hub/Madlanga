import { useEffect } from 'react';
import Thumb from './Thumb.jsx';
import { transcriptMentionsFor } from '../lib/transcripts.js';
import {
  peopleById,
  videosFor,
  eventsFor,
  formatDate,
  CATEGORY,
  SEVERITY,
  videoById,
} from '../lib/data.js';

export default function PersonPanel({ personId, onClose, onPerson }) {
  const p = peopleById[personId];

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!p) return null;

  const clips = videosFor(p.id);
  const events = eventsFor(p.id);

  return (
    <div className="overlay" onClick={onClose}>
      <aside
        className={`drawer tone-${CATEGORY[p.category].tone}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={p.name}
      >
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <header className="drawer-head">
          <span className="cat-tag">{CATEGORY[p.category].label}</span>
          <h2>
            {p.name}
            {p.aka && <span className="aka">{p.aka}</span>}
          </h2>
          <p className="drawer-role">
            {p.role}
            {p.org && p.org !== '—' ? ` · ${p.org}` : ''}
          </p>
          <p className="drawer-status">{p.status}</p>
          {p.severity && (
            <span className={`sev sev-${p.severity}`}>
              {SEVERITY[p.severity].label}
            </span>
          )}
        </header>

        <p className="drawer-summary">{p.summary}</p>

        {p.allegations.length > 0 && (
          <section className="drawer-section">
            <h3>
              What is alleged{' '}
              <span className="hint">— untested; no finding made</span>
            </h3>
            <ol className="allegations">
              {p.allegations.map((a, i) => (
                <li key={i}>
                  <div className="alleg-when">
                    <time>{formatDate(a.presented)}</time>
                    {(a.presentedNote || videoById[a.clip]?.dateApprox) && (
                      <span className="approx">approx</span>
                    )}
                  </div>
                  <p className="alleg-what">{a.what}</p>
                  <dl className="alleg-meta">
                    <div>
                      <dt>Alleged by</dt>
                      <dd>{a.by}</dd>
                    </div>
                    <div>
                      <dt>Forum</dt>
                      <dd>{a.forum}</dd>
                    </div>
                    <div>
                      <dt>Response</dt>
                      <dd>{a.response}</dd>
                    </div>
                  </dl>
                  <div className="alleg-links">
                    {a.clip && videoById[a.clip] ? (
                      <a
                        href={videoById[a.clip].url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        ▶ Watch it put on the record
                      </a>
                    ) : (
                      <span className={`basis basis-${a.basis}`}>
                        {a.basis === 'video'
                          ? 'evidenced by hearing footage'
                          : 'public record — not re-verified here'}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {transcriptMentionsFor(p.id).length > 0 && (
          <section className="drawer-section">
            <h3>
              In the transcripts{' '}
              <span className="hint">
                — {transcriptMentionsFor(p.id).length} sitting day(s)
              </span>
            </h3>
            <ul className="tmentions">
              {transcriptMentionsFor(p.id).map((m) => (
                <li key={m.date}>
                  <div className="passage-meta">
                    <time>{formatDate(m.date)}</time>
                    {m.day && <span className="pill">Day {m.day}</span>}
                    <span className="passage-page">
                      {m.count}× · first p.{m.firstPage}
                    </span>
                  </div>
                  {m.snippet && <p className="passage">{m.snippet}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.notes?.length > 0 && (
          <section className="drawer-section">
            <h3>On the record</h3>
            <ul className="notes">
              {p.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        {events.length > 0 && (
          <section className="drawer-section">
            <h3>Appears in the timeline</h3>
            <ul className="drawer-events">
              {events.map((e) => (
                <li key={e.date + e.title}>
                  <time>{formatDate(e.date)}</time>
                  <span>{e.title}</span>
                  {e.certainty === 'approx' && (
                    <span className="approx">approx</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {events.length > 0 && (
          <section className="drawer-section">
            <h3>Also named alongside</h3>
            <div className="chips">
              {[...new Set(events.flatMap((e) => e.people))]
                .filter((id) => id !== p.id && peopleById[id])
                .map((id) => (
                  <button
                    key={id}
                    className="chip"
                    onClick={() => onPerson(id)}
                  >
                    {peopleById[id].name}
                  </button>
                ))}
            </div>
          </section>
        )}

        <section className="drawer-section">
          <h3>
            Footage <span className="hint">— {clips.length} clip(s)</span>
          </h3>
          {clips.length === 0 ? (
            <p className="empty">
              No clip in the indexed playlists names this person in its title.
            </p>
          ) : (
            <ul className="clip-list">
              {clips.map((v) => (
                <li key={v.videoId}>
                  <a href={v.url} target="_blank" rel="noreferrer">
                    <Thumb videoId={v.videoId} />
                    <div>
                      <span className="clip-title">{v.title}</span>
                      <span className="clip-meta">
                        {formatDate(v.date)}
                        {v.dateApprox && <span className="approx">approx</span>}
                        {v.duration && ` · ${v.duration}`}
                        {v.isLive && ' · full stream'}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
