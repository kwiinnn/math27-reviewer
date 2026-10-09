import type { Topic } from '../../types/curriculum';
import type { PlotFigure, PlotItem, Vec } from '../../types/figure';
import { fmt } from '../../lib/plot';

/** Natural length of the drawn spring, in plot units. */
const SPRING_L0 = 3.5;

/** A spring fixed to a wall at x = 0, stretched s plot units, with a block on the end. */
function spring(s: number): PlotItem[] {
  const end = SPRING_L0 + s;
  return [
    { type: 'spring', from: [0, 0], to: [end, 0] },
    { type: 'polygon', points: [[end, -0.5], [end + 0.8, -0.5], [end + 0.8, 0.5], [end, 0.5]], tone: 2, outline: true },
    { type: 'segment', from: [SPRING_L0, -1.05], to: [end, -1.05], tone: 2, width: 2, label: 'x', anchor: 's' },
  ];
}

/** Windows on a building whose wall runs from x0 to x1 and from the roof at y = 0 down to y = bottom. */
function windows(x0: number, x1: number, bottom: number, w: number, h: number, rows: number): PlotItem[] {
  const cols = 2;
  const items: PlotItem[] = [];
  for (let r = 0; r < rows; r++) {
    const top = bottom * ((r + 0.4) / rows);
    for (let c = 0; c < cols; c++) {
      const left = x0 + ((x1 - x0) * (c + 0.5)) / cols - w / 2;
      items.push({ type: 'polygon', points: [[left, top], [left + w, top], [left + w, top - h], [left, top - h]], tone: 'muted' });
    }
  }
  return items;
}

/** A chain or cable hanging from a beam on a roof: 1 plot unit = 10 ft. */
function cable(caption: string, at?: number, kind: 'chain' | 'cable' = 'cable'): PlotFigure {
  // The piece of length about 8 ft at depth x, as fractions of the 100 ft length.
  const piece = (x: number): Vec => [(x - 4) / 100, (x + 4) / 100];
  const hang = (x?: number): PlotItem =>
    kind === 'chain'
      ? { type: 'chain', from: [2, 0], to: [2, -10], mark: x === undefined ? undefined : piece(x) }
      : { type: 'rope', from: [2, 0], to: [2, -10], mark: x === undefined ? undefined : piece(x) };
  const slice = (x: number): PlotItem[] => [
    hang(x),
    { type: 'segment', from: [2.8, -x / 10], to: [2.8, 0], tone: 2, width: 1.5, arrow: true, label: 'x', anchor: 'e' },
    { type: 'segment', from: [2.25, -x / 10], to: [2.75, -x / 10], tone: 'muted', width: 1, dashed: true },
  ];
  return {
    kind: 'plot',
    caption,
    axes: false,
    aspect: 0.75,
    x: [-0.4, 4.6],
    y: [-11, 1.2],
    items: [
      { type: 'polygon', points: [[-0.4, 0], [1.6, 0], [1.6, -11], [-0.4, -11]], tone: 'muted' },
      ...windows(-0.4, 1.6, -11, 0.36, 0.55, 7),
      { type: 'support', from: [1.6, 0], to: [2.35, 0] },
      { type: 'label', at: [1.6, 0], text: '\\text{roof}', anchor: 'nw' },
      ...(at === undefined ? [] : slice(at)),
    ],
    ...(at === undefined
      ? {
          animate: {
            param: 'x',
            range: [5, 95] as Vec,
            initial: 60,
            duration: 7,
            frame: slice,
            readout: (x: number) => `The piece $${fmt(x, 0)}$ ft down weighs $2\\,\\Delta x$ lb and is lifted $${fmt(x, 0)}$ ft, so it takes about $${fmt(2 * x, 0)}\\,\\Delta x$ ft-lb.`,
          },
        }
      : {}),
  };
}

/** The conical tank of Worked Example 5: height 10 m, top radius 4 m, water 8 m deep. x is depth below the top. */
function cone(caption: string, at?: number): PlotFigure {
  const slice = (x: number): PlotItem[] => {
    const y = 10 - x;
    const r = 0.4 * y;
    return [
      { type: 'polygon', points: [[-r, y - 0.18], [r, y - 0.18], [r, y + 0.18], [-r, y + 0.18]], tone: 2, outline: true },
      { type: 'segment', from: [0, y], to: [r, y], tone: 2, width: 2, label: 'r', anchor: 'n' },
      { type: 'segment', from: [4.9, y], to: [4.9, 10], tone: 2, width: 1.5, arrow: true, label: 'x', anchor: 'e' },
      { type: 'segment', from: [r, y], to: [4.9, y], tone: 'muted', dashed: true, width: 1 },
    ];
  };
  return {
    kind: 'plot',
    caption,
    axes: false,
    equal: true,
    x: [-5.8, 6.6],
    y: [-0.8, 11],
    items: [
      { type: 'liquid', points: [[0, 0], [3.2, 8], [-3.2, 8]] },
      { type: 'segment', from: [0, 0], to: [4, 10], tone: 'ink', width: 2 },
      { type: 'segment', from: [0, 0], to: [-4, 10], tone: 'ink', width: 2 },
      { type: 'segment', from: [-4, 10], to: [4, 10], tone: 'ink', width: 1.5, dashed: true, label: '8\\text{ m across}', anchor: 'n' },
      { type: 'segment', from: [-5, 0], to: [-5, 10], tone: 'ink', width: 1.2, label: '10', anchor: 'w' },
      { type: 'segment', from: [-4.5, 0], to: [-4.5, 8], tone: 1, width: 1.2, label: '8', anchor: 'e' },
      ...(at === undefined ? [] : slice(at)),
    ],
    ...(at === undefined
      ? {
          animate: {
            param: 'x',
            range: [2.2, 9.8] as Vec,
            initial: 5,
            duration: 7,
            frame: slice,
            readout: (x: number) => {
              const r = 0.4 * (10 - x);
              return `A layer $${fmt(x, 1)}$ m below the top has radius $r = \\frac25(10 - x) = ${fmt(r)}$ m and must be lifted $${fmt(x, 1)}$ m.`;
            },
          },
        }
      : {}),
  };
}

