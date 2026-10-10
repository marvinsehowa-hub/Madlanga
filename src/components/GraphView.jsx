import { useMemo, useState } from 'react';
import {
  nodes,
  nodeById,
  edges,
  edgesFor,
  otherEnd,
  neighbourhood,
  layout,
  INVESTIGATION_PATHS,
} from '../lib/graph.js';
import { CATEGORY } from '../lib/data.js';

const W = 1280;
const H = 860;

const TONE = {
  red: '#ef5350',
  blue: '#4fa3e3',
  green: '#4caf82',
  amber: '#e0a63c',
  violet: '#9b7ede',
};

const EDGE_STYLE = {
  alleges: { stroke: '#ef5350', label: 'alleges against' },
  'co-event': { stroke: '#4fa3e3', label: 'named in same event' },
  'co-clip': { stroke: '#3a4653', label: 'named in same clip' },
};

/** The strongest relationship an edge represents, for colour and labelling. */
function dominantType(edge) {
  if (edge.types.alleges) return 'alleges';
  if (edge.types['co-event']) return 'co-event';
  return 'co-clip';
}

export default function GraphView({ onPerson }) {
  const [pathId, setPathId] = useState('all');
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [minWeight, setMinWeight] = useState(1);

  const visibleIds = useMemo(() => {
    if (pathId === 'all') {
      return new Set(nodes.filter((n) => n.degree > 0).map((n) => n.id));
    }
    const preset = INVESTIGATION_PATHS.find((p) => p.id === pathId);
    return neighbourhood(preset.focus, preset.depth);
  }, [pathId]);

  const shownEdges = useMemo(
    () =>
      edges.filter(
        (e) =>
          visibleIds.has(e.source) &&
          visibleIds.has(e.target) &&
          e.weight >= minWeight
      ),
    [visibleIds, minWeight]
  );

  // Drop nodes that end up with nothing attached at this weight threshold.
  const drawnIds = useMemo(() => {
    const connected = new Set();
    for (const e of shownEdges) {
      connected.add(e.source);
      connected.add(e.target);
    }
    return [...visibleIds].filter((id) => connected.has(id));
  }, [visibleIds, shownEdges]);

  const pos = useMemo(() => layout(drawnIds, W, H), [drawnIds]);

  const active = hover ?? selected;
  const activeNeighbours = useMemo(() => {
    if (!active) return null;
    const set = new Set([active]);
    for (const e of shownEdges) {
      if (e.source === active) set.add(e.target);
      if (e.target === active) set.add(e.source);
    }
    return set;
  }, [active, shownEdges]);

  const selectedNode = selected ? nodeById[selected] : null;
  const selectedEdges = selected
    ? edgesFor(selected)
        .filter((e) => shownEdges.includes(e))
        .sort((a, b) => b.weight - a.weight)
    : [];

  return (
    <div className="stack">
      <p className="cat-blurb tone-blue">
        Every line here is something in the data, not an inference: a red arrow
        means one person put an allegation against another on the record; a blue
        line means they are named in the same timeline event; a grey line means
        they are named in the same clip title. Click a node to inspect its
        connections.
      </p>

      <div className="controls">
        <div className="segmented">
          <button
            className={`seg ${pathId === 'all' ? 'is-active' : ''}`}
            onClick={() => {
              setPathId('all');
              setSelected(null);
            }}
          >
            Full network
            <span className="seg-count">
              {nodes.filter((n) => n.degree > 0).length}
            </span>
          </button>
          {INVESTIGATION_PATHS.map((p) => (
            <button
              key={p.id}
              className={`seg ${pathId === p.id ? 'is-active' : ''}`}
              title={p.hint}
              onClick={() => {
                setPathId(p.id);
                setSelected(p.focus);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="toggle">
          Min. link strength
          <input
            type="range"
            min="1"
            max="8"
            value={minWeight}
            onChange={(e) => setMinWeight(Number(e.target.value))}
          />
          <span className="seg-count">{minWeight}</span>
        </label>
      </div>

      <p className="result-count">
        {drawnIds.length} people · {shownEdges.length} connections
      </p>

      <div className="graph-wrap">
        <svg
          className="graph"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Relationship graph"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef5350" />
            </marker>
          </defs>

          {shownEdges.map((e) => {
            const a = pos[e.source];
            const b = pos[e.target];
            if (!a || !b) return null;
            const type = dominantType(e);
            const dim =
              activeNeighbours &&
              !(activeNeighbours.has(e.source) && activeNeighbours.has(e.target));
            const dir = e.direction;
            const from = dir && dir.from === e.target ? b : a;
            const to = dir && dir.from === e.target ? a : b;
            return (
              <line
                key={`${e.source}-${e.target}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={EDGE_STYLE[type].stroke}
                strokeWidth={Math.min(1 + e.weight / 5, 4)}
                strokeOpacity={dim ? 0.07 : type === 'co-clip' ? 0.35 : 0.6}
                markerEnd={type === 'alleges' && !dim ? 'url(#arrow)' : undefined}
              />
            );
          })}

          {drawnIds.map((id) => {
            const n = nodeById[id];
            const p = pos[id];
            if (!p) return null;
            const tone = TONE[CATEGORY[n.person.category].tone];
            const r = 7 + Math.min(n.degree, 14) * 0.9;
            const dim = activeNeighbours && !activeNeighbours.has(id);
            return (
              <g
                key={id}
                className="graph-node"
                transform={`translate(${p.x},${p.y})`}
                opacity={dim ? 0.15 : 1}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(id === selected ? null : id)}
              >
                <circle
                  r={r}
                  fill={tone}
                  fillOpacity={selected === id ? 1 : 0.75}
                  stroke={selected === id ? '#fff' : tone}
                  strokeWidth={selected === id ? 2 : 1}
                />
                <text y={r + 12} textAnchor="middle" className="graph-label">
                  {n.person.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="graph-legend">
          {Object.entries(EDGE_STYLE).map(([k, v]) => (
            <span key={k}>
              <i style={{ background: v.stroke }} />
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {selectedNode && (
        <section className="panel">
          <div className="panel-head">
            <h2>{selectedNode.person.name}</h2>
            <button className="link" onClick={() => onPerson(selectedNode.id)}>
              Open full dossier →
            </button>
          </div>
          <p className="card-role">{selectedNode.person.role}</p>
          <div className="card-foot">
            <span className="pill">{selectedNode.degree} connections</span>
            {selectedNode.allegationsAgainst > 0 && (
              <span className="pill pill-alert">
                {selectedNode.allegationsAgainst} allegation
                {selectedNode.allegationsAgainst === 1 ? '' : 's'} against
              </span>
            )}
            {selectedNode.allegationsMade > 0 && (
              <span className="pill">
                {selectedNode.allegationsMade} allegation
                {selectedNode.allegationsMade === 1 ? '' : 's'} made
              </span>
            )}
          </div>

          <ul className="edge-list">
            {selectedEdges.map((e) => {
              const other = otherEnd(e, selectedNode.id);
              const type = dominantType(e);
              return (
                <li key={other}>
                  <button className="chip" onClick={() => setSelected(other)}>
                    {nodeById[other]?.person.name}
                  </button>
                  <span className="edge-type" style={{ color: EDGE_STYLE[type].stroke }}>
                    {EDGE_STYLE[type].label}
                  </span>
                  <span className="edge-labels">{e.labels.join(' · ')}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
