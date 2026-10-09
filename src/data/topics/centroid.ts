import type { Topic } from '../../types/curriculum';
import type { Anchor, PlotFigure, PlotItem, Tick, Vec } from '../../types/figure';
import { fmt, piTicks } from '../../lib/plot';

/** [mass, x, y] of a particle in the plane. */
type Particle = [number, number, number];

/** Particles drawn as points labelled with their masses, and optionally the center of mass. */
function particles(caption: string, ps: Particle[], x: Vec, y: Vec, center?: Vec, anchor: Anchor = 'se'): PlotFigure {
  return {
    kind: 'plot',
    caption,
    x,
    y,
    equal: true,
    items: [
      ...ps.map(([m, px, py]): PlotItem => ({ type: 'point', at: [px, py], tone: 1, label: `m = ${m}`, anchor: 'ne' })),
      ...(center ? [{ type: 'point' as const, at: center, tone: 2 as const, label: '(\\bar{x}, \\bar{y})', anchor }] : []),
    ],
  };
}

interface RegionSpec {
  caption: string;
  f: (x: number) => number;
  /** Lower boundary; the x-axis when omitted. */
  g?: (x: number) => number;
  from: number;
  to: number;
  x: Vec;
  y: Vec;
  xTicks?: Tick[];
  yTicks?: Tick[];
  aspect?: number;
  /** Labelled boundary curves. */
  boundary: PlotItem[];
  centroid?: Vec;
}

/** A shaded region with its boundary curves and, when given, its centroid. */
function region(sp: RegionSpec): PlotFigure {
  return {
    kind: 'plot',
    caption: sp.caption,
    x: sp.x,
    y: sp.y,
    xTicks: sp.xTicks,
    yTicks: sp.yTicks,
    ...(sp.aspect ? { aspect: sp.aspect } : { equal: true }),
    items: [
      { type: 'area', f: sp.f, g: sp.g, from: sp.from, to: sp.to },
      ...sp.boundary,
      ...(sp.centroid ? [{ type: 'point' as const, at: sp.centroid, tone: 2 as const, label: '(\\bar{x}, \\bar{y})', anchor: 'ne' as const }] : []),
    ],
  };
}

