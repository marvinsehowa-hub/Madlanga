import { useMemo, useState } from 'react';
import {
  people,
  allegations,
  videos,
  playlists,
  playlistByKey,
  timeline,
  STRANDS,
  CATEGORY,
  SEVERITY,
  formatDate,
} from '../lib/data.js';
import { nodes, edges, allegationsMadeBy } from '../lib/graph.js';

/** Horizontal bar list — one shape reused for every ranking on this page. */
function BarList({ rows, max, onPick, unit }) {
  const top = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.key}>
          <button
            className="bar-row"
            onClick={() => r.id && onPick?.(r.id)}
            disabled={!r.id}
          >
            <span className="bar-label">{r.label}</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{
                  width: `${(r.value / top) * 100}%`,
                  background: r.color ?? 'var(--blue)',
                }}
              />
            </span>
            <span className="bar-value">
              {r.value}
              {unit ? ` ${unit}` : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const TONE_VAR = {
  red: 'var(--red)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  violet: 'var(--violet)',
};

export default function AnalyticsView({ onPerson }) {
  const [limit, setLimit] = useState(10);

  const mostAccused = useMemo(
    () =>
      people
        .filter((p) => p.allegations?.length)
        .sort((a, b) => b.allegations.length - a.allegations.length)
        .slice(0, limit)
        .map((p) => ({
          key: p.id,
          id: p.id,
          label: p.name,
          value: p.allegations.length,
          color: 'var(--red)',
        })),
    [limit]
  );

  const mostConnected = useMemo(
    () =>
      [...nodes]
        .sort((a, b) => b.degree - a.degree)
        .slice(0, limit)
        .map((n) => ({
          key: n.id,
          id: n.id,
          label: n.person.name,
          value: n.degree,
          color: TONE_VAR[CATEGORY[n.person.category].tone],
        })),
    [limit]
  );

  const topAllegers = useMemo(
    () =>
      [...allegationsMadeBy.entries()]
        .map(([id, list]) => ({
          key: id,
          id,
          label: people.find((p) => p.id === id)?.name ?? id,
          value: list.length,
          color: 'var(--amber)',
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit),
    [limit]
  );

  const byMonth = useMemo(() => {
    const m = new Map();
    for (const a of allegations) {
      const key = a.presented.slice(0, 7);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        key,
        label: formatDate(`${key}-01`).replace(/^1 /, ''),
        value,
        color: 'var(--red)',
      }));
  }, []);

  const byForum = useMemo(() => {
    const commission = allegations.filter((a) =>
      a.forum.includes('Madlanga Commission')
    ).length;
    const adhoc = allegations.filter((a) =>
      a.forum.includes('Ad Hoc Committee')
    ).length;
    return [
      { key: 'c', label: 'Madlanga Commission', value: commission, color: 'var(--blue)' },
      { key: 'a', label: 'Ad Hoc Committee', value: adhoc, color: 'var(--amber)' },
    ];
  }, []);

  const bySeverity = useMemo(
    () =>
      Object.entries(SEVERITY).map(([key, meta]) => ({
        key,
        label: meta.label,
        value: people.filter((p) => p.severity === key).length,
        color: key === 'central' ? 'var(--red)' : 'var(--amber)',
      })),
    []
  );

  const byCategory = useMemo(
    () =>
      Object.values(CATEGORY).map((c) => ({
        key: c.key,
        label: c.label,
        value: people.filter((p) => p.category === c.key).length,
        color: TONE_VAR[c.tone],
      })),
    []
  );

  const byStrand = useMemo(
    () =>
      Object.entries(STRANDS).map(([key, meta]) => ({
        key,
        label: meta.label,
        value: timeline.filter((e) => e.strand === key).length,
        color: TONE_VAR[meta.tone],
      })),
    []
  );

  const bySource = useMemo(
    () =>
      playlists.map((p) => ({
        key: p.key,
        label: p.label,
        value: videos.filter((v) => v.playlists.includes(p.key)).length,
        color: 'var(--green)',
      })),
    []
  );

  const responseRate = useMemo(() => {
    const answered = allegations.filter((a) => a.response !== '—').length;
    return {
      answered,
      unanswered: allegations.length - answered,
      pct: Math.round((answered / allegations.length) * 100),
    };
  }, []);

  const evidenceRate = useMemo(() => {
    const pinned = allegations.filter((a) => a.clip).length;
    return { pinned, total: allegations.length };
  }, []);

  return (
    <div className="stack">
      <p className="cat-blurb tone-green">
        Aggregate view of the register. Rankings count what the record holds —
        an allegation tally is a measure of how often someone has been named,
        not a measure of guilt.
      </p>

      <div className="controls">
        <div className="segmented">
          {[10, 25, 50].map((n) => (
            <button
              key={n}
              className={`seg ${limit === n ? 'is-active' : ''}`}
              onClick={() => setLimit(n)}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>

      <div className="cols">
        <section className="panel">
          <h2>Most allegations against</h2>
          <BarList rows={mostAccused} onPick={onPerson} />
        </section>
        <section className="panel">
          <h2>Most connected</h2>
          <BarList rows={mostConnected} onPick={onPerson} unit="links" />
        </section>
      </div>

      <div className="cols">
        <section className="panel">
          <h2>Who is making the allegations</h2>
          <BarList rows={topAllegers} onPick={onPerson} />
        </section>
        <section className="panel">
          <h2>Allegations put on the record, by month</h2>
          <BarList rows={byMonth} />
        </section>
      </div>

      <div className="cols">
        <section className="panel">
          <h2>By forum</h2>
          <BarList rows={byForum} />
          <p className="panel-note">
            Totals exceed {allegations.length} because two allegations were put
            in both forums.
          </p>
        </section>
        <section className="panel">
          <h2>Register composition</h2>
          <BarList rows={byCategory} />
          <BarList rows={bySeverity} />
        </section>
      </div>

      <div className="cols">
        <section className="panel">
          <h2>Timeline strands</h2>
          <BarList rows={byStrand} />
        </section>
        <section className="panel">
          <h2>Footage by source</h2>
          <BarList rows={bySource} unit="clips" />
        </section>
      </div>

      <section className="panel">
        <h2>Record quality</h2>
        <div className="quality">
          <div>
            <div className="stat-value">
              {evidenceRate.pinned}/{evidenceRate.total}
            </div>
            <div className="stat-label">
              allegations pinned to a specific clip
            </div>
          </div>
          <div>
            <div className="stat-value">{responseRate.pct}%</div>
            <div className="stat-label">
              have a response on the record ({responseRate.unanswered}{' '}
              unanswered)
            </div>
          </div>
          <div>
            <div className="stat-value">{edges.length}</div>
            <div className="stat-label">
              justified relationships between people
            </div>
          </div>
          <div>
            <div className="stat-value">
              {videos.filter((v) => !v.dateApprox).length}/{videos.length}
            </div>
            <div className="stat-label">clips with an exact, stated date</div>
          </div>
        </div>
      </section>
    </div>
  );
}
