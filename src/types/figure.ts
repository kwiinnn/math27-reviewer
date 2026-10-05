/**
 * Figure data model: the visuals attached to notes, examples, problems and steps.
 *
 * String conventions follow curriculum.ts:
 *  - `label`, `latex`, `text` on plot items and sides of triangles are LaTeX
 *    rendered inline (no dollar signs).
 *  - `caption`, `title`, `readout`, and the cells of flows and sequences are
 *    prose with inline math in single dollar signs.
 */

/** Series colour: 1-3 are the chart hues; 'ink' and 'muted' are greys. */
export type Tone = 1 | 2 | 3 | 'ink' | 'muted';
export type Vec = [number, number];
/** Where a label sits relative to its point, as a compass direction. */
export type Anchor = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'c';
/** A tick at a value, optionally with a LaTeX label such as "\\frac{\\pi}{2}". */
export type Tick = number | [number, string];

interface Stroke {
  tone?: Tone;
  dashed?: boolean;
  /** Line width in px (default 2). */
  width?: number;
}

interface Labelled {
  label?: string;
  /** Where the label goes, in plot coordinates. */
  labelAt?: Vec;
  anchor?: Anchor;
}

export type PlotItem =
  /** The graph of y = f(x). Labelled graphs also appear in the hover readout. */
  | ({ type: 'fn'; f: (x: number) => number; from?: number; to?: number } & Stroke & Labelled)
  /** A parametric curve (x(t), y(t)). */
  | ({ type: 'curve'; x: (t: number) => number; y: (t: number) => number; t: Vec } & Stroke & Labelled)
  /** The region between f and g (default the x-axis) for x from `from` to `to`. */
  | { type: 'area'; f: (x: number) => number; g?: (x: number) => number; from: number; to: number; tone?: Tone }
  | { type: 'polygon'; points: Vec[]; tone?: Tone; outline?: boolean }
  | ({ type: 'segment'; from: Vec; to: Vec; arrow?: boolean } & Stroke & Labelled)
  | ({ type: 'vline'; x: number } & Stroke & Labelled)
  | ({ type: 'hline'; y: number } & Stroke & Labelled)
  | { type: 'point'; at: Vec; tone?: Tone; hollow?: boolean; label?: string; anchor?: Anchor }
  | { type: 'label'; at: Vec; text: string; anchor?: Anchor; tone?: Tone }
  /** An angle at `at` between the rays towards `a` and `b`; `right` draws the square mark. */
  | { type: 'angle'; at: Vec; a: Vec; b: Vec; label?: string; right?: boolean; radius?: number; tone?: Tone };

export interface PlotAnimation {
  /** LaTeX name of the moving parameter, shown on the slider. */
  param: string;
  range: Vec;
  /** Value shown before playback starts (default: start of the range). */
  initial?: number;
  /** Snap to multiples of this, e.g. 1 for a whole-number n. */
  step?: number;
  /** Seconds for one sweep across the range (default 6). */
  duration?: number;
  /** Extra items drawn for the current parameter value. */
  frame: (t: number) => PlotItem[];
  /** One line under the plot describing the current state. */
  readout?: (t: number) => string;
}

export interface PlotFigure {
  kind: 'plot';
  title?: string;
  caption?: string;
  x: Vec;
  y: Vec;
  /** Defaults to evenly spaced whole numbers; [] for none. */
  xTicks?: Tick[];
  yTicks?: Tick[];
  /** Draw axes, ticks and grid (default true). Off for geometry diagrams. */
  axes?: boolean;
  /** One unit is the same length on both axes. */
  equal?: boolean;
  /** Width over height when not `equal` (default 1.5). */
  aspect?: number;
  items: PlotItem[];
  animate?: PlotAnimation;
}

/** A right triangle: angle at the bottom left, right angle at the bottom right. */
export interface TriangleFigure {
  kind: 'triangle';
  title?: string;
  caption?: string;
  opposite: string;
  adjacent: string;
  hypotenuse: string;
  /** LaTeX for the marked angle (default \theta). */
  angle?: string;
  /** The side to draw in the accent colour, usually the one holding the radical. */
  highlight?: 'opposite' | 'adjacent' | 'hypotenuse';
}

/** Several small figures side by side. */
export interface GroupFigure {
  kind: 'group';
  caption?: string;
  figures: (PlotFigure | TriangleFigure)[];
}

/** A procedure read left to right. */
export interface SequenceFigure {
  kind: 'sequence';
  caption?: string;
  steps: { label?: string; latex?: string; text?: string }[];
}

/** "If you see this, do that" rows. */
export interface FlowFigure {
  kind: 'flow';
  caption?: string;
  head?: [string, string];
  rows: { when: string; then: string }[];
}

/** The tabular (DI) method for repeated integration by parts. */
export interface TabularFigure {
  kind: 'tabular';
  caption?: string;
  /** Successive derivatives of u (LaTeX), ending in 0 when it terminates. */
  d: string[];
  /** Successive antiderivatives of dv (LaTeX). */
  i: string[];
  /** The assembled answer (LaTeX). */
  result?: string;
}

export type Figure = PlotFigure | TriangleFigure | GroupFigure | SequenceFigure | FlowFigure | TabularFigure;
