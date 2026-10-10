import { useMemo, useState } from 'react';
import Thumb from './Thumb.jsx';
import {
  videos,
  playlists,
  playlistByKey,
  peopleFor,
  formatDate,
} from '../lib/data.js';

export default function Hearings({ onPerson }) {
  const [pl, setPl] = useState('all');
  const [q, setQ] = useState('');
  const [longOnly, setLongOnly] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return videos.filter((v) => {
      if (pl !== 'all' && !v.playlists.includes(pl)) return false;
      if (longOnly && (v.seconds ?? 0) < 3600) return false;
      if (!needle) return true;
      return (
        v.title.toLowerCase().includes(needle) ||
        peopleFor(v.videoId).some((p) =>
          p.name.toLowerCase().includes(needle)
        )
      );
    });
  }, [pl, q, longOnly]);

  return (
    <div className="stack">
      <div className="controls">
        <div className="segmented">
          <button
            className={`seg ${pl === 'all' ? 'is-active' : ''}`}
            onClick={() => setPl('all')}
          >
            All sources<span className="seg-count">{videos.length}</span>
          </button>
          {playlists.map((p) => (
            <button
              key={p.key}
              className={`seg ${pl === p.key ? 'is-active' : ''}`}
              onClick={() => setPl(p.key)}
              title={p.blurb}
            >
              {p.label}
              <span className="seg-count">
                {videos.filter((v) => v.playlists.includes(p.key)).length}
              </span>
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search titles and named people…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="toggle">
          <input
            type="checkbox"
            checked={longOnly}
            onChange={(e) => setLongOnly(e.target.checked)}
          />
          Full sessions only (1h+)
        </label>
      </div>

      <p className="result-count">
        {list.length} of {videos.length} items
        {pl !== 'all' && ` · ${playlistByKey[pl].blurb}`}
      </p>

      <ul className="hearings">
        {list.map((v) => {
          const named = peopleFor(v.videoId);
          return (
            <li key={v.videoId} className="hearing">
              <a
                className="hearing-thumb"
                href={v.url}
                target="_blank"
                rel="noreferrer"
              >
                <Thumb videoId={v.videoId} duration={v.duration} />
              </a>
              <div className="hearing-body">
                <a href={v.url} target="_blank" rel="noreferrer">
                  <h3>{v.title}</h3>
                </a>
                <div className="hearing-meta">
                  <time>{formatDate(v.date)}</time>
                  {v.dateApprox && <span className="approx">approx</span>}
                  {v.isLive && <span className="pill">full stream</span>}
                  {v.hearingDay && (
                    <span className="pill">Day {v.hearingDay}</span>
                  )}
                  <span className="src">
                    {v.playlists.map((k) => playlistByKey[k].label).join(' · ')}
                  </span>
                </div>
                {named.length > 0 && (
                  <div className="chips">
                    {named.map((p) => (
                      <button
                        key={p.id}
                        className={`chip chip-${p.category}`}
                        onClick={() => onPerson(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {list.length === 0 && (
          <p className="empty">Nothing matches that filter.</p>
        )}
      </ul>
    </div>
  );
}
