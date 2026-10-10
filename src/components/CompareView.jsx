import { useMemo, useState } from 'react';
import {
  people,
  peopleById,
  sortPeople,
  videosFor,
  eventsFor,
  formatDate,
  CATEGORY,
} from '../lib/data.js';
import {
  nodeById,
  adjacency,
  shortestPath,
  edgeBetween,
  allegationsMadeBy,
} from '../lib/graph.js';

const ordered = sortPeople(people);

function Picker({ label, value, onChange, exclude }) {
  return (
    <label className="picker">
      <span>{label}</span>
      <select
        className="search"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Choose a person…</option>
        {ordered
          .filter((p) => p.id !== exclude)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {CATEGORY[p.category].label}
            </option>
          ))}
      </select>
    </label>
  );
}

function Column({ id }) {
  if (!id) return <div className="cmp-col cmp-empty">Nothing selected</div>;
  const p = peopleById[id];
  const n = nodeById[id];
  const clips = videosFor(id);
  const events = eventsFor(id);
  const made = allegationsMadeBy.get(id) ?? [];

  return (
    <div className={`cmp-col tone-${CATEGORY[p.category].tone}`}>
      <h3>{p.name}</h3>
      <p className="card-role">{p.role}</p>
      <p className="card-status">{p.status}</p>

      <dl className="cmp-stats">
        <div>
          <dt>Allegations against</dt>
          <dd>{p.allegations?.length ?? 0}</dd>
        </div>
        <div>
          <dt>Allegations made</dt>
          <dd>{made.length}</dd>
        </div>
        <div>
          <dt>Connections</dt>
          <dd>{n?.degree ?? 0}</dd>
        </div>
        <div>
          <dt>Clips</dt>
          <dd>{clips.length}</dd>
        </div>
        <div>
          <dt>Timeline events</dt>
          <dd>{events.length}</dd>
        </div>
        <div>
          <dt>First on record</dt>
          <dd>
            {p.allegations?.length
              ? formatDate(
                  [...p.allegations].sort((a, b) =>
                    a.presented.localeCompare(b.presented)
                  )[0].presented
                )
              : events.length
                ? formatDate(events[events.length - 1].date)
                : '—'}
          </dd>
        </div>
      </dl>

      <p className="cmp-summary">{p.summary}</p>
    </div>
  );
}

export default function CompareView({ onPerson }) {
  const [a, setA] = useState('mchunu');
  const [b, setB] = useState('matlala');

  const path = useMemo(() => (a && b ? shortestPath(a, b) : null), [a, b]);

  const shared = useMemo(() => {
    if (!a || !b) return null;
    const na = adjacency.get(a) ?? new Set();
    const nb = adjacency.get(b) ?? new Set();
    return [...na].filter((id) => nb.has(id) && id !== a && id !== b);
  }, [a, b]);

  const sharedClips = useMemo(() => {
    if (!a || !b) return [];
    const ids = new Set(videosFor(b).map((v) => v.videoId));
    return videosFor(a).filter((v) => ids.has(v.videoId));
  }, [a, b]);

  const sharedEvents = useMemo(() => {
    if (!a || !b) return [];
    const keys = new Set(eventsFor(b).map((e) => e.date + e.title));
    return eventsFor(a).filter((e) => keys.has(e.date + e.title));
  }, [a, b]);

  return (
    <div className="stack">
      <p className="cat-blurb tone-amber">
        Put two people side by side and see how the record connects them — the
        shortest chain between them, who they both touch, and the sittings and
        clips where both are named.
      </p>

      <div className="controls cmp-pickers">
        <Picker label="Person A" value={a} onChange={setA} exclude={b} />
        <Picker label="Person B" value={b} onChange={setB} exclude={a} />
      </div>

      <div className="cmp-grid">
        <Column id={a} />
        <Column id={b} />
      </div>

      <section className="panel">
        <h2>Connection</h2>
        {!path && (
          <p className="empty">
            No chain of allegations, shared events or shared footage links these
            two in the record.
          </p>
        )}
        {path && path.length === 1 && (
          <p className="empty">Same person.</p>
        )}
        {path && path.length > 1 && (
          <>
            <p className="panel-note">
              {path.length === 2
                ? 'Directly connected.'
                : `${path.length - 2} step${path.length - 2 === 1 ? '' : 's'} apart.`}
            </p>
            <ol className="path">
              {path.map((id, i) => {
                const link = i > 0 ? edgeBetween(path[i - 1], id) : null;
                const type = link?.types?.alleges
                  ? 'alleges against'
                  : link?.types?.['co-event']
                    ? 'named in same event as'
                    : link
                      ? 'named in same clip as'
                      : null;
                return (
                  <li key={id}>
                    {type && <span className="path-rel">{type}</span>}
                    <button className="chip" onClick={() => onPerson(id)}>
                      {peopleById[id]?.name}
                    </button>
                    {link?.labels?.length > 0 && (
                      <span className="path-why">{link.labels[0]}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>

      <div className="cols">
        <section className="panel">
          <h2>People both are linked to ({shared?.length ?? 0})</h2>
          {shared?.length ? (
            <div className="chips">
              {shared.map((id) => (
                <button
                  key={id}
                  className={`chip chip-${peopleById[id]?.category}`}
                  onClick={() => onPerson(id)}
                >
                  {peopleById[id]?.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="empty">None in common.</p>
          )}
        </section>

        <section className="panel">
          <h2>Where both appear</h2>
          {sharedEvents.length === 0 && sharedClips.length === 0 && (
            <p className="empty">No shared sitting or clip.</p>
          )}
          {sharedEvents.length > 0 && (
            <ul className="drawer-events">
              {sharedEvents.map((e) => (
                <li key={e.date + e.title}>
                  <time>{formatDate(e.date)}</time>
                  <span>{e.title}</span>
                </li>
              ))}
            </ul>
          )}
          {sharedClips.length > 0 && (
            <ul className="hit-list">
              {sharedClips.map((v) => (
                <li key={v.videoId}>
                  <div className="hit-meta">
                    <time>{formatDate(v.date)}</time>
                  </div>
                  <p>
                    <a href={v.url} target="_blank" rel="noreferrer">
                      {v.title}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
