/**
 * Incremental force layout.
 *
 * The previous version ran 400 spring iterations plus 160 separation passes
 * inside a useMemo, which meant every change to the node set - dragging the
 * link-strength slider, switching an investigation path - blocked the main
 * thread and then teleported every node to a new position. This runs the same
 * model one step at a time so the caller can drive it from rAF: nodes glide
 * to their new places and the UI stays responsive while they do.
 *
 * The model itself is deliberately unchanged in character. 72 people is a
 * small graph - 2.5k pairs per tick - so plain O(n^2) repulsion is cheaper
 * than a quadtree and far cheaper than a dependency.
 */

/**
 * Minimum spacing, as an ellipse: labels are wider than they are tall, so
 * nodes need more horizontal room than vertical.
 *
 * These used to be 150x36, sized so that every one of the 67 labels could be
 * drawn at once without overlapping. At this canvas width that forces the
 * nodes into horizontal rows - a text grid, not a network, and the shape of
 * the graph stopped carrying any information. The view now draws labels
 * adaptively instead, so spacing only has to keep the dots and the labels it
 * actually shows apart.
 */
const SEP_X = 86;
const SEP_Y = 46;

/**
 * Margin kept clear for labels.
 *
 * A label is the same number of pixels wide whatever the canvas is, but a
 * fixed 62px margin would eat most of a phone-width canvas, so it scales down
 * and the view's pan and zoom make up the difference.
 */
const padFor = (w, h) => Math.min(62, Math.max(22, Math.min(w, h) * 0.085));

