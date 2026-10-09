import type { PlotFigure, PlotItem, Tick, Tone, Vec } from '../types/figure';

/**
 * Pseudo-3D pieces for solids of revolution drawn on a flat plot.
 *
 * A disk perpendicular to the axis of rotation is seen almost edge-on, so it
 * is drawn as an ellipse whose short axis is TILT times its radius.
 */
const TILT = 0.3;

const sample = (n: number, a: number, b: number, p: (t: number) => Vec): Vec[] =>
  Array.from({ length: n + 1 }, (_, i) => p(a + ((b - a) * i) / n));

/**
 * A disk (r = 0) or washer at position `at` along the axis of rotation.
 * `axis` is 'x' for a horizontal axis y = c (the slab sits at x = at) and
 * 'y' for a vertical axis x = c (the slab sits at y = at). `ratio` is how many
 * x units match one y unit on screen (1 on an `equal` plot).
 */
export function slab(axis: 'x' | 'y', at: number, c: number, R: number, r = 0, tone: Tone = 2, ratio = 1): PlotItem[] {
  const ellipse = (rad: number) => (t: number): Vec =>
    axis === 'x'
      ? [at + TILT * rad * ratio * Math.cos(t), c + rad * Math.sin(t)]
      : [c + rad * Math.cos(t), at + (TILT * rad * Math.sin(t)) / ratio];
  const outer = sample(64, 0, 2 * Math.PI, ellipse(R));
  // The inner ellipse runs the other way, so the fill leaves a hole.
  const inner = r > 0 ? sample(64, 2 * Math.PI, 0, ellipse(r)) : [];
  const rim = (rad: number): PlotItem => {
    const e = ellipse(rad);
    return { type: 'curve', x: (t) => e(t)[0], y: (t) => e(t)[1], t: [0, 2 * Math.PI], tone, width: 1.5 };
  };
  return [{ type: 'polygon', points: [...outer, ...inner], tone }, rim(R), ...(r > 0 ? [rim(r)] : [])];
}

/** The region between x = left(y) and x = right(y) for y from c to d, as polygon points. */
export function betweenY(left: (y: number) => number, right: (y: number) => number, c: number, d: number, n = 120): Vec[] {
  return [...sample(n, c, d, (y) => [right(y), y]), ...sample(n, d, c, (y) => [left(y), y])];
}

export interface SolidSpec {
  caption: string;
  x: Vec;
  y: Vec;
  xTicks?: Tick[];
  yTicks?: Tick[];
  /** Width over height; omit for an `equal` plot. */
  aspect?: number;
  /** 'x' turns the region about the horizontal line y = c, 'y' about the vertical line x = c. */
  axis: 'x' | 'y';
  c: number;
  /** The interval along the axis of rotation. */
  from: number;
  to: number;
  /** The boundary farther from the axis (gives R), as a function of the variable along the axis. */
  far: (s: number) => number;
  /** The boundary nearer the axis (gives r); omit when the region touches the axis, for a disk. */
  near?: (s: number) => number;
  /** Labelled boundary curves and lines, drawn over the region. */
  boundary: PlotItem[];
  initial: number;
  readout: (s: number) => string;
}

/**
 * A region, the silhouette of the solid it sweeps out, and a disk or washer
 * that slides along the axis with its radii marked.
 */
export function solid(sp: SolidSpec): PlotFigure {
  const { axis, c, from, to, far, near } = sp;
  const ratio = sp.aspect ? (sp.x[1] - sp.x[0]) / (sp.y[1] - sp.y[0]) / sp.aspect : 1;
  const R = (s: number) => Math.abs(far(s) - c);
  const r = (s: number) => (near ? Math.abs(near(s) - c) : 0);
  const mirror = (g: (s: number) => number): PlotItem =>
    axis === 'x'
      ? { type: 'fn', f: (s) => 2 * c - g(s), from, to, tone: 'muted', dashed: true, width: 1.5 }
      : { type: 'curve', x: (s) => 2 * c - g(s), y: (s) => s, t: [from, to], tone: 'muted', dashed: true, width: 1.5 };
  const shape: PlotItem[] =
    axis === 'x'
      ? [
          { type: 'area', f: (s) => c + R(s), g: (s) => c - R(s), from, to },
          { type: 'area', f: far, g: near ?? (() => c), from, to },
        ]
      : [
          { type: 'polygon', points: betweenY((s) => c - R(s), (s) => c + R(s), from, to) },
          { type: 'polygon', points: betweenY(near ?? (() => c), far, from, to) },
        ];
  const axisLine: PlotItem =
    axis === 'x'
      ? { type: 'segment', from: [sp.x[0], c], to: [sp.x[1], c], tone: 'ink', dashed: true, width: 1.25 }
      : { type: 'segment', from: [c, sp.y[0]], to: [c, sp.y[1]], tone: 'ink', dashed: true, width: 1.25 };
  return {
    kind: 'plot',
    caption: sp.caption,
    x: sp.x,
    y: sp.y,
    xTicks: sp.xTicks,
    yTicks: sp.yTicks,
    ...(sp.aspect ? { aspect: sp.aspect } : { equal: true }),
    items: [...shape, mirror(far), ...(near ? [mirror(near)] : []), axisLine, ...sp.boundary],
    animate: {
      param: axis,
      range: [from, to],
      initial: sp.initial,
      duration: 7,
      frame: (s) => {
        const pt = (v: number): Vec => (axis === 'x' ? [s, v] : [v, s]);
        const nearV = near ? near(s) : c;
        const radius = (to: number, tone: Tone, width: number, label: string, mid: number): PlotItem => ({
          type: 'segment', from: pt(c), to: pt(to), tone, width, label, labelAt: pt(mid), anchor: axis === 'x' ? 'w' : 'n',
        });
        return [
          ...slab(axis, s, c, R(s), r(s), 2, ratio),
          radius(far(s), 2, 2.5, 'R', (far(s) + nearV) / 2),
          ...(near ? [radius(nearV, 'ink', 3, 'r', (c + nearV) / 2)] : []),
        ];
      },
      readout: sp.readout,
    },
  };
}
