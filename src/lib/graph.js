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

/* The layout itself now lives in ./graph-sim.js, which runs the same spring
   model one step at a time so the view can animate it. */
