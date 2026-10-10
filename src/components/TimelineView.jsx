import { useMemo, useState } from 'react';
import {
  timelineSorted,
  STRANDS,
  peopleById,
  videos,
  formatDate,
  videoPeople,
} from '../lib/data.js';

const STRAND_KEYS = Object.keys(STRANDS);

/** Clips published within a fortnight of an event, that name one of its people. */
function clipsNear(event) {
  const day = new Date(event.date).getTime();
  const window = 16 * 24 * 3600 * 1000;
  return videos
    .filter((v) => {
      if (!v.date) return false;
      if (Math.abs(new Date(v.date).getTime() - day) > window) return false;
      const named = videoPeople.get(v.videoId) ?? [];
      return named.some((id) => event.people.includes(id));
    })
    .slice(0, 3);
}

export default function TimelineView({ onPerson }) {
  const [active, setActive] = useState(new Set(STRAND_KEYS));
  const [order, setOrder] = useState('desc');

  const toggle = (k) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next.size ? next : new Set(STRAND_KEYS);
    });

  const events = useMemo(() => {
    const list = timelineSorted.filter((e) => active.has(e.strand));
    return order === 'asc' ? [...list].reverse() : list;
  }, [active, order]);

  return (
    <div className="stack">
      <div className="controls">
        <div className="filters">
          {STRAND_KEYS.map((k) => (
            <button
              key={k}
              className={`filter tone-${STRANDS[k].tone} ${
                active.has(k) ? 'is-active' : ''
              }`}
              onClick={() => toggle(k)}
              aria-pressed={active.has(k)}
            >
              {STRANDS[k].label}
            </button>
          ))}
        </div>
        <button
          className="link"
          onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
        >
          {order === 'desc' ? 'Newest first ↓' : 'Oldest first ↑'}
        </button>
      </div>

      <ol className="timeline">
        {events.map((e) => {
          const clips = clipsNear(e);
          return (
            <li key={e.date + e.title} className={`tl tone-${STRANDS[e.strand].tone}`}>
              <div className="tl-rail" aria-hidden="true">
                <span className="tl-dot" />
              </div>
              <div className="tl-body">
                <div className="tl-meta">
                  <time>{formatDate(e.date)}</time>
                  {e.certainty === 'approx' && (
                    <span className="approx" title="derived from clip publication age">
                      approx
                    </span>
                  )}
                  <span className="tl-strand">{STRANDS[e.strand].label}</span>
                </div>
                <h3>{e.title}</h3>
                <p>{e.body}</p>

                <div className="chips">
                  {e.people
                    .filter((id) => peopleById[id])
                    .map((id) => (
                      <button
                        key={id}
                        className={`chip chip-${peopleById[id].category}`}
                        onClick={() => onPerson(id)}
                      >
                        {peopleById[id].name}
                      </button>
                    ))}
                </div>

                {clips.length > 0 && (
                  <details className="tl-clips">
                    <summary>Footage from around this date ({clips.length})</summary>
                    <ul>
                      {clips.map((v) => (
                        <li key={v.videoId}>
                          <a href={v.url} target="_blank" rel="noreferrer">
                            {v.title}
                          </a>
                          <span className="clip-meta">
                            {formatDate(v.date)}
                            {v.duration && ` · ${v.duration}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
