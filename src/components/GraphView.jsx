import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  nodes,
  nodeById,
  edges,
  edgesFor,
  otherEnd,
  neighbourhood,
  INVESTIGATION_PATHS,
} from '../lib/graph.js';
import { ForceLayout } from '../lib/graph-sim.js';
import { CATEGORY } from '../lib/data.js';

const TONE = {
  red: '#ef5350',
  blue: '#4fa3e3',
  green: '#4caf82',
  amber: '#e0a63c',
  violet: '#9b7ede',
};

const EDGE_STYLE = {
  alleges: { stroke: '#ef5350', label: 'alleges against', rest: 0.72 },
  'co-event': { stroke: '#4fa3e3', label: 'named in same event', rest: 0.5 },
  'co-clip': { stroke: '#5b6b7d', label: 'named in same clip', rest: 0.3 },
};

const ZOOM_MIN = 0.45;
const ZOOM_MAX = 3;
const DRAG_SLOP = 4;

/** The strongest relationship an edge represents, for colour and labelling. */
function dominantType(edge) {
  if (edge.types.alleges) return 'alleges';
  if (edge.types['co-event']) return 'co-event';
  return 'co-clip';
}

const radiusOf = (n) => 7 + Math.min(n.degree, 14) * 0.9;
const edgeId = (e) => `${e.source}|${e.target}`;

/** Pointer capture, without letting a refused capture kill the handler. */
function capture(ev) {
  try {
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  } catch {
    /* no capture; drag still works while the pointer stays over the node */
  }
}

const prefersStill = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Which labels to draw at this zoom.
 *
 * Drawing all 67 at once is what forced the old wide spacing, and a wall of
 * 10px text is not more informative than a readable subset. Zooming in is the
 * gesture that asks for more detail, so it is what reveals more names - along
 * with hovering, selecting, or being connected to whoever is selected.
 */
function labelFloor(k) {
  if (k < 0.85) return 12;
  if (k < 1.3) return 6;
  if (k < 1.9) return 3;
  return 0;
}

/**
 * Trim long names to keep labels from colliding.
 *
 * Trimming the tail rather than the head is deliberate: the register holds two
 * Mkhwanazis, and it is the given name that tells them apart. Checked against
 * every name in the register - no two collapse to the same 22 characters.
 */
const LABEL_MAX = 22;
const shortName = (name) =>
  name.length > LABEL_MAX ? `${name.slice(0, LABEL_MAX - 1)}…` : name;

/**
 * A gentle arc between two nodes, trimmed to each rim.
 *
 * Trimming matters once arrowheads are involved: a line drawn centre to
 * centre puts the arrow inside the target circle, where a large node hides it
 * completely. The old fixed marker offset assumed every node was the same
 * size, and hubs are not.
 */
