import type { Topic } from '../../types/curriculum';
import type { PlotItem, Vec } from '../../types/figure';
import { fmt } from '../../lib/plot';

/** The mean-value theorem picture: f(x) = x³/2 − 3x/2 on [−2, 2.5]. */
const mvtF = (x: number) => 0.5 * x ** 3 - 1.5 * x;
const MVT_SLOPE = (mvtF(2.5) - mvtF(-2)) / 4.5;
const MVT_C = Math.sqrt((MVT_SLOPE + 1.5) / 1.5);
/** A short segment of the given slope through (c, f(c)). */
const tangent = (c: number, half = 0.9): PlotItem => ({
  type: 'segment', from: [c - half, mvtF(c) - half * MVT_SLOPE], to: [c + half, mvtF(c) + half * MVT_SLOPE], tone: 2, width: 2,
});

/** The note's polygon example: y = (2/3)x^(3/2) on [0, 3], exact length 14/3. */
const polyF = (x: number) => (2 / 3) * x ** 1.5;

/** Unit 3.5 — Length of an arc. Source: lecture deck 3.5 (examples solved here). */
export const arcLength: Topic = {
  id: 'arc-length',
  title: 'Length of an Arc',
  slug: 'arc-length',
  unitNumber: '3.5',
  summary:
    "The length of a curve is the limit of the lengths of inscribed polygons. The mean-value theorem turns each chord into $\\sqrt{1 + [f'(c_i)]^2}\\,\\Delta x$, so the length of $y = f(x)$ from $x = a$ to $x = b$ is $\\int_a^b \\sqrt{1 + [f'(x)]^2}\\,dx$, and there is a matching formula in $y$. The integrand rarely has an elementary antiderivative, so exam curves are chosen so that $1 + [f']^2$ is a perfect square.",

  examNotes: [
    {
      title: 'The mean-value theorem',
      concept:
        "Let $f$ be continuous on $[a, b]$ and differentiable on $(a, b)$. Then there is a number $c$ in $(a, b)$ such that",
      display: "f'(c) = \\frac{f(b) - f(a)}{b - a}",
      conditions: "Geometrically, somewhere between $a$ and $b$ the tangent line is parallel to the secant through $(a, f(a))$ and $(b, f(b))$. There may be more than one such $c$.",
      commonTraps: [
        "Confusing it with the mean-value theorem for integrals from Unit 3.3, which is about $f(c)$, not $f'(c)$.",
        "Applying it where $f$ is not differentiable, such as at a corner or a cusp.",
        "Keeping a solution $c$ outside the open interval $(a, b)$.",
      ],
      tip: "This is the step that makes arc length work: on each short piece of the curve, the slope of the chord equals $f'$ at some point of that piece.",
      figure: {
        kind: 'plot',
        caption: 'The secant from $a$ to $b$ (dashed) and two tangents parallel to it (orange). Here both $c = \\pm\\sqrt{1.75}$ satisfy the theorem.',
        x: [-2.4, 2.9],
        y: [-2.6, 4.6],
        aspect: 1.2,
        xTicks: [[-2, 'a'], [-MVT_C, 'c_1'], [MVT_C, 'c_2'], [2.5, 'b']],
        yTicks: [],
        items: [
          { type: 'fn', f: mvtF, label: 'y = f(x)', labelAt: [-1.6, 1.3], anchor: 'nw' },
          { type: 'segment', from: [-2, mvtF(-2)], to: [2.5, mvtF(2.5)], tone: 'ink', dashed: true, width: 1.5 },
          tangent(-MVT_C),
          tangent(MVT_C),
          { type: 'point', at: [-2, mvtF(-2)], tone: 'ink' },
          { type: 'point', at: [2.5, mvtF(2.5)], tone: 'ink' },
          { type: 'point', at: [-MVT_C, mvtF(-MVT_C)], tone: 2 },
          { type: 'point', at: [MVT_C, mvtF(MVT_C)], tone: 2 },
        ],
      },
    },
    {
      title: 'Length as a limit of polygons',
      concept:
        "Mark points $P_0, P_1, \\dots, P_n$ along the curve and join them with straight segments. The length of the curve is the limit of the total length of these polygons as the pieces get shorter. A chord across a piece of width $\\Delta x$ and rise $\\Delta y$ has length $\\sqrt{\\Delta x^2 + \\Delta y^2} = \\sqrt{1 + \\left(\\frac{\\Delta y}{\\Delta x}\\right)^2}\\,\\Delta x$, and by the mean-value theorem $\\frac{\\Delta y}{\\Delta x} = f'(c_i)$ for some $c_i$ in the piece.",
      display: "L = \\lim_{n\\to\\infty}\\sum_{i=1}^{n}\\sqrt{1 + \\left[f'(c_i)\\right]^2}\\,\\Delta x_i = \\int_a^b \\sqrt{1 + \\left[f'(x)\\right]^2}\\,dx",
      conditions: "Every inscribed polygon is shorter than the curve, so the polygon lengths increase toward $L$.",
      commonTraps: [
        "Thinking of $\\sqrt{1 + [f']^2}$ as a height to find the area under. The integral adds up chord lengths, not areas.",
        "Expecting a straight line's length to need calculus: for a line the polygon is exact.",
      ],
      tip: "If you remember $\\Delta s \\approx \\sqrt{\\Delta x^2 + \\Delta y^2}$, you can rebuild both arc length formulas by factoring out $\\Delta x$ or $\\Delta y$.",
      figure: {
        kind: 'plot',
        caption: 'Inscribed polygons for $y = \\frac23 x^{3/2}$ on $[0, 3]$. As $n$ grows their length rises toward the exact arc length $\\frac{14}{3} \\approx 4.667$.',
        x: [-0.3, 3.4],
        y: [-0.3, 3.8],
        aspect: 1.1,
        xTicks: [1, 2, 3],
        yTicks: [1, 2, 3],
        items: [{ type: 'fn', f: polyF, from: 0, to: 3.2, tone: 'muted', width: 3, label: 'y = \\tfrac23 x^{3/2}', labelAt: [1.2, 0.88], anchor: 'se' }],
        animate: {
          param: 'n',
          range: [1, 12],
          initial: 2,
          step: 1,
          duration: 7,
          frame: (n) => {
            const pts: Vec[] = Array.from({ length: n + 1 }, (_, i) => [(3 * i) / n, polyF((3 * i) / n)]);
            return [
              ...pts.slice(1).map((p, i): PlotItem => ({ type: 'segment', from: pts[i], to: p, tone: 2, width: 2 })),
              ...pts.map((p): PlotItem => ({ type: 'point', at: p, tone: 2 })),
            ];
          },
          readout: (n) => {
            let len = 0;
            for (let i = 1; i <= n; i++) len += Math.hypot(3 / n, polyF((3 * i) / n) - polyF((3 * (i - 1)) / n));
            return `$n = ${n}$ segments: total length $${fmt(len, 4)}$, against the arc length $\\frac{14}{3} \\approx 4.6667$.`;
          },
        },
      },
    },
    {
      title: 'Arc length in x',
      concept:
        "If $f$ and $f'$ are continuous on $[a, b]$, the length of the arc of $y = f(x)$ from $(a, f(a))$ to $(b, f(b))$ is",
      display: "L = \\int_a^b \\sqrt{1 + \\left[f'(x)\\right]^2}\\,dx",
      conditions: "Procedure: differentiate, square, add $1$, simplify (look for a perfect square), take the square root, integrate. The limits are the $x$-coordinates of the endpoints.",
      commonTraps: [
        "Forgetting to square $f'$, or squaring $f$ instead.",
        "Writing $\\sqrt{1 + [f']^2} = 1 + f'$. A square root does not split over a sum.",
        "Using the $y$-coordinates of the endpoints as limits.",
      ],
      tip: "A quick check: $L$ must be at least the straight-line distance between the endpoints.",
      figure: {
        kind: 'plot',
        caption: 'One piece of the curve: the chord has run $\\Delta x$, rise $\\Delta y$ and length $\\sqrt{\\Delta x^2 + \\Delta y^2}$.',
        x: [-0.3, 3.4],
        y: [-0.3, 3.8],
        aspect: 1.1,
        xTicks: [],
        yTicks: [],
        items: [
          { type: 'fn', f: polyF, from: 0, to: 3.2, tone: 'muted', width: 3 },
          { type: 'segment', from: [1, polyF(1)], to: [2.6, polyF(1)], tone: 'ink', dashed: true, width: 1.5, label: '\\Delta x', anchor: 's' },
          { type: 'segment', from: [2.6, polyF(1)], to: [2.6, polyF(2.6)], tone: 'ink', dashed: true, width: 1.5, label: '\\Delta y', anchor: 'e' },
          { type: 'segment', from: [1, polyF(1)], to: [2.6, polyF(2.6)], tone: 2, width: 2.5, label: '\\Delta s', anchor: 'nw' },
          { type: 'point', at: [1, polyF(1)], tone: 2 },
          { type: 'point', at: [2.6, polyF(2.6)], tone: 2 },
        ],
      },
    },
    {
      title: 'Arc length in y',
      concept:
        "If the curve is $x = g(y)$, with $g$ and $g'$ continuous on $[c, d]$, the length of the arc from $(g(c), c)$ to $(g(d), d)$ is",
      display: "L = \\int_c^d \\sqrt{1 + \\left[g'(y)\\right]^2}\\,dy",
      conditions: "Switch to $y$ when the curve is given as $x = g(y)$, when $\\frac{dy}{dx}$ is undefined somewhere on the arc (a vertical tangent), or when the $y$-integral is simpler. The limits are $y$-coordinates.",
      commonTraps: [
        "Using $dy$ with $x$-limits.",
        "Using the $x$-formula through a vertical tangent: $\\frac{dy}{dx}$ is infinite there and $f'$ is not continuous.",
        "Forgetting to solve for $x$ before differentiating.",
      ],
      tip: "For $y = x^{p/q}$, try the inverse $x = y^{q/p}$. A fractional power with a small denominator often becomes a nicer one.",
      figure: {
        kind: 'plot',
        caption: '$y = x^{2/3}$ has a vertical tangent at the origin, where $\\frac{dy}{dx} = \\frac{2}{3x^{1/3}}$ is undefined. As $x = y^{3/2}$, $\\frac{dx}{dy} = \\frac32 y^{1/2}$ is continuous.',
        x: [-1.2, 8.8],
        y: [-0.5, 4.8],
        aspect: 1.6,
        xTicks: [2, 4, 6, 8],
        yTicks: [1, 2, 3, 4],
        items: [
          { type: 'fn', f: (x) => Math.cbrt(x * x), from: -1, to: 8.6, label: 'y = x^{2/3}', labelAt: [5, 2.92], anchor: 'nw' },
          { type: 'segment', from: [0, 0], to: [0, 2.6], tone: 2, width: 2.5, label: '\\text{vertical tangent}', labelAt: [0, 2.6], anchor: 'e' },
        ],
      },
    },
    {
      title: 'Integrands that simplify',
      concept:
        "$\\int \\sqrt{1 + [f']^2}\\,dx$ usually has no elementary antiderivative, so exam curves are built so that $1 + [f']^2$ is a perfect square. The common patterns:",
      table: {
        head: ['Curve', "$f'$", "$1 + [f']^2$"],
        rows: [
          ['$y = \\dfrac{x^{n+1}}{2(n+1)} - \\dfrac{x^{1-n}}{2(1-n)}$ type', "$\\dfrac12\\left(u - \\dfrac1u\\right)$", "$\\left[\\dfrac12\\left(u + \\dfrac1u\\right)\\right]^2$"],
          ['$y = a\\cosh\\dfrac{x}{a}$ (catenary)', '$\\sinh\\dfrac{x}{a}$', '$\\cosh^2\\dfrac{x}{a}$'],
          ['$y = \\ln(\\cos x)$', '$-\\tan x$', '$\\sec^2 x$'],
          ['$y = \\dfrac13\\left(x^2 + 2\\right)^{3/2}$', '$x\\sqrt{x^2 + 2}$', '$\\left(x^2 + 1\\right)^2$'],
        ],
      },
      conditions: "The first pattern: if $f' = \\frac12\\left(u - \\frac1u\\right)$ then $1 + [f']^2 = \\frac14\\left(u^2 + 2 + \\frac{1}{u^2}\\right) = \\left[\\frac12\\left(u + \\frac1u\\right)\\right]^2$. Subtracting becomes adding.",
      commonTraps: [
        "Expanding $1 + [f']^2$ and then not recognising the perfect square.",
        "Taking the square root of a perfect square and forgetting it must be non-negative: $\\sqrt{\\cosh^2 u} = \\cosh u$ because $\\cosh u > 0$.",
        "Giving up when the integral looks impossible. If the problem asks for an exact length, look for the square.",
      ],
      tip: "When $f'$ is a difference of two terms whose product is a constant $-\\frac14$, the square is guaranteed. Check the product first.",
    },
  ],

  keyFormulas: [
    {
      id: 'arc-mvt',
      name: 'Mean-value theorem',
      formulaLatex: "f'(c) = \\frac{f(b) - f(a)}{b - a} \\quad \\text{for some } c \\in (a, b)",
      whenToUse: "Relating the slope of a chord to the derivative at a point between its ends.",
      restrictions: "$f$ continuous on $[a, b]$ and differentiable on $(a, b)$.",
      example: "f(x) = x^2,\\; [0, 2]: \\quad 2c = \\frac{4 - 0}{2} \\;\\Longrightarrow\\; c = 1",
    },
    {
      id: 'arc-x',
      name: 'Arc length of y = f(x)',
      formulaLatex: "L = \\int_a^b \\sqrt{1 + \\left[f'(x)\\right]^2}\\,dx",
      whenToUse: "The curve is a function of $x$ with a continuous derivative on $[a, b]$.",
      restrictions: "$f'$ continuous on $[a, b]$; limits are $x$-values.",
      example: "y = 6\\cosh\\frac{x}{6}: \\quad \\int_0^{6\\ln 6}\\cosh\\frac{x}{6}\\,dx = \\frac{35}{2}",
    },
    {
      id: 'arc-y',
      name: 'Arc length of x = g(y)',
      formulaLatex: "L = \\int_c^d \\sqrt{1 + \\left[g'(y)\\right]^2}\\,dy",
      whenToUse: "The curve is a function of $y$, or $\\frac{dy}{dx}$ is undefined on the arc.",
      restrictions: "$g'$ continuous on $[c, d]$; limits are $y$-values.",
      example: "x = y^{3/2},\\; 1 \\le y \\le 4: \\quad L = \\frac{80\\sqrt{10} - 13\\sqrt{13}}{27}",
    },
    {
      id: 'arc-ds',
      name: 'Element of arc length',
      formulaLatex: "ds = \\sqrt{dx^2 + dy^2} = \\sqrt{1 + \\left(\\frac{dy}{dx}\\right)^2}\\,dx = \\sqrt{1 + \\left(\\frac{dx}{dy}\\right)^2}\\,dy",
      whenToUse: "Rebuilding either formula from the Pythagorean theorem.",
      restrictions: "Factor out whichever differential matches the variable of integration.",
      example: "y = 2x + 1,\\; 0 \\le x \\le 3: \\quad \\int_0^3 \\sqrt{5}\\,dx = 3\\sqrt{5}",
    },
    {
      id: 'arc-squares',
      name: 'Perfect squares under the root',
      formulaLatex: "\\begin{gathered} 1 + \\sinh^2 u = \\cosh^2 u \\\\[1ex] 1 + \\tan^2 u = \\sec^2 u \\\\[1ex] 1 + \\tfrac14\\left(u - \\tfrac1u\\right)^2 = \\tfrac14\\left(u + \\tfrac1u\\right)^2 \\end{gathered}",
      whenToUse: "Simplifying $1 + [f']^2$ before taking the square root.",
      restrictions: "The root of the square is the absolute value; check the sign on the interval.",
      example: "y = \\frac{x^3}{6} + \\frac{1}{2x}: \\quad 1 + [f']^2 = \\left(\\frac{x^2}{2} + \\frac{1}{2x^2}\\right)^2",
    },
  ],

  workedExamples: [
    {
      id: 'arc-we-1',
      title: 'Switching to y',
      prompt: "Find the length of the arc of the curve $y = x^{2/3}$ from the point $(1, 1)$ to $(8, 4)$.",
      problemLatex: "y = x^{2/3}, \\qquad (1, 1) \\text{ to } (8, 4)",
      keyIdea: "In $x$ the integrand is $\\sqrt{1 + \\frac{4}{9x^{2/3}}}$, which is awkward. Solve for $x$: $x = y^{3/2}$, and integrate in $y$ from $1$ to $4$.",
      figure: {
        kind: 'plot',
        caption: 'The arc from $(1, 1)$ to $(8, 4)$ (orange).',
        x: [-0.5, 8.8],
        y: [-0.4, 4.8],
        aspect: 1.6,
        xTicks: [2, 4, 6, 8],
        yTicks: [1, 2, 3, 4],
        items: [
          { type: 'fn', f: (x) => Math.cbrt(x * x), from: 0, to: 8.6, tone: 'muted', width: 2, label: 'y = x^{2/3}', labelAt: [5, 2.92], anchor: 'se' },
          { type: 'fn', f: (x) => Math.cbrt(x * x), from: 1, to: 8, tone: 2, width: 3 },
          { type: 'point', at: [1, 1], tone: 'ink', label: '(1, 1)', anchor: 'nw' },
          { type: 'point', at: [8, 4], tone: 'ink', label: '(8, 4)', anchor: 'nw' },
        ],
      },
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Solve for x and differentiate',
          mathLatex: "x = y^{3/2}, \\qquad \\frac{dx}{dy} = \\frac32 y^{1/2}, \\qquad 1 \\le y \\le 4",
          explanation: "Raise both sides of $y = x^{2/3}$ to the power $\\frac32$; on this arc $x > 0$. The endpoints have $y = 1$ and $y = 4$.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Set up',
          mathLatex: "L = \\int_1^4 \\sqrt{1 + \\frac94 y}\\,dy",
          explanation: "$\\left(\\frac32 y^{1/2}\\right)^2 = \\frac94 y$.",
          ruleApplied: '$L = \\int_c^d \\sqrt{1 + [g\'(y)]^2}\\,dy$',
          pitfall: "Using the $x$-limits $1$ and $8$.",
        },
        {
          stepNumber: 3,
          title: 'Substitute',
          mathLatex: "u = 1 + \\frac94 y,\\; du = \\frac94\\,dy: \\qquad L = \\frac49\\int_{13/4}^{10} u^{1/2}\\,du = \\frac{8}{27}\\Big[u^{3/2}\\Big]_{13/4}^{10}",
          explanation: "At $y = 1$, $u = \\frac{13}{4}$; at $y = 4$, $u = 10$.",
          ruleApplied: '$u$-substitution',
        },
        {
          stepNumber: 4,
          title: 'Evaluate',
          mathLatex: "L = \\frac{8}{27}\\left(10\\sqrt{10} - \\frac{13\\sqrt{13}}{8}\\right) = \\frac{80\\sqrt{10} - 13\\sqrt{13}}{27} \\approx 7.63",
          explanation: "$\\left(\\frac{13}{4}\\right)^{3/2} = \\frac{13\\sqrt{13}}{8}$. Check: the straight-line distance from $(1, 1)$ to $(8, 4)$ is $\\sqrt{58} \\approx 7.62$, just under $L$, as it must be.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'arc-we-2',
      title: 'A catenary',
      prompt: "Find the length of the arc of the catenary $y = 6\\cosh\\frac{x}{6}$ from the point $(0, 6)$ to the point where $x = 6\\ln 6$.",
      problemLatex: "y = 6\\cosh\\frac{x}{6}, \\qquad 0 \\le x \\le 6\\ln 6",
      keyIdea: "$1 + \\sinh^2 = \\cosh^2$ makes the root disappear.",
      figure: {
        kind: 'plot',
        caption: 'The catenary from $(0, 6)$ to $x = 6\\ln 6 \\approx 10.75$, where $y = 18.5$.',
        x: [-1, 12],
        y: [0, 20.5],
        aspect: 1.2,
        xTicks: [[6 * Math.log(6), '6\\ln 6']],
        yTicks: [6, 12, 18],
        items: [
          { type: 'fn', f: (x) => 6 * Math.cosh(x / 6), tone: 'muted', width: 2, label: 'y = 6\\cosh\\tfrac{x}{6}', labelAt: [4, 7.4], anchor: 'se' },
          { type: 'fn', f: (x) => 6 * Math.cosh(x / 6), from: 0, to: 6 * Math.log(6), tone: 2, width: 3 },
          { type: 'point', at: [0, 6], tone: 'ink', label: '(0, 6)', anchor: 'ne' },
          { type: 'point', at: [6 * Math.log(6), 18.5], tone: 'ink' },
        ],
      },
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate and square',
          mathLatex: "f'(x) = 6\\sinh\\frac{x}{6}\\cdot\\frac16 = \\sinh\\frac{x}{6}, \\qquad 1 + [f'(x)]^2 = 1 + \\sinh^2\\frac{x}{6} = \\cosh^2\\frac{x}{6}",
          explanation: "The chain-rule factor $\\frac16$ cancels the $6$ in front. Then the hyperbolic identity $\\cosh^2 u - \\sinh^2 u = 1$ from Unit 1.6 finishes it.",
          ruleApplied: '$\\cosh^2 u - \\sinh^2 u = 1$',
        },
        {
          stepNumber: 2,
          title: 'Take the root and integrate',
          mathLatex: "L = \\int_0^{6\\ln 6}\\cosh\\frac{x}{6}\\,dx = 6\\sinh\\frac{x}{6}\\Bigg|_0^{6\\ln 6} = 6\\sinh(\\ln 6)",
          explanation: "$\\cosh$ is always positive, so $\\sqrt{\\cosh^2 u} = \\cosh u$.",
          ruleApplied: '$\\int \\cosh u\\,du = \\sinh u + C$',
        },
        {
          stepNumber: 3,
          title: 'Evaluate',
          mathLatex: "\\sinh(\\ln 6) = \\frac{e^{\\ln 6} - e^{-\\ln 6}}{2} = \\frac{6 - \\frac16}{2} = \\frac{35}{12} \\qquad\\Longrightarrow\\qquad L = 6\\cdot\\frac{35}{12} = \\frac{35}{2}",
          explanation: "Use the exponential definition with $e^{\\ln 6} = 6$. The length is $17.5$ units.",
          ruleApplied: '$\\sinh u = \\dfrac{e^u - e^{-u}}{2}$',
          pitfall: "Writing $\\sinh(\\ln 6) = \\ln(\\sinh 6)$ or $\\frac{6 - 6}{2}$.",
        },
      ],
    },
    {
      id: 'arc-we-3',
      title: 'The perfect-square pattern',
      prompt: "Find the length of the curve $y = \\dfrac{x^3}{6} + \\dfrac{1}{2x}$ from $x = 1$ to $x = 2$.",
      problemLatex: "y = \\frac{x^3}{6} + \\frac{1}{2x}, \\qquad 1 \\le x \\le 2",
      keyIdea: "$f'$ is a difference of two terms whose product is $-\\frac14$, so $1 + [f']^2$ is the square of their sum.",
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate',
          mathLatex: "f'(x) = \\frac{x^2}{2} - \\frac{1}{2x^2}",
          explanation: "$\\frac{d}{dx}\\left(\\frac12 x^{-1}\\right) = -\\frac12 x^{-2}$.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Find the perfect square',
          mathLatex: "1 + [f']^2 = 1 + \\frac{x^4}{4} - \\frac12 + \\frac{1}{4x^4} = \\frac{x^4}{4} + \\frac12 + \\frac{1}{4x^4} = \\left(\\frac{x^2}{2} + \\frac{1}{2x^2}\\right)^2",
          explanation: "The middle term of $(a - b)^2$ is $-2ab = -\\frac12$; adding $1$ flips it to $+\\frac12$, which is the middle term of $(a + b)^2$.",
          ruleApplied: '$(a + b)^2 = a^2 + 2ab + b^2$',
          pitfall: "Writing $\\sqrt{1 + [f']^2} = 1 + f'$.",
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "L = \\int_1^2 \\left(\\frac{x^2}{2} + \\frac{1}{2x^2}\\right)dx = \\left[\\frac{x^3}{6} - \\frac{1}{2x}\\right]_1^2 = \\left(\\frac43 - \\frac14\\right) - \\left(\\frac16 - \\frac12\\right) = \\frac{17}{12}",
          explanation: "The root of a square of a positive quantity is the quantity itself. The length is about $1.42$; the straight-line distance between the endpoints $\\left(1, \\frac23\\right)$ and $\\left(2, \\frac{19}{12}\\right)$ is about $1.36$.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
  ],

  problems: [
    {
      id: 'arc-p01',
      problemNumber: 1,
      difficulty: 'Basic',
      prompt: 'Find the length of the line segment $y = 2x + 1$ from $x = 0$ to $x = 3$ using the arc length formula, and check it with the distance formula.',
      questionLatex: "y = 2x + 1, \\qquad 0 \\le x \\le 3",
      hint: "$f'$ is constant, so the integrand is constant.",
      steps: [
        {
          stepNumber: 1,
          title: 'Integrate',
          mathLatex: "L = \\int_0^3 \\sqrt{1 + 2^2}\\,dx = 3\\sqrt5",
          explanation: "For a line the integrand is a constant.",
          ruleApplied: '$L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Check',
          mathLatex: "(0, 1) \\text{ to } (3, 7): \\quad \\sqrt{3^2 + 6^2} = \\sqrt{45} = 3\\sqrt5",
          explanation: "The formula agrees with the distance formula, as it must for a straight line.",
          ruleApplied: 'Distance formula',
        },
      ],
    },
    {
      id: 'arc-p02',
      problemNumber: 2,
      difficulty: 'Basic',
      prompt: 'Find the length of the curve $y = x^{3/2}$ from $x = 0$ to $x = 4$.',
      questionLatex: "y = x^{3/2}, \\qquad 0 \\le x \\le 4",
      hint: "$1 + [f']^2$ is linear in $x$; substitute $u = 1 + \\frac94 x$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Set up',
          mathLatex: "f'(x) = \\frac32 x^{1/2}, \\qquad L = \\int_0^4 \\sqrt{1 + \\frac94 x}\\,dx",
          explanation: "Squaring the derivative removes the root.",
          ruleApplied: '$L = \\int_a^b \\sqrt{1 + [f\'(x)]^2}\\,dx$',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "\\frac49\\cdot\\frac23\\left(1 + \\frac94 x\\right)^{3/2}\\Bigg|_0^4 = \\frac{8}{27}\\left(10^{3/2} - 1\\right) = \\frac{8}{27}\\left(10\\sqrt{10} - 1\\right) \\approx 9.07",
          explanation: "At $x = 4$, $1 + 9 = 10$; at $x = 0$, $1$. Straight-line distance from $(0, 0)$ to $(4, 8)$ is $\\sqrt{80} \\approx 8.94$.",
          ruleApplied: '$u$-substitution',
          pitfall: "Forgetting the factor $\\frac49$ from $du = \\frac94\\,dx$.",
        },
      ],
    },
    {
      id: 'arc-p03',
      problemNumber: 3,
      difficulty: 'Basic',
      prompt: 'Find the length of the curve $y = \\frac13\\left(x^2 + 2\\right)^{3/2}$ from $x = 0$ to $x = 3$.',
      questionLatex: "y = \\frac13\\left(x^2 + 2\\right)^{3/2}, \\qquad 0 \\le x \\le 3",
      hint: "Expand $1 + [f']^2$. It is a perfect square.",
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate and square',
          mathLatex: "f'(x) = \\frac12\\left(x^2 + 2\\right)^{1/2}(2x) = x\\sqrt{x^2 + 2}, \\qquad 1 + [f']^2 = 1 + x^4 + 2x^2 = \\left(x^2 + 1\\right)^2",
          explanation: "Chain rule, then recognise $x^4 + 2x^2 + 1$.",
          ruleApplied: 'Chain rule',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "L = \\int_0^3 \\left(x^2 + 1\\right)dx = 9 + 3 = 12",
          explanation: "The root of the square is $x^2 + 1$, which is positive.",
          ruleApplied: 'Perfect square under the root',
        },
      ],
    },
    {
      id: 'arc-p04',
      problemNumber: 4,
      difficulty: 'Exam-Level',
      prompt: 'Find the length of the curve $y = \\dfrac{x^4}{8} + \\dfrac{1}{4x^2}$ from $x = 1$ to $x = 2$.',
      questionLatex: "y = \\frac{x^4}{8} + \\frac{1}{4x^2}, \\qquad 1 \\le x \\le 2",
      hint: "The two terms of $f'$ multiply to $-\\frac14$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate',
          mathLatex: "f'(x) = \\frac{x^3}{2} - \\frac{1}{2x^3}",
          explanation: "$\\frac{d}{dx}\\left(\\frac14 x^{-2}\\right) = -\\frac12 x^{-3}$.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Perfect square',
          mathLatex: "1 + [f']^2 = \\frac{x^6}{4} + \\frac12 + \\frac{1}{4x^6} = \\left(\\frac{x^3}{2} + \\frac{1}{2x^3}\\right)^2",
          explanation: "The cross term $2\\cdot\\frac{x^3}{2}\\cdot\\left(-\\frac{1}{2x^3}\\right) = -\\frac12$; adding $1$ gives $+\\frac12$.",
          ruleApplied: 'Perfect square under the root',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "L = \\int_1^2 \\left(\\frac{x^3}{2} + \\frac{x^{-3}}{2}\\right)dx = \\left[\\frac{x^4}{8} - \\frac{1}{4x^2}\\right]_1^2 = \\left(2 - \\frac{1}{16}\\right) - \\left(\\frac18 - \\frac14\\right) = \\frac{33}{16}",
          explanation: "Note the antiderivative is $f$ with the second sign flipped, typical of this pattern.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'arc-p05',
      problemNumber: 5,
      difficulty: 'Exam-Level',
      prompt: 'Find the length of the curve $y = \\ln(\\cos x)$ from $x = 0$ to $x = \\frac{\\pi}{4}$.',
      questionLatex: "y = \\ln(\\cos x), \\qquad 0 \\le x \\le \\frac{\\pi}{4}",
      hint: "$1 + \\tan^2 x = \\sec^2 x$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate and simplify',
          mathLatex: "f'(x) = \\frac{-\\sin x}{\\cos x} = -\\tan x, \\qquad 1 + [f']^2 = 1 + \\tan^2 x = \\sec^2 x",
          explanation: "Derivative of $\\ln u$ is $\\frac{u'}{u}$. The sign disappears when squared.",
          ruleApplied: '$1 + \\tan^2 x = \\sec^2 x$',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "L = \\int_0^{\\pi/4}\\sec x\\,dx = \\Big[\\ln|\\sec x + \\tan x|\\Big]_0^{\\pi/4} = \\ln\\left(\\sqrt2 + 1\\right) - \\ln 1 = \\ln\\left(1 + \\sqrt2\\right) \\approx 0.881",
          explanation: "$\\sec x > 0$ on the interval, so $\\sqrt{\\sec^2 x} = \\sec x$.",
          ruleApplied: '$\\int \\sec x\\,dx = \\ln|\\sec x + \\tan x| + C$',
        },
      ],
    },
    {
      id: 'arc-p06',
      problemNumber: 6,
      difficulty: 'Exam-Level',
      prompt: 'Find the length of the curve $x = \\dfrac{y^3}{3} + \\dfrac{1}{4y}$ from $y = 1$ to $y = 3$.',
      questionLatex: "x = \\frac{y^3}{3} + \\frac{1}{4y}, \\qquad 1 \\le y \\le 3",
      hint: "The curve is already $x = g(y)$. The same perfect-square pattern works in $y$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate',
          mathLatex: "g'(y) = y^2 - \\frac{1}{4y^2}",
          explanation: "Differentiate with respect to $y$.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Perfect square',
          mathLatex: "1 + [g']^2 = y^4 + \\frac12 + \\frac{1}{16y^4} = \\left(y^2 + \\frac{1}{4y^2}\\right)^2",
          explanation: "The cross term is $-2\\cdot y^2\\cdot\\frac{1}{4y^2} = -\\frac12$.",
          ruleApplied: 'Perfect square under the root',
        },
        {
          stepNumber: 3,
          title: 'Integrate',
          mathLatex: "L = \\int_1^3 \\left(y^2 + \\frac{1}{4y^2}\\right)dy = \\left[\\frac{y^3}{3} - \\frac{1}{4y}\\right]_1^3 = \\left(9 - \\frac{1}{12}\\right) - \\left(\\frac13 - \\frac14\\right) = \\frac{53}{6}",
          explanation: "Limits are $y$-values because the integral is in $y$.",
          ruleApplied: '$L = \\int_c^d \\sqrt{1 + [g\'(y)]^2}\\,dy$',
        },
      ],
    },
    {
      id: 'arc-p07',
      problemNumber: 7,
      difficulty: 'Exam-Level',
      prompt: 'Find the length of the curve $x = \\frac23(y - 1)^{3/2}$ from $y = 1$ to $y = 4$.',
      questionLatex: "x = \\frac23(y - 1)^{3/2}, \\qquad 1 \\le y \\le 4",
      hint: "$1 + [g']^2$ simplifies to a single term.",
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate and square',
          mathLatex: "g'(y) = (y - 1)^{1/2}, \\qquad 1 + [g']^2 = 1 + (y - 1) = y",
          explanation: "The constant $\\frac23$ cancels the $\\frac32$ from the power rule.",
          ruleApplied: 'Power rule',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "L = \\int_1^4 \\sqrt{y}\\,dy = \\frac23\\left(4^{3/2} - 1\\right) = \\frac{14}{3}",
          explanation: "The same length as the polygon example in the notes: this curve is that one shifted and with the axes swapped.",
          ruleApplied: '$L = \\int_c^d \\sqrt{1 + [g\'(y)]^2}\\,dy$',
        },
      ],
    },
    {
      id: 'arc-p08',
      problemNumber: 8,
      difficulty: 'Exam-Level',
      prompt: 'Find the length of the curve $y = \\dfrac{e^x + e^{-x}}{2}$ from $x = 0$ to $x = \\ln 2$.',
      questionLatex: "y = \\frac{e^x + e^{-x}}{2}, \\qquad 0 \\le x \\le \\ln 2",
      hint: "Recognise the function before differentiating.",
      steps: [
        {
          stepNumber: 1,
          title: 'Recognise and differentiate',
          mathLatex: "y = \\cosh x, \\qquad f'(x) = \\sinh x, \\qquad 1 + \\sinh^2 x = \\cosh^2 x",
          explanation: "The catenary with $a = 1$.",
          ruleApplied: '$\\cosh^2 x - \\sinh^2 x = 1$',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "L = \\int_0^{\\ln 2}\\cosh x\\,dx = \\sinh(\\ln 2) = \\frac{2 - \\frac12}{2} = \\frac34",
          explanation: "$e^{\\ln 2} = 2$ and $e^{-\\ln 2} = \\frac12$.",
          ruleApplied: '$\\int \\cosh x\\,dx = \\sinh x + C$',
          pitfall: "Working with the exponentials directly and missing that $\\left(\\frac{e^x - e^{-x}}{2}\\right)^2 + 1 = \\left(\\frac{e^x + e^{-x}}{2}\\right)^2$.",
        },
      ],
    },
    {
      id: 'arc-p09',
      problemNumber: 9,
      difficulty: 'Exam-Level',
      prompt: 'Find the length of the curve $y = \\dfrac{x^2}{2} - \\dfrac{\\ln x}{4}$ from $x = 1$ to $x = e$.',
      questionLatex: "y = \\frac{x^2}{2} - \\frac{\\ln x}{4}, \\qquad 1 \\le x \\le e",
      hint: "$f' = x - \\frac{1}{4x}$; the product of the two terms is $-\\frac14$.",
      steps: [
        {
          stepNumber: 1,
          title: 'Perfect square',
          mathLatex: "f'(x) = x - \\frac{1}{4x}, \\qquad 1 + [f']^2 = x^2 + \\frac12 + \\frac{1}{16x^2} = \\left(x + \\frac{1}{4x}\\right)^2",
          explanation: "The cross term is $-2\\cdot x\\cdot\\frac{1}{4x} = -\\frac12$.",
          ruleApplied: 'Perfect square under the root',
        },
        {
          stepNumber: 2,
          title: 'Integrate',
          mathLatex: "L = \\int_1^e \\left(x + \\frac{1}{4x}\\right)dx = \\left[\\frac{x^2}{2} + \\frac{\\ln x}{4}\\right]_1^e = \\frac{e^2}{2} + \\frac14 - \\frac12 = \\frac{e^2}{2} - \\frac14 \\approx 3.44",
          explanation: "$\\ln e = 1$ and $\\ln 1 = 0$.",
          ruleApplied: 'Fundamental Theorem of Calculus',
        },
      ],
    },
    {
      id: 'arc-p10',
      problemNumber: 10,
      difficulty: 'Challenge',
      prompt: 'Find the total length of the astroid $x^{2/3} + y^{2/3} = 1$.',
      questionLatex: "x^{2/3} + y^{2/3} = 1",
      hint: "By symmetry it is four times the length in the first quadrant. Differentiate implicitly and use the equation of the curve to simplify $1 + [y']^2$.",
      figure: {
        kind: 'plot',
        caption: 'The astroid is symmetric about both axes and has four cusps.',
        x: [-1.3, 1.3],
        y: [-1.3, 1.3],
        equal: true,
        xTicks: [-1, 1],
        yTicks: [-1, 1],
        items: [{ type: 'curve', x: (t) => Math.cos(t) ** 3, y: (t) => Math.sin(t) ** 3, t: [0, 2 * Math.PI], label: 'x^{2/3} + y^{2/3} = 1', labelAt: [0.35, 0.35], anchor: 'ne' }],
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate implicitly',
          mathLatex: "\\frac23 x^{-1/3} + \\frac23 y^{-1/3}y' = 0 \\;\\Longrightarrow\\; y' = -\\frac{y^{1/3}}{x^{1/3}}",
          explanation: "Work in the first quadrant, $0 < x < 1$.",
          ruleApplied: 'Implicit differentiation',
        },
        {
          stepNumber: 2,
          title: 'Simplify with the curve',
          mathLatex: "1 + [y']^2 = 1 + \\frac{y^{2/3}}{x^{2/3}} = \\frac{x^{2/3} + y^{2/3}}{x^{2/3}} = \\frac{1}{x^{2/3}}",
          explanation: "The numerator is exactly the left side of the equation of the curve, which equals $1$.",
          ruleApplied: 'Substitution',
        },
        {
          stepNumber: 3,
          title: 'One quarter',
          mathLatex: "L_1 = \\int_0^1 x^{-1/3}\\,dx = \\frac32 x^{2/3}\\Big|_0^1 = \\frac32",
          explanation: "At $x = 0$ the integrand is infinite (a cusp), so this is an improper integral; it converges because the power $-\\frac13 > -1$.",
          ruleApplied: 'Power rule; improper integral',
          pitfall: "Stopping because $f'$ is not continuous at $x = 0$. The improper integral still converges.",
        },
        {
          stepNumber: 4,
          title: 'Total',
          mathLatex: "L = 4\\cdot\\frac32 = 6",
          explanation: "The astroid fits inside the unit circle, whose circumference is $2\\pi \\approx 6.28$, and is just shorter.",
          ruleApplied: 'Symmetry',
        },
      ],
    },
  ],
};
