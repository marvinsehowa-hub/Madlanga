/**
 * Relationship graph over the people register.
 *
 * Unlike a document-mining pipeline, we have no free text to extract from —
 * only curated allegations, timeline events and clip titles. So every edge
 * here is one of three things we can actually justify:
 *
 *   alleges   — X put an allegation to the commission against Y (directed)
 *   co-event  — X and Y are named in the same timeline event
 *   co-clip   — X and Y are both named in the same clip title
 *
 * Nothing is inferred beyond that. `unresolvedAllegers` is exported so the UI
 * can state plainly how much of the record the graph does NOT cover.
 */
import {
  people,
  peopleById,
  allegations,
  timeline,
  videos,
  videoPeople,
} from './data.js';
import { resolveAlleger } from './resolve.js';

export { resolveAlleger };

const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function buildEdges() {
  const map = new Map();
  const add = (a, b, type, weight, label) => {
    if (!a || !b || a === b) return;
    if (!peopleById[a] || !peopleById[b]) return;
    const k = edgeKey(a, b);
    let e = map.get(k);
    if (!e) {
      e = { source: a, target: b, weight: 0, types: {}, labels: [] };
      map.set(k, e);
    }
    e.weight += weight;
    e.types[type] = (e.types[type] ?? 0) + 1;
    if (label && e.labels.length < 6 && !e.labels.includes(label)) {
      e.labels.push(label);
    }
    if (type === 'alleges') {
      e.direction = { from: a, to: b };
    }
  };

  const unresolvedAllegers = [];

  for (const a of allegations) {
    const from = resolveAlleger(a.by, a.target.id);
    if (!from) unresolvedAllegers.push({ by: a.by, target: a.target.name });
    else add(from, a.target.id, 'alleges', 6, `${a.presented}: ${a.what.slice(0, 90)}`);
  }

  for (const e of timeline) {
    const ids = e.people.filter((id) => peopleById[id]);
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        add(ids[i], ids[j], 'co-event', 2, `${e.date}: ${e.title}`);
  }

  for (const v of videos) {
    const ids = videoPeople.get(v.videoId) ?? [];
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        add(ids[i], ids[j], 'co-clip', 1, v.title.slice(0, 90));
  }

  return { edges: [...map.values()], unresolvedAllegers };
}

const built = buildEdges();
export const edges = built.edges;
export const unresolvedAllegers = built.unresolvedAllegers;

/** Adjacency, degree and allegation tallies per person. */
export const adjacency = new Map();
for (const p of people) adjacency.set(p.id, new Set());
for (const e of edges) {
  adjacency.get(e.source)?.add(e.target);
  adjacency.get(e.target)?.add(e.source);
}

export const allegationsMadeBy = new Map();
for (const a of allegations) {
  const from = resolveAlleger(a.by, a.target.id);
  if (!from) continue;
  if (!allegationsMadeBy.has(from)) allegationsMadeBy.set(from, []);
  allegationsMadeBy.get(from).push(a);
}

export const nodes = people.map((p) => ({
  id: p.id,
  person: p,
  degree: adjacency.get(p.id)?.size ?? 0,
  allegationsAgainst: p.allegations?.length ?? 0,
  allegationsMade: allegationsMadeBy.get(p.id)?.length ?? 0,
}));

export const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

export const edgesFor = (id) =>
  edges.filter((e) => e.source === id || e.target === id);

export const otherEnd = (edge, id) =>
  edge.source === id ? edge.target : edge.source;

