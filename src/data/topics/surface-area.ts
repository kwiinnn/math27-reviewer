import type { Topic } from '../../types/curriculum';
import type { Anchor, PlotFigure, PlotItem, Tick, Tone, Vec } from '../../types/figure';
import { fmt } from '../../lib/plot';
import { betweenY } from '../../lib/solids';

/** A circle around the axis of rotation seen nearly edge-on, as in the volume figures. */
const TILT = 0.3;

/**
 * The circle swept by a point at distance R from the axis, at position `at`
 * along it. `ratio` is how many x units match one y unit on screen.
 */
function ring(axis: 'x' | 'y', at: number, c: number, R: number, ratio: number, tone: Tone = 2, width = 2): PlotItem {
  return axis === 'x'
    ? { type: 'curve', x: (t) => at + TILT * R * ratio * Math.cos(t), y: (t) => c + R * Math.sin(t), t: [0, 2 * Math.PI], tone, width }
    : { type: 'curve', x: (t) => c + R * Math.cos(t), y: (t) => at + (TILT * R * Math.sin(t)) / ratio, t: [0, 2 * Math.PI], tone, width };
}

interface SurfaceSpec {
  caption: string;
  x: Vec;
  y: Vec;
  xTicks?: Tick[];
  yTicks?: Tick[];
  /** Width over height; omit for an `equal` plot. */
  aspect?: number;
  /** 'x' revolves about the horizontal line y = c, 'y' about the vertical line x = c. */
  axis: 'x' | 'y';
  c: number;
  from: number;
  to: number;
  /** The curve: y = f(x) for a horizontal axis, x = f(y) for a vertical one. */
  f: (s: number) => number;
  label: string;
  labelAt: Vec;
  anchor: Anchor;
  initial: number;
  readout: (s: number) => string;
  /** Extra items, such as labelled endpoints. */
  extra?: PlotItem[];
}

/**
 * The curve, the silhouette of the surface it sweeps out, and a short arc of
 * the curve sliding along it together with the circle that arc traces.
 */
function surface(sp: SurfaceSpec): PlotFigure {
  const { axis, c, from, to, f } = sp;
  const R = (s: number) => Math.abs(f(s) - c);
  const ratio = sp.aspect ? (sp.x[1] - sp.x[0]) / (sp.y[1] - sp.y[0]) / sp.aspect : 1;
  const pt = (s: number, v: number): Vec => (axis === 'x' ? [s, v] : [v, s]);
  type Label = { label?: string; labelAt?: Vec; anchor?: Anchor };
  const piece = (a: number, b: number, tone: Tone, width: number, label: Label = {}): PlotItem =>
    axis === 'x'
      ? { type: 'fn', f, from: a, to: b, tone, width, ...label }
      : { type: 'curve', x: f, y: (t) => t, t: [a, b], tone, width, ...label };
  const half = 0.05 * (to - from);
  return {
    kind: 'plot',
    caption: sp.caption,
    x: sp.x,
    y: sp.y,
    xTicks: sp.xTicks,
    yTicks: sp.yTicks,
    ...(sp.aspect ? { aspect: sp.aspect } : { equal: true }),
    items: [
      axis === 'x'
        ? { type: 'area', f: (s) => c + R(s), g: (s) => c - R(s), from, to }
        : { type: 'polygon', points: betweenY((s) => c - R(s), (s) => c + R(s), from, to) },
      axis === 'x'
        ? { type: 'fn', f: (s) => 2 * c - f(s), from, to, tone: 'muted', dashed: true, width: 1.5 }
        : { type: 'curve', x: (s) => 2 * c - f(s), y: (s) => s, t: [from, to], tone: 'muted', dashed: true, width: 1.5 },
      ring(axis, from, c, R(from), ratio, 'muted', 1.25),
      ring(axis, to, c, R(to), ratio, 'muted', 1.25),
      axis === 'x'
        ? { type: 'segment', from: [sp.x[0], c], to: [sp.x[1], c], tone: 'ink', dashed: true, width: 1.25 }
        : { type: 'segment', from: [c, sp.y[0]], to: [c, sp.y[1]], tone: 'ink', dashed: true, width: 1.25 },
      piece(from, to, 1, 2.5, { label: sp.label, labelAt: sp.labelAt, anchor: sp.anchor }),
      ...(sp.extra ?? []),
    ],
    animate: {
      param: axis,
      range: [from + half, to - half],
      initial: sp.initial,
      duration: 7,
      frame: (s) => [
        ring(axis, s, c, R(s), ratio),
        {
          type: 'segment', from: pt(s, c), to: pt(s, f(s)), tone: 'ink', width: 1.5,
          // Too short to carry a label near the tip of a cone or the ends of a sphere.
          ...(R(s) > 0.2 ? { label: 'r', labelAt: pt(s, (c + f(s)) / 2), anchor: axis === 'x' ? ('w' as const) : ('n' as const) } : {}),
        },
        piece(s - half, s + half, 2, 5),
        { type: 'label', at: pt(s, f(s)), text: '\\Delta s', anchor: axis === 'x' ? 'n' : 'e', tone: 2 },
      ],
      readout: sp.readout,
    },
  };
}

interface RevolveSpec {
  title?: string;
  caption?: string;
  x: Vec;
  y: Vec;
  xTicks?: Tick[];
  yTicks?: Tick[];
  axes?: boolean;
  /** Width over height; omit for an `equal` plot. */
  aspect?: number;
  /** 'x' revolves about the horizontal line y = c, 'y' about the vertical line x = c. */
  axis: 'x' | 'y';
  c: number;
  from: number;
  to: number;
  /** The curve: y = f(x) for a horizontal axis, x = f(y) for a vertical one. */
  f: (s: number) => number;
  label?: string;
  labelAt?: Vec;
  anchor?: Anchor;
  extra?: PlotItem[];
  initial?: number;
  /** A one-line readout, for small figures in a group. */
  brief?: boolean;
}

/**
 * The curve swinging about the axis as θ goes from 0° to 360°, leaving a
 * wireframe of the surface behind: copies of the curve every 30° and the
 * circles traced by a few of its points. Uses the same tilted view as `ring`,
 * so the curve at θ = 180° is its mirror image across the axis.
 */