/** Deterministic jitter, so a reload produces the same picture. */
function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export class ForceLayout {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.nodes = new Map();
    this.links = [];
    this.alpha = 0;
    this.alphaMin = 0.012;
    this.alphaDecay = 0.03;
    this.velocityDecay = 0.62;
  }

  resize(width, height) {
    if (width === this.w && height === this.h) return;
    // Scale existing positions so a resize nudges the layout rather than
    // restarting it.
    const sx = width / this.w;
    const sy = height / this.h;
    for (const n of this.nodes.values()) {
      n.x *= sx;
      n.y *= sy;
    }
    this.w = width;
    this.h = height;
    this.reheat(0.35);
  }

  /**
   * Replace the graph, keeping positions for nodes that survive.
   *
   * New nodes are seeded next to whichever of their neighbours are already
   * placed, so adding a node does not throw the rest of the picture into
   * disarray - it arrives where it belongs and the neighbourhood relaxes.
   */
  setGraph(ids, links) {
    const wanted = new Set(ids);
    for (const id of [...this.nodes.keys()]) {
      if (!wanted.has(id)) this.nodes.delete(id);
    }

    this.links = links.filter(
      (l) => wanted.has(l.source) && wanted.has(l.target)
    );

    const neighbours = new Map();
    for (const id of wanted) neighbours.set(id, []);
    for (const l of this.links) {
      neighbours.get(l.source).push(l.target);
      neighbours.get(l.target).push(l.source);
    }

    const fresh = [...wanted].filter((id) => !this.nodes.has(id));
    const n = Math.max(wanted.size, 1);

    fresh.forEach((id, i) => {
      const placed = (neighbours.get(id) ?? []).filter((m) =>
        this.nodes.has(m)
      );
      const jitter = hash01(id) * Math.PI * 2;

      if (placed.length) {
        let cx = 0;
        let cy = 0;
        for (const m of placed) {
          cx += this.nodes.get(m).x;
          cy += this.nodes.get(m).y;
        }
        cx /= placed.length;
        cy /= placed.length;
        this.nodes.set(id, {
          x: cx + Math.cos(jitter) * 70,
          y: cy + Math.sin(jitter) * 70,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        });
      } else {
        const angle = ((i / Math.max(fresh.length, 1)) * Math.PI * 2 + jitter) % (Math.PI * 2);
        const r = Math.min(this.w, this.h) * 0.34;
        this.nodes.set(id, {
          x: this.w / 2 + Math.cos(angle) * r,
          y: this.h / 2 + Math.sin(angle) * r,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        });
      }
    });

    this.k = Math.sqrt((this.w * this.h) / n) * 0.9;
    this.reheat(fresh.length ? 1 : 0.45);
  }

  reheat(to = 1) {
    this.alpha = Math.max(this.alpha, to);
  }

  get settled() {
    return this.alpha <= this.alphaMin;
  }

  /** Hold a node under the cursor. */
  pin(id, x, y) {
    const n = this.nodes.get(id);
    if (!n) return;
    n.fx = x;
    n.fy = y;
    n.x = x;
    n.y = y;
    this.reheat(0.3);
  }

  release(id) {
    const n = this.nodes.get(id);
    if (!n) return;
    n.fx = null;
    n.fy = null;
    this.reheat(0.2);
  }

  /** Run a fixed number of steps synchronously. */
  warm(steps = 70) {
    for (let i = 0; i < steps; i++) this.tick();
  }

  /**
   * Run to convergence off-screen.
   *
   * The first paint should show a settled network, not one still unfolding:
   * at 67 nodes this is a few tens of milliseconds, far less than the four
   * seconds it takes to watch. Animation is for *changes* - switching a path,
   * moving the slider - where seeing what moved is the point.
   */
  settle(cap = 500) {
    let i = 0;
    while (!this.settled && i++ < cap) this.tick();
    return i;
  }

  tick() {
    if (this.settled) return false;

    const list = [...this.nodes.values()];
    const n = list.length;
    if (!n) {
      this.alpha = 0;
      return false;
    }
    const k = this.k ?? Math.sqrt((this.w * this.h) / n) * 0.9;
    const pad = padFor(this.w, this.h);

    // repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = list[i];
        const b = list[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Coincident nodes have no direction to separate along; nudge them
          // apart deterministically rather than randomly.
          dx = (i % 3) - 1 + 0.3;
          dy = (j % 3) - 1 + 0.3;
          d2 = 1;
        }
        const d = Math.sqrt(d2);
        // Fruchterman-Reingold repulsion, k^2/d. The previous version used
        // k^2/d^2, which falls off so much faster than the d^2/k attraction
        // that a connected pair sat about fifteen times over-attracted at
        // typical spacing. The graph only looked spread out because the hard
        // separation pass below was prising it back apart - the force model
        // was contributing almost nothing. With both terms in their proper
        // form a linked pair settles at d = k, which is the spacing we want.
        const f = (k * k) / d;
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
    }

    // attraction along links
    for (const l of this.links) {
      const a = this.nodes.get(l.source);
      const b = this.nodes.get(l.target);
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      // A heavily shared pair is pulled tighter than a single co-mention, so
      // clusters read as clusters - but only within a factor of two, or hubs
      // swallow their neighbourhoods.
      const strength = Math.min(l.weight, 12) / 12;
      const f = ((d * d) / k) * (0.7 + 0.6 * strength);
      a.vx -= (dx / d) * f;
      a.vy -= (dy / d) * f;
      b.vx += (dx / d) * f;
      b.vy += (dy / d) * f;
    }

    // gravity + integrate
    const max = 26 * this.alpha + 1.5;
    for (const p of list) {
      if (p.fx != null) {
        p.x = p.fx;
        p.y = p.fy;
        p.vx = 0;
        p.vy = 0;
        continue;
      }
      p.vx += (this.w / 2 - p.x) * 0.006;
      p.vy += (this.h / 2 - p.y) * 0.006;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
      const scale = Math.min(speed, max) / speed;
      p.x += p.vx * scale;
      p.y += p.vy * scale;
      p.vx *= this.velocityDecay;
      p.vy *= this.velocityDecay;
      p.x = Math.max(pad, Math.min(this.w - pad, p.x));
      p.y = Math.max(pad, Math.min(this.h - pad, p.y));
    }

    // Hard separation. The force model alone leaves nodes close enough that
    // their labels collide, which is what actually makes a graph unreadable.
    // This is a constraint rather than a force, so it is not scaled by alpha -
    // two passes per tick converge quickly and keep converging under drag.
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = list[i];
          const b = list[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const nx = dx / SEP_X;
          const ny = dy / SEP_Y;
          const dist = Math.sqrt(nx * nx + ny * ny);
          if (dist >= 1 || dist === 0) continue;
          const push = ((1 - dist) / 2) * 0.6;
          const ux = (nx / dist) * SEP_X * push;
          const uy = (ny / dist) * SEP_Y * push;
          if (a.fx == null) {
            a.x -= ux;
            a.y -= uy;
          }
          if (b.fx == null) {
            b.x += ux;
            b.y += uy;
          }
        }
      }
      for (const p of list) {
        if (p.fx != null) continue;
        p.x = Math.max(pad, Math.min(this.w - pad, p.x));
        p.y = Math.max(pad, Math.min(this.h - pad, p.y));
      }
    }

    this.alpha += (0 - this.alpha) * this.alphaDecay;
    if (this.alpha <= this.alphaMin) this.alpha = this.alphaMin;
    return true;
  }

  /** Plain {id: {x, y}} snapshot for rendering. */
  positions() {
    const out = {};
    for (const [id, p] of this.nodes) out[id] = { x: p.x, y: p.y };
    return out;
  }

  /** Bounding box of the placed nodes, for zoom-to-fit. */
  bounds() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of this.nodes.values()) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    if (!Number.isFinite(minX)) return null;
    return { minX, minY, maxX, maxY };
  }
}
