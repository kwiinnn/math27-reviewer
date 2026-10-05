/**
 * Shape cleanup for the scratchpad, as in note-taking apps: hold the pen still
 * at the end of a stroke and a rough line, triangle, rectangle or loop is
 * replaced by a clean one. Points are flat [x0, y0, x1, y1, ...] arrays.
 */

type Pt = [number, number];

const pairs = (p: number[]): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < p.length; i += 2) out.push([p[i], p[i + 1]]);
  return out;
};
const flat = (pts: Pt[]) => pts.flatMap(([x, y]) => [x, y]);
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Distance from p to the segment ab. */
function segDist(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return dist(p, [a[0] + t * dx, a[1] + t * dy]);
}

/** Ramer-Douglas-Peucker simplification of an open polyline. */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts;
  let worst = 0;
  let at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = segDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > worst) [worst, at] = [d, i];
  }
  if (worst <= eps) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, at + 1), eps).slice(0, -1), ...simplify(pts.slice(at), eps)];
}

/** Snap the end of a line to horizontal, vertical or 45 degrees when it is within a few degrees. */
export function snapLine(x0: number, y0: number, x1: number, y1: number): number[] {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const step = Math.PI / 4;
  const nearest = Math.round(angle / step) * step;
  const a = Math.abs(angle - nearest) < (6 * Math.PI) / 180 ? nearest : angle;
  return [x0, y0, x0 + len * Math.cos(a), y0 + len * Math.sin(a)];
}

export type ShapeKind = 'line' | 'triangle' | 'rectangle' | 'polygon' | 'ellipse';

/**
 * The clean shape a held stroke stands for, or null to leave it as drawn.
 * An open stroke becomes a line only if it is already roughly straight.
 */
export function recognise(points: number[]): { kind: ShapeKind; points: number[] } | null {
  const pts = pairs(points);
  if (pts.length < 4) return null;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = maxX - minX;
  const h = maxY - minY;
  const size = Math.max(w, h);
  if (size < 16) return null; // a dot or a tiny tick: leave it alone

  let length = 0;
  for (let i = 1; i < pts.length; i++) length += dist(pts[i - 1], pts[i]);
  const first = pts[0];
  const last = pts[pts.length - 1];
  const gap = dist(first, last);

  // Open stroke: straighten it if no point strays far from the chord.
  if (gap > 0.25 * size || length < 2.2 * gap) {
    const stray = Math.max(...pts.map((p) => segDist(p, first, last)));
    if (stray > 0.18 * Math.max(gap, 1)) return null;
    return { kind: 'line', points: snapLine(first[0], first[1], last[0], last[1]) };
  }

  // Closed loop: count its corners.
  const corners = simplify(pts, 0.1 * Math.hypot(w, h));
  if (dist(corners[0], corners[corners.length - 1]) < 0.25 * size) corners.pop();
  if (corners.length === 3) return { kind: 'triangle', points: flat([...corners, corners[0]]) };
  if (corners.length === 4) {
    // Nearly axis-aligned sides: a true rectangle on the bounding box.
    const level = corners.every((c, i) => {
      const d = corners[(i + 1) % 4];
      const ang = Math.abs(Math.atan2(d[1] - c[1], d[0] - c[0])) % (Math.PI / 2);
      return Math.min(ang, Math.PI / 2 - ang) < (12 * Math.PI) / 180;
    });
    if (level) return { kind: 'rectangle', points: [minX, minY, maxX, minY, maxX, maxY, minX, maxY, minX, minY] };
    return { kind: 'polygon', points: flat([...corners, corners[0]]) };
  }
  // Anything rounder: the ellipse in its bounding box.
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const ellipse: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * 2 * Math.PI;
    ellipse.push(cx + (w / 2) * Math.cos(t), cy + (h / 2) * Math.sin(t));
  }
  return { kind: 'ellipse', points: ellipse };
}