function revolve(sp: RevolveSpec): PlotFigure {
  const { axis, c, from, to, f } = sp;
  const R = (s: number) => Math.abs(f(s) - c);
  const ratio = sp.aspect ? (sp.x[1] - sp.x[0]) / (sp.y[1] - sp.y[0]) / sp.aspect : 1;
  const at = (s: number, phi: number): Vec =>
    axis === 'x'
      ? [s - TILT * R(s) * ratio * Math.sin(phi), c + R(s) * Math.cos(phi)]
      : [c + R(s) * Math.cos(phi), s + (TILT * R(s) * Math.sin(phi)) / ratio];
  const meridian = (phi: number, tone: Tone, width: number): PlotItem => ({
    type: 'curve', x: (s) => at(s, phi)[0], y: (s) => at(s, phi)[1], t: [from, to], tone, width,
  });
  const parallel = (s: number, phi: number, width: number): PlotItem => ({
    type: 'curve', x: (p) => at(s, p)[0], y: (p) => at(s, p)[1], t: [0, phi], tone: 1, width,
  });
  const rings = Array.from({ length: 7 }, (_, i) => from + ((to - from) * i) / 6);
  return {
    kind: 'plot',
    title: sp.title,
    caption: sp.caption,
    x: sp.x,
    y: sp.y,
    xTicks: sp.xTicks,
    yTicks: sp.yTicks,
    axes: sp.axes,
    ...(sp.aspect ? { aspect: sp.aspect } : { equal: true }),
    items: [
      axis === 'x'
        ? { type: 'segment', from: [sp.x[0], c], to: [sp.x[1], c], tone: 'ink', dashed: true, width: 1.25 }
        : { type: 'segment', from: [c, sp.y[0]], to: [c, sp.y[1]], tone: 'ink', dashed: true, width: 1.25 },
      { ...meridian(0, 1, 2.5), ...(sp.label ? { label: sp.label, labelAt: sp.labelAt, anchor: sp.anchor } : {}) },
      ...(sp.extra ?? []),
    ],
    animate: {
      param: '\\theta',
      range: [0, 360],
      initial: sp.initial ?? 150,
      step: 1,
      duration: 6,
      frame: (deg) => {
        const phi = (deg * Math.PI) / 180;
        if (phi < 0.01) return [];
        const copies = Array.from({ length: Math.floor(deg / 30) }, (_, k) => meridian(((k + 1) * Math.PI) / 6, 'muted', 1));
        return [
          ...copies,
          ...rings.map((s, i) => parallel(s, phi, i === 0 || i === rings.length - 1 ? 1.75 : 1)),
          meridian(phi, 2, 2.5),
        ];
      },
      readout: (deg) =>
        deg >= 359.5
          ? sp.brief ? 'Full turn: the whole surface.' : '$\\theta = 360^\\circ$: one full turn sweeps out the whole surface.'
          : sp.brief ? `${fmt((deg / 360) * 100, 0)}% of a turn.` : `$\\theta = ${fmt(deg, 0)}^\\circ$: the orange curve is the original rotated by $\\theta$; the grey copies and blue circles show the surface swept so far.`,
    },
  };
}

