import { useMemo, useState } from 'react';
import {
  allegations,
  groupAllegationsByDate,
  FORUMS,
  formatDate,
  SEVERITY,
} from '../lib/data.js';

export default function Allegations({ onPerson }) {
  const [forum, setForum] = useState('all');
  const [q, setQ] = useState('');
  const [order, setOrder] = useState('asc');

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = allegations.filter((a) => {
      if (forum !== 'all' && !a.forum.includes(forum)) return false;
      if (!needle) return true;
      return (
        a.target.name.toLowerCase().includes(needle) ||
        a.what.toLowerCase().includes(needle) ||
        a.by.toLowerCase().includes(needle)
      );
    });
    const g = groupAllegationsByDate(list);
    return order === 'desc' ? [...g].reverse() : g;
  }, [forum, q, order]);

  const shown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="stack">
      <p className="cat-blurb tone-red">
        Every allegation in the register, ordered by the day it was put on the
        record — not by when the underlying events happened. Each is pinned to
        the session where it was aired. Nothing here has been tested or found
        proven.
      </p>

      <div className="controls">
        <div className="segmented">
          <button
            className={`seg ${forum === 'all' ? 'is-active' : ''}`}
            onClick={() => setForum('all')}
          >
            Both forums<span className="seg-count">{allegations.length}</span>
          </button>
          {FORUMS.map((f) => (
            <button
              key={f.key}
              className={`seg ${forum === f.key ? 'is-active' : ''}`}
              onClick={() => setForum(f.key)}
            >
              {f.label}
              <span className="seg-count">
                {allegations.filter((a) => a.forum.includes(f.key)).length}
              </span>
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search who it's against, what's alleged, or who alleged it…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="link"
          onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        >
          {order === 'asc' ? 'Oldest first ↑' : 'Newest first ↓'}
        </button>
      </div>

      <p className="result-count">
        {shown} allegation{shown === 1 ? '' : 's'} across {groups.length} sitting
        {groups.length === 1 ? '' : 's'}
      </p>

      <ol className="ledger">
        {groups.map((g) => (
          <li key={g.date} className="sitting">
            <div className="sitting-head">
              <time>{formatDate(g.date)}</time>
              {g.approx && <span className="approx">approx</span>}
              <span className="sitting-count">
                {g.items.length} allegation{g.items.length === 1 ? '' : 's'}
              </span>
            </div>

            <ul className="sitting-items">
              {g.items.map((a) => (
                <li key={a.key} className="alleg-row">
                  <div className="alleg-target">
                    <button
                      className="chip chip-accused"
                      onClick={() => onPerson(a.target.id)}
                    >
                      {a.target.name}
                    </button>
                    {a.target.severity && (
                      <span className={`sev sev-${a.target.severity}`}>
                        {SEVERITY[a.target.severity].label}
                      </span>
                    )}
                  </div>

                  <div className="alleg-main">
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
                        <dd className={a.response === '—' ? 'muted' : ''}>
                          {a.response === '—'
                            ? 'No response on the record'
                            : a.response}
                        </dd>
                      </div>
                    </dl>

                    {a.presentedNote && (
                      <p className="alleg-note">{a.presentedNote}</p>
                    )}

                    <div className="alleg-links">
                      {a.clip ? (
                        <a href={a.clip.url} target="_blank" rel="noreferrer">
                          ▶ Watch it put on the record
                          {a.clip.duration ? ` (${a.clip.duration})` : ''}
                        </a>
                      ) : (
                        <span className="basis basis-public-record">
                          not isolated in a published clip
                        </span>
                      )}
                      {a.responseClip && (
                        <a
                          href={a.responseClip.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ▶ Watch the response
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {groups.length === 0 && (
          <p className="empty">No allegation matches that filter.</p>
        )}
      </ol>
    </div>
  );
}