/** Unit 3.4 — Center of mass of a lamina and centroid of a plane region. Source: lecture deck 3.4 (examples solved here). */
export const centroid: Topic = {
  id: 'centroid',
  title: 'Center of Mass of a Lamina and Centroid of a Plane Region',
  slug: 'centroid',
  unitNumber: '3.4',
  summary:
    "In the plane, a system balances at the point $(\\bar{x}, \\bar{y})$, found from two moments: $M_y$ (about the $y$-axis, built from $x$-coordinates) and $M_x$ (about the $x$-axis, built from $y$-coordinates). A thin plate of uniform density, a homogeneous lamina, balances at the centroid of its shape. For a region under $y = f(x)$, vertical strips give $M_y = \\int x f(x)\\,dx$ and $M_x = \\frac12\\int [f(x)]^2\\,dx$, and symmetry often gives one coordinate for free.",

  examNotes: [
    {
      title: 'Moments of particles in the plane',
      concept:
        "For particles of mass $m_i$ at $(x_i, y_i)$, the moment about the $y$-axis is $M_y = \\sum m_ix_i$ and the moment about the $x$-axis is $M_x = \\sum m_iy_i$. With total mass $M = \\sum m_i$, the center of mass is the point $(\\bar{x}, \\bar{y})$ with",
      display: "\\bar{x} = \\frac{M_y}{M}, \\qquad \\bar{y} = \\frac{M_x}{M}",
      conditions: "Each moment uses the distance from its axis: distance from the $y$-axis is $x$, distance from the $x$-axis is $y$. Coordinates are signed.",
      commonTraps: [
        "Swapping the subscripts: $\\bar{x}$ uses $M_y$, not $M_x$.",
        "Dropping a negative coordinate.",
        "Averaging the coordinates without weighting by mass.",
      ],
      tip: "Make a table with columns $m$, $x$, $y$, $mx$, $my$. The column sums are $M$, $M_y$ and $M_x$.",
      figure: particles(
        'Masses $3$, $1$ and $2$ at $(-2, 1)$, $(3, 2)$ and $(1, -2)$: $M_y = -1$, $M_x = 1$, $M = 6$, so the system balances at $\\left(-\\frac16, \\frac16\\right)$.',
        [[3, -2, 1], [1, 3, 2], [2, 1, -2]],
        [-3.2, 4.2],
        [-2.8, 3],
        [-1 / 6, 1 / 6],
        'nw',
      ),
    },
    {
      title: 'Centroid of a region under a curve',
      concept:
        "Let $R$ be bounded by $y = f(x) \\ge 0$, the $x$-axis and the lines $x = a$, $x = b$. A vertical strip at $x$ has area $f(x)\\,dx$ and its own center at $\\left(x, \\frac{f(x)}{2}\\right)$, halfway up. Its moments are $x f(x)\\,dx$ about the $y$-axis and $\\frac{f(x)}{2}\\cdot f(x)\\,dx$ about the $x$-axis, so",
      display: "M_y = \\int_a^b x f(x)\\,dx, \\qquad M_x = \\frac12\\int_a^b \\left[f(x)\\right]^2dx, \\qquad (\\bar{x}, \\bar{y}) = \\left(\\frac{M_y}{A}, \\frac{M_x}{A}\\right)",
      conditions: "$A = \\int_a^b f(x)\\,dx$ is the area. A homogeneous lamina of constant density $\\rho$ has mass $\\rho A$ and moments $\\rho M_x$, $\\rho M_y$; the $\\rho$ cancels, so its center of mass is the centroid of its shape.",
      commonTraps: [
        "Forgetting the $\\frac12$ in $M_x$.",
        "Writing $M_x = \\int x f(x)\\,dx$: the $x$-axis moment uses heights, so it is the one with $f^2$.",
        "Dividing by the length $b - a$ instead of the area $A$.",
      ],
      tip: "Three integrals, always: $A$, $M_y$, $M_x$. Compute $A$ first; it is needed for both coordinates.",
      figure: {
        kind: 'plot',
        caption: 'Each strip balances at its midpoint $\\left(x, \\frac{f(x)}{2}\\right)$ (orange dot). Weighting those midpoints by strip area gives the centroid of the region. This region is symmetric about $x = 2$, so $\\bar{x} = 2$; the integral gives $\\bar{y} = 0.86$.',
        x: [-0.3, 4.4],
        y: [-0.3, 2.4],
        equal: true,
        xTicks: [1, 2, 3, 4],
        yTicks: [1, 2],
        items: [
          { type: 'area', f: (x) => 1 + x - (x * x) / 4, from: 0, to: 4 },
          { type: 'fn', f: (x) => 1 + x - (x * x) / 4, from: 0, to: 4, label: 'y = f(x)', labelAt: [3.3, 1.58], anchor: 'ne' },
          { type: 'point', at: [2, 0.86], tone: 'ink', label: '(\\bar{x}, \\bar{y})', anchor: 'e' },
        ],
        animate: {
          param: 'x',
          range: [0.1, 3.9],
          initial: 0.9,
          duration: 7,
          frame: (x) => {
            const h = 1 + x - (x * x) / 4;
            return [
              { type: 'polygon', points: [[x - 0.07, 0], [x - 0.07, h], [x + 0.07, h], [x + 0.07, 0]], tone: 2, outline: true },
              { type: 'point', at: [x, h / 2], tone: 2 },
            ];
          },
          readout: (x) => {
            const h = 1 + x - (x * x) / 4;
            return `At $x = ${fmt(x)}$: the strip has height $f(x) = ${fmt(h)}$ and its center is at height $${fmt(h / 2)}$.`;
          },
        },
      },
    },
    {
      title: 'Symmetry',
      concept:
        "If a line is an axis of symmetry of the plane region $R$, the centroid of $R$ lies on that line. Each strip on one side is matched by a mirror-image strip on the other, and their moments about the line cancel.",
      conditions: "Use symmetry to write down one coordinate without integrating. For a region symmetric about the $y$-axis, $\\bar{x} = 0$; symmetric about $x = c$, $\\bar{x} = c$. Two axes of symmetry fix the centroid at their intersection.",
      commonTraps: [
        "Claiming symmetry the region does not have. Check that reflecting the boundary curves gives the same region.",
        "Using symmetry for one coordinate and then not computing the other.",
        "Integrating an odd function over symmetric limits and being surprised by $0$: that is the symmetry working.",
      ],
      tip: "Before any integral, look for symmetry. It halves the work, and it is a check on the answer when you do integrate.",
      figure: {
        kind: 'plot',
        caption: 'This triangle is symmetric about the $y$-axis, so $\\bar{x} = 0$. Its centroid is at $(0, 1)$: one third of the way up, where the medians meet.',
        x: [-2.6, 2.6],
        y: [-0.5, 3.4],
        equal: true,
        xTicks: [-2, -1, 1, 2],
        yTicks: [1, 2, 3],
        items: [
          { type: 'polygon', points: [[-2, 0], [2, 0], [0, 3]], tone: 1, outline: true },
          { type: 'segment', from: [0, -0.5], to: [0, 3.4], tone: 'ink', dashed: true, width: 1.5 },
          { type: 'segment', from: [-2, 0], to: [1, 1.5], tone: 'muted', width: 1, dashed: true },
          { type: 'segment', from: [2, 0], to: [-1, 1.5], tone: 'muted', width: 1, dashed: true },
          { type: 'point', at: [0, 1], tone: 2, label: '(0, 1)', anchor: 'e' },
        ],
      },
    },
    {
      title: 'A region between two curves',
      concept:
        "If $R$ lies between $y = f(x)$ above and $y = g(x)$ below, a strip at $x$ has length $f - g$ and center at height $\\frac{f + g}{2}$. Its moment about the $x$-axis is $\\frac{f + g}{2}(f - g)\\,dx = \\frac12\\left(f^2 - g^2\\right)dx$, so",
      display: "A = \\int_a^b (f - g)\\,dx, \\qquad M_y = \\int_a^b x(f - g)\\,dx, \\qquad M_x = \\frac12\\int_a^b \\left(f^2 - g^2\\right)dx",
      conditions: "$f(x) \\ge g(x)$ on $[a, b]$. The limits are the intersection points, as for the area. With $g = 0$ these are the formulas for a region under a curve.",
      commonTraps: [
        "Writing $M_x = \\frac12\\int (f - g)^2\\,dx$. Square each function, then subtract, exactly as in the washer method.",
        "Using $x(f - g)$ for both moments.",
        "Forgetting that $\\bar{y}$ can be negative when part of the region is below the $x$-axis.",
      ],
      tip: "$\\frac12\\left(f^2 - g^2\\right)$ is the washer integrand without the $\\pi$. If you have done washers, you already know this integral.",
      figure: {
        kind: 'plot',
        caption: 'Between $y = x + 2$ and $y = x^2$, each strip balances at the midpoint of its two ends. The centroid of the whole region is at $\\left(\\frac12, \\frac85\\right)$.',
        x: [-1.6, 2.6],
        y: [-0.5, 4.8],
        aspect: 1.3,
        xTicks: [-1, 1, 2],
        yTicks: [1, 2, 3, 4],
        items: [
          { type: 'area', f: (x) => x + 2, g: (x) => x * x, from: -1, to: 2 },
          { type: 'fn', f: (x) => x + 2, label: 'y = x + 2', labelAt: [1.2, 3.2], anchor: 'nw' },
          { type: 'fn', f: (x) => x * x, tone: 3, label: 'y = x^2', labelAt: [1.6, 2.56], anchor: 'se' },
          { type: 'point', at: [0.5, 1.6], tone: 'ink', label: '(\\bar{x}, \\bar{y})', anchor: 'w' },
        ],
        animate: {
          param: 'x',
          range: [-0.95, 1.95],
          initial: 1.2,
          duration: 7,
          frame: (x) => [
            { type: 'polygon', points: [[x - 0.05, x * x], [x - 0.05, x + 2], [x + 0.05, x + 2], [x + 0.05, x * x]], tone: 2, outline: true },
            { type: 'point', at: [x, (x + 2 + x * x) / 2], tone: 2 },
          ],
          readout: (x) => `At $x = ${fmt(x)}$: the strip runs from $${fmt(x * x)}$ to $${fmt(x + 2)}$, so its center is at height $\\frac{f + g}{2} = ${fmt((x + 2 + x * x) / 2)}$.`,
        },
      },
    },
  ],

  keyFormulas: [
    {
      id: 'centroid-particles',
      name: 'Center of mass of particles in the plane',
      formulaLatex: "M_y = \\sum m_ix_i, \\quad M_x = \\sum m_iy_i, \\qquad (\\bar{x}, \\bar{y}) = \\left(\\frac{M_y}{M}, \\frac{M_x}{M}\\right)",
      whenToUse: "Point masses at known coordinates.",
      restrictions: "$M_y$ uses $x$-coordinates and gives $\\bar{x}$; $M_x$ uses $y$-coordinates and gives $\\bar{y}$.",
      example: "3, 1, 2 \\text{ at } (-2, 1), (3, 2), (1, -2): \\quad (\\bar{x}, \\bar{y}) = \\left(-\\tfrac16, \\tfrac16\\right)",
    },
    {
      id: 'centroid-under',
      name: 'Moments of a region under a curve',
      formulaLatex: "M_x = \\frac12\\int_a^b \\left[f(x)\\right]^2dx, \\qquad M_y = \\int_a^b x f(x)\\,dx",
      whenToUse: "The region between $y = f(x) \\ge 0$ and the $x$-axis on $[a, b]$.",
      restrictions: "$f$ continuous on $[a, b]$.",
      example: "f(x) = 2\\sqrt{x},\\; [1, 4]: \\quad M_x = 15,\\; M_y = \\frac{124}{5}",
    },
    {
      id: 'centroid-point',
      name: 'Centroid',
      formulaLatex: "\\bar{x} = \\frac{M_y}{A}, \\qquad \\bar{y} = \\frac{M_x}{A}, \\qquad A = \\int_a^b f(x)\\,dx",
      whenToUse: "Any plane region, once $A$, $M_x$ and $M_y$ are known.",
      restrictions: "For a homogeneous lamina of density $\\rho$, the center of mass is the centroid: $\\rho$ cancels.",
      example: "A = \\frac{28}{3},\\; M_y = \\frac{124}{5},\\; M_x = 15: \\quad (\\bar{x}, \\bar{y}) = \\left(\\frac{93}{35}, \\frac{45}{28}\\right)",
    },
    {
      id: 'centroid-between',
      name: 'Region between two curves',
      formulaLatex: "M_x = \\frac12\\int_a^b \\left(f^2 - g^2\\right)dx, \\qquad M_y = \\int_a^b x(f - g)\\,dx",
      whenToUse: "The region between $y = f(x)$ above and $y = g(x)$ below.",
      restrictions: "$f \\ge g$ on $[a, b]$. Not $\\frac12\\int (f - g)^2\\,dx$.",
      example: "f = x + 2,\\; g = x^2,\\; [-1, 2]: \\quad (\\bar{x}, \\bar{y}) = \\left(\\frac12, \\frac85\\right)",
    },
    {
      id: 'centroid-symmetry',
      name: 'Symmetry and known centroids',
      formulaLatex: "\\begin{gathered} \\text{axis of symmetry} \\Rightarrow \\text{centroid on it} \\\\[1ex] \\text{triangle: } \\tfrac13 \\text{ of the height} \\\\[1ex] \\text{half-disk of radius } r: \\; \\bar{y} = \\frac{4r}{3\\pi} \\end{gathered}",
      whenToUse: "Writing down a coordinate without integrating, or checking one.",
      restrictions: "The region must really be symmetric about the line.",
      example: "y = \\sqrt{4 - x^2},\\; y \\ge 0: \\quad (\\bar{x}, \\bar{y}) = \\left(0, \\frac{8}{3\\pi}\\right)",
    },
  ],

  workedExamples: [
    {
      id: 'centroid-we-1',
      title: 'Four particles in the plane',
      prompt: "Find the center of mass of the system of four particles whose masses have measures 2, 6, 4 and 1, and which are located at the points $(5, -2)$, $(-2, 1)$, $(0, 3)$ and $(4, -1)$, respectively.",
      problemLatex: "m_i: 2,\\; 6,\\; 4,\\; 1, \\qquad (5, -2),\\; (-2, 1),\\; (0, 3),\\; (4, -1)",
      keyIdea: "Total mass, then one moment for each coordinate.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Total mass',
          mathLatex: "M = 2 + 6 + 4 + 1 = 13",
          explanation: "Both coordinates are divided by this.",
          ruleApplied: '$M = \\sum m_i$',
        },
        {
          stepNumber: 2,
          title: 'Moment about the y-axis',
          mathLatex: "M_y = \\sum m_ix_i = 2(5) + 6(-2) + 4(0) + 1(4) = 10 - 12 + 0 + 4 = 2",
          explanation: "$M_y$ uses the $x$-coordinates: the distances from the $y$-axis.",
          ruleApplied: '$M_y = \\sum m_ix_i$',
        },
        {
          stepNumber: 3,
          title: 'Moment about the x-axis',
          mathLatex: "M_x = \\sum m_iy_i = 2(-2) + 6(1) + 4(3) + 1(-1) = -4 + 6 + 12 - 1 = 13",
          explanation: "$M_x$ uses the $y$-coordinates.",
          ruleApplied: '$M_x = \\sum m_iy_i$',
          pitfall: "Pairing $M_x$ with $\\bar{x}$ in the next step.",
        },
        {
          stepNumber: 4,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{M_y}{M} = \\frac{2}{13}, \\qquad \\bar{y} = \\frac{M_x}{M} = \\frac{13}{13} = 1 \\qquad\\Longrightarrow\\qquad \\left(\\frac{2}{13}, 1\\right)",
          explanation: "The heavy $6$ unit mass at $(-2, 1)$ and the $4$ at $(0, 3)$ pull the balance point up and to the left of the remaining two.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{M}, \\dfrac{M_x}{M}\\right)$',
          figure: particles('The four particles and their center of mass $\\left(\\frac{2}{13}, 1\\right)$.', [[2, 5, -2], [6, -2, 1], [4, 0, 3], [1, 4, -1]], [-3, 6.4], [-2.8, 4], [2 / 13, 1]),
        },
      ],
    },
    {
      id: 'centroid-we-2',
      title: 'Centroid of a region under a curve',
      prompt: "Find the centroid of the first-quadrant region bounded by the curve $y^2 = 4x$, the $x$-axis, and the lines $x = 1$ and $x = 4$.",
      problemLatex: "y^2 = 4x, \\quad y = 0, \\quad x = 1, \\quad x = 4",
      keyIdea: "In the first quadrant the curve is $y = 2\\sqrt{x}$. Compute $A$, $M_y$ and $M_x$.",
      figure: region({
        caption: 'The upper half of the parabola $y^2 = 4x$ over $[1, 4]$.',
        f: (x) => 2 * Math.sqrt(x),
        from: 1,
        to: 4,
        x: [-0.3, 4.6],
        y: [-0.4, 4.4],
        xTicks: [1, 2, 3, 4],
        yTicks: [1, 2, 3, 4],
        boundary: [
          { type: 'fn', f: (x) => 2 * Math.sqrt(x), from: 0, to: 4.4, label: 'y = 2\\sqrt{x}', labelAt: [1.5, 2.45], anchor: 'nw' },
          { type: 'vline', x: 1 },
          { type: 'vline', x: 4 },
        ],
      }),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Area',
          mathLatex: "f(x) = 2\\sqrt{x}, \\qquad A = \\int_1^4 2x^{1/2}\\,dx = \\left[\\frac43 x^{3/2}\\right]_1^4 = \\frac43(8 - 1) = \\frac{28}{3}",
          explanation: "First quadrant means the positive square root: $y = \\sqrt{4x} = 2\\sqrt{x}$.",
          ruleApplied: 'Area under a curve',
        },
        {
          stepNumber: 2,
          title: 'Moment about the y-axis',
          mathLatex: "M_y = \\int_1^4 x\\cdot 2x^{1/2}\\,dx = \\int_1^4 2x^{3/2}\\,dx = \\left[\\frac45 x^{5/2}\\right]_1^4 = \\frac45(32 - 1) = \\frac{124}{5}",
          explanation: "$4^{5/2} = 32$.",
          ruleApplied: '$M_y = \\int_a^b x f(x)\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Moment about the x-axis',
          mathLatex: "M_x = \\frac12\\int_1^4 \\left(2\\sqrt{x}\\right)^2dx = \\frac12\\int_1^4 4x\\,dx = \\Big[x^2\\Big]_1^4 = 15",
          explanation: "Squaring removes the root. This is why $y^2 = 4x$ is pleasant: $f^2$ is given directly.",
          ruleApplied: '$M_x = \\dfrac12\\int_a^b [f(x)]^2\\,dx$',
          pitfall: "Leaving out the $\\frac12$, which gives $\\bar{y}$ twice too big.",
        },
        {
          stepNumber: 4,
          title: 'Centroid',
          mathLatex: "\\bar{x} = \\frac{124/5}{28/3} = \\frac{93}{35} \\approx 2.66, \\qquad \\bar{y} = \\frac{15}{28/3} = \\frac{45}{28} \\approx 1.61",
          explanation: "$\\bar{x}$ is right of the middle $2.5$ because the region is taller on the right. $\\bar{y}$ is a bit below half the maximum height, $4$.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{A}, \\dfrac{M_x}{A}\\right)$',
          figure: region({
            caption: 'The centroid $\\left(\\frac{93}{35}, \\frac{45}{28}\\right)$.',
            f: (x) => 2 * Math.sqrt(x),
            from: 1,
            to: 4,
            x: [-0.3, 4.6],
            y: [-0.4, 4.4],
            xTicks: [1, 2, 3, 4],
            yTicks: [1, 2, 3, 4],
            boundary: [{ type: 'fn', f: (x) => 2 * Math.sqrt(x), from: 0, to: 4.4, label: 'y = 2\\sqrt{x}', labelAt: [1.5, 2.45], anchor: 'nw' }],
            centroid: [93 / 35, 45 / 28],
          }),
        },
      ],
    },
    {
      id: 'centroid-we-3',
      title: 'Centroid of a half-disk',
      prompt: "Find the centroid of the region bounded by the $x$-axis and the semicircle $y = \\sqrt{4 - x^2}$.",
      problemLatex: "y = \\sqrt{4 - x^2}, \\qquad y = 0",
      keyIdea: "The region is symmetric about the $y$-axis, so $\\bar{x} = 0$. Only $\\bar{y}$ needs integrals.",
      figure: region({
        caption: 'The upper half of the disk of radius $2$. The $y$-axis is an axis of symmetry.',
        f: (x) => Math.sqrt(Math.max(0, 4 - x * x)),
        from: -2,
        to: 2,
        x: [-2.6, 2.6],
        y: [-0.4, 2.5],
        xTicks: [-2, -1, 1, 2],
        yTicks: [1, 2],
        boundary: [
          { type: 'fn', f: (x) => Math.sqrt(4 - x * x), from: -2, to: 2, label: 'y = \\sqrt{4 - x^2}', labelAt: [1.41, 1.41], anchor: 'ne' },
          { type: 'segment', from: [0, -0.4], to: [0, 2.5], tone: 'ink', dashed: true, width: 1.5 },
        ],
      }),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Use symmetry',
          mathLatex: "\\bar{x} = 0",
          explanation: "Reflecting $y = \\sqrt{4 - x^2}$ in the $y$-axis gives the same curve, so the $y$-axis is an axis of symmetry and the centroid lies on it.",
          ruleApplied: 'Symmetry theorem',
        },
        {
          stepNumber: 2,
          title: 'Area',
          mathLatex: "A = \\frac12\\pi(2)^2 = 2\\pi",
          explanation: "Half of a disk of radius $2$. No integral needed; $\\int_{-2}^{2}\\sqrt{4 - x^2}\\,dx$ would need a trigonometric substitution.",
          ruleApplied: 'Area of a circle',
        },
        {
          stepNumber: 3,
          title: 'Moment about the x-axis',
          mathLatex: "M_x = \\frac12\\int_{-2}^{2}\\left(4 - x^2\\right)dx = \\int_0^2 \\left(4 - x^2\\right)dx = 8 - \\frac83 = \\frac{16}{3}",
          explanation: "Squaring the semicircle removes the root, and the integrand is even.",
          ruleApplied: '$M_x = \\dfrac12\\int_a^b [f(x)]^2\\,dx$',
        },
        {
          stepNumber: 4,
          title: 'Centroid',
          mathLatex: "\\bar{y} = \\frac{16/3}{2\\pi} = \\frac{8}{3\\pi} \\approx 0.85 \\qquad\\Longrightarrow\\qquad \\left(0, \\frac{8}{3\\pi}\\right)",
          explanation: "This is the general result $\\bar{y} = \\frac{4r}{3\\pi}$ with $r = 2$: a little under halfway up, because the half-disk is wider at the bottom.",
          ruleApplied: '$\\bar{y} = \\dfrac{M_x}{A}$',
          figure: region({
            caption: 'The centroid $\\left(0, \\frac{8}{3\\pi}\\right)$ lies on the axis of symmetry.',
            f: (x) => Math.sqrt(Math.max(0, 4 - x * x)),
            from: -2,
            to: 2,
            x: [-2.6, 2.6],
            y: [-0.4, 2.5],
            xTicks: [-2, -1, 1, 2],
            yTicks: [1, 2],
            boundary: [
              { type: 'fn', f: (x) => Math.sqrt(4 - x * x), from: -2, to: 2 },
              { type: 'segment', from: [0, -0.4], to: [0, 2.5], tone: 'ink', dashed: true, width: 1.5 },
            ],
            centroid: [0, 8 / (3 * Math.PI)],
          }),
        },
      ],
    },
  ],

  problems: [
    {
      id: 'centroid-p01',
      problemNumber: 1,
      difficulty: 'Basic',
      prompt: 'Particles of mass 3, 1 and 2 are at $(1, 2)$, $(-3, 4)$ and $(2, -1)$. Find the center of mass.',
      questionLatex: "m_i: 3,\\; 1,\\; 2, \\qquad (1, 2),\\; (-3, 4),\\; (2, -1)",
      hint: "$\\bar{x}$ comes from $M_y = \\sum m_ix_i$; $\\bar{y}$ from $M_x = \\sum m_iy_i$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass and moments',
          mathLatex: "M = 6, \\qquad M_y = 3(1) + 1(-3) + 2(2) = 4, \\qquad M_x = 3(2) + 1(4) + 2(-1) = 8",
          explanation: "$M_y$ uses $x$-coordinates, $M_x$ uses $y$-coordinates.",
          ruleApplied: 'Moments of a system',
        },
        {
          stepNumber: 2,
          title: 'Center of mass',
          mathLatex: "(\\bar{x}, \\bar{y}) = \\left(\\frac46, \\frac86\\right) = \\left(\\frac23, \\frac43\\right)",
          explanation: "Inside the triangle formed by the three particles, as it must be.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{M}, \\dfrac{M_x}{M}\\right)$',
          pitfall: "Writing $\\left(\\frac86, \\frac46\\right)$ by pairing $M_x$ with $\\bar{x}$.",
        },
      ],
    },
    {
      id: 'centroid-p02',
      problemNumber: 2,
      difficulty: 'Basic',
      prompt: 'Find the centroid of the region bounded by $y = x^2$, the $x$-axis and the line $x = 2$.',
      questionLatex: "y = x^2, \\quad y = 0, \\quad x = 2",
      hint: "$A = \\int_0^2 x^2\\,dx$, $M_y = \\int_0^2 x^3\\,dx$, $M_x = \\frac12\\int_0^2 x^4\\,dx$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Area and moments',
          mathLatex: "A = \\int_0^2 x^2\\,dx = \\frac83, \\qquad M_y = \\int_0^2 x^3\\,dx = 4, \\qquad M_x = \\frac12\\int_0^2 x^4\\,dx = \\frac{16}{5}",
          explanation: "The region runs from where the parabola meets the axis, $x = 0$, to $x = 2$.",
          ruleApplied: 'Moments of a region',
        },
        {
          stepNumber: 2,
          title: 'Centroid',
          mathLatex: "\\bar{x} = \\frac{4}{8/3} = \\frac32, \\qquad \\bar{y} = \\frac{16/5}{8/3} = \\frac65",
          explanation: "The region is concentrated low and to the right, so the centroid is right of $x = 1$ and well below the top height $4$.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{A}, \\dfrac{M_x}{A}\\right)$',
          figure: region({
            caption: 'The centroid $\\left(\\frac32, \\frac65\\right)$.',
            f: (x) => x * x,
            from: 0,
            to: 2,
            x: [-0.3, 2.5],
            y: [-0.3, 4.4],
            aspect: 1,
            xTicks: [1, 2],
            yTicks: [1, 2, 3, 4],
            boundary: [{ type: 'fn', f: (x) => x * x, from: 0, to: 2.1, label: 'y = x^2', labelAt: [1.5, 2.25], anchor: 'nw' }],
            centroid: [1.5, 1.2],
          }),
        },
      ],
    },
    {
      id: 'centroid-p03',
      problemNumber: 3,
      difficulty: 'Basic',
      prompt: 'Find the centroid of the triangle bounded by $y = x$, the $x$-axis and the line $x = 3$, and check it against the average of the vertices.',
      questionLatex: "y = x, \\quad y = 0, \\quad x = 3",
      hint: "The vertices are $(0, 0)$, $(3, 0)$ and $(3, 3)$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Area and moments',
          mathLatex: "A = \\frac92, \\qquad M_y = \\int_0^3 x^2\\,dx = 9, \\qquad M_x = \\frac12\\int_0^3 x^2\\,dx = \\frac92",
          explanation: "With $f(x) = x$, both $xf$ and $f^2$ are $x^2$; only the $\\frac12$ differs.",
          ruleApplied: 'Moments of a region',
        },
        {
          stepNumber: 2,
          title: 'Centroid and check',
          mathLatex: "(\\bar{x}, \\bar{y}) = \\left(\\frac{9}{9/2}, \\frac{9/2}{9/2}\\right) = (2, 1) = \\left(\\frac{0 + 3 + 3}{3}, \\frac{0 + 0 + 3}{3}\\right)",
          explanation: "The centroid of any triangle is the average of its vertices, which lies one third of the way from each side to the opposite vertex.",
          ruleApplied: 'Centroid of a triangle',
        },
      ],
    },
    {
      id: 'centroid-p04',
      problemNumber: 4,
      difficulty: 'Exam-Level',
      prompt: 'Find the centroid of the region bounded by $y = 4 - x^2$ and the $x$-axis.',
      questionLatex: "y = 4 - x^2, \\qquad y = 0",
      hint: "Symmetry gives $\\bar{x}$. For $\\bar{y}$ you need $\\frac12\\int (4 - x^2)^2\\,dx$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Symmetry and area',
          mathLatex: "\\bar{x} = 0, \\qquad A = \\int_{-2}^{2}\\left(4 - x^2\\right)dx = \\frac{32}{3}",
          explanation: "The parabola is symmetric about the $y$-axis and meets the $x$-axis at $\\pm 2$.",
          ruleApplied: 'Symmetry theorem',
        },
        {
          stepNumber: 2,
          title: 'Moment about the x-axis',
          mathLatex: "M_x = \\frac12\\int_{-2}^{2}\\left(16 - 8x^2 + x^4\\right)dx = \\int_0^2 \\left(16 - 8x^2 + x^4\\right)dx = 32 - \\frac{64}{3} + \\frac{32}{5} = \\frac{256}{15}",
          explanation: "Expand the square. The $\\frac12$ and the doubling from symmetry cancel.",
          ruleApplied: '$M_x = \\dfrac12\\int_a^b [f(x)]^2\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Centroid',
          mathLatex: "\\bar{y} = \\frac{256/15}{32/3} = \\frac{8}{5} \\qquad\\Longrightarrow\\qquad \\left(0, \\frac85\\right)",
          explanation: "$\\frac85$ is $\\frac25$ of the height $4$, the standard result for a parabolic segment.",
          ruleApplied: '$\\bar{y} = \\dfrac{M_x}{A}$',
          figure: region({
            caption: 'The centroid $\\left(0, \\frac85\\right)$ lies on the axis of symmetry.',
            f: (x) => 4 - x * x,
            from: -2,
            to: 2,
            x: [-2.6, 2.6],
            y: [-0.4, 4.5],
            aspect: 1.2,
            xTicks: [-2, -1, 1, 2],
            yTicks: [1, 2, 3, 4],
            boundary: [{ type: 'fn', f: (x) => 4 - x * x, from: -2.2, to: 2.2, label: 'y = 4 - x^2', labelAt: [1.2, 2.56], anchor: 'ne' }],
            centroid: [0, 1.6],
          }),
        },
      ],
    },
    {
      id: 'centroid-p05',
      problemNumber: 5,
      difficulty: 'Exam-Level',
      prompt: 'Find the centroid of the region bounded by $y = x$ and $y = x^2$.',
      questionLatex: "y = x, \\qquad y = x^2",
      hint: "Top curve $f = x$, bottom $g = x^2$ on $[0, 1]$. $M_x = \\frac12\\int (f^2 - g^2)\\,dx$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Area',
          mathLatex: "A = \\int_0^1 \\left(x - x^2\\right)dx = \\frac16",
          explanation: "The curves meet at $x = 0$ and $x = 1$; the line is on top.",
          ruleApplied: 'Area between two curves',
        },
        {
          stepNumber: 2,
          title: 'Moments',
          mathLatex: "M_y = \\int_0^1 x\\left(x - x^2\\right)dx = \\frac13 - \\frac14 = \\frac{1}{12}, \\qquad M_x = \\frac12\\int_0^1 \\left(x^2 - x^4\\right)dx = \\frac12\\left(\\frac13 - \\frac15\\right) = \\frac{1}{15}",
          explanation: "Square each boundary, then subtract.",
          ruleApplied: 'Moments of a region between two curves',
          pitfall: "$\\frac12\\int_0^1 \\left(x - x^2\\right)^2dx = \\frac{1}{60}$, which squares the difference.",
        },
        {
          stepNumber: 3,
          title: 'Centroid',
          mathLatex: "\\bar{x} = \\frac{1/12}{1/6} = \\frac12, \\qquad \\bar{y} = \\frac{1/15}{1/6} = \\frac25",
          explanation: "The centroid $\\left(\\frac12, \\frac25\\right)$ lies just below the line $y = x$ and above the parabola, inside this thin region.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{A}, \\dfrac{M_x}{A}\\right)$',
          figure: region({
            caption: 'The centroid $\\left(\\frac12, \\frac25\\right)$.',
            f: (x) => x,
            g: (x) => x * x,
            from: 0,
            to: 1,
            x: [-0.2, 1.3],
            y: [-0.2, 1.2],
            xTicks: [0.5, 1],
            yTicks: [0.5, 1],
            boundary: [
              { type: 'fn', f: (x) => x, from: 0, to: 1.15, label: 'y = x', labelAt: [0.3, 0.3], anchor: 'nw' },
              { type: 'fn', f: (x) => x * x, from: 0, to: 1.1, tone: 3, label: 'y = x^2', labelAt: [0.85, 0.72], anchor: 'se' },
            ],
            centroid: [0.5, 0.4],
          }),
        },
      ],
    },
    {
      id: 'centroid-p06',
      problemNumber: 6,
      difficulty: 'Exam-Level',
      prompt: 'Find the centroid of the region under one arch of $y = \\sin x$, $0 \\le x \\le \\pi$.',
      questionLatex: "y = \\sin x, \\qquad 0 \\le x \\le \\pi",
      hint: "The arch is symmetric about $x = \\frac{\\pi}{2}$. For $M_x$ use $\\sin^2 x = \\frac{1 - \\cos 2x}{2}$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Symmetry and area',
          mathLatex: "\\bar{x} = \\frac{\\pi}{2}, \\qquad A = \\int_0^{\\pi}\\sin x\\,dx = 2",
          explanation: "$\\sin(\\pi - x) = \\sin x$, so the arch is symmetric about $x = \\frac\\pi2$.",
          ruleApplied: 'Symmetry theorem',
        },
        {
          stepNumber: 2,
          title: 'Moment about the x-axis',
          mathLatex: "M_x = \\frac12\\int_0^{\\pi}\\sin^2 x\\,dx = \\frac12\\int_0^{\\pi}\\frac{1 - \\cos 2x}{2}\\,dx = \\frac12\\cdot\\frac{\\pi}{2} = \\frac{\\pi}{4}",
          explanation: "Power-reducing identity from Unit 2.3; the $\\cos 2x$ term integrates to $0$ over $[0, \\pi]$.",
          ruleApplied: '$\\sin^2 x = \\dfrac{1 - \\cos 2x}{2}$',
        },
        {
          stepNumber: 3,
          title: 'Centroid',
          mathLatex: "\\bar{y} = \\frac{\\pi/4}{2} = \\frac{\\pi}{8} \\approx 0.39 \\qquad\\Longrightarrow\\qquad \\left(\\frac{\\pi}{2}, \\frac{\\pi}{8}\\right)",
          explanation: "Below half the height of the arch, since the region is wider near the axis.",
          ruleApplied: '$\\bar{y} = \\dfrac{M_x}{A}$',
          figure: region({
            caption: 'The centroid $\\left(\\frac{\\pi}{2}, \\frac{\\pi}{8}\\right)$.',
            f: Math.sin,
            from: 0,
            to: Math.PI,
            x: [-0.2, 3.5],
            y: [-0.2, 1.2],
            aspect: 2,
            xTicks: piTicks(1, 2),
            yTicks: [0.5, 1],
            boundary: [
              { type: 'fn', f: Math.sin, from: 0, to: Math.PI, label: 'y = \\sin x', labelAt: [2.5, 0.6], anchor: 'ne' },
              { type: 'vline', x: Math.PI / 2 },
            ],
            centroid: [Math.PI / 2, Math.PI / 8],
          }),
        },
      ],
    },
    {
      id: 'centroid-p07',
      problemNumber: 7,
      difficulty: 'Exam-Level',
      prompt: 'A homogeneous lamina has the shape of the region bounded by $y = \\sqrt{x}$, the $x$-axis and the line $x = 4$, and its density is 3 kg/m². Find its mass and center of mass.',
      questionLatex: "y = \\sqrt{x}, \\quad y = 0, \\quad x = 4, \\qquad \\rho = 3",
      hint: "Mass is $\\rho A$. The center of mass of a homogeneous lamina is the centroid; the density cancels.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass',
          mathLatex: "A = \\int_0^4 \\sqrt{x}\\,dx = \\frac{16}{3}, \\qquad M = \\rho A = 3\\cdot\\frac{16}{3} = 16 \\text{ kg}",
          explanation: "For a lamina, density is mass per unit area.",
          ruleApplied: 'Mass of a homogeneous lamina',
        },
        {
          stepNumber: 2,
          title: 'Moments of mass',
          mathLatex: "M_y = \\rho\\int_0^4 x\\sqrt{x}\\,dx = 3\\cdot\\frac{64}{5} = \\frac{192}{5}, \\qquad M_x = \\frac{\\rho}{2}\\int_0^4 x\\,dx = \\frac32\\cdot 8 = 12",
          explanation: "Each moment of the lamina is $\\rho$ times the moment of the region. $\\left(\\sqrt{x}\\right)^2 = x$.",
          ruleApplied: 'Moments of a lamina',
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{192/5}{16} = \\frac{12}{5}, \\qquad \\bar{y} = \\frac{12}{16} = \\frac34",
          explanation: "The same as the centroid of the region: compute it without $\\rho$ and you get $\\frac{64/5}{16/3} = \\frac{12}{5}$ and $\\frac{4}{16/3} = \\frac34$.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{M}, \\dfrac{M_x}{M}\\right)$',
          pitfall: "Dividing the moments of mass by the area instead of the mass, which gives values $3$ times too big.",
        },
      ],
    },
    {
      id: 'centroid-p08',
      problemNumber: 8,
      difficulty: 'Exam-Level',
      prompt: 'Find the centroid of the region bounded by $y = 2x$ and $y = x^2$.',
      questionLatex: "y = 2x, \\qquad y = x^2",
      hint: "On $[0, 2]$ the line is on top. Use the between-curves formulas.",
      steps: [
        {
          stepNumber: 1,
          title: 'Area',
          mathLatex: "A = \\int_0^2 \\left(2x - x^2\\right)dx = 4 - \\frac83 = \\frac43",
          explanation: "The curves meet at $x = 0$ and $x = 2$.",
          ruleApplied: 'Area between two curves',
        },
        {
          stepNumber: 2,
          title: 'Moments',
          mathLatex: "M_y = \\int_0^2 \\left(2x^2 - x^3\\right)dx = \\frac{16}{3} - 4 = \\frac43, \\qquad M_x = \\frac12\\int_0^2 \\left(4x^2 - x^4\\right)dx = \\frac12\\left(\\frac{32}{3} - \\frac{32}{5}\\right) = \\frac{32}{15}",
          explanation: "$M_y$: multiply $f - g$ by $x$. $M_x$: square each curve, subtract, halve.",
          ruleApplied: 'Moments of a region between two curves',
        },
        {
          stepNumber: 3,
          title: 'Centroid',
          mathLatex: "\\bar{x} = \\frac{4/3}{4/3} = 1, \\qquad \\bar{y} = \\frac{32/15}{4/3} = \\frac85",
          explanation: "$\\bar{x} = 1$: the vertical gap $2x - x^2 = 1 - (x - 1)^2$ is symmetric about $x = 1$.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{A}, \\dfrac{M_x}{A}\\right)$',
          figure: region({
            caption: 'The centroid $\\left(1, \\frac85\\right)$.',
            f: (x) => 2 * x,
            g: (x) => x * x,
            from: 0,
            to: 2,
            x: [-0.3, 2.5],
            y: [-0.3, 4.4],
            aspect: 1,
            xTicks: [1, 2],
            yTicks: [1, 2, 3, 4],
            boundary: [
              { type: 'fn', f: (x) => 2 * x, from: 0, to: 2.2, label: 'y = 2x', labelAt: [0.8, 1.6], anchor: 'nw' },
              { type: 'fn', f: (x) => x * x, from: 0, to: 2.1, tone: 3, label: 'y = x^2', labelAt: [1.6, 2.56], anchor: 'se' },
            ],
            centroid: [1, 1.6],
          }),
        },
      ],
    },
    {
      id: 'centroid-p09',
      problemNumber: 9,
      difficulty: 'Exam-Level',
      prompt: 'Find the centroid of the region under $y = e^x$ from $x = 0$ to $x = 1$.',
      questionLatex: "y = e^x, \\qquad 0 \\le x \\le 1",
      hint: "$M_y$ needs integration by parts; $M_x$ needs $\\left(e^x\\right)^2 = e^{2x}$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Area',
          mathLatex: "A = \\int_0^1 e^x\\,dx = e - 1",
          explanation: "$e^0 = 1$ at the lower limit.",
          ruleApplied: '$\\int e^x\\,dx = e^x + C$',
        },
        {
          stepNumber: 2,
          title: 'Moment about the y-axis',
          mathLatex: "M_y = \\int_0^1 xe^x\\,dx = \\Big[xe^x - e^x\\Big]_0^1 = (e - e) - (0 - 1) = 1",
          explanation: "Parts with $u = x$, $dv = e^x\\,dx$.",
          ruleApplied: 'Integration by parts',
        },
        {
          stepNumber: 3,
          title: 'Moment about the x-axis',
          mathLatex: "M_x = \\frac12\\int_0^1 e^{2x}\\,dx = \\frac14\\Big[e^{2x}\\Big]_0^1 = \\frac{e^2 - 1}{4}",
          explanation: "$\\left(e^x\\right)^2 = e^{2x}$, and $\\int e^{2x}\\,dx = \\frac12 e^{2x}$.",
          ruleApplied: '$M_x = \\dfrac12\\int_a^b [f(x)]^2\\,dx$',
          pitfall: "Writing $\\left(e^x\\right)^2 = e^{x^2}$.",
        },
        {
          stepNumber: 4,
          title: 'Centroid',
          mathLatex: "\\bar{x} = \\frac{1}{e - 1} \\approx 0.58, \\qquad \\bar{y} = \\frac{(e^2 - 1)/4}{e - 1} = \\frac{e + 1}{4} \\approx 0.93",
          explanation: "$e^2 - 1 = (e - 1)(e + 1)$ simplifies $\\bar{y}$. $\\bar{x} > \\frac12$ because the region is taller on the right.",
          ruleApplied: '$(\\bar{x}, \\bar{y}) = \\left(\\dfrac{M_y}{A}, \\dfrac{M_x}{A}\\right)$',
          figure: region({
            caption: 'The centroid $\\left(\\frac{1}{e - 1}, \\frac{e + 1}{4}\\right) \\approx (0.58, 0.93)$.',
            f: Math.exp,
            from: 0,
            to: 1,
            x: [-0.3, 1.4],
            y: [-0.2, 3],
            aspect: 1,
            xTicks: [0.5, 1],
            yTicks: [1, 2],
            boundary: [
              { type: 'fn', f: Math.exp, from: -0.3, to: 1.1, label: 'y = e^x', labelAt: [1.05, 2.86], anchor: 'e' },
              { type: 'vline', x: 1 },
            ],
            centroid: [1 / (Math.E - 1), (Math.E + 1) / 4],
          }),
        },
      ],
    },
    {
      id: 'centroid-p10',
      problemNumber: 10,
      difficulty: 'Challenge',
      prompt: 'Find the centroid of the quarter-disk $x^2 + y^2 \\le r^2$, $x \\ge 0$, $y \\ge 0$.',
      questionLatex: "x^2 + y^2 \\le r^2, \\qquad x \\ge 0, \\quad y \\ge 0",
      hint: "The quarter-disk is symmetric about the line $y = x$, so $\\bar{x} = \\bar{y}$. Compute just one moment.",
      steps: [
        {
          stepNumber: 1,
          title: 'Use symmetry',
          mathLatex: "\\bar{x} = \\bar{y}",
          explanation: "Swapping $x$ and $y$ leaves $x^2 + y^2 \\le r^2$, $x, y \\ge 0$ unchanged, so the line $y = x$ is an axis of symmetry and the centroid lies on it.",
          ruleApplied: 'Symmetry theorem',
          figure: {
            kind: 'plot',
            caption: 'Drawn with $r = 2$. The line $y = x$ cuts the quarter-disk into mirror images.',
            x: [-0.3, 2.5],
            y: [-0.3, 2.5],
            equal: true,
            xTicks: [[2, 'r']],
            yTicks: [[2, 'r']],
            items: [
              { type: 'area', f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), from: 0, to: 2 },
              { type: 'fn', f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), from: 0, to: 2 },
              { type: 'fn', f: (x) => x, from: 0, to: 2.3, tone: 'ink', dashed: true, width: 1.5, label: 'y = x', labelAt: [2.2, 2.2], anchor: 'w' },
            ],
          },
        },
        {
          stepNumber: 2,
          title: 'Area and one moment',
          mathLatex: "A = \\frac{\\pi r^2}{4}, \\qquad M_x = \\frac12\\int_0^r \\left(r^2 - x^2\\right)dx = \\frac12\\left(r^3 - \\frac{r^3}{3}\\right) = \\frac{r^3}{3}",
          explanation: "Squaring $\\sqrt{r^2 - x^2}$ removes the root. $r$ is a constant.",
          ruleApplied: '$M_x = \\dfrac12\\int_a^b [f(x)]^2\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Centroid',
          mathLatex: "\\bar{y} = \\frac{r^3/3}{\\pi r^2/4} = \\frac{4r}{3\\pi} \\qquad\\Longrightarrow\\qquad (\\bar{x}, \\bar{y}) = \\left(\\frac{4r}{3\\pi}, \\frac{4r}{3\\pi}\\right) \\approx (0.42r, 0.42r)",
          explanation: "Check $M_y$ directly: $\\int_0^r x\\sqrt{r^2 - x^2}\\,dx = \\left[-\\frac13\\left(r^2 - x^2\\right)^{3/2}\\right]_0^r = \\frac{r^3}{3}$, the same as $M_x$. The $\\bar{y}$ agrees with the half-disk of Worked Example 3: cutting it in half along the $y$-axis does not change the height of the centroid.",
          ruleApplied: '$u$-substitution',
          pitfall: "Using $A = \\frac{\\pi r^2}{2}$, the area of a half-disk.",
        },
      ],
    },
  ],
};