/** Unit 3.7 — Area of a surface of revolution. Source: lecture deck 3.7 (examples solved here). */
export const surfaceArea: Topic = {
  id: 'surface-area',
  title: 'Area of a Surface of Revolution',
  slug: 'surface-area',
  unitNumber: '3.7',
  summary:
    "Revolving a curve about an axis sweeps out a surface. A short piece of the curve, of length $ds$ at distance $r$ from the axis, traces a thin band of area about $2\\pi r\\,ds$: circumference times width. Adding the bands gives $S = \\int 2\\pi r\\,ds$, which about the $x$-axis is $\\int_a^b 2\\pi f(x)\\sqrt{1 + [f'(x)]^2}\\,dx$. It combines the radius from the disk method with the $ds$ from arc length.",

  examNotes: [
    {
      title: 'Surfaces of revolution',
      concept:
        "A surface of revolution is generated by revolving a plane curve about an axis in the same plane. Only the curve moves, not a region, so the result is a hollow shell with no inside volume. Its surface area is the total area of that shell, the way the surface area of a cube is the sum of its six faces, $6s^2$.",
      conditions: "Compare with Units 3.2.1 and 3.2.2: revolving a region gives a solid; revolving a curve gives a surface. The same picture is used for both, but the integrals are different.",
      commonTraps: [
        "Using a disk or washer integral when the question asks for surface area.",
        "Including end caps or a base that the problem excludes. A cone's lateral area does not include its base.",
      ],
      tip: "Read the question for \"curve\" or \"arc\" (surface) versus \"region\" (solid).",
      figure: {
        kind: 'group',
        caption: 'The four surfaces from the lecture slide. Press play or drag $\\theta$: each curve swings about the $x$-axis (dashed) and leaves its surface behind. The orange curve is the original rotated by $\\theta$.',
        figures: [
          revolve({ title: 'Semicircle: sphere', x: [-1.35, 1.35], y: [-1.2, 1.2], axes: false, brief: true, axis: 'x', c: 0, from: -1, to: 1, f: (x) => Math.sqrt(Math.max(0, 1 - x * x)) }),
          revolve({ title: 'Horizontal segment: cylinder', x: [-1.35, 1.35], y: [-1.2, 1.2], axes: false, brief: true, axis: 'x', c: 0, from: -1, to: 1, f: () => 0.7 }),
          revolve({ title: 'Slanted segment: frustum', x: [-1.35, 1.35], y: [-1.2, 1.2], axes: false, brief: true, axis: 'x', c: 0, from: -1, to: 1, f: (x) => 0.5 + 0.25 * (x + 1) }),
          revolve({ title: 'A curve: an hourglass', x: [-1.35, 1.35], y: [-1.2, 1.2], axes: false, brief: true, axis: 'x', c: 0, from: -1, to: 1, f: (x) => 0.6 + 0.28 * (x + 0.3) ** 2 }),
        ],
      },
    },
    {
      title: 'Revolving about the x-axis',
      concept:
        "If $f$ is smooth and non-negative on $[a, b]$, the area of the surface generated by revolving $y = f(x)$, $a \\le x \\le b$, about the $x$-axis is",
      display: "S = \\int_a^b 2\\pi f(x)\\sqrt{1 + \\left[f'(x)\\right]^2}\\,dx",
      conditions: "Smooth means $f'$ is continuous. Read it as the surface of a cylinder, $2\\pi rh$, with a curved height: the radius is $f(x)$, the circumference is $2\\pi f(x)$, and the height of each band is the arc length element $ds = \\sqrt{1 + [f']^2}\\,dx$.",
      commonTraps: [
        "Using $dx$ instead of $ds$: $\\int 2\\pi f(x)\\,dx$ is too small whenever the curve is not flat.",
        "Forgetting the $2\\pi$, or writing $\\pi f^2$ as in the disk method.",
        "Not simplifying $f\\sqrt{1 + [f']^2}$ before integrating. Often it is easier as $\\sqrt{f^2 + (ff')^2}$.",
      ],
      tip: "Each band is a slice of a cone (a frustum) of slant height $\\Delta s$ and average radius $r$, with lateral area $2\\pi r\\,\\Delta s$. That is all the formula is.",
      figure: surface({
        caption: 'Revolving the curve $y = 1 + \\frac{x^2}{8}$ about the $x$-axis. The short orange arc, of length $\\Delta s$, sweeps out a thin band: the circle it traces has length $2\\pi r$, so the band has area about $2\\pi r\\,\\Delta s$.',
        x: [-0.6, 3.8],
        y: [-2.6, 2.6],
        xTicks: [1, 2, 3],
        yTicks: [-2, -1, 1, 2],
        axis: 'x',
        c: 0,
        from: 0,
        to: 3,
        f: (x) => 1 + (x * x) / 8,
        label: 'y = f(x)',
        labelAt: [-0.55, 2.5],
        anchor: 'se',
        initial: 1.6,
        readout: (x) => {
          const r = 1 + (x * x) / 8;
          return `At $x = ${fmt(x)}$: $r = f(x) = ${fmt(r)}$, so the band has area about $2\\pi r\\,\\Delta s = ${fmt(2 * Math.PI * r)}\\,\\Delta s$.`;
        },
      }),
    },
    {
      title: 'Revolving about the y-axis or another line',
      concept:
        "In every case $S = \\int 2\\pi r\\,ds$: $r$ is the distance from the axis to the curve, and $ds$ is the arc length element in whichever variable is convenient. For $x = g(y)$, $c \\le y \\le d$, about the $y$-axis:",
      display: "S = \\int_c^d 2\\pi g(y)\\sqrt{1 + \\left[g'(y)\\right]^2}\\,dy",
      table: {
        head: ['Axis', 'Radius $r$', '$ds$'],
        rows: [
          ['$x$-axis', '$f(x)$', '$\\sqrt{1 + [f\'(x)]^2}\\,dx$'],
          ['$y$-axis, curve $x = g(y)$', '$g(y)$', '$\\sqrt{1 + [g\'(y)]^2}\\,dy$'],
          ['$y$-axis, curve $y = f(x)$', '$x$', '$\\sqrt{1 + [f\'(x)]^2}\\,dx$'],
          ['$y = k$', '$|f(x) - k|$', '$\\sqrt{1 + [f\'(x)]^2}\\,dx$'],
        ],
      },
      conditions: "The radius and $ds$ must be in the same variable, and the limits must match that variable.",
      commonTraps: [
        "About the $y$-axis with $dx$, using $f(x)$ as the radius. The radius is the distance from the $y$-axis, which is $x$.",
        "Mixing a radius in $y$ with $ds$ in $x$.",
        "For an axis $y = k$, using $f(x)$ instead of $|f(x) - k|$.",
      ],
      tip: "Decide the radius from the picture first (distance to the axis), then choose whichever $ds$ gives the easier integral.",
      figure: surface({
        caption: 'One band of the lecture cone (Worked Example 2 shows the whole cone being swept out). This slider does not rotate the segment; it moves one band up the cone. The band is the lecture\'s circumference times arc length: the radius $r = 1 - y$ is measured horizontally from the $y$-axis, and $\\Delta s$ is the short piece of the segment.',
        x: [-1.5, 1.9],
        y: [-0.45, 1.35],
        xTicks: [-1, 1],
        yTicks: [1],
        axis: 'y',
        c: 0,
        from: 0,
        to: 1,
        f: (y) => 1 - y,
        label: 'x = 1 - y',
        labelAt: [1.1, 1.15],
        anchor: 'e',
        initial: 0.35,
        readout: (y) => `At $y = ${fmt(y)}$: $r = 1 - y = ${fmt(1 - y)}$, so this band has area about $2\\pi r\\,\\Delta s = ${fmt(2 * Math.PI * (1 - y))}\\,\\Delta s$.`,
        extra: [
          { type: 'point', at: [0, 1], tone: 'ink', label: 'A(0, 1)', anchor: 'nw' },
          { type: 'point', at: [1, 0], tone: 'ink', label: 'B(1, 0)', anchor: 'se' },
        ],
      }),
    },
    {
      title: 'Checking with familiar surfaces',
      concept:
        "Several textbook formulas are surfaces of revolution, and the integral reproduces them. They are quick checks on an answer.",
      table: {
        head: ['Curve revolved', 'Surface', 'Area'],
        rows: [
          ['Horizontal segment at height $r$, length $h$', 'Cylinder (side)', '$2\\pi rh$'],
          ['Slanted segment from the axis, slant length $\\ell$, far end at radius $r$', 'Cone (lateral)', '$\\pi r\\ell$'],
          ['Slanted segment, ends at radii $r_1$ and $r_2$, slant length $\\ell$', 'Frustum (lateral)', '$\\pi(r_1 + r_2)\\ell$'],
          ['Semicircle of radius $r$', 'Sphere', '$4\\pi r^2$'],
        ],
      },
      conditions: "For a sphere $f(x) = \\sqrt{r^2 - x^2}$, and $f\\sqrt{1 + [f']^2} = r$ exactly, so any band of the sphere between $x = a$ and $x = b$ has area $2\\pi r(b - a)$: it depends only on its width.",
      commonTraps: [
        "Comparing with a volume formula: $\\frac43\\pi r^3$ is the volume of a sphere, $4\\pi r^2$ its surface area.",
        "Forgetting that the lateral area of a cone uses the slant height $\\ell$, not the vertical height.",
      ],
      tip: "If the curve is a straight segment, the answer must match the frustum formula. Use that as a check whenever a problem revolves a line.",
    },
    {
      title: 'Making the integral manageable',
      concept:
        "Surface-area integrands are products, so they need more care than arc length. Three patterns cover most exam problems.",
      table: {
        head: ['Pattern', 'What happens', 'Example'],
        rows: [
          ['$f = \\sqrt{\\text{linear}}$', '$f\\sqrt{1 + [f\']^2} = \\sqrt{f^2 + (ff\')^2}$ is the root of a linear function', '$y = 2\\sqrt{x}$: $\\;2\\sqrt{x + 1}$'],
          ['$f = x^n$ or $f$ times a power', '$u = 1 + [f\']^2$ and the remaining factor is $du$', '$y = x^3$: $\\;u = 1 + 9x^4$'],
          ['$1 + [f\']^2$ a perfect square', 'The root disappears, leaving a polynomial or $\\cosh^2$', '$y = \\cosh x$: $\\;2\\pi\\cosh^2 x$'],
        ],
      },
      conditions: "In the second pattern, check that the extra factor (here $x^3$) is a constant times the derivative of $u$ (here $36x^3$).",
      commonTraps: [
        "Expanding $f\\sqrt{1 + [f']^2}$ into two square roots.",
        "Missing the constant factor in a $u$-substitution, such as $\\frac{1}{36}$.",
        "For $\\cosh^2 x$, forgetting the identity $\\cosh^2 x = \\frac{1 + \\cosh 2x}{2}$.",
      ],
      tip: "Before integrating, write the integrand as one expression under a single square root if you can. That usually reveals which pattern applies.",
    },
  ],

  keyFormulas: [
    {
      id: 'surface-x',
      name: 'Surface area about the x-axis',
      formulaLatex: "S = \\int_a^b 2\\pi f(x)\\sqrt{1 + \\left[f'(x)\\right]^2}\\,dx",
      whenToUse: "Revolving $y = f(x)$, $a \\le x \\le b$, about the $x$-axis.",
      restrictions: "$f$ smooth and non-negative on $[a, b]$.",
      example: "y = 2\\sqrt{x},\\; [1, 2]: \\quad S = 4\\pi\\int_1^2 \\sqrt{x + 1}\\,dx = \\frac{8\\pi}{3}\\left(3\\sqrt3 - 2\\sqrt2\\right)",
    },
    {
      id: 'surface-y',
      name: 'Surface area about the y-axis',
      formulaLatex: "S = \\int_c^d 2\\pi g(y)\\sqrt{1 + \\left[g'(y)\\right]^2}\\,dy",
      whenToUse: "Revolving $x = g(y)$, $c \\le y \\le d$, about the $y$-axis.",
      restrictions: "$g$ smooth and non-negative on $[c, d]$.",
      example: "x = 1 - y,\\; [0, 1]: \\quad S = 2\\sqrt2\\,\\pi\\int_0^1 (1 - y)\\,dy = \\sqrt2\\,\\pi",
    },
    {
      id: 'surface-general',
      name: 'General form',
      formulaLatex: "S = \\int 2\\pi r\\,ds, \\qquad ds = \\sqrt{1 + \\left(\\frac{dy}{dx}\\right)^2}dx = \\sqrt{1 + \\left(\\frac{dx}{dy}\\right)^2}dy",
      whenToUse: "Any axis: $r$ is the distance from the axis to the curve.",
      restrictions: "$r$, $ds$ and the limits in one variable.",
      example: "y = x^2 \\text{ about the } y\\text{-axis}: \\quad S = \\int 2\\pi x\\sqrt{1 + 4x^2}\\,dx",
    },
    {
      id: 'surface-frustum',
      name: 'Lateral area of a frustum and a cone',
      formulaLatex: "\\begin{gathered} \\text{frustum: } \\pi(r_1 + r_2)\\ell \\\\[1ex] \\text{cone: } \\pi r\\ell \\end{gathered}",
      whenToUse: "Checking the area swept by a straight segment.",
      restrictions: "$\\ell$ is the slant length of the segment.",
      example: "r = 1,\\; \\ell = \\sqrt2: \\quad \\pi(1)\\sqrt2 = \\sqrt2\\,\\pi",
    },
    {
      id: 'surface-sphere',
      name: 'Sphere and zones of a sphere',
      formulaLatex: "S_{\\text{sphere}} = 4\\pi r^2, \\qquad S_{\\text{zone of width } h} = 2\\pi rh",
      whenToUse: "Any band of a sphere between two parallel planes.",
      restrictions: "The planes must cut the sphere; $h$ is the distance between them.",
      example: "2\\pi\\int_{-r}^{r} r\\,dx = 4\\pi r^2",
    },
  ],

  workedExamples: [
    {
      id: 'surface-we-1',
      title: 'Revolving a root curve about the x-axis',
      prompt: "Find the area of the surface generated by revolving the curve $y = 2\\sqrt{x}$, $1 \\le x \\le 2$, about the $x$-axis.",
      problemLatex: "y = 2\\sqrt{x}, \\qquad 1 \\le x \\le 2",
      keyIdea: "Combine $f$ and the root into one square root before integrating: $2\\sqrt{x}\\sqrt{\\frac{x + 1}{x}} = 2\\sqrt{x + 1}$.",
      figure: revolve({
        caption: 'The surface of the lecture example. Press play or drag $\\theta$: the arc of $y = 2\\sqrt{x}$ from $(1, 2)$ to $(2, 2\\sqrt2)$ swings about the $x$-axis and sweeps out a band-shaped shell, open at both ends.',
        x: [0.3, 2.6],
        y: [-3.2, 3.2],
        aspect: 1.1,
        xTicks: [1, 2],
        yTicks: [-2, 2],
        axis: 'x',
        c: 0,
        from: 1,
        to: 2,
        f: (x) => 2 * Math.sqrt(x),
        label: 'y = 2\\sqrt{x}',
        labelAt: [0.35, 3.15],
        anchor: 'se',
        initial: 200,
      }),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate',
          mathLatex: "f'(x) = \\frac{1}{\\sqrt{x}}, \\qquad 1 + [f'(x)]^2 = 1 + \\frac{1}{x} = \\frac{x + 1}{x}",
          explanation: "$\\frac{d}{dx}\\left(2x^{1/2}\\right) = x^{-1/2}$.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Set up and simplify',
          mathLatex: "S = \\int_1^2 2\\pi\\cdot 2\\sqrt{x}\\sqrt{\\frac{x + 1}{x}}\\,dx = 4\\pi\\int_1^2 \\sqrt{x + 1}\\,dx",
          explanation: "The $\\sqrt{x}$ in the radius cancels the $\\sqrt{x}$ in the denominator of the arc length element.",
          ruleApplied: '$S = \\int_a^b 2\\pi f(x)\\sqrt{1 + [f\'(x)]^2}\\,dx$',
          pitfall: "Forgetting that the radius $f(x) = 2\\sqrt{x}$ carries a factor $2$.",
          figure: surface({
            caption: 'One band of the surface: circumference $2\\pi f(x)$ times the arc piece $\\Delta s$. Slide it along the curve; the readout gives the simplified integrand $4\\pi\\sqrt{x + 1}$.',
            x: [0.3, 2.6],
            y: [-3.2, 3.2],
            aspect: 1.1,
            xTicks: [1, 2],
            yTicks: [-2, 2],
            axis: 'x',
            c: 0,
            from: 1,
            to: 2,
            f: (x) => 2 * Math.sqrt(x),
            label: 'y = 2\\sqrt{x}',
            labelAt: [0.35, 3.15],
            anchor: 'se',
            initial: 1.5,
            readout: (x) => `At $x = ${fmt(x)}$: $r = 2\\sqrt{x} = ${fmt(2 * Math.sqrt(x))}$, and $2\\pi f\\sqrt{1 + [f']^2} = 4\\pi\\sqrt{x + 1} = ${fmt(4 * Math.PI * Math.sqrt(x + 1))}$.`,
          }),
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "4\\pi\\cdot\\frac23 (x + 1)^{3/2}\\Bigg|_1^2 = \\frac{8\\pi}{3}\\left(3\\sqrt3 - 2\\sqrt2\\right) \\approx 19.8",
          explanation: "$3^{3/2} = 3\\sqrt3$ and $2^{3/2} = 2\\sqrt2$. Check: the surface lies between the cylinders of radius $2$ and $2\\sqrt2$ of length $1$, areas $4\\pi \\approx 12.6$ and $4\\sqrt2\\,\\pi \\approx 17.8$; the slanting adds a little more.",
          ruleApplied: 'Power rule',
        },
      ],
    },
    {
      id: 'surface-we-2',
      title: 'The lateral area of a cone',
      prompt: "The line segment $x = 1 - y$, $0 \\le y \\le 1$, is revolved about the $y$-axis to generate a cone. Find its lateral area (which excludes the base area).",
      problemLatex: "x = 1 - y, \\qquad 0 \\le y \\le 1; \\qquad \\text{axis } x = 0",
      keyIdea: "The curve is already $x = g(y)$, so use the $y$-axis formula. The answer can be checked against $\\pi r\\ell$.",
      figure: revolve({
        caption: 'Press play or drag $\\theta$: the segment from $A(0, 1)$ to $B(1, 0)$ swings about the $y$-axis (dashed), and its path is the lateral surface of the cone. At $360^\\circ$ the cone is complete.',
        x: [-1.45, 1.75],
        y: [-0.5, 1.35],
        xTicks: [-1, 1],
        yTicks: [1],
        axis: 'y',
        c: 0,
        from: 0,
        to: 1,
        f: (y) => 1 - y,
        label: 'x = 1 - y',
        labelAt: [0.5, 0.5],
        anchor: 'ne',
        initial: 200,
        extra: [
          { type: 'point', at: [0, 1], tone: 'ink', label: 'A(0, 1)', anchor: 'ne' },
          { type: 'point', at: [1, 0], tone: 'ink', label: 'B(1, 0)', anchor: 'se' },
        ],
      }),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate',
          mathLatex: "g(y) = 1 - y, \\qquad g'(y) = -1, \\qquad \\sqrt{1 + [g'(y)]^2} = \\sqrt2",
          explanation: "A straight segment has a constant arc length factor.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Set up',
          mathLatex: "S = \\int_0^1 2\\pi(1 - y)\\sqrt2\\,dy = 2\\sqrt2\\,\\pi\\int_0^1 (1 - y)\\,dy",
          explanation: "The radius at height $y$ is the distance $1 - y$ from the $y$-axis.",
          ruleApplied: '$S = \\int_c^d 2\\pi g(y)\\sqrt{1 + [g\'(y)]^2}\\,dy$',
        },
        {
          stepNumber: 3,
          title: 'Evaluate and check',
          mathLatex: "S = 2\\sqrt2\\,\\pi\\cdot\\frac12 = \\sqrt2\\,\\pi \\approx 4.44; \\qquad \\pi r\\ell = \\pi(1)\\left(\\sqrt2\\right) = \\sqrt2\\,\\pi",
          explanation: "The cone has base radius $1$ and slant height $\\sqrt{1^2 + 1^2} = \\sqrt2$. The base, area $\\pi$, is not included.",
          ruleApplied: 'Lateral area of a cone',
          pitfall: "Integrating $2\\pi(1 - y)\\,dy$ without the $\\sqrt2$, which gives $\\pi$.",
        },
      ],
    },
    {
      id: 'surface-we-3',
      title: 'The surface area of a sphere',
      prompt: "Use the surface-area formula to show that a sphere of radius $r$ has surface area $4\\pi r^2$.",
      problemLatex: "f(x) = \\sqrt{r^2 - x^2}, \\qquad -r \\le x \\le r",
      keyIdea: "Revolve the upper semicircle about the $x$-axis. The product $f\\sqrt{1 + [f']^2}$ collapses to the constant $r$.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate',
          mathLatex: "f'(x) = \\frac{-x}{\\sqrt{r^2 - x^2}}, \\qquad 1 + [f'(x)]^2 = 1 + \\frac{x^2}{r^2 - x^2} = \\frac{r^2}{r^2 - x^2}",
          explanation: "Chain rule on $\\left(r^2 - x^2\\right)^{1/2}$.",
          ruleApplied: 'Chain rule',
        },
        {
          stepNumber: 2,
          title: 'Simplify the integrand',
          mathLatex: "f(x)\\sqrt{1 + [f'(x)]^2} = \\sqrt{r^2 - x^2}\\cdot\\frac{r}{\\sqrt{r^2 - x^2}} = r",
          explanation: "The radius and the arc length factor cancel exactly.",
          ruleApplied: 'Algebra',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "S = \\int_{-r}^{r} 2\\pi r\\,dx = 2\\pi r(2r) = 4\\pi r^2",
          explanation: "The integrand is constant. At $x = \\pm r$ the derivative is infinite, but the simplified integrand is not, so the result stands. It also shows that a band of the sphere of width $h$ has area $2\\pi rh$, wherever it is.",
          ruleApplied: 'Surface area about the $x$-axis',
          figure: surface({
            caption: 'Bands of equal width on a sphere have equal area: near the poles the radius is small but the curve is steep, and the two effects cancel.',
            x: [-2.5, 2.5],
            y: [-2.3, 2.3],
            xTicks: [-2, 2],
            yTicks: [-2, 2],
            axis: 'x',
            c: 0,
            from: -2,
            to: 2,
            f: (x) => Math.sqrt(Math.max(0, 4 - x * x)),
            label: 'y = \\sqrt{r^2 - x^2}',
            labelAt: [-2.45, 2.25],
            anchor: 'se',
            initial: 0.8,
            readout: (x) => {
              const r = Math.sqrt(Math.max(0, 4 - x * x));
              return `Drawn with $r = 2$. At $x = ${fmt(x)}$: radius $${fmt(r)}$, stretch factor $\\sqrt{1 + [f']^2} = ${fmt(2 / Math.max(r, 1e-9))}$, product always $2$.`;
            },
          }),
        },
      ],
    },
  ],

  problems: [
    {
      id: 'surface-p01',
      problemNumber: 1,
      difficulty: 'Basic',
      prompt: 'Find the area of the surface generated by revolving $y = 3x$, $0 \\le x \\le 2$, about the $x$-axis. Check your answer with the cone formula.',
      questionLatex: "y = 3x, \\qquad 0 \\le x \\le 2",
      hint: "$f' = 3$, so the arc length factor is constant.",
      steps: [
        {
          stepNumber: 1,
          title: 'Integrate',
          mathLatex: "S = \\int_0^2 2\\pi(3x)\\sqrt{1 + 9}\\,dx = 6\\sqrt{10}\\,\\pi\\int_0^2 x\\,dx = 12\\sqrt{10}\\,\\pi \\approx 119.2",
          explanation: "The radius is the height $3x$.",
          ruleApplied: 'Surface area about the $x$-axis',
        },
        {
          stepNumber: 2,
          title: 'Check',
          mathLatex: "r = 6, \\quad \\ell = \\sqrt{2^2 + 6^2} = 2\\sqrt{10}: \\qquad \\pi r\\ell = 12\\sqrt{10}\\,\\pi",
          explanation: "The segment from the origin to $(2, 6)$ sweeps out a cone with base radius $6$.",
          ruleApplied: 'Lateral area of a cone',
        },
      ],
    },
    {
      id: 'surface-p02',
      problemNumber: 2,
      difficulty: 'Basic',
      prompt: 'Find the area of the surface generated by revolving $y = x^3$, $0 \\le x \\le 1$, about the $x$-axis.',
      questionLatex: "y = x^3, \\qquad 0 \\le x \\le 1",
      hint: "Let $u = 1 + 9x^4$. What is $du$?",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up',
          mathLatex: "f'(x) = 3x^2, \\qquad S = 2\\pi\\int_0^1 x^3\\sqrt{1 + 9x^4}\\,dx",
          explanation: "The radius $x^3$ is, up to a constant, the derivative of $1 + 9x^4$.",
          ruleApplied: 'Surface area about the $x$-axis',
        },
        {
          stepNumber: 2,
          title: 'Substitute',
          mathLatex: "u = 1 + 9x^4,\\; du = 36x^3\\,dx: \\qquad S = \\frac{2\\pi}{36}\\int_1^{10} u^{1/2}\\,du = \\frac{\\pi}{18}\\cdot\\frac23\\left(10^{3/2} - 1\\right) = \\frac{\\pi}{27}\\left(10\\sqrt{10} - 1\\right) \\approx 3.56",
          explanation: "Change the limits: $x = 0 \\Rightarrow u = 1$, $x = 1 \\Rightarrow u = 10$.",
          ruleApplied: '$u$-substitution',
          pitfall: "Dropping the $\\frac{1}{36}$.",
        },
      ],
    },
    {
      id: 'surface-p03',
      problemNumber: 3,
      difficulty: 'Basic',
      prompt: 'Find the area of the surface generated by revolving $y = \\sqrt{x}$, $1 \\le x \\le 4$, about the $x$-axis.',
      questionLatex: "y = \\sqrt{x}, \\qquad 1 \\le x \\le 4",
      hint: "$f\\sqrt{1 + [f']^2} = \\sqrt{f^2 + (ff')^2}$, and $ff' = \\frac12$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Simplify the integrand',
          mathLatex: "f'(x) = \\frac{1}{2\\sqrt{x}}, \\qquad \\sqrt{x}\\sqrt{1 + \\frac{1}{4x}} = \\sqrt{x + \\frac14}",
          explanation: "Bring $\\sqrt{x}$ inside the root.",
          ruleApplied: 'Algebra',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "S = 2\\pi\\int_1^4 \\sqrt{x + \\tfrac14}\\,dx = \\frac{4\\pi}{3}\\left[\\left(x + \\tfrac14\\right)^{3/2}\\right]_1^4 = \\frac{4\\pi}{3}\\cdot\\frac{17\\sqrt{17} - 5\\sqrt5}{8} = \\frac{\\pi}{6}\\left(17\\sqrt{17} - 5\\sqrt5\\right) \\approx 30.8",
          explanation: "$\\left(\\frac{17}{4}\\right)^{3/2} = \\frac{17\\sqrt{17}}{8}$ and $\\left(\\frac54\\right)^{3/2} = \\frac{5\\sqrt5}{8}$.",
          ruleApplied: 'Power rule',
        },
      ],
    },
    {
      id: 'surface-p04',
      problemNumber: 4,
      difficulty: 'Exam-Level',
      prompt: 'Find the area of the surface generated by revolving $y = x^2$, $0 \\le x \\le \\sqrt2$, about the $y$-axis.',
      questionLatex: "y = x^2, \\qquad 0 \\le x \\le \\sqrt2; \\qquad \\text{axis } x = 0",
      hint: "Keep $dx$. The radius is the distance from the $y$-axis, which is $x$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up with radius x',
          mathLatex: "S = \\int_0^{\\sqrt2} 2\\pi x\\sqrt{1 + 4x^2}\\,dx",
          explanation: "$f'(x) = 2x$. About the $y$-axis the radius is $x$, not $x^2$.",
          ruleApplied: '$S = \\int 2\\pi r\\,ds$',
          pitfall: "Using $2\\pi x^2$, the radius for the $x$-axis.",
          figure: surface({
            caption: 'The parabola revolved about the $y$-axis makes a bowl. The radius of each band is $x$.',
            x: [-1.9, 1.9],
            y: [-0.4, 2.5],
            xTicks: [-1, 1],
            yTicks: [1, 2],
            axis: 'y',
            c: 0,
            from: 0,
            to: 2,
            f: Math.sqrt,
            label: 'y = x^2',
            labelAt: [1.45, 2.3],
            anchor: 'e',
            initial: 1,
            readout: (y) => `At $y = ${fmt(y)}$: $r = x = ${fmt(Math.sqrt(y))}$.`,
          }),
        },
        {
          stepNumber: 2,
          title: 'Substitute',
          mathLatex: "u = 1 + 4x^2,\\; du = 8x\\,dx: \\qquad S = \\frac{2\\pi}{8}\\int_1^9 u^{1/2}\\,du = \\frac{\\pi}{4}\\cdot\\frac23(27 - 1) = \\frac{13\\pi}{3} \\approx 13.6",
          explanation: "At $x = \\sqrt2$, $u = 9$ and $9^{3/2} = 27$.",
          ruleApplied: '$u$-substitution',
        },
      ],
    },
    {
      id: 'surface-p05',
      problemNumber: 5,
      difficulty: 'Exam-Level',
      prompt: 'Find the area of the surface generated by revolving $x = \\dfrac{y^3}{3}$, $0 \\le y \\le 1$, about the $y$-axis.',
      questionLatex: "x = \\frac{y^3}{3}, \\qquad 0 \\le y \\le 1; \\qquad \\text{axis } x = 0",
      hint: "The curve is $x = g(y)$. Substitute $u = 1 + y^4$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up',
          mathLatex: "g'(y) = y^2, \\qquad S = \\int_0^1 2\\pi\\cdot\\frac{y^3}{3}\\sqrt{1 + y^4}\\,dy",
          explanation: "The radius is $g(y)$, the distance from the $y$-axis.",
          ruleApplied: 'Surface area about the $y$-axis',
        },
        {
          stepNumber: 2,
          title: 'Substitute',
          mathLatex: "u = 1 + y^4,\\; du = 4y^3\\,dy: \\qquad S = \\frac{2\\pi}{3}\\cdot\\frac14\\int_1^2 u^{1/2}\\,du = \\frac{\\pi}{6}\\cdot\\frac23\\left(2\\sqrt2 - 1\\right) = \\frac{\\pi}{9}\\left(2\\sqrt2 - 1\\right) \\approx 0.64",
          explanation: "$2^{3/2} = 2\\sqrt2$.",
          ruleApplied: '$u$-substitution',
        },
      ],
    },
    {
      id: 'surface-p06',
      problemNumber: 6,
      difficulty: 'Exam-Level',
      prompt: 'Find the area of the surface generated by revolving $y = \\dfrac{x^3}{6} + \\dfrac{1}{2x}$, $1 \\le x \\le 2$, about the $x$-axis.',
      questionLatex: "y = \\frac{x^3}{6} + \\frac{1}{2x}, \\qquad 1 \\le x \\le 2",
      hint: "This is the curve of arc-length Worked Example 3: $1 + [f']^2$ is a perfect square.",
      steps: [
        {
          stepNumber: 1,
          title: 'Remove the root',
          mathLatex: "\\sqrt{1 + [f']^2} = \\frac{x^2}{2} + \\frac{1}{2x^2}",
          explanation: "From Unit 3.5: $f' = \\frac{x^2}{2} - \\frac{1}{2x^2}$, and adding $1$ turns the square of the difference into the square of the sum.",
          ruleApplied: 'Perfect square under the root',
        },
        {
          stepNumber: 2,
          title: 'Multiply out',
          mathLatex: "\\left(\\frac{x^3}{6} + \\frac{1}{2x}\\right)\\left(\\frac{x^2}{2} + \\frac{1}{2x^2}\\right) = \\frac{x^5}{12} + \\frac{x}{12} + \\frac{x}{4} + \\frac{1}{4x^3} = \\frac{x^5}{12} + \\frac{x}{3} + \\frac{1}{4x^3}",
          explanation: "Four products; the two middle ones combine.",
          ruleApplied: 'Algebra',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "S = 2\\pi\\left[\\frac{x^6}{72} + \\frac{x^2}{6} - \\frac{1}{8x^2}\\right]_1^2 = 2\\pi\\left(\\frac78 + \\frac12 + \\frac{3}{32}\\right) = 2\\pi\\cdot\\frac{47}{32} = \\frac{47\\pi}{16} \\approx 9.23",
          explanation: "Piece by piece: $\\frac{64 - 1}{72} = \\frac78$, $\\frac{4 - 1}{6} = \\frac12$, $-\\frac{1}{32} + \\frac18 = \\frac{3}{32}$.",
          ruleApplied: 'Power rule',
        },
      ],
    },
    {
      id: 'surface-p07',
      problemNumber: 7,
      difficulty: 'Exam-Level',
      prompt: 'Find the area of the surface generated by revolving the catenary $y = \\cosh x$, $0 \\le x \\le 1$, about the $x$-axis.',
      questionLatex: "y = \\cosh x, \\qquad 0 \\le x \\le 1",
      hint: "$\\sqrt{1 + \\sinh^2 x} = \\cosh x$, then use $\\cosh^2 x = \\frac{1 + \\cosh 2x}{2}$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up',
          mathLatex: "S = \\int_0^1 2\\pi\\cosh x\\sqrt{1 + \\sinh^2 x}\\,dx = 2\\pi\\int_0^1 \\cosh^2 x\\,dx",
          explanation: "The radius and the arc length factor are both $\\cosh x$.",
          ruleApplied: '$\\cosh^2 x - \\sinh^2 x = 1$',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "2\\pi\\int_0^1 \\frac{1 + \\cosh 2x}{2}\\,dx = \\pi\\left[x + \\frac{\\sinh 2x}{2}\\right]_0^1 = \\pi\\left(1 + \\frac{\\sinh 2}{2}\\right) \\approx 8.84",
          explanation: "The hyperbolic power-reducing identity, analogous to $\\cos^2 x = \\frac{1 + \\cos 2x}{2}$.",
          ruleApplied: '$\\cosh^2 x = \\dfrac{1 + \\cosh 2x}{2}$',
          pitfall: "Writing $\\int \\cosh^2 x\\,dx = \\frac{\\cosh^3 x}{3}$.",
        },
      ],
    },
    {
      id: 'surface-p08',
      problemNumber: 8,
      difficulty: 'Exam-Level',
      prompt: 'Find the area of the surface generated by revolving $y = x$, $0 \\le x \\le 2$, about the line $y = -1$. Check with the frustum formula.',
      questionLatex: "y = x, \\qquad 0 \\le x \\le 2; \\qquad \\text{axis } y = -1",
      hint: "The radius is the distance from $y = -1$: $x + 1$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up',
          mathLatex: "S = \\int_0^2 2\\pi(x + 1)\\sqrt{1 + 1}\\,dx = 2\\sqrt2\\,\\pi\\left[\\frac{x^2}{2} + x\\right]_0^2 = 8\\sqrt2\\,\\pi \\approx 35.5",
          explanation: "$r = x - (-1)$. The segment's arc length factor is $\\sqrt2$.",
          ruleApplied: 'Radius about $y = k$',
          pitfall: "Using the radius $x$, which revolves about the $x$-axis instead.",
        },
        {
          stepNumber: 2,
          title: 'Check',
          mathLatex: "r_1 = 1,\\; r_2 = 3,\\; \\ell = 2\\sqrt2: \\qquad \\pi(1 + 3)\\left(2\\sqrt2\\right) = 8\\sqrt2\\,\\pi",
          explanation: "The ends of the segment are $1$ and $3$ units from the axis; the segment from $(0, 0)$ to $(2, 2)$ has length $2\\sqrt2$.",
          ruleApplied: 'Lateral area of a frustum',
        },
      ],
    },
    {
      id: 'surface-p09',
      problemNumber: 9,
      difficulty: 'Exam-Level',
      prompt: 'The arc $x = \\sqrt{4 - y^2}$, $-1 \\le y \\le 1$, is revolved about the $y$-axis. Find the area of the resulting band of the sphere.',
      questionLatex: "x = \\sqrt{4 - y^2}, \\qquad -1 \\le y \\le 1; \\qquad \\text{axis } x = 0",
      hint: "As for the full sphere, $g\\sqrt{1 + [g']^2}$ simplifies to the radius of the sphere.",
      steps: [
        {
          stepNumber: 1,
          title: 'Simplify',
          mathLatex: "g'(y) = \\frac{-y}{\\sqrt{4 - y^2}}, \\qquad g\\sqrt{1 + [g']^2} = \\sqrt{4 - y^2}\\cdot\\frac{2}{\\sqrt{4 - y^2}} = 2",
          explanation: "The same cancellation as in Worked Example 3, with the roles of $x$ and $y$ swapped.",
          ruleApplied: 'Surface area about the $y$-axis',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "S = \\int_{-1}^{1} 2\\pi(2)\\,dy = 8\\pi \\approx 25.1",
          explanation: "A zone of width $h = 2$ on a sphere of radius $2$: $2\\pi rh = 8\\pi$, exactly half of the sphere's $16\\pi$, because it spans half of the sphere's height.",
          ruleApplied: 'Zone of a sphere',
        },
      ],
    },
    {
      id: 'surface-p10',
      problemNumber: 10,
      difficulty: 'Challenge',
      prompt: 'The circle $(x - 3)^2 + y^2 = 1$ is revolved about the $y$-axis, generating the surface of a torus. Find its surface area.',
      questionLatex: "(x - 3)^2 + y^2 = 1; \\qquad \\text{axis } x = 0",
      hint: "Treat the right and left halves $x = 3 \\pm \\sqrt{1 - y^2}$ separately; their arc length factors are equal.",
      steps: [
        {
          stepNumber: 1,
          title: 'Arc length factor',
          mathLatex: "x = 3 \\pm \\sqrt{1 - y^2}, \\qquad \\frac{dx}{dy} = \\mp\\frac{y}{\\sqrt{1 - y^2}}, \\qquad \\sqrt{1 + \\left(\\frac{dx}{dy}\\right)^2} = \\frac{1}{\\sqrt{1 - y^2}}",
          explanation: "The same for both halves because the sign disappears when squared.",
          ruleApplied: 'Implicit curves as two functions',
        },
        {
          stepNumber: 2,
          title: 'Add the two halves',
          mathLatex: "S = \\int_{-1}^{1} 2\\pi\\left[\\left(3 + \\sqrt{1 - y^2}\\right) + \\left(3 - \\sqrt{1 - y^2}\\right)\\right]\\frac{dy}{\\sqrt{1 - y^2}} = 12\\pi\\int_{-1}^{1}\\frac{dy}{\\sqrt{1 - y^2}}",
          explanation: "The radii are the two $x$-values; their sum is $6$.",
          ruleApplied: 'Surface area about the $y$-axis',
        },
        {
          stepNumber: 3,
          title: 'Evaluate',
          mathLatex: "12\\pi\\Big[\\sin^{-1} y\\Big]_{-1}^{1} = 12\\pi\\left(\\frac{\\pi}{2} + \\frac{\\pi}{2}\\right) = 12\\pi^2 \\approx 118.4",
          explanation: "An improper integral (the integrand blows up at $y = \\pm 1$) that converges, using the inverse sine from Unit 1.5. Check: the circle has length $2\\pi$ and its center travels a circle of length $2\\pi(3)$; their product is $12\\pi^2$.",
          ruleApplied: '$\\int \\dfrac{du}{\\sqrt{1 - u^2}} = \\sin^{-1}u + C$',
          pitfall: "Subtracting the inner half as in the washer method. For a surface both halves add.",
        },
      ],
    },
  ],
};