/** Problem 5: a 50 ft rope over the edge of a roof, 1 plot unit = 10 ft. */
const ropeOverEdge: PlotFigure = {
  kind: 'plot',
  caption: 'The rope hangs $50$ ft down the wall. Only the top half (highlighted) is pulled up onto the roof.',
  axes: false,
  aspect: 0.85,
  x: [-2.6, 2.4],
  y: [-5.8, 0.9],
  items: [
    { type: 'polygon', points: [[-2.6, 0], [0, 0], [0, -5.8], [-2.6, -5.8]], tone: 'muted' },
    ...windows(-2.6, 0, -5.8, 0.4, 0.42, 5),
    { type: 'label', at: [-1.3, 0], text: '\\text{roof}', anchor: 'n' },
    // Each piece runs to the far edge of the other so the corner is filled.
    { type: 'rope', kind: 'rope', from: [-0.9, 0.04], to: [0.103, 0.04] },
    { type: 'rope', kind: 'rope', from: [0.07, 0.077], to: [0.07, -5], mark: [0, 2.577 / 5.077] },
    { type: 'segment', from: [0.7, 0], to: [0.7, -2.5], tone: 2, width: 1.5, label: '25\\text{ ft, top half}', anchor: 'e' },
    { type: 'segment', from: [0.7, -2.5], to: [0.7, -5], tone: 'ink', width: 1.5, label: '25\\text{ ft}', anchor: 'e' },
    { type: 'segment', from: [0.55, -2.5], to: [0.85, -2.5], tone: 'ink', width: 1.5 },
  ],
};

/** Problem 6: coal lifted up a 500 ft shaft by a winch, not to scale. */
const mineShaft: PlotFigure = {
  kind: 'plot',
  caption: 'Not to scale: the shaft is $500$ ft deep. The cable runs over the pulley to a winch at the surface.',
  axes: false,
  aspect: 0.8,
  x: [-3, 3],
  y: [-5.5, 1.9],
  items: [
    { type: 'polygon', points: [[-3, 0], [-0.95, 0], [-0.95, -5.5], [-3, -5.5]], tone: 'muted' },
    { type: 'polygon', points: [[0.95, 0], [3, 0], [3, -5.5], [0.95, -5.5]], tone: 'muted' },
    { type: 'support', from: [-3, 0], to: [-0.95, 0], side: 'right' },
    { type: 'support', from: [0.95, 0], to: [3, 0], side: 'right' },
    { type: 'support', from: [-0.95, 0], to: [-0.95, -5.5], side: 'right' },
    { type: 'support', from: [0.95, 0], to: [0.95, -5.5] },
    { type: 'segment', from: [-1.15, 0], to: [-0.04, 1.3], tone: 'ink', width: 2.5 },
    { type: 'segment', from: [1.15, 0], to: [0.04, 1.3], tone: 'ink', width: 2.5 },
    { type: 'rope', from: [0.12, 1.41], to: [1.9, 0.32], width: 3 },
    { type: 'rope', from: [-0.158, 1.3], to: [-0.158, -4.46], width: 3 },
    { type: 'pulley', at: [0, 1.3] },
    { type: 'pulley', at: [1.9, 0.2], radius: 9 },
    { type: 'label', at: [2.05, 0.2], text: '\\text{winch}', anchor: 'e' },
    { type: 'bucket', at: [-0.158, -5], size: 28, fill: 0.8, contents: 'coal' },
    { type: 'label', at: [0.05, -4.8], text: '800\\text{ lb}', anchor: 'e' },
    { type: 'segment', from: [-1.6, 0], to: [-1.6, -5], tone: 'ink', width: 1.2, label: '500\\text{ ft}', anchor: 'w' },
  ],
};

/** Problem 7: a leaking bucket lifted 40 ft, 1 plot unit = 10 ft. */
const leakyBucket: PlotFigure = {
  kind: 'plot',
  caption: 'The bucket is lifted $40$ ft while water drips out at a steady rate. It starts full and arrives empty. Drag $x$ to raise it.',
  axes: false,
  aspect: 0.8,
  x: [-2.2, 2.2],
  y: [-0.5, 5.5],
  items: [
    { type: 'support', from: [-1.6, 5.1], to: [1.6, 5.1] },
    { type: 'segment', from: [0, 5.1], to: [0, 4.65], tone: 'ink', width: 2 },
    { type: 'support', from: [-1.8, 0], to: [1.8, 0], side: 'right' },
    { type: 'rope', kind: 'rope', from: [-0.1, 4.7], to: [-1.5, 0.29], width: 3 },
    { type: 'pulley', at: [-1.5, 0.2], radius: 9 },
    { type: 'label', at: [-1.62, 0.2], text: '\\text{winch}', anchor: 'w' },
  ],
  animate: {
    param: 'x',
    range: [0, 40],
    initial: 15,
    duration: 7,
    restart: true,
    frame: (x) => {
      const y = x / 10;
      const left = 1 - x / 40;
      return [
        { type: 'rope', kind: 'rope', from: [0.116, 4.65], to: [0.116, y + 0.46], width: 3 },
        { type: 'pulley', at: [0, 4.65] },
        { type: 'bucket', at: [0.116, y], fill: left, leak: left > 0.02 },
        ...(x > 1.5 ? [{ type: 'segment' as const, from: [1.1, 0] as Vec, to: [1.1, y] as Vec, tone: 2 as const, width: 1.5, arrow: true, label: 'x', anchor: 'e' as const }] : []),
      ];
    },
    readout: (x) => `The bucket is $${fmt(x, 0)}$ ft up and ${x < 0.5 ? 'full' : x > 39.5 ? 'empty' : `$${fmt(100 * (1 - x / 40), 0)}\\%$ full`}.`,
  },
};

