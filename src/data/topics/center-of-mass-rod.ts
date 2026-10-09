import type { Topic } from '../../types/curriculum';
import type { PlotFigure, PlotItem, Vec } from '../../types/figure';
import { fmt } from '../../lib/plot';

/** [mass, position] of a particle on the x-axis. */
type Particle = [number, number];

/** A fulcrum: a small triangle with its tip at (x, y). */
const fulcrum = (x: number, y = 0, label?: string): PlotItem[] => [
  { type: 'polygon', points: [[x, y], [x - 0.25, y - 0.45], [x + 0.25, y - 0.45]], tone: 1, outline: true },
  ...(label ? [{ type: 'label' as const, at: [x, y - 0.45] as Vec, text: label, anchor: 's' as const }] : []),
];

/**
 * Particles as blocks on a weightless rod along the x-axis. With `at` the
 * fulcrum is drawn there; without it the fulcrum slides along the rod and the
 * readout gives the net moment about it.
 */
function seesaw(caption: string, ps: Particle[], x: Vec, at?: number): PlotFigure {
  const block = ([m, px]: Particle): PlotItem[] => {
    const w = 0.17 * Math.sqrt(m);
    return [
      { type: 'polygon', points: [[px - w, 0.06], [px + w, 0.06], [px + w, 0.06 + 2 * w], [px - w, 0.06 + 2 * w]], tone: 2, outline: true },
      { type: 'label', at: [px, 0.06 + 2 * w], text: `${m}`, anchor: 'n' },
      // The fulcrum label takes this spot when the fulcrum sits right under the block.
      ...(at !== undefined && Math.abs(px - at) < 0.4 ? [] : [{ type: 'label' as const, at: [px, -0.05] as Vec, text: `${px}`, anchor: 's' as const }]),
    ];
  };
  const M = ps.reduce((s, [m]) => s + m, 0);
  const M0 = ps.reduce((s, [m, px]) => s + m * px, 0);
  return {
    kind: 'plot',
    caption,
    axes: false,
    equal: true,
    x,
    y: [-1.1, 1.5],
    items: [
      { type: 'segment', from: [x[0] + 0.3, 0], to: [x[1] - 0.3, 0], tone: 'ink', width: 4 },
      { type: 'point', at: [0, 0], tone: 'ink', hollow: true },
      ...ps.flatMap(block),
      ...(at === undefined ? [] : fulcrum(at, -0.04, '\\bar{x}')),
    ],
    ...(at === undefined
      ? {
          animate: {
            param: 'p',
            range: [x[0] + 0.6, x[1] - 0.6] as Vec,
            initial: x[1] - 2,
            duration: 8,
            frame: (p: number) => fulcrum(p, -0.04, 'p'),
            readout: (p: number) => {
              const net = M0 - p * M;
              const side = Math.abs(net) < 0.15 ? 'balanced: $p = \\bar{x}$.' : net > 0 ? 'the right end goes down.' : 'the left end goes down.';
              return `Net moment about $p = ${fmt(p, 1)}$: $\\sum m_i(x_i - p) = ${fmt(net, 1)}$, so ${side}`;
            },
          },
        }
      : {}),
  };
}

/** A rod on [0, L] with its density graph above it and a fulcrum at the center of mass. */
function densityRod(caption: string, rho: (x: number) => number, L: number, top: number, xbar: number, label: string): PlotFigure {
  const gap = 0.1 * top;
  return {
    kind: 'plot',
    caption,
    axes: false,
    aspect: 1.6,
    x: [-0.12 * L, 1.12 * L],
    y: [-0.42 * top, 1.12 * top],
    items: [
      { type: 'area', f: rho, from: 0, to: L },
      { type: 'fn', f: rho, from: 0, to: L, label, labelAt: [0.45 * L, rho(0.45 * L)], anchor: 'nw' },
      { type: 'segment', from: [0, 0], to: [L, 0], tone: 'muted', width: 1 },
      { type: 'segment', from: [0, -gap], to: [L, -gap], tone: 'ink', width: 6 },
      { type: 'label', at: [0, -gap], text: '0', anchor: 'w' },
      { type: 'label', at: [L, -gap], text: `${L}`, anchor: 'e' },
      { type: 'polygon', points: [[xbar, -gap - 0.02 * top], [xbar - 0.05 * L, -gap - 0.2 * top], [xbar + 0.05 * L, -gap - 0.2 * top]], tone: 1, outline: true },
      { type: 'label', at: [xbar, -gap - 0.2 * top], text: '\\bar{x}', anchor: 's' },
    ],
  };
}

/** The rod of Worked Example 2: 4 m long, external point P 2 m beyond the left end. */
const rodWithPoint = (caption: string): PlotFigure => ({
  kind: 'plot',
  caption,
  axes: false,
  equal: true,
  x: [-2.8, 4.6],
  y: [-1.1, 0.9],
  items: [
    { type: 'segment', from: [-2.5, 0], to: [4.4, 0], tone: 'muted', width: 1, dashed: true },
    { type: 'segment', from: [0, 0], to: [4, 0], tone: 'ink', width: 6 },
    { type: 'point', at: [-2, 0], tone: 2, label: 'P', anchor: 'n' },
    { type: 'label', at: [0, 0.12], text: '0', anchor: 'n' },
    { type: 'label', at: [4, 0.12], text: '4', anchor: 'n' },
    { type: 'segment', from: [-2, -0.35], to: [0, -0.35], tone: 'ink', width: 1.5, label: '2', anchor: 's' },
    { type: 'point', at: [2.6, 0], tone: 1 },
    { type: 'label', at: [2.6, 0.12], text: 'x', anchor: 'n' },
    { type: 'segment', from: [-2, -0.75], to: [2.6, -0.75], tone: 2, width: 1.5, label: 'x + 2', anchor: 's' },
  ],
});