/** Shortest connection between two people, as a list of person ids. */
export function shortestPath(from, to) {
  if (from === to) return [from];
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const next of adjacency.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      if (next === to) {
        const path = [to];
        let step = cur;
        while (step) {
          path.unshift(step);
          step = prev.get(step);
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

export function edgeBetween(a, b) {
  return edges.find(
    (e) =>
      (e.source === a && e.target === b) || (e.source === b && e.target === a)
  );
}

/** Everyone within `depth` hops — the subgraph a preset path opens onto. */
export function neighbourhood(id, depth = 1) {
  const seen = new Set([id]);
  let frontier = [id];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const cur of frontier) {
      for (const n of adjacency.get(cur) ?? []) {
        if (!seen.has(n)) {
          seen.add(n);
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  return seen;
}

/** Curated entry points, mirroring the "investigation paths" idea. */
export const INVESTIGATION_PATHS = [
  {
    id: 'mkhwanazi',
    label: 'Mkhwanazi’s allegations',
    hint: 'Everything traced back to the original complainant',
    focus: 'nhlanhla-mkhwanazi',
    depth: 1,
  },
  {
    id: 'matlala',
    label: 'The Matlala network',
    hint: 'Officers and officials linked to the businessman',
    focus: 'matlala',
    depth: 1,
  },
  {
    id: 'pktt',
    label: 'PKTT disbandment chain',
    hint: 'Minister → deputy commissioner → dockets',
    focus: 'mchunu',
    depth: 1,
  },
  {
    id: 'idac',
    label: 'The IDAC thread',
    hint: 'The 2026 cross-examination of the corruption directorate',
    focus: 'andrea-johnson',
    depth: 1,
  },
  {
    id: 'aeroton',
    label: 'Drug-bust evidence',
    hint: 'Aeroton and Port Shepstone',
    focus: 'magane',
    depth: 1,
  },
  {
    id: 'tshwane',
    label: 'Tshwane metro thread',
    hint: 'Metro police and municipal finance',
    focus: 'julius-mkhwanazi',
    depth: 1,
  },
];

/**
 * Deterministic force-directed layout. Small graph, so a plain spring model
 * run to convergence on load is cheaper and more predictable than a library.
 */
export function layout(ids, width, height, iterations = 400) {
  const list = [...ids];
  const n = list.length;
  if (n === 0) return {};
  const idx = Object.fromEntries(list.map((id, i) => [id, i]));
  const pos = list.map((id, i) => {
    const angle = (i / n) * Math.PI * 2;
    const r = Math.min(width, height) * 0.34;
    return {
      x: width / 2 + Math.cos(angle) * r,
      y: height / 2 + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    };
  });

  const local = edges.filter(
    (e) => idx[e.source] !== undefined && idx[e.target] !== undefined
  );
  const k = Math.sqrt((width * height) / Math.max(n, 1)) * 0.9;

  for (let it = 0; it < iterations; it++) {
    const cool = 1 - it / iterations;
    // repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = (i % 3) - 1 + 0.3;
          dy = (j % 3) - 1 + 0.3;
          d2 = 1;
        }
        const f = (k * k) / d2;
        const d = Math.sqrt(d2);
        pos[i].vx += (dx / d) * f;
        pos[i].vy += (dy / d) * f;
        pos[j].vx -= (dx / d) * f;
        pos[j].vy -= (dy / d) * f;
      }
    }
    // attraction along edges - deliberately weak, so hubs do not collapse
    // the whole network into the middle
    for (const e of local) {
      const a = pos[idx[e.source]];
      const b = pos[idx[e.target]];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const strength = Math.min(e.weight, 12) / 12;
      const f = ((d * d) / k) * 0.22 * (0.5 + strength);
      a.vx -= (dx / d) * f;
      a.vy -= (dy / d) * f;
      b.vx += (dx / d) * f;
      b.vy += (dy / d) * f;
    }
    // gravity to centre + integrate
    for (let i = 0; i < n; i++) {
      pos[i].vx += (width / 2 - pos[i].x) * 0.006;
      pos[i].vy += (height / 2 - pos[i].y) * 0.006;
      const speed = Math.sqrt(pos[i].vx ** 2 + pos[i].vy ** 2) || 1;
      const max = 26 * cool;
      const scale = Math.min(speed, max) / speed;
      pos[i].x += pos[i].vx * scale;
      pos[i].y += pos[i].vy * scale;
      pos[i].vx = 0;
      pos[i].vy = 0;
      const pad = 40;
      pos[i].x = Math.max(pad, Math.min(width - pad, pos[i].x));
      pos[i].y = Math.max(pad, Math.min(height - pad, pos[i].y));
    }
  }

  // Hard separation pass. The force model alone leaves nodes close enough that
  // their labels collide, which is what actually makes a graph unreadable.
  // Labels are wide and short, so separate on an ellipse, not a circle.
  const SEP_X = 146;
  const SEP_Y = 34;
  for (let pass = 0; pass < 160; pass++) {
    let moved = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const nx = dx / SEP_X;
        const ny = dy / SEP_Y;
        const dist = Math.sqrt(nx * nx + ny * ny);
        if (dist >= 1 || dist === 0) continue;
        const push = (1 - dist) / 2;
        const ux = (nx / (dist || 1)) * SEP_X * push;
        const uy = (ny / (dist || 1)) * SEP_Y * push;
        pos[i].x -= ux;
        pos[i].y -= uy;
        pos[j].x += ux;
        pos[j].y += uy;
        moved++;
      }
    }
    for (let i = 0; i < n; i++) {
      const pad = 40;
      pos[i].x = Math.max(pad, Math.min(width - pad, pos[i].x));
      pos[i].y = Math.max(pad, Math.min(height - pad, pos[i].y));
    }
    if (!moved) break;
  }

  return Object.fromEntries(
    list.map((id, i) => [id, { x: pos[i].x, y: pos[i].y }])
  );
}
