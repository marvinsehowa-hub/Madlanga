import { useMemo, useState } from 'react';
import {
  people,
  sortPeople,
  videosFor,
  CATEGORY,
  SEVERITY,
} from '../lib/data.js';

const ORDER = ['accused', 'witness', 'commission', 'legal', 'political'];

export default function PeopleGrid({ onPerson }) {
  const [cat, setCat] = useState('accused');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sortPeople(
      people.filter((p) => {
        if (p.category !== cat) return false;
        if (!needle) return true;
        return (
          p.name.toLowerCase().includes(needle) ||
          (p.aka ?? '').toLowerCase().includes(needle) ||
          p.role.toLowerCase().includes(needle) ||
          p.summary.toLowerCase().includes(needle)
        );
      })
    );
  }, [cat, q]);

  const meta = CATEGORY[cat];

  return (
    <div className="stack">
      <div className="controls">
        <div className="segmented" role="tablist">
          {ORDER.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={cat === key}
              className={`seg ${cat === key ? 'is-active' : ''} tone-${CATEGORY[key].tone}`}
              onClick={() => setCat(key)}
            >
              {CATEGORY[key].label}
              <span className="seg-count">
                {people.filter((p) => p.category === key).length}
              </span>
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search name, role or summary…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <p className={`cat-blurb tone-${meta.tone}`}>{meta.blurb}</p>

      <div className="grid">
        {list.map((p) => {
          const clips = videosFor(p.id);
          return (
            <button
              key={p.id}
              className={`card tone-${CATEGORY[p.category].tone}`}
              onClick={() => onPerson(p.id)}
            >
              <div className="card-head">
                <h3>
                  {p.name}
                  {p.aka && <span className="aka">{p.aka}</span>}
                </h3>
                {p.severity && (
                  <span className={`sev sev-${p.severity}`}>
                    {SEVERITY[p.severity].label}
                  </span>
                )}
              </div>
              <p className="card-role">{p.role}</p>
              <p className="card-status">{p.status}</p>
              <p className="card-summary">{p.summary}</p>
              <div className="card-foot">
                {p.allegations.length > 0 && (
                  <span className="pill pill-alert">
                    {p.allegations.length} allegation
                    {p.allegations.length === 1 ? '' : 's'}
                  </span>
                )}
                {clips.length > 0 && (
                  <span className="pill">
                    {clips.length} clip{clips.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="empty">No one in this group matches “{q}”.</p>
        )}
      </div>
    </div>
  );
}