/** Unit 3.3 — Center of mass of a rod. Source: lecture deck 3.3 (examples solved here). */
export const centerOfMassRod: Topic = {
  id: 'center-of-mass-rod',
  title: 'Center of Mass of a Rod',
  slug: 'center-of-mass-rod',
  unitNumber: '3.3',
  summary:
    "The center of mass of a system is its balance point: the place where a fulcrum would hold it level. For particles on a line it is the moment $\\sum m_ix_i$ divided by the total mass. A rod whose density $\\rho(x)$ varies along its length is cut into short pieces of mass $\\rho(x)\\,dx$, so both the mass and the moment become integrals and $\\bar{x} = \\dfrac{\\int x\\rho(x)\\,dx}{\\int \\rho(x)\\,dx}$.",

  examNotes: [
    {
      title: 'Mean-value theorem for integrals',
      concept:
        "If $f$ is continuous on $[a, b]$, there is a number $c$ in $[a, b]$ such that $\\int_a^b f(x)\\,dx = f(c)(b - a)$. The rectangle of height $f(c)$ on the same base has the same area as the region under the curve. $f(c)$ is the average value of $f$ on $[a, b]$:",
      display: "f(c) = \\frac{1}{b - a}\\int_a^b f(x)\\,dx",
      conditions: "$f$ must be continuous on the closed interval. The theorem says $c$ exists; to find it, compute the average value and solve $f(c) = $ average for $c$ in $[a, b]$.",
      commonTraps: [
        "Answering with the average value $f(c)$ when the question asks for $c$, or the reverse.",
        "Keeping a solution $c$ that lies outside $[a, b]$.",
        "Dividing by $b$ instead of $b - a$.",
      ],
      tip: "This is why a sum like $\\sum \\rho(w_i)\\Delta x_i$ works: on each short piece there is a point $w_i$ whose density, times the length, gives exactly the mass of that piece.",
      figure: {
        kind: 'plot',
        caption: 'The rectangle of height $f(c)$ (orange outline) has the same area as the region under $y = f(x)$: the part of the curve above the rectangle exactly fills the gap below it.',
        x: [-0.3, 3.5],
        y: [-0.3, 3.6],
        aspect: 1.2,
        xTicks: [[0, 'a'], [Math.sqrt(3), 'c'], [3, 'b']],
        yTicks: [[1.75, 'f(c)']],
        items: [
          { type: 'area', f: (x) => 1 + (x * x) / 4, from: 0, to: 3 },
          { type: 'polygon', points: [[0, 0], [0, 1.75], [3, 1.75], [3, 0]], tone: 2, outline: true },
          { type: 'fn', f: (x) => 1 + (x * x) / 4, from: 0, to: 3.3, label: 'y = f(x)', labelAt: [3.05, 3.33], anchor: 'w' },
          { type: 'segment', from: [Math.sqrt(3), 0], to: [Math.sqrt(3), 1.75], tone: 'muted', dashed: true, width: 1.5 },
          { type: 'point', at: [Math.sqrt(3), 1.75], tone: 2 },
        ],
      },
    },
    {
      title: 'Moment and center of mass of particles on a line',
      concept:
        "A mass $m$ at position $x$ has moment $mx$ about the origin: its tendency to turn the line about the origin. For particles $m_1, \\dots, m_n$ at $x_1, \\dots, x_n$, the moment of mass is $M_0 = \\sum m_ix_i$. The center of mass $\\bar{x}$ is the point where the whole mass, concentrated, would have the same moment: $\\bar{x}\\sum m_i = \\sum m_ix_i$, so",
      display: "\\bar{x} = \\frac{\\sum_{i=1}^{n} m_ix_i}{\\sum_{i=1}^{n} m_i} = \\frac{M_0}{M}",
      conditions: "Positions are signed: particles left of the origin have negative $x_i$ and contribute negative moment. $\\bar{x}$ is the balance point: a fulcrum there holds the line level.",
      commonTraps: [
        "Dropping the signs of negative positions.",
        "Dividing by the number of particles instead of the total mass. That is only right when all masses are equal.",
        "Reporting $M_0$ as the answer. The center of mass is $M_0$ divided by $M$.",
      ],
      tip: "$\\bar{x}$ must lie between the leftmost and rightmost particles, and closer to the heavier ones. Check that before moving on.",
      figure: seesaw(
        'Slide the fulcrum. Its net moment $\\sum m_i(x_i - p) = M_0 - pM$ is zero only at $p = \\bar{x} = \\frac{M_0}{M} = \\frac{3}{6} = 0.5$. Masses in kg; the hollow dot is the origin.',
        [[3, -2], [1, 1], [2, 4]],
        [-3.2, 5.2],
      ),
    },
    {
      title: 'Mass of a rod',
      concept:
        "If $\\rho(x)$ kilograms per meter is the linear density at the point $x$ meters from one end, and $\\rho$ is continuous on $[0, L]$, then a short piece of length $\\Delta x$ near $w_i$ has mass about $\\rho(w_i)\\,\\Delta x$. Adding the pieces and taking the limit:",
      display: "M = \\lim_{n\\to\\infty}\\sum_{i=1}^{n}\\rho(w_i)\\,\\Delta x_i = \\int_0^L \\rho(x)\\,dx",
      conditions: "Density is mass per unit length. The mass of the rod is the area under the graph of $\\rho$. A uniform rod has constant $\\rho$ and mass $\\rho L$.",
      commonTraps: [
        "Multiplying the density at one point by the length. That is only right for a uniform rod.",
        "Mixing units: $\\rho$ in g/cm with $x$ in m.",
        "Measuring $x$ from the wrong end, so that the density formula is reversed.",
      ],
      tip: "By the mean-value theorem, $M = \\rho(c)\\,L$ for some $c$: the mass is the average density times the length. For a linear density the average is just the mean of the end values.",
      figure: {
        kind: 'plot',
        caption: 'The mass of the rod is the area under the density graph. A short piece at $x$ contributes $\\rho(x)\\,\\Delta x$.',
        x: [-0.4, 4.6],
        y: [-0.5, 3.6],
        aspect: 1.5,
        xTicks: [1, 2, 3, 4],
        yTicks: [1, 2, 3],
        items: [
          { type: 'area', f: (x) => 1 + x / 2, from: 0, to: 4 },
          { type: 'fn', f: (x) => 1 + x / 2, from: 0, to: 4, label: '\\rho(x)', labelAt: [4, 3], anchor: 'nw' },
          { type: 'segment', from: [0, 0], to: [4, 0], tone: 'ink', width: 5 },
        ],
        animate: {
          param: 'x',
          range: [0.1, 3.9],
          initial: 2.4,
          duration: 7,
          frame: (x) => [{ type: 'polygon', points: [[x - 0.1, 0], [x - 0.1, 1 + x / 2], [x + 0.1, 1 + x / 2], [x + 0.1, 0]], tone: 2, outline: true }],
          readout: (x) => `At $x = ${fmt(x)}$: $\\rho = ${fmt(1 + x / 2)}$, so a piece of length $\\Delta x = 0.2$ has mass about $${fmt(0.2 * (1 + x / 2), 3)}$.`,
        },
      },
    },
    {
      title: 'Moment and center of mass of a rod',
      concept:
        "The piece at $x$ has mass $\\rho(x)\\,dx$ and moment $x\\rho(x)\\,dx$ about the origin. Adding them gives the moment of mass of the rod, and dividing by the mass gives its center of mass:",
      display: "M_0 = \\int_0^L x\\rho(x)\\,dx, \\qquad \\bar{x} = \\frac{M_0}{M} = \\frac{\\int_0^L x\\rho(x)\\,dx}{\\int_0^L \\rho(x)\\,dx}",
      conditions: "Moment of mass is measured in kilogram-meters (or slug-feet, gram-centimeters). $\\bar{x}$ is a position on the rod, in the same length unit as $x$, measured from the same origin.",
      commonTraps: [
        "Forgetting the extra factor $x$ in the moment integral.",
        "Dividing by the length $L$ instead of the mass $M$.",
        "Not saying where $\\bar{x}$ is measured from. \"$\\frac73$ m from the end nearer the external point\" is a complete answer; \"$\\frac73$\" is not.",
      ],
      tip: "If the density increases along the rod, $\\bar{x}$ is past the midpoint, toward the denser end. A density proportional to $x$ puts $\\bar{x}$ at $\\frac{2L}{3}$.",
      figure: {
        kind: 'plot',
        caption: 'A rod of density $\\rho(x) = 1 + x$ on $[0, 4]$, with its density graph above. Slide the fulcrum: the net moment $M_0 - pM = \\frac{88}{3} - 12p$ vanishes at $\\bar{x} = \\frac{22}{9} \\approx 2.44$, past the midpoint toward the denser end.',
        x: [-0.4, 4.6],
        y: [-1.3, 5.4],
        aspect: 1.4,
        xTicks: [],
        yTicks: [],
        axes: false,
        items: [
          { type: 'area', f: (x) => 1 + x, from: 0, to: 4, tone: 1 },
          { type: 'fn', f: (x) => 1 + x, from: 0, to: 4, label: '\\rho(x) = 1 + x', labelAt: [2.6, 3.6], anchor: 'nw' },
          { type: 'segment', from: [0, 0], to: [4, 0], tone: 'muted', width: 1 },
          { type: 'segment', from: [0, -0.35], to: [4, -0.35], tone: 'ink', width: 6 },
          { type: 'label', at: [0, -0.35], text: '0', anchor: 'w' },
          { type: 'label', at: [4, -0.35], text: '4', anchor: 'e' },
        ],
        animate: {
          param: 'p',
          range: [0.5, 3.5],
          initial: 1.2,
          duration: 7,
          frame: (p) => fulcrum(p, -0.42, 'p'),
          readout: (p) => {
            const net = 88 / 3 - 12 * p;
            const side = Math.abs(net) < 0.4 ? 'balanced: $p = \\bar{x}$.' : net > 0 ? 'the right end goes down.' : 'the left end goes down.';
            return `About $p = ${fmt(p)}$: net moment $\\frac{88}{3} - 12p = ${fmt(net, 1)}$, so ${side}`;
          },
        },
      },
    },
    {
      title: 'Reading the density from words',
      concept:
        "\"Varies directly as\" means proportional: $\\rho = k \\times (\\text{that quantity})$. Place the rod on $[0, L]$, write the quantity in terms of $x$, then use the one given density value to find $k$.",
      table: {
        head: ['System', 'Force', 'Acceleration', 'Mass'],
        rows: [
          ['BES (British)', 'pound (lb)', 'ft/sec$^2$', 'slug'],
          ['SI', 'newton (N)', 'm/sec$^2$', 'kilogram (kg)'],
          ['CGS', 'dyne', 'cm/sec$^2$', 'gram (g)'],
        ],
      },
      conditions: "Distance from an external point $P$ at $x = -d$ is $x + d$; distance from the end $x = L$ is $L - x$. Density is mass per length: kg/m, slug/ft, or g/cm. Moments are kg·m, slug·ft, or g·cm.",
      commonTraps: [
        "Measuring the distance from the end of the rod instead of from the external point.",
        "Using the given density at the wrong end when finding $k$.",
        "Treating pounds as a unit of mass. In BES the unit of mass is the slug.",
      ],
      tip: "Draw the rod on a number line with the external point marked. Writing the distance as a length on the sketch avoids almost every set-up error.",
    },
  ],

  keyFormulas: [
    {
      id: 'rod-mvt',
      name: 'Mean-value theorem for integrals',
      formulaLatex: "\\int_a^b f(x)\\,dx = f(c)(b - a) \\quad \\text{for some } c \\in [a, b]",
      whenToUse: "Average value of a function, or finding the $c$ that the theorem guarantees.",
      restrictions: "$f$ continuous on $[a, b]$.",
      example: "f(x) = x \\text{ on } [0, 4]: \\quad 8 = c(4) \\;\\Longrightarrow\\; c = 2",
    },
    {
      id: 'rod-particles',
      name: 'Center of mass of particles on a line',
      formulaLatex: "M_0 = \\sum_{i=1}^{n} m_ix_i, \\qquad \\bar{x} = \\frac{\\sum m_ix_i}{\\sum m_i}",
      whenToUse: "Point masses at known positions on a line.",
      restrictions: "Positions are signed.",
      example: "\\bar{x} = \\frac{3(-2) + 1(1) + 2(4)}{3 + 1 + 2} = \\frac{3}{6} = \\frac12",
    },
    {
      id: 'rod-mass',
      name: 'Mass of a rod',
      formulaLatex: "M = \\int_0^L \\rho(x)\\,dx",
      whenToUse: "A rod of length $L$ with linear density $\\rho(x)$.",
      restrictions: "$\\rho$ continuous on $[0, L]$; $x$ measured from one end.",
      example: "\\rho(x) = \\tfrac52(x + 2),\\; L = 4: \\quad M = 40 \\text{ kg}",
    },
    {
      id: 'rod-moment',
      name: 'Moment of mass of a rod',
      formulaLatex: "M_0 = \\int_0^L x\\rho(x)\\,dx",
      whenToUse: "The moment of the rod about the origin.",
      restrictions: "Units of mass times length.",
      example: "\\rho(x) = 1 + x,\\; L = 4: \\quad M_0 = \\int_0^4 \\left(x + x^2\\right)dx = \\frac{88}{3}",
    },
    {
      id: 'rod-center',
      name: 'Center of mass of a rod',
      formulaLatex: "\\bar{x} = \\frac{M_0}{M} = \\frac{\\int_0^L x\\rho(x)\\,dx}{\\int_0^L \\rho(x)\\,dx}",
      whenToUse: "The balance point of a rod with variable density.",
      restrictions: "Measured from the same origin as $x$.",
      example: "\\rho \\text{ constant}: \\quad \\bar{x} = \\frac{\\rho L^2/2}{\\rho L} = \\frac{L}{2}",
    },
  ],

  workedExamples: [
    {
      id: 'rod-we-1',
      title: 'Four particles on a line',
      prompt: "Given four particles of masses 2, 3, 1 and 5 kg located on the $x$-axis at the points having coordinates 5, 2, $-3$ and $-4$, respectively, where the distance measurement is in meters, find the center of mass of the system.",
      problemLatex: "m_i: 2,\\; 3,\\; 1,\\; 5, \\qquad x_i: 5,\\; 2,\\; -3,\\; -4",
      keyIdea: "Total moment divided by total mass. Keep the signs of the positions.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Total mass',
          mathLatex: "M = 2 + 3 + 1 + 5 = 11 \\text{ kg}",
          explanation: "The denominator is the total mass, not the number of particles.",
          ruleApplied: '$M = \\sum m_i$',
        },
        {
          stepNumber: 2,
          title: 'Moment about the origin',
          mathLatex: "M_0 = 2(5) + 3(2) + 1(-3) + 5(-4) = 10 + 6 - 3 - 20 = -7 \\text{ kg·m}",
          explanation: "The two particles on the left have negative moments. The heavy $5$ kg particle at $-4$ outweighs the rest, so the total is negative.",
          ruleApplied: '$M_0 = \\sum m_ix_i$',
          pitfall: "Writing $5(-4)$ as $+20$.",
        },
        {
          stepNumber: 3,
          title: 'Divide',
          mathLatex: "\\bar{x} = \\frac{M_0}{M} = -\\frac{7}{11} \\approx -0.64 \\text{ m}",
          explanation: "The center of mass is $\\frac{7}{11}$ m to the left of the origin: between the extremes $-4$ and $5$, pulled left by the $5$ kg mass.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          figure: seesaw('The system balances at $\\bar{x} = -\\frac{7}{11}$. Masses in kg; the hollow dot is the origin.', [[2, 5], [3, 2], [1, -3], [5, -4]], [-5.2, 6.2], -7 / 11),
        },
      ],
    },
    {
      id: 'rod-we-2',
      title: 'Mass of a rod with variable density',
      prompt: "The linear density at any point of a rod 4 m long varies directly as the distance from the point to an external point in the line of the rod 2 m from the end, where the linear density is 5 kg/m. Find the total mass of the rod.",
      problemLatex: "\\rho \\propto \\text{distance from } P, \\qquad L = 4, \\qquad \\rho = 5 \\text{ at the end nearer } P",
      keyIdea: "The external point $P$ lies on the line of the rod, 2 m beyond one end, and the density at that end is 5 kg/m. Put the rod on $[0, 4]$ with $P$ at $x = -2$.",
      figure: rodWithPoint('The rod occupies $[0, 4]$. $P$ is $2$ m beyond the left end, so a point $x$ of the rod is $x + 2$ meters from $P$.'),
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Write the density',
          mathLatex: "\\rho(x) = k(x + 2)",
          explanation: "\"Varies directly as\" means proportional to. The distance from $P$ at $x = -2$ to the point $x$ is $x + 2$.",
          ruleApplied: 'Direct variation',
          pitfall: "Using $\\rho = kx$, the distance from the end of the rod.",
        },
        {
          stepNumber: 2,
          title: 'Find k',
          mathLatex: "\\rho(0) = 2k = 5 \\;\\Longrightarrow\\; k = \\frac{5}{2}, \\qquad \\rho(x) = \\frac{5}{2}(x + 2)",
          explanation: "The end nearer $P$ is $x = 0$, at distance $2$ from $P$. The density rises from $5$ kg/m there to $15$ kg/m at the far end.",
          ruleApplied: 'Given condition',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "M = \\int_0^4 \\frac{5}{2}(x + 2)\\,dx = \\frac{5}{2}\\left[\\frac{x^2}{2} + 2x\\right]_0^4 = \\frac{5}{2}(8 + 8) = 40 \\text{ kg}",
          explanation: "Check: the density is linear, so its average is $\\frac{5 + 15}{2} = 10$ kg/m, and $10 \\times 4 = 40$.",
          ruleApplied: '$M = \\int_0^L \\rho(x)\\,dx$',
        },
      ],
    },
    {
      id: 'rod-we-3',
      title: 'A rod of uniform density',
      prompt: "Show that the center of mass of a rod of uniform linear density is at the center of the rod.",
      problemLatex: "\\rho(x) = k \\text{ (constant)}, \\qquad 0 \\le x \\le L",
      keyIdea: "With $\\rho$ constant, both integrals are elementary and $k$ cancels.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Mass',
          mathLatex: "M = \\int_0^L k\\,dx = kL",
          explanation: "Uniform means the density is the same constant $k$ everywhere.",
          ruleApplied: '$M = \\int_0^L \\rho(x)\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Moment',
          mathLatex: "M_0 = \\int_0^L kx\\,dx = \\frac{kL^2}{2}",
          explanation: "The factor $x$ makes this a power-rule integral.",
          ruleApplied: '$M_0 = \\int_0^L x\\rho(x)\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{M_0}{M} = \\frac{kL^2/2}{kL} = \\frac{L}{2}",
          explanation: "The midpoint of $[0, L]$, whatever the density. Any symmetric density about the midpoint gives the same result.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          figure: {
            kind: 'plot',
            caption: 'A uniform rod balances at its midpoint.',
            axes: false,
            equal: true,
            x: [-0.4, 4.4],
            y: [-0.9, 0.5],
            items: [
              { type: 'segment', from: [0, 0], to: [4, 0], tone: 'ink', width: 6 },
              { type: 'label', at: [0, 0.08], text: '0', anchor: 'n' },
              { type: 'label', at: [4, 0.08], text: 'L', anchor: 'n' },
              ...fulcrum(2, -0.06, '\\bar{x} = \\tfrac{L}{2}'),
            ],
          },
        },
      ],
    },
  ],

  problems: [
    {
      id: 'rod-p01',
      problemNumber: 1,
      difficulty: 'Basic',
      prompt: 'Particles of mass 4, 2 and 6 kg are at $x = -2$, $3$ and $5$ m on the $x$-axis. Find the center of mass of the system.',
      questionLatex: "m_i: 4,\\; 2,\\; 6, \\qquad x_i: -2,\\; 3,\\; 5",
      hint: "Total moment over total mass.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass and moment',
          mathLatex: "M = 4 + 2 + 6 = 12, \\qquad M_0 = 4(-2) + 2(3) + 6(5) = -8 + 6 + 30 = 28",
          explanation: "The particle at $-2$ contributes a negative moment.",
          ruleApplied: '$M_0 = \\sum m_ix_i$',
        },
        {
          stepNumber: 2,
          title: 'Divide',
          mathLatex: "\\bar{x} = \\frac{28}{12} = \\frac{7}{3} \\approx 2.33 \\text{ m}",
          explanation: "Between $-2$ and $5$, pulled right by the $6$ kg mass.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          pitfall: "Dividing by $3$, the number of particles.",
        },
      ],
    },
    {
      id: 'rod-p02',
      problemNumber: 2,
      difficulty: 'Basic',
      prompt: 'Find the number $c$ guaranteed by the mean-value theorem for integrals for $f(x) = \\sqrt{x}$ on $[0, 4]$.',
      questionLatex: "\\int_0^4 \\sqrt{x}\\,dx = f(c)(4 - 0)",
      hint: "Compute the integral, divide by the length of the interval, then solve $\\sqrt{c} = $ that value.",
      steps: [
        {
          stepNumber: 1,
          title: 'Integrate',
          mathLatex: "\\int_0^4 x^{1/2}\\,dx = \\left[\\frac23 x^{3/2}\\right]_0^4 = \\frac{16}{3}",
          explanation: "$4^{3/2} = 8$.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Solve for c',
          mathLatex: "\\sqrt{c} = \\frac{16/3}{4} = \\frac43 \\;\\Longrightarrow\\; c = \\frac{16}{9} \\approx 1.78",
          explanation: "$\\frac43$ is the average value of $\\sqrt{x}$ on $[0, 4]$. $c = \\frac{16}{9}$ lies in $[0, 4]$, as the theorem promises.",
          ruleApplied: 'Mean-value theorem for integrals',
          pitfall: "Answering $\\frac43$, which is $f(c)$, not $c$.",
        },
      ],
    },
    {
      id: 'rod-p03',
      problemNumber: 3,
      difficulty: 'Basic',
      prompt: 'A rod 3 m long has linear density $\\rho(x) = 2 + x$ kg/m, where $x$ is the distance in meters from its left end. Find its mass and its center of mass.',
      questionLatex: "\\rho(x) = 2 + x, \\qquad 0 \\le x \\le 3",
      hint: "Two integrals: $\\int \\rho$ for the mass and $\\int x\\rho$ for the moment.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass',
          mathLatex: "M = \\int_0^3 (2 + x)\\,dx = \\left[2x + \\frac{x^2}{2}\\right]_0^3 = 6 + \\frac92 = \\frac{21}{2} \\text{ kg}",
          explanation: "Check: average density $\\frac{2 + 5}{2} = 3.5$ times length $3$.",
          ruleApplied: '$M = \\int_0^L \\rho(x)\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Moment',
          mathLatex: "M_0 = \\int_0^3 x(2 + x)\\,dx = \\left[x^2 + \\frac{x^3}{3}\\right]_0^3 = 9 + 9 = 18 \\text{ kg·m}",
          explanation: "Multiply the density by $x$ before integrating.",
          ruleApplied: '$M_0 = \\int_0^L x\\rho(x)\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{18}{21/2} = \\frac{36}{21} = \\frac{12}{7} \\approx 1.71 \\text{ m from the left end}",
          explanation: "A little right of the midpoint $1.5$, because the rod is denser on the right.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          figure: densityRod('The density rises from $2$ to $5$ kg/m, so the balance point $\\bar{x} = \\frac{12}{7}$ sits right of the midpoint.', (x) => 2 + x, 3, 5, 12 / 7, '\\rho(x) = 2 + x'),
        },
      ],
    },
    {
      id: 'rod-p04',
      problemNumber: 4,
      difficulty: 'Exam-Level',
      prompt: 'Find the center of mass of the rod in Worked Example 2.',
      questionLatex: "\\rho(x) = \\frac{5}{2}(x + 2), \\qquad 0 \\le x \\le 4, \\qquad M = 40",
      hint: "The mass is already known. Only the moment is new.",
      steps: [
        {
          stepNumber: 1,
          title: 'Moment',
          mathLatex: "M_0 = \\int_0^4 x\\cdot\\frac52(x + 2)\\,dx = \\frac52\\int_0^4 \\left(x^2 + 2x\\right)dx = \\frac52\\left(\\frac{64}{3} + 16\\right) = \\frac{280}{3} \\text{ kg·m}",
          explanation: "Distribute $x$ before integrating.",
          ruleApplied: '$M_0 = \\int_0^L x\\rho(x)\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{280/3}{40} = \\frac{7}{3} \\approx 2.33 \\text{ m}",
          explanation: "Measured from the end nearer $P$. Past the midpoint, since the density increases away from $P$.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          pitfall: "Giving $\\frac73 - (-2)$ or another distance from $P$ without saying so. State the reference point.",
        },
      ],
    },
    {
      id: 'rod-p05',
      problemNumber: 5,
      difficulty: 'Exam-Level',
      prompt: 'The linear density of a rod 6 m long varies directly as the square of the distance from its left end, and is 72 kg/m at the right end. Find the mass and the center of mass of the rod.',
      questionLatex: "\\rho(x) = kx^2, \\qquad \\rho(6) = 72, \\qquad 0 \\le x \\le 6",
      hint: "Find $k$ from $\\rho(6) = 72$ first.",
      steps: [
        {
          stepNumber: 1,
          title: 'Find k',
          mathLatex: "36k = 72 \\;\\Longrightarrow\\; k = 2, \\qquad \\rho(x) = 2x^2",
          explanation: "The right end is $x = 6$.",
          ruleApplied: 'Direct variation',
        },
        {
          stepNumber: 2,
          title: 'Mass and moment',
          mathLatex: "M = \\int_0^6 2x^2\\,dx = \\frac{2(216)}{3} = 144 \\text{ kg}, \\qquad M_0 = \\int_0^6 2x^3\\,dx = \\frac{2(1296)}{4} = 648 \\text{ kg·m}",
          explanation: "Power rule twice.",
          ruleApplied: 'Mass and moment of a rod',
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{648}{144} = 4.5 \\text{ m from the left end}",
          explanation: "In general $\\rho = kx^2$ on $[0, L]$ gives $\\bar{x} = \\frac{kL^4/4}{kL^3/3} = \\frac{3L}{4}$.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          figure: densityRod('Most of the mass is near the right end, so the rod balances three quarters of the way along.', (x) => 2 * x * x, 6, 72, 4.5, '\\rho(x) = 2x^2'),
        },
      ],
    },
    {
      id: 'rod-p06',
      problemNumber: 6,
      difficulty: 'Exam-Level',
      prompt: 'A 3 kg mass is at $x = 2$ and a 5 kg mass is at $x = -1$ on the $x$-axis. Where must a 2 kg mass be placed so that the center of mass of the three is at $x = 2$?',
      questionLatex: "3 \\text{ at } 2, \\quad 5 \\text{ at } -1, \\quad 2 \\text{ at } p; \\qquad \\bar{x} = 2",
      hint: "Write $\\bar{x}$ with the unknown position $p$ and solve.",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up the equation',
          mathLatex: "\\frac{3(2) + 5(-1) + 2p}{3 + 5 + 2} = 2",
          explanation: "The unknown position enters the moment only.",
          ruleApplied: '$\\bar{x} = \\dfrac{\\sum m_ix_i}{\\sum m_i}$',
        },
        {
          stepNumber: 2,
          title: 'Solve',
          mathLatex: "1 + 2p = 20 \\;\\Longrightarrow\\; p = \\frac{19}{2} = 9.5",
          explanation: "The 2 kg mass must sit far out on the right to drag the balance point from $\\frac18$ (the first two alone) to $2$.",
          ruleApplied: 'Solving a linear equation',
          pitfall: "Leaving the denominator as $8$, the mass before the new particle is added.",
          figure: seesaw('With the $2$ kg mass at $9.5$, the system balances at $x = 2$.', [[3, 2], [5, -1], [2, 9.5]], [-2.2, 10.7], 2),
        },
      ],
    },
    {
      id: 'rod-p07',
      problemNumber: 7,
      difficulty: 'Exam-Level',
      prompt: 'A rod 4 cm long has linear density $\\rho(x) = \\sqrt{x}$ g/cm at a point $x$ cm from one end. Find its mass and center of mass.',
      questionLatex: "\\rho(x) = \\sqrt{x}, \\qquad 0 \\le x \\le 4 \\quad (\\text{CGS})",
      hint: "Write the roots as powers: $x\\sqrt{x} = x^{3/2}$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass',
          mathLatex: "M = \\int_0^4 x^{1/2}\\,dx = \\frac23(8) = \\frac{16}{3} \\text{ g}",
          explanation: "Grams, since density is in g/cm and length in cm.",
          ruleApplied: '$M = \\int_0^L \\rho(x)\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Moment',
          mathLatex: "M_0 = \\int_0^4 x^{3/2}\\,dx = \\frac25\\left(4^{5/2}\\right) = \\frac25(32) = \\frac{64}{5} \\text{ g·cm}",
          explanation: "$4^{5/2} = \\left(\\sqrt4\\right)^5 = 32$.",
          ruleApplied: '$M_0 = \\int_0^L x\\rho(x)\\,dx$',
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{64/5}{16/3} = \\frac{64}{5}\\cdot\\frac{3}{16} = \\frac{12}{5} = 2.4 \\text{ cm}",
          explanation: "Past the midpoint, toward the denser end.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
        },
      ],
    },
    {
      id: 'rod-p08',
      problemNumber: 8,
      difficulty: 'Exam-Level',
      prompt: 'A rod 3 ft long has linear density $\\rho(x) = \\dfrac{1}{x + 1}$ slug/ft at a point $x$ ft from one end. Find its mass and center of mass.',
      questionLatex: "\\rho(x) = \\frac{1}{x + 1}, \\qquad 0 \\le x \\le 3 \\quad (\\text{BES})",
      hint: "For the moment, divide: $\\frac{x}{x + 1} = 1 - \\frac{1}{x + 1}$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass',
          mathLatex: "M = \\int_0^3 \\frac{dx}{x + 1} = \\Big[\\ln(x + 1)\\Big]_0^3 = \\ln 4 \\approx 1.386 \\text{ slugs}",
          explanation: "The natural logarithm case of the power rule.",
          ruleApplied: '$\\int \\dfrac{du}{u} = \\ln|u| + C$',
        },
        {
          stepNumber: 2,
          title: 'Moment',
          mathLatex: "M_0 = \\int_0^3 \\frac{x}{x + 1}\\,dx = \\int_0^3 \\left(1 - \\frac{1}{x + 1}\\right)dx = 3 - \\ln 4 \\approx 1.614 \\text{ slug·ft}",
          explanation: "The numerator has the same degree as the denominator, so divide first.",
          ruleApplied: 'Long division',
          pitfall: "Writing $\\int \\frac{x}{x + 1}\\,dx = x\\ln(x + 1)$.",
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{3 - \\ln 4}{\\ln 4} = \\frac{3}{\\ln 4} - 1 \\approx 1.16 \\text{ ft}",
          explanation: "Left of the midpoint $1.5$, because the density decreases along the rod.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
        },
      ],
    },
    {
      id: 'rod-p09',
      problemNumber: 9,
      difficulty: 'Exam-Level',
      prompt: 'A rod 2 m long has linear density $\\rho(x) = e^x$ kg/m at a point $x$ m from one end. Find its center of mass.',
      questionLatex: "\\rho(x) = e^x, \\qquad 0 \\le x \\le 2",
      hint: "The moment integral $\\int xe^x\\,dx$ needs integration by parts.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass',
          mathLatex: "M = \\int_0^2 e^x\\,dx = e^2 - 1",
          explanation: "$e^0 = 1$ at the lower limit.",
          ruleApplied: '$\\int e^x\\,dx = e^x + C$',
        },
        {
          stepNumber: 2,
          title: 'Moment by parts',
          mathLatex: "u = x,\\; dv = e^x\\,dx: \\qquad M_0 = \\Big[xe^x - e^x\\Big]_0^2 = \\left(2e^2 - e^2\\right) - (0 - 1) = e^2 + 1",
          explanation: "Algebraic times exponential: differentiate the $x$, integrate the $e^x$.",
          ruleApplied: 'Integration by parts',
          pitfall: "Forgetting the lower limit, where $xe^x - e^x = -1$.",
        },
        {
          stepNumber: 3,
          title: 'Center of mass',
          mathLatex: "\\bar{x} = \\frac{e^2 + 1}{e^2 - 1} \\approx 1.31 \\text{ m}",
          explanation: "Past the midpoint, toward the denser end at $x = 2$.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
          figure: densityRod('The rod balances at $\\bar{x} = \\frac{e^2 + 1}{e^2 - 1} \\approx 1.31$.', Math.exp, 2, Math.E ** 2, (Math.E ** 2 + 1) / (Math.E ** 2 - 1), '\\rho(x) = e^x'),
        },
      ],
    },
    {
      id: 'rod-p10',
      problemNumber: 10,
      difficulty: 'Challenge',
      prompt: 'A rod 1 m long has linear density $\\rho(x) = 1 + kx$ kg/m, where $k > 0$. Find $k$ so that the center of mass is at $x = 0.6$. Can the center of mass ever be at $x = 0.7$?',
      questionLatex: "\\rho(x) = 1 + kx, \\qquad 0 \\le x \\le 1, \\qquad \\bar{x} = 0.6",
      hint: "Find $\\bar{x}$ as a function of $k$, then set it equal to $0.6$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Mass and moment in terms of k',
          mathLatex: "M = \\int_0^1 (1 + kx)\\,dx = 1 + \\frac{k}{2}, \\qquad M_0 = \\int_0^1 \\left(x + kx^2\\right)dx = \\frac12 + \\frac{k}{3}",
          explanation: "$k$ is a constant, so it comes out of each integral.",
          ruleApplied: 'Mass and moment of a rod',
        },
        {
          stepNumber: 2,
          title: 'Solve for k',
          mathLatex: "\\frac{\\frac12 + \\frac{k}{3}}{1 + \\frac{k}{2}} = \\frac{3 + 2k}{6 + 3k} = 0.6 \\;\\Longrightarrow\\; 3 + 2k = 3.6 + 1.8k \\;\\Longrightarrow\\; k = 3",
          explanation: "Multiply numerator and denominator by $6$ to clear the fractions, then cross-multiply. Check: $\\rho = 1 + 3x$ gives $M = 2.5$, $M_0 = 1.5$, $\\bar{x} = 0.6$.",
          ruleApplied: '$\\bar{x} = \\dfrac{M_0}{M}$',
        },
        {
          stepNumber: 3,
          title: 'The limit as k grows',
          mathLatex: "\\bar{x}(k) = \\frac{3 + 2k}{6 + 3k} \\to \\frac{2}{3} \\text{ as } k \\to \\infty",
          explanation: "$\\bar{x}$ increases from $\\frac12$ at $k = 0$ toward $\\frac23$ but never reaches it, so $0.7$ is impossible. For large $k$ the density is essentially $kx$, whose center of mass is $\\frac{2L}{3}$.",
          ruleApplied: 'Limit of a rational function',
          pitfall: "Solving $\\frac{3 + 2k}{6 + 3k} = 0.7$ anyway: it gives $k = -12$, which makes the density negative for $x > \\frac{1}{12}$.",
        },
      ],
    },
  ],
};