/** Unit 3.6 — Work. Source: lecture deck 3.6 (Examples 2 to 5 solved here). */
export const work: Topic = {
  id: 'work',
  title: 'Work',
  slug: 'work',
  unitNumber: '3.6',
  summary:
    "Work is force times distance when the force is constant. When the force varies with position, or different parts of an object move different distances, cut the job into small pieces, treat each as constant-force work, and add: $W = \\int_a^b f(x)\\,dx$. Springs (Hooke's law), cables and chains, and pumping liquid out of tanks are the standard cases.",

  examNotes: [
    {
      title: 'Work done by a constant force',
      concept:
        "If a constant force $F$ moves an object a distance $d$ in the direction of the force, the work done is $W = Fd$. Lifting an object means pushing against gravity, so the force is its weight: $F = mg$ for a mass $m$, with $g = 9.8$ m/s² (or $32$ ft/s²).",
      table: {
        head: ['System', 'Force', 'Distance', 'Work'],
        rows: [
          ['SI', 'newton (N) $= $ kg·m/s²', 'meter', 'joule (J) $= $ N·m'],
          ['BES', 'pound (lb)', 'foot', 'foot-pound (ft-lb) $\\approx 1.36$ J'],
          ['CGS', 'dyne', 'centimeter', 'erg $= $ dyne·cm'],
        ],
      },
      conditions: "Newton's second law: $F = m\\dfrac{d^2s}{dt^2}$, mass times acceleration. A force of $1$ N gives a mass of $1$ kg an acceleration of $1$ m/s².",
      commonTraps: [
        "Multiplying a weight in pounds by $g$. Pounds are already a force; only a mass (kg, slug, g) needs $\\times g$.",
        "Forgetting $g$ when the object is given in kilograms.",
        "Mixing centimeters and meters in one calculation.",
      ],
      tip: "Ask first: is the quantity given a mass or a weight? That decides whether $g$ appears.",
    },
    {
      title: 'Work done by a variable force',
      concept:
        "If a force $f(x)$, continuous in $x$, acts along the $x$-axis as an object moves from $x = a$ to $x = b$, cut $[a, b]$ into pieces of width $\\Delta x$. On each piece the force is nearly constant, so the work there is about $f(x_i^*)\\,\\Delta x$. Adding and taking the limit:",
      display: "W = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i^*)\\,\\Delta x = \\int_a^b f(x)\\,dx",
      conditions: "The work is the area under the graph of force against position. The units are force units times distance units.",
      commonTraps: [
        "Multiplying the force at one point by the whole distance.",
        "Getting the limits from times or from the force values instead of from positions.",
      ],
      tip: "Every work problem in this unit is the same sentence: force on a piece, times the distance that piece moves, added up.",
      figure: {
        kind: 'plot',
        caption: 'The work is the area under the force graph. On a short piece the force is almost constant, so that piece of work is about $f(x)\\,\\Delta x$.',
        x: [-0.3, 4.6],
        y: [-0.4, 5.4],
        aspect: 1.5,
        xTicks: [[1, 'a'], [4, 'b']],
        yTicks: [],
        items: [
          { type: 'area', f: (x) => 1 + (x * x) / 4, from: 1, to: 4 },
          { type: 'fn', f: (x) => 1 + (x * x) / 4, from: 0, to: 4.3, label: 'f(x)', labelAt: [3.6, 4.24], anchor: 'nw' },
          { type: 'vline', x: 1 },
          { type: 'vline', x: 4 },
        ],
        animate: {
          param: 'x',
          range: [1.1, 3.9],
          initial: 2.8,
          duration: 7,
          frame: (x) => [{ type: 'polygon', points: [[x - 0.1, 0], [x - 0.1, 1 + (x * x) / 4], [x + 0.1, 1 + (x * x) / 4], [x + 0.1, 0]], tone: 2, outline: true }],
          readout: (x) => `At $x = ${fmt(x)}$ the force is $${fmt(1 + (x * x) / 4)}$; over $\\Delta x = 0.2$ it does about $${fmt(0.2 * (1 + (x * x) / 4), 3)}$ units of work.`,
        },
      },
    },
    {
      title: "Hooke's law: springs",
      concept:
        "The force needed to hold a spring stretched $x$ units beyond its natural length is proportional to $x$: $f(x) = kx$, where $k > 0$ is the spring constant. The work to stretch it from $x = a$ to $x = b$ beyond natural length is",
      display: "W = \\int_a^b kx\\,dx = \\frac{k}{2}\\left(b^2 - a^2\\right)",
      conditions: "Hooke's law holds as long as $x$ is not too large. $x$ is the stretch beyond the natural length, never the total length of the spring.",
      commonTraps: [
        "Using total lengths as limits. From $15$ cm to $18$ cm on a spring of natural length $10$ cm is $x = 0.05$ to $x = 0.08$ m.",
        "Finding $k$ with the total length instead of the stretch.",
        "Mixing cm and m: $k$ in N/m needs $x$ in meters.",
      ],
      tip: "Two steps, always: find $k$ from the given force and stretch, then integrate $kx$ between the two stretches.",
      figure: {
        kind: 'plot',
        caption: 'The spring of Worked Example 3 ($k = 800$ N/m), drawn stretched $x$ beyond its natural length. The force grows with $x$, so equal extra stretches cost more and more work.',
        axes: false,
        equal: true,
        x: [-0.4, 7],
        y: [-1.6, 1],
        items: [
          { type: 'support', from: [0, -0.5], to: [0, 0.9] },
          { type: 'support', from: [0, -0.5], to: [6.9, -0.5], side: 'right' },
          { type: 'segment', from: [SPRING_L0, -1.1], to: [SPRING_L0, 0.8], tone: 'muted', dashed: true, width: 1, label: '\\text{natural length}', labelAt: [SPRING_L0, 0.8], anchor: 'n' },
        ],
        animate: {
          param: 'x',
          range: [0, 2.5],
          initial: 1,
          duration: 6,
          frame: spring,
          readout: (s) => {
            const x = s / 50;
            return `$x = ${fmt(100 * x, 1)}$ cm: holding force $kx = ${fmt(800 * x, 1)}$ N; work so far $\\frac{k}{2}x^2 = ${fmt(400 * x * x, 3)}$ J.`;
          },
        },
      },
    },
    {
      title: 'Lifting cables and chains',
      concept:
        "When a hanging cable is pulled up, different pieces travel different distances. Measure $x$ down from the top. The piece at depth $x$ of length $\\Delta x$ weighs $w\\,\\Delta x$, where $w$ is the weight per unit length, and it is lifted $x$:",
      display: "W = \\int_0^L w\\,x\\,dx = \\frac{wL^2}{2}",
      conditions: "$w = \\dfrac{\\text{total weight}}{\\text{length}}$. A load hanging on the end adds its weight times the full distance it is lifted, a constant-force term.",
      commonTraps: [
        "Multiplying the cable's total weight by its full length. Only the bottom piece goes that far; the result is twice the right answer.",
        "Pulling up only part of a cable and forgetting that the bottom part still rises: it moves the full distance pulled.",
        "Using the length of the cable as the distance for a load when the shaft is a different depth.",
      ],
      tip: "$\\frac{wL^2}{2}$ is the cable's weight $wL$ times $\\frac{L}{2}$: the work is the same as lifting the whole cable from its midpoint, its center of mass.",
      figure: cable('A $100$ ft chain weighing $2$ lb/ft hanging from a roof. The highlighted links, $x$ ft down, are lifted $x$ ft; links lower down travel farther. (Not to scale horizontally.)', undefined, 'chain'),
    },
    {
      title: 'Pumping liquid from a tank',
      concept:
        "Cut the liquid into thin horizontal layers. A layer at depth $x$ below the outlet with cross-sectional area $A(x)$ and thickness $\\Delta x$ has volume $A(x)\\,\\Delta x$, weight $\\rho g A(x)\\,\\Delta x$ (density times $g$ times volume), and must be lifted the distance $D(x)$ to the outlet:",
      display: "W = \\int_a^b \\rho g\\,A(x)\\,D(x)\\,dx",
      conditions: "Water: $\\rho = 1000$ kg/m³ and $g = 9.8$ m/s², so $\\rho g = 9800$ N/m³; in BES its weight density is $62.5$ lb/ft³ (already a force). The limits cover only where liquid is; $D(x)$ is measured to where it is pumped, which may be above the tank.",
      commonTraps: [
        "Integrating over the whole tank when it is only partly full.",
        "Getting the radius of a layer wrong in a cone: use similar triangles from the vertex.",
        "Measuring the lifting distance to the bottom instead of to the outlet, or forgetting a spout above the top.",
      ],
      tip: "Put $x = 0$ at the outlet and measure down. Then $D(x) = x$ (plus the spout height, if any) and only $A(x)$ depends on the shape.",
      figure: cone('Cross-section of the conical tank of Worked Example 5. By similar triangles the layer $x$ m below the top has radius $r = \\frac25(10 - x)$.'),
    },
  ],

  keyFormulas: [
    {
      id: 'work-constant',
      name: 'Constant force',
      formulaLatex: "W = Fd, \\qquad F = mg \\text{ when lifting a mass } m",
      whenToUse: "A constant force acting through a distance in its own direction.",
      restrictions: "Weights in pounds are already forces; masses need $g$.",
      example: "W = (1.2)(9.8)(0.7) \\approx 8.2 \\text{ J}",
    },
    {
      id: 'work-variable',
      name: 'Variable force',
      formulaLatex: "W = \\int_a^b f(x)\\,dx",
      whenToUse: "The force depends on position along a line.",
      restrictions: "$f$ continuous on $[a, b]$; $x$ is position.",
      example: "\\int_1^3 \\left(x^2 + 2x\\right)dx = \\frac{50}{3} \\text{ ft-lb}",
    },
    {
      id: 'work-hooke',
      name: "Hooke's law",
      formulaLatex: "f(x) = kx, \\qquad W = \\int_a^b kx\\,dx = \\frac{k}{2}\\left(b^2 - a^2\\right)",
      whenToUse: "Stretching or compressing a spring.",
      restrictions: "$x$ is the stretch beyond natural length.",
      example: "40 = k(0.05) \\Rightarrow k = 800: \\quad \\int_{0.05}^{0.08} 800x\\,dx = 1.56 \\text{ J}",
    },
    {
      id: 'work-cable',
      name: 'Lifting a hanging cable',
      formulaLatex: "W = \\int_0^L w\\,x\\,dx = \\frac{wL^2}{2}",
      whenToUse: "A uniform cable or chain of weight $w$ per unit length pulled to the top.",
      restrictions: "$x$ measured down from the top.",
      example: "w = 2,\\; L = 100: \\quad W = 10\\,000 \\text{ ft-lb}",
    },
    {
      id: 'work-pump',
      name: 'Pumping liquid',
      formulaLatex: "W = \\int_a^b \\rho g\\,A(x)\\,D(x)\\,dx",
      whenToUse: "Emptying a tank by pumping liquid to an outlet.",
      restrictions: "$A(x)$ is the area of the layer, $D(x)$ its lifting distance; integrate only over the liquid.",
      example: "\\text{cone}: \\quad 9800\\pi\\int_2^{10} x\\left[\\tfrac25(10 - x)\\right]^2dx \\approx 3.36\\times 10^6 \\text{ J}",
    },
  ],

  workedExamples: [
    {
      id: 'work-we-1',
      title: 'Constant force: mass and weight',
      prompt: "(a) How much work is done in lifting a 1.2-kg book off the floor to put it on a desk that is 0.7 m high? Use $g = 9.8$ m/s². (b) How much work is done in lifting a 20-lb weight 6 ft off the ground?",
      problemLatex: "\\text{(a) } m = 1.2 \\text{ kg},\\; d = 0.7 \\text{ m} \\qquad \\text{(b) } F = 20 \\text{ lb},\\; d = 6 \\text{ ft}",
      keyIdea: "In (a) a mass is given, so the force is $mg$. In (b) a weight is given, which is already a force.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: '(a) Force on the book',
          mathLatex: "F = mg = (1.2)(9.8) = 11.76 \\text{ N}",
          explanation: "The lifting force is equal and opposite to gravity's pull on the book.",
          ruleApplied: "Newton's second law",
        },
        {
          stepNumber: 2,
          title: '(a) Work',
          mathLatex: "W = Fd = (11.76)(0.7) \\approx 8.2 \\text{ J}",
          explanation: "Newtons times meters gives joules.",
          ruleApplied: '$W = Fd$',
        },
        {
          stepNumber: 3,
          title: '(b) Work',
          mathLatex: "W = Fd = 20\\cdot 6 = 120 \\text{ ft-lb}",
          explanation: "Unlike (a), there is no need to multiply by $g$: the weight, a force, is given, not the mass.",
          ruleApplied: '$W = Fd$',
          pitfall: "Computing $20\\cdot 32\\cdot 6$.",
        },
      ],
    },
    {
      id: 'work-we-2',
      title: 'A variable force',
      prompt: "When a particle is located a distance $x$ feet from the origin, a force of $x^2 + 2x$ pounds acts on it. How much work is done in moving it from $x = 1$ to $x = 3$?",
      problemLatex: "f(x) = x^2 + 2x, \\qquad 1 \\le x \\le 3",
      keyIdea: "The force changes with position, so integrate it over the path.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Set up',
          mathLatex: "W = \\int_1^3 \\left(x^2 + 2x\\right)dx",
          explanation: "Force in pounds, distance in feet: the work is in foot-pounds.",
          ruleApplied: '$W = \\int_a^b f(x)\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Evaluate',
          mathLatex: "\\left[\\frac{x^3}{3} + x^2\\right]_1^3 = (9 + 9) - \\left(\\frac13 + 1\\right) = \\frac{50}{3} \\approx 16.7 \\text{ ft-lb}",
          explanation: "Check: the force rises from $3$ to $15$ lb over $2$ ft, so the work is between $6$ and $30$ ft-lb.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'work-we-3',
      title: 'Stretching a spring',
      prompt: "A force of 40 N is required to hold a spring that has been stretched from its natural length of 10 cm to a length of 15 cm. How much work is done in stretching the spring from 15 cm to 18 cm?",
      problemLatex: "f(0.05) = 40 \\text{ N}; \\qquad \\text{stretch from } 15 \\text{ cm to } 18 \\text{ cm}",
      keyIdea: "Convert lengths to stretches beyond $10$ cm, in meters: $0.05$ m and $0.08$ m.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Find the spring constant',
          mathLatex: "40 = k(0.05) \\;\\Longrightarrow\\; k = 800 \\text{ N/m}",
          explanation: "At length $15$ cm the stretch is $15 - 10 = 5$ cm $= 0.05$ m.",
          ruleApplied: "Hooke's law",
          pitfall: "Using $x = 0.15$, the total length.",
        },
        {
          stepNumber: 2,
          title: 'Set up',
          mathLatex: "W = \\int_{0.05}^{0.08} 800x\\,dx",
          explanation: "From length $15$ cm to $18$ cm is stretch $0.05$ m to $0.08$ m.",
          ruleApplied: '$W = \\int_a^b kx\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Evaluate',
          mathLatex: "400x^2\\Big|_{0.05}^{0.08} = 400(0.0064 - 0.0025) = 1.56 \\text{ J}",
          explanation: "Stretching from $0$ to $0.05$ m took only $1$ J; the next $3$ cm take more because the force is larger.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'work-we-4',
      title: 'Lifting a cable',
      prompt: "A 200-lb cable is 100 ft long and hangs vertically from the top of a tall building. How much work is required to lift the cable to the top of the building?",
      problemLatex: "\\text{weight } 200 \\text{ lb}, \\qquad L = 100 \\text{ ft}",
      keyIdea: "The cable weighs $2$ lb/ft. The piece $x$ ft below the top is lifted $x$ ft.",
      figure: cable('The piece of cable $x$ ft below the roof (highlighted) has length $\\Delta x$, weighs $2\\,\\Delta x$ lb, and is lifted $x$ ft.', 60),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Weight of a piece',
          mathLatex: "w = \\frac{200}{100} = 2 \\text{ lb/ft}, \\qquad \\text{piece at depth } x: \\; 2\\,\\Delta x \\text{ lb}",
          explanation: "A uniform cable has the same weight per foot everywhere.",
          ruleApplied: 'Weight per unit length',
        },
        {
          stepNumber: 2,
          title: 'Work on a piece',
          mathLatex: "\\Delta W \\approx (2\\,\\Delta x)\\,x",
          explanation: "Force (its weight) times the distance it travels to the roof.",
          ruleApplied: '$W = Fd$',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "W = \\int_0^{100} 2x\\,dx = x^2\\Big|_0^{100} = 10\\,000 \\text{ ft-lb}",
          explanation: "The same as lifting $200$ lb through $50$ ft, the distance the cable's midpoint rises.",
          ruleApplied: 'Riemann sum to integral',
          pitfall: "$200 \\times 100 = 20\\,000$ ft-lb, as if every piece rose the full $100$ ft.",
        },
      ],
    },
    {
      id: 'work-we-5',
      title: 'Emptying a conical tank',
      prompt: "A tank has the shape of an inverted circular cone with height 10 m and base radius 4 m. It is filled with water to a height of 8 m. Find the work required to empty the tank by pumping all of the water to the top of the tank. (The density of water is 1000 kg/m³.)",
      problemLatex: "\\text{cone: } h = 10,\\; r = 4; \\qquad \\text{water depth } 8; \\qquad \\rho = 1000",
      keyIdea: "Measure $x$ down from the top. Water fills $2 \\le x \\le 10$. A layer at depth $x$ is a thin disk lifted $x$ m.",
      figure: cone('The layer $x$ m below the top. Water occupies $2 \\le x \\le 10$.', 5),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Radius of a layer',
          mathLatex: "\\frac{r}{10 - x} = \\frac{4}{10} \\;\\Longrightarrow\\; r = \\frac25(10 - x)",
          explanation: "The layer is $10 - x$ m above the vertex. Similar triangles: radius over height is $\\frac{4}{10}$ throughout the cone.",
          ruleApplied: 'Similar triangles',
          pitfall: "Using $r = \\frac25 x$, measured from the top instead of the vertex.",
        },
        {
          stepNumber: 2,
          title: 'Work on a layer',
          mathLatex: "\\Delta W \\approx \\underbrace{1000(9.8)\\,\\pi\\left[\\tfrac25(10 - x)\\right]^2\\Delta x}_{\\text{weight of the layer}}\\cdot\\underbrace{x}_{\\text{distance}} = 1568\\pi\\,x(10 - x)^2\\,\\Delta x",
          explanation: "Volume $\\pi r^2\\Delta x$, mass $1000$ times that, weight $9.8$ times the mass. $9800\\cdot\\frac{4}{25} = 1568$.",
          ruleApplied: 'Weight $= \\rho g V$',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "W = 1568\\pi\\int_2^{10} x(10 - x)^2\\,dx = 1568\\pi\\int_2^{10}\\left(100x - 20x^2 + x^3\\right)dx",
          explanation: "The limits start at $x = 2$: the top $2$ m of the tank are empty.",
          ruleApplied: 'Riemann sum to integral',
          pitfall: "Integrating from $0$ to $10$, as if the tank were full.",
        },
        {
          stepNumber: 4,
          title: 'Evaluate',
          mathLatex: "\\left[50x^2 - \\frac{20x^3}{3} + \\frac{x^4}{4}\\right]_2^{10} = \\frac{2500}{3} - \\frac{452}{3} = \\frac{2048}{3}, \\qquad W = \\frac{3\\,211\\,264\\pi}{3} \\approx 3.36\\times 10^6 \\text{ J}",
          explanation: "At $10$: $5000 - \\frac{20000}{3} + 2500 = \\frac{2500}{3}$. At $2$: $200 - \\frac{160}{3} + 4 = \\frac{452}{3}$.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
  ],

  problems: [
    {
      id: 'work-p01',
      problemNumber: 1,
      difficulty: 'Basic',
      prompt: 'How much work is done in lifting a 5-kg box 3 m straight up? Use $g = 9.8$ m/s².',
      questionLatex: "m = 5 \\text{ kg}, \\qquad d = 3 \\text{ m}",
      hint: "A mass is given, so you need its weight.",
      steps: [
        {
          stepNumber: 1,
          title: 'Weight',
          mathLatex: "F = mg = 5(9.8) = 49 \\text{ N}",
          explanation: "Kilograms measure mass, not force.",
          ruleApplied: "Newton's second law",
        },
        {
          stepNumber: 2,
          title: 'Work',
          mathLatex: "W = Fd = 49(3) = 147 \\text{ J}",
          explanation: "Constant force, so no integral is needed.",
          ruleApplied: '$W = Fd$',
          pitfall: "Answering $15$, which is mass times distance.",
        },
      ],
    },
    {
      id: 'work-p02',
      problemNumber: 2,
      difficulty: 'Basic',
      prompt: 'A force of $\\dfrac{5}{x^2}$ newtons acts on a particle $x$ meters from the origin. Find the work done in moving it from $x = 1$ to $x = 10$.',
      questionLatex: "f(x) = \\frac{5}{x^2}, \\qquad 1 \\le x \\le 10",
      hint: "Write the force as $5x^{-2}$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Integrate',
          mathLatex: "W = \\int_1^{10} 5x^{-2}\\,dx = \\left[-\\frac{5}{x}\\right]_1^{10} = -\\frac12 + 5 = \\frac92 \\text{ J}",
          explanation: "The force weakens with distance, so most of the work is done near $x = 1$.",
          ruleApplied: '$W = \\int_a^b f(x)\\,dx$',
          pitfall: "Integrating $x^{-2}$ as $\\ln x$.",
        },
      ],
    },
    {
      id: 'work-p03',
      problemNumber: 3,
      difficulty: 'Basic',
      prompt: 'A spring has natural length 20 cm. A force of 25 N holds it at a length of 30 cm. How much work is done in stretching it from its natural length to 30 cm?',
      questionLatex: "f(0.1) = 25 \\text{ N}; \\qquad 20 \\text{ cm} \\to 30 \\text{ cm}",
      hint: "Stretches in meters: from $0$ to $0.1$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Spring constant',
          mathLatex: "25 = k(0.1) \\;\\Longrightarrow\\; k = 250 \\text{ N/m}",
          explanation: "The stretch at $30$ cm is $10$ cm $= 0.1$ m.",
          ruleApplied: "Hooke's law",
        },
        {
          stepNumber: 2,
          title: 'Work',
          mathLatex: "W = \\int_0^{0.1} 250x\\,dx = 125(0.1)^2 = 1.25 \\text{ J}",
          explanation: "From natural length means from stretch $0$.",
          ruleApplied: '$W = \\int_a^b kx\\,dx$',
          pitfall: "$W = Fd = 25(0.1) = 2.5$ J, as if the full force acted the whole way.",
        },
      ],
    },
    {
      id: 'work-p04',
      problemNumber: 4,
      difficulty: 'Exam-Level',
      prompt: 'It takes 2 J of work to stretch a spring from its natural length of 30 cm to a length of 42 cm. How much work is needed to stretch it from 35 cm to 40 cm?',
      questionLatex: "\\int_0^{0.12} kx\\,dx = 2; \\qquad 35 \\text{ cm} \\to 40 \\text{ cm}",
      hint: "This time the work is given, not a force. Use it to find $k$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Find k from the work',
          mathLatex: "\\frac{k}{2}(0.12)^2 = 2 \\;\\Longrightarrow\\; k = \\frac{4}{0.0144} = \\frac{2500}{9} \\approx 277.8 \\text{ N/m}",
          explanation: "From $30$ cm to $42$ cm is stretch $0$ to $0.12$ m.",
          ruleApplied: "Hooke's law",
        },
        {
          stepNumber: 2,
          title: 'Work for the new stretch',
          mathLatex: "W = \\int_{0.05}^{0.10} kx\\,dx = \\frac{k}{2}\\left(0.01 - 0.0025\\right) = \\frac{1250}{9}(0.0075) = \\frac{25}{24} \\approx 1.04 \\text{ J}",
          explanation: "$35$ cm and $40$ cm are stretches of $0.05$ m and $0.10$ m.",
          ruleApplied: '$W = \\dfrac{k}{2}\\left(b^2 - a^2\\right)$',
          pitfall: "Using $0.35$ and $0.40$ as limits.",
        },
      ],
    },
    {
      id: 'work-p05',
      problemNumber: 5,
      difficulty: 'Exam-Level',
      prompt: 'A rope 50 ft long weighing 0.5 lb/ft hangs over the edge of a tall building. How much work is done in pulling up only the top half of the rope?',
      questionLatex: "L = 50 \\text{ ft},\\; w = 0.5 \\text{ lb/ft}; \\qquad \\text{pull up } 25 \\text{ ft}",
      hint: "The top half is lifted piece by piece. The bottom half moves up as a whole, $25$ ft.",
      figure: ropeOverEdge,
      steps: [
        {
          stepNumber: 1,
          title: 'Top half',
          mathLatex: "W_1 = \\int_0^{25} 0.5x\\,dx = 0.25x^2\\Big|_0^{25} = 156.25 \\text{ ft-lb}",
          explanation: "The piece at depth $x \\le 25$ is lifted $x$ ft.",
          ruleApplied: 'Lifting a cable',
        },
        {
          stepNumber: 2,
          title: 'Bottom half',
          mathLatex: "W_2 = (0.5 \\cdot 25)(25) = 312.5 \\text{ ft-lb}",
          explanation: "Every piece of the bottom half rises the same $25$ ft, so this is a constant force: its weight, $12.5$ lb.",
          ruleApplied: '$W = Fd$',
          pitfall: "Leaving out the bottom half because it is not pulled to the top.",
        },
        {
          stepNumber: 3,
          title: 'Total',
          mathLatex: "W = 156.25 + 312.5 = 468.75 \\text{ ft-lb}",
          explanation: "Pulling up the whole rope would take $\\frac{0.5(50)^2}{2} = 625$ ft-lb; the top half costs most of that because the bottom half has to come along.",
          ruleApplied: 'Additivity of work',
        },
      ],
    },
    {
      id: 'work-p06',
      problemNumber: 6,
      difficulty: 'Exam-Level',
      prompt: 'A cable that weighs 2 lb/ft is used to lift 800 lb of coal up a mine shaft 500 ft deep. Find the work done.',
      questionLatex: "w = 2 \\text{ lb/ft}, \\quad \\text{load } 800 \\text{ lb}, \\quad 500 \\text{ ft}",
      hint: "Two parts: the coal (constant force) and the cable (integral).",
      figure: mineShaft,
      steps: [
        {
          stepNumber: 1,
          title: 'The coal',
          mathLatex: "W_{\\text{coal}} = 800(500) = 400\\,000 \\text{ ft-lb}",
          explanation: "The coal is lifted the full $500$ ft at constant weight.",
          ruleApplied: '$W = Fd$',
        },
        {
          stepNumber: 2,
          title: 'The cable',
          mathLatex: "W_{\\text{cable}} = \\int_0^{500} 2x\\,dx = 250\\,000 \\text{ ft-lb}",
          explanation: "The piece of cable $x$ ft below the top is lifted $x$ ft.",
          ruleApplied: 'Lifting a cable',
        },
        {
          stepNumber: 3,
          title: 'Total',
          mathLatex: "W = 650\\,000 \\text{ ft-lb}",
          explanation: "Work done on separate parts of a system adds.",
          ruleApplied: 'Additivity of work',
        },
      ],
    },
    {
      id: 'work-p07',
      problemNumber: 7,
      difficulty: 'Exam-Level',
      prompt: 'A bucket weighing 5 lb is filled with 20 lb of water and lifted 40 ft at a constant speed. Water leaks out at a constant rate, and the bucket is just empty when it reaches the top. Find the work done.',
      questionLatex: "\\text{bucket } 5 \\text{ lb}, \\quad \\text{water } 20 \\text{ lb} \\to 0, \\quad 40 \\text{ ft}",
      hint: "At height $x$, how much water is left? The force depends on $x$.",
      figure: leakyBucket,
      steps: [
        {
          stepNumber: 1,
          title: 'Force at height x',
          mathLatex: "f(x) = 5 + 20\\left(1 - \\frac{x}{40}\\right) = 25 - \\frac{x}{2}",
          explanation: "Constant speed and constant leak rate mean the water decreases linearly with height, from $20$ lb at $x = 0$ to $0$ at $x = 40$.",
          ruleApplied: 'Linear model',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "W = \\int_0^{40}\\left(25 - \\frac{x}{2}\\right)dx = 1000 - 400 = 600 \\text{ ft-lb}",
          explanation: "Check: the average force is $\\frac{25 + 5}{2} = 15$ lb over $40$ ft.",
          ruleApplied: '$W = \\int_a^b f(x)\\,dx$',
          pitfall: "Using $25(40) = 1000$ ft-lb, as if no water leaked.",
        },
      ],
    },
    {
      id: 'work-p08',
      problemNumber: 8,
      difficulty: 'Exam-Level',
      prompt: 'A rectangular tank 4 m long, 2 m wide and 3 m deep is full of water. Find the work needed to pump all of the water out over the top.',
      questionLatex: "4 \\times 2 \\times 3 \\text{ m}, \\qquad \\text{full}, \\qquad \\rho g = 9800 \\text{ N/m}^3",
      hint: "Every layer has the same area $8$ m². The layer at depth $x$ is lifted $x$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Layer',
          mathLatex: "\\Delta W \\approx 9800\\,(4\\cdot 2\\,\\Delta x)\\,x = 78\\,400\\,x\\,\\Delta x",
          explanation: "Weight density times volume of the layer, times the distance to the top.",
          ruleApplied: 'Pumping liquid',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "W = 78\\,400\\int_0^3 x\\,dx = 78\\,400\\cdot\\frac92 = 352\\,800 \\text{ J}",
          explanation: "The same as lifting all $24$ m³ of water ($235\\,200$ N) through $1.5$ m, the depth of its center of mass.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'work-p09',
      problemNumber: 9,
      difficulty: 'Exam-Level',
      prompt: 'A cylindrical tank with radius 3 m and height 5 m is full of water. Find the work needed to pump the water out through a spout 1 m above the top of the tank.',
      questionLatex: "r = 3, \\quad h = 5, \\qquad \\text{spout } 1 \\text{ m above the top}",
      hint: "Measure $x$ down from the top of the tank. The layer at depth $x$ is lifted $x + 1$.",
      figure: {
        kind: 'plot',
        caption: 'Cross-section of the tank. Each layer must be lifted to the spout, $1$ m above the top.',
        axes: false,
        equal: true,
        x: [-4.4, 5],
        y: [-0.6, 6.8],
        items: [
          { type: 'liquid', points: [[-3, 0], [3, 0], [3, 5], [-3, 5]] },
          { type: 'segment', from: [-3, 0], to: [-3, 5], tone: 'ink', width: 2 },
          { type: 'segment', from: [3, 0], to: [3, 5], tone: 'ink', width: 2 },
          { type: 'segment', from: [-3, 0], to: [3, 0], tone: 'ink', width: 2, label: '6', anchor: 's' },
          { type: 'polygon', points: [[-0.16, 5], [0.16, 5], [0.16, 6], [-0.16, 6]], tone: 'ink', outline: true },
          { type: 'label', at: [0, 6], text: '\\text{spout}', anchor: 'n' },
          { type: 'segment', from: [-3.7, 0], to: [-3.7, 5], tone: 'ink', width: 1.2, label: '5', anchor: 'w' },
          { type: 'segment', from: [0.55, 5], to: [0.55, 6], tone: 'ink', width: 1.2, label: '1', anchor: 'e' },
        ],
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Layer',
          mathLatex: "\\Delta W \\approx 9800\\,\\pi(3)^2\\Delta x\\,(x + 1) = 88\\,200\\pi\\,(x + 1)\\,\\Delta x",
          explanation: "Every layer is a disk of radius $3$. It rises $x$ to the top and then $1$ more to the spout.",
          ruleApplied: 'Pumping liquid',
          pitfall: "Using $x$ as the distance and forgetting the spout.",
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "W = 88\\,200\\pi\\int_0^5 (x + 1)\\,dx = 88\\,200\\pi\\left(\\frac{25}{2} + 5\\right) = 1\\,543\\,500\\pi \\approx 4.85\\times 10^6 \\text{ J}",
          explanation: "The water's center of mass is $2.5$ m below the top, so it rises $3.5$ m on average: $9800\\cdot 45\\pi\\cdot 3.5$ gives the same.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'work-p10',
      problemNumber: 10,
      difficulty: 'Challenge',
      prompt: 'A hemispherical tank of radius 2 m, flat side up, is full of water. Find the work needed to pump all the water out over the top.',
      questionLatex: "\\text{hemisphere, } R = 2 \\text{ m}, \\qquad \\text{full}",
      hint: "Measure $x$ down from the top. The layer at depth $x$ is a disk of radius $\\sqrt{4 - x^2}$.",
      figure: {
        kind: 'plot',
        caption: 'Cross-section of the tank: a half-disk of radius $2$ with the flat side at the top.',
        axes: false,
        equal: true,
        x: [-2.8, 3.2],
        y: [-2.5, 0.7],
        items: [
          { type: 'liquid', points: Array.from({ length: 61 }, (_, i): Vec => [-2 * Math.cos((Math.PI * i) / 60), -2 * Math.sin((Math.PI * i) / 60)]) },
          { type: 'fn', f: (x) => -Math.sqrt(4 - x * x), from: -2, to: 2, tone: 'ink' },
          { type: 'segment', from: [-2, 0], to: [2, 0], tone: 'ink', width: 2 },
          { type: 'segment', from: [0, 0], to: [2, 0], tone: 'muted', width: 1, label: '2', anchor: 'n' },
        ],
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Radius of a layer',
          mathLatex: "r(x) = \\sqrt{4 - x^2}, \\qquad 0 \\le x \\le 2",
          explanation: "With the center of the sphere at the top, a layer at depth $x$ meets the sphere where $r^2 + x^2 = 4$.",
          ruleApplied: 'Pythagorean theorem',
        },
        {
          stepNumber: 2,
          title: 'Set up',
          mathLatex: "W = \\int_0^2 9800\\,\\pi\\left(4 - x^2\\right)x\\,dx",
          explanation: "Weight of the layer times the distance $x$ to the top.",
          ruleApplied: 'Pumping liquid',
        },
        {
          stepNumber: 3,
          title: 'Evaluate',
          mathLatex: "9800\\pi\\left[2x^2 - \\frac{x^4}{4}\\right]_0^2 = 9800\\pi(8 - 4) = 39\\,200\\pi \\approx 1.23\\times 10^5 \\text{ J}",
          explanation: "Check: the water weighs $9800\\cdot\\frac{16\\pi}{3}$ N and its center of mass is $\\frac{3R}{8} = 0.75$ m below the top; their product is $39\\,200\\pi$.",
          ruleApplied: 'Fundamental Theorem of Calculus',
          pitfall: "Using $r = 2 - x$, as if the side were a straight line.",
        },
      ],
    },
  ],
};