function arcPath(a, b, ra, rb) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const x1 = a.x + ux * ra;
  const y1 = a.y + uy * ra;
  const x2 = b.x - ux * rb;
  const y2 = b.y - uy * rb;
  // Bow perpendicular to the chord, so two people linked several ways still
  // read as separate strands rather than one thick line.
  const bow = Math.min(d * 0.085, 34);
  const mx = (x1 + x2) / 2 - uy * bow;
  const my = (y1 + y2) / 2 + ux * bow;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(
    1
  )} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export default function GraphView({ onPerson }) {
  const [pathId, setPathId] = useState('all');
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [minWeight, setMinWeight] = useState(1);

  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 1180, h: 760 });

  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;

  const [pos, setPos] = useState({});
  const simRef = useRef(null);
  const rafRef = useRef(0);
  const warmedRef = useRef(false);
  const dragRef = useRef(null);
  const panRef = useRef(null);

  if (!simRef.current) simRef.current = new ForceLayout(size.w, size.h);

  /* ------------------------------------------------- what is on screen */

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

  /* ----------------------------------------------------------- sizing */

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(el.clientWidth - 20, 320);
      // Keep a landscape canvas, but never so tall it pushes the detail
      // panel off screen.
      const h = Math.round(Math.min(Math.max(w * 0.6, 440), 720));
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ------------------------------------------------- the running sim */

  const kick = useCallback(() => {
    if (rafRef.current) return;
    const sim = simRef.current;
    const loop = () => {
      const running = sim.tick();
      setPos(sim.positions());
      rafRef.current = running ? requestAnimationFrame(loop) : 0;
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    sim.resize(size.w, size.h);
    sim.setGraph(drawnIds, shownEdges);

    // Someone who has asked for reduced motion should not be shown a network
    // rearranging itself. Settle it off-screen and paint the result once.
    if (prefersStill()) {
      sim.settle();
      setPos(sim.positions());
      return undefined;
    }

    if (!warmedRef.current) {
      sim.settle();
      warmedRef.current = true;
    } else {
      sim.warm(3);
    }
    setPos(sim.positions());
    kick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [drawnIds, shownEdges, size.w, size.h, kick]);

  /* ---------------------------------------------------- pan and zoom */

  const toSvg = useCallback(
    (clientX, clientY) => {
      const r = svgRef.current.getBoundingClientRect();
      return {
        x: ((clientX - r.left) / r.width) * size.w,
        y: ((clientY - r.top) / r.height) * size.h,
      };
    },
    [size.w, size.h]
  );

  const toGraph = useCallback(
    (clientX, clientY) => {
      const p = toSvg(clientX, clientY);
      const v = viewRef.current;
      return { x: (p.x - v.x) / v.k, y: (p.y - v.y) / v.k };
    },
    [toSvg]
  );

  const zoomTo = useCallback((nextK, anchor) => {
    setView((v) => {
      const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextK));
      if (k === v.k) return v;
      const ax = anchor?.x ?? 0;
      const ay = anchor?.y ?? 0;
      return { k, x: ax - (ax - v.x) * (k / v.k), y: ay - (ay - v.y) * (k / v.k) };
    });
  }, []);

  // React attaches wheel passively, so preventDefault has to come from a
  // native non-passive listener or the page scrolls as well as the graph.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (ev) => {
      ev.preventDefault();
      const v = viewRef.current;
      const factor = Math.exp(-ev.deltaY * 0.0014);
      zoomTo(v.k * factor, toSvg(ev.clientX, ev.clientY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomTo, toSvg]);

  const fit = useCallback(() => {
    const b = simRef.current.bounds();
    if (!b) return;
    const pad = 70;
    const w = Math.max(b.maxX - b.minX, 1);
    const h = Math.max(b.maxY - b.minY, 1);
    const k = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, Math.min((size.w - pad) / w, (size.h - pad) / h))
    );
    setView({
      k,
      x: size.w / 2 - ((b.minX + b.maxX) / 2) * k,
      y: size.h / 2 - ((b.minY + b.maxY) / 2) * k,
    });
  }, [size.w, size.h]);

  /* -------------------------------------------------------- dragging */

  const onNodePointerDown = (ev, id) => {
    ev.stopPropagation();
    // Capture keeps a drag alive when the cursor outruns the node, but it
    // throws if the pointer id is not active. Letting that escape would take
    // the whole handler with it and leave the node unclickable, so the drag
    // degrades to the uncaptured case instead.
    capture(ev);
    const g = toGraph(ev.clientX, ev.clientY);
    dragRef.current = {
      id,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
      offX: (pos[id]?.x ?? g.x) - g.x,
      offY: (pos[id]?.y ?? g.y) - g.y,
    };
  };

  const onNodePointerMove = (ev) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== ev.pointerId) return;
    if (
      !d.moved &&
      Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < DRAG_SLOP
    ) {
      return;
    }
    d.moved = true;
    const g = toGraph(ev.clientX, ev.clientY);
    simRef.current.pin(d.id, g.x + d.offX, g.y + d.offY);
    kick();
  };

  const onNodePointerUp = (ev, id) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved) {
      // Let it go rather than leaving it pinned: a pinned node silently
      // distorts every later layout, and nothing on screen would say so.
      simRef.current.release(d.id);
      kick();
    } else {
      setSelected((cur) => (cur === id ? null : id));
    }
  };

  const onBgPointerDown = (ev) => {
    if (ev.button !== 0) return;
    panRef.current = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      origin: { ...viewRef.current },
      moved: false,
    };
    capture(ev);
  };

  const onBgPointerMove = (ev) => {
    const p = panRef.current;
    if (!p || p.pointerId !== ev.pointerId) return;
    const dx = ev.clientX - p.startX;
    const dy = ev.clientY - p.startY;
    if (!p.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    p.moved = true;
    const r = svgRef.current.getBoundingClientRect();
    const sx = size.w / r.width;
    const sy = size.h / r.height;
    setView({ ...p.origin, x: p.origin.x + dx * sx, y: p.origin.y + dy * sy });
  };

  const onBgPointerUp = () => {
    const p = panRef.current;
    panRef.current = null;
    if (p && !p.moved) setSelected(null);
  };

  /* ---------------------------------------------------- focus + fade */

  const active = hover ?? selected;

  const focus = useMemo(() => {
    if (!active) return null;
    const people = new Set([active]);
    const links = new Set();
    for (const e of shownEdges) {
      if (e.source === active || e.target === active) {
        people.add(e.source);
        people.add(e.target);
        links.add(edgeId(e));
      }
    }
    return { people, links };
  }, [active, shownEdges]);

  const selectedNode = selected ? nodeById[selected] : null;
  const selectedEdges = useMemo(() => {
    if (!selected) return [];
    const shown = new Set(shownEdges.map(edgeId));
    return edgesFor(selected)
      .filter((e) => shown.has(edgeId(e)))
      .sort((a, b) => b.weight - a.weight);
  }, [selected, shownEdges]);

  const resetAll = () => {
    setPathId('all');
    setSelected(null);
    setView({ k: 1, x: 0, y: 0 });
  };

  const floor = labelFloor(view.k);
  const isNamed = (id) =>
    focus?.people.has(id) ||
    id === selected ||
    id === hover ||
    (nodeById[id]?.degree ?? 0) >= floor;
  const namedCount = drawnIds.filter(isNamed).length;

  /* ------------------------------------------------------------ render */

  return (
    <div className="stack">
      <p className="cat-blurb tone-blue">
        Every line here is something in the data, not an inference: a red arrow
        means one person put an allegation against another on the record; a blue
        line means they are named in the same timeline event; a grey line means
        they are named in the same clip title.{' '}
        <strong>Click anyone to isolate their connections</strong> — drag to
        move a node, drag the background to pan, scroll to zoom.
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

      <div className="graph-bar">
        <p className="result-count">
          {drawnIds.length} people · {shownEdges.length} connections
          {selectedNode && (
            <>
              {' · '}
              <strong>{selectedNode.person.name}</strong> and{' '}
              {focus ? focus.people.size - 1 : 0} direct
              {focus && focus.people.size - 1 === 1 ? ' link' : ' links'}
            </>
          )}
        </p>
        <div className="graph-tools">
          <button
            className="gbtn"
            onClick={() => zoomTo(viewRef.current.k / 1.3, { x: size.w / 2, y: size.h / 2 })}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
          <span className="gzoom">{Math.round(view.k * 100)}%</span>
          <button
            className="gbtn"
            onClick={() => zoomTo(viewRef.current.k * 1.3, { x: size.w / 2, y: size.h / 2 })}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <button className="gbtn gbtn-wide" onClick={fit} title="Fit to view">
            Fit
          </button>
          <button className="gbtn gbtn-wide" onClick={resetAll} title="Reset">
            Reset
          </button>
        </div>
      </div>

      <div className="graph-wrap" ref={wrapRef}>
        <svg
          ref={svgRef}
          className={`graph ${focus ? 'is-focused' : ''}`}
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-label={`Relationship graph: ${drawnIds.length} people, ${shownEdges.length} connections. Each person is a button.`}
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          onPointerCancel={onBgPointerUp}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef5350" />
            </marker>
          </defs>

          {/* Catches background drags and clear-selection clicks. */}
          <rect width={size.w} height={size.h} fill="transparent" />

          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            <g className="graph-links">
              {shownEdges.map((e) => {
                const a = pos[e.source];
                const b = pos[e.target];
                if (!a || !b) return null;
                const type = dominantType(e);
                const style = EDGE_STYLE[type];
                const lit = focus?.links.has(edgeId(e));
                const faded = focus && !lit;

                const dir = e.direction;
                const flip = dir && dir.from === e.target;
                const from = flip ? b : a;
                const to = flip ? a : b;
                const nFrom = nodeById[flip ? e.target : e.source];
                const nTo = nodeById[flip ? e.source : e.target];

                // Slim by default; the focused strand earns the extra weight.
                const base = 0.7 + (Math.min(e.weight, 14) / 14) * 1.1;
                return (
                  <path
                    key={edgeId(e)}
                    className="graph-link"
                    d={arcPath(
                      from,
                      to,
                      radiusOf(nFrom) + 1,
                      radiusOf(nTo) + (type === 'alleges' ? 9 : 2)
                    )}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={lit ? base * 1.9 : base}
                    strokeLinecap="round"
                    style={{ opacity: faded ? 0.05 : lit ? 0.95 : style.rest }}
                    markerEnd={
                      type === 'alleges' && !faded ? 'url(#arrow)' : undefined
                    }
                  />
                );
              })}
            </g>

            <g className="graph-nodes">
              {drawnIds.map((id) => {
                const n = nodeById[id];
                const p = pos[id];
                if (!p) return null;
                const tone = TONE[CATEGORY[n.person.category].tone];
                const r = radiusOf(n);
                const isSel = selected === id;
                const lit = focus?.people.has(id);
                const faded = focus && !lit;
                // Named if they matter structurally, or if this interaction
                // is about them.
                const named = isNamed(id);
                return (
                  <g
                    key={id}
                    className={`graph-node ${isSel ? 'is-selected' : ''}`}
                    transform={`translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`}
                    style={{ opacity: faded ? 0.12 : 1 }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${n.person.name}, ${n.degree} connections`}
                    onPointerDown={(ev) => onNodePointerDown(ev, id)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={(ev) => onNodePointerUp(ev, id)}
                    onPointerEnter={() => setHover(id)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(id)}
                    onBlur={() => setHover(null)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        setSelected((cur) => (cur === id ? null : id));
                      }
                    }}
                  >
                    {/* Generous invisible target: the visible dot is small by
                        design, and a 14px circle is a poor thing to hit. */}
                    <circle className="graph-hit" r={r + 10} />
                    {/* Full name, including for the labels trimmed above. */}
                    <title>{n.person.name}</title>
                    {isSel && <circle className="graph-ring" r={r + 7} />}
                    <circle
                      className="graph-dot"
                      r={r}
                      fill={tone}
                      fillOpacity={isSel || lit ? 1 : 0.78}
                      stroke={tone}
                      strokeWidth={isSel ? 1.6 : 1}
                    />
                    {named && (
                      <text
                        className="graph-label"
                        y={r + 13}
                        textAnchor="middle"
                      >
                        {shortName(n.person.name)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        <div className="graph-legend">
          {Object.entries(EDGE_STYLE).map(([k, v]) => (
            <span key={k}>
              <i style={{ background: v.stroke }} />
              {v.label}
            </span>
          ))}
          <span className="graph-hint">
            {namedCount < drawnIds.length
              ? `${namedCount} of ${drawnIds.length} named — zoom in, or click anyone, for the rest`
              : 'all names shown'}
          </span>
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
                <li
                  key={other}
                  onPointerEnter={() => setHover(other)}
                  onPointerLeave={() => setHover(null)}
                >
                  <button className="chip" onClick={() => setSelected(other)}>
                    {nodeById[other]?.person.name}
                  </button>
                  <span
                    className="edge-type"
                    style={{ color: EDGE_STYLE[type].stroke }}
                  >
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
