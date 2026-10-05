import type { Topic } from '../../types/curriculum';
import { piTicks } from '../../lib/plot';

/**
 * Unit 1.4 — Inverse Trigonometric Functions.
 * Source: lecture deck 1.4 (definitions, principal ranges, derivatives)
 * and the three basic integral forms introduced at the start of deck 1.5.
 * Notation follows the deck: sin^{-1} (not arcsin) and D_x for derivatives.
 */
export const inverseTrig: Topic = {
  id: 'inverse-trig',
  title: 'Inverse Trigonometric Functions',
  slug: 'inverse-trigonometric-functions',
  unitNumber: '1.4',
  summary:
    'Trigonometric functions are periodic, so they are not one-to-one. Restricting each to a principal interval makes it invertible; the inverse returns an angle. This unit fixes those intervals, derives the six derivatives from the theorem on derivatives of inverses, and reads the derivative table backwards to get three integral forms.',

  // ───────────────────────────── EXAM NOTES ─────────────────────────────
  examNotes: [
    {
      title: 'Why the domain must be restricted',
      concept:
        'A function has an inverse only if it is one-to-one. $\\sin t$ fails the horizontal line test (a horizontal line meets the graph infinitely often), so we keep only the piece on $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$, where it is increasing and still takes every value in $[-1,1]$. Then $y = \\sin^{-1} x$ if and only if $x = \\sin y$ and $-\\frac{\\pi}{2} \\le y \\le \\frac{\\pi}{2}$. The same idea is applied to the other five functions.',
      conditions:
        'The output of an inverse trig function is always an angle in its principal range. The input is a ratio: $[-1,1]$ for $\\sin^{-1}$ and $\\cos^{-1}$, all reals for $\\tan^{-1}$ and $\\cot^{-1}$, and $|x| \\ge 1$ for $\\sec^{-1}$ and $\\csc^{-1}$.',
      commonTraps: [
        'Reading the $-1$ as an exponent: $\\sin^{-1} x \\ne (\\sin x)^{-1} = \\csc x$. It means inverse, not reciprocal.',
        'Giving an angle outside the principal range, e.g. writing $\\sin^{-1}\\!\\left(-\\tfrac12\\right) = \\tfrac{7\\pi}{6}$. The only acceptable value is $-\\tfrac{\\pi}{6}$.',
        'Evaluating $\\sin^{-1} 2$ or $\\sec^{-1}\\tfrac12$. Neither exists: the input is outside the domain.',
      ],
      tip: 'Before computing anything, say the sentence "the answer is an angle between ___ and ___". It catches most range errors.',
      figure: {
        kind: 'plot',
        caption: 'A horizontal line such as $y = \\frac12$ meets $y = \\sin x$ infinitely often. Keeping only the piece on $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$ leaves one crossing, at $\\frac{\\pi}{6} = \\sin^{-1}\\frac12$, and that piece is the graph we invert.',
        x: [-6.6, 6.6],
        y: [-1.5, 1.5],
        aspect: 2.3,
        xTicks: piTicks(-4, 4),
        yTicks: [-1, 1],
        items: [
          { type: 'fn', f: Math.sin, tone: 'muted', width: 1.5 },
          { type: 'fn', f: Math.sin, from: -Math.PI / 2, to: Math.PI / 2, width: 3, label: '\\text{principal piece}', labelAt: [-Math.PI / 2, -1], anchor: 'sw' },
          { type: 'hline', y: 0.5, tone: 2, dashed: false, width: 1.5, label: 'y = \\tfrac12', labelAt: [6.6, 0.5], anchor: 'nw' },
          ...[-11 * Math.PI / 6, -7 * Math.PI / 6, 5 * Math.PI / 6, 13 * Math.PI / 6].map((x) => ({ type: 'point' as const, at: [x, 0.5] as [number, number], tone: 'muted' as const, hollow: true })),
          { type: 'point', at: [Math.PI / 6, 0.5], tone: 2, label: '\\tfrac{\\pi}{6}', anchor: 'nw' },
        ],
      },
    },
    {
      title: 'The six principal ranges (deck convention)',
      concept:
        "Each inverse trigonometric function returns an angle from a fixed principal range, chosen so that the restricted function is one-to-one. This course uses the ranges below.",
      table: {
        head: ["Function", "Domain", "Range"],
        rows: [
          ["$\\sin^{-1} x$", "$[-1, 1]$", "$\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$"],
          ["$\\cos^{-1} x$", "$[-1, 1]$", "$[0, \\pi]$"],
          ["$\\tan^{-1} x$", "$\\mathbb{R}$", "$\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$"],
          ["$\\cot^{-1} x$", "$\\mathbb{R}$", "$(0, \\pi)$"],
          ["$\\sec^{-1} x$", "$|x| \\ge 1$", "$\\left[0, \\frac{\\pi}{2}\\right)$ for $x \\ge 1$; $\\left(\\frac{\\pi}{2}, \\pi\\right]$ for $x \\le -1$"],
          ["$\\csc^{-1} x$", "$|x| \\ge 1$", "$\\left(0, \\frac{\\pi}{2}\\right]$ for $x \\ge 1$; $\\left[-\\frac{\\pi}{2}, 0\\right)$ for $x \\le -1$"],
        ],
      },
      conditions:
        'Sine-type inverses ($\\sin^{-1}$, $\\tan^{-1}$, $\\csc^{-1}$) live in quadrants I and IV, around $0$. Cosine-type inverses ($\\cos^{-1}$, $\\cot^{-1}$, $\\sec^{-1}$) live in quadrants I and II, between $0$ and $\\pi$.',
      commonTraps: [
        'Closing the $\\tan^{-1}$ range. $\\pm\\frac{\\pi}{2}$ are horizontal asymptotes, never attained.',
        'Including $\\frac{\\pi}{2}$ in the range of $\\sec^{-1}$, or $0$ in the range of $\\csc^{-1}$. $\\sec\\frac{\\pi}{2}$ and $\\csc 0$ are undefined.',
        'Using a different textbook\'s $\\sec^{-1}$ range. Some books send $x \\le -1$ to $\\left[\\pi, \\frac{3\\pi}{2}\\right)$; that changes the derivative formula (no absolute value). This course uses the range above, so the derivative carries $|u|$.',
      ],
      tip: 'Memorise two ranges only: $\\sin^{-1}$ gives $\\left[-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right]$, $\\cos^{-1}$ gives $[0,\\pi]$. The other four copy one of these and delete the endpoints where the original function is undefined.',
      figure: {
        kind: 'group',
        caption: 'Each graph is the restricted trigonometric function reflected in $y = x$. Read the range off the vertical axis: that is where the answer must land.',
        figures: [
          {
            kind: 'plot',
            title: '$y = \\sin^{-1} x$',
            x: [-1.6, 1.6],
            y: [-1.9, 1.9],
            aspect: 1.25,
            xTicks: [-1, 1],
            yTicks: piTicks(-1, 1),
            items: [
              { type: 'fn', f: Math.asin, from: -1, to: 1 },
              { type: 'point', at: [-1, -Math.PI / 2] },
              { type: 'point', at: [1, Math.PI / 2] },
            ],
          },
          {
            kind: 'plot',
            title: '$y = \\cos^{-1} x$',
            x: [-1.6, 1.6],
            y: [-0.4, 3.5],
            aspect: 1.25,
            xTicks: [-1, 1],
            yTicks: piTicks(1, 2),
            items: [
              { type: 'fn', f: Math.acos, from: -1, to: 1 },
              { type: 'point', at: [-1, Math.PI] },
              { type: 'point', at: [1, 0] },
            ],
          },
          {
            kind: 'plot',
            title: '$y = \\tan^{-1} x$',
            x: [-6, 6],
            y: [-1.9, 1.9],
            aspect: 1.25,
            xTicks: [-4, 4],
            yTicks: piTicks(-1, 1),
            items: [
              { type: 'hline', y: Math.PI / 2 },
              { type: 'hline', y: -Math.PI / 2 },
              { type: 'fn', f: Math.atan },
            ],
          },
          {
            kind: 'plot',
            title: '$y = \\sec^{-1} x$',
            x: [-5, 5],
            y: [-0.4, 3.5],
            aspect: 1.25,
            xTicks: [-1, 1],
            yTicks: piTicks(1, 2),
            items: [
              { type: 'hline', y: Math.PI / 2 },
              { type: 'fn', f: (x) => Math.acos(1 / x), from: 1 },
              { type: 'fn', f: (x) => Math.acos(1 / x), to: -1 },
              { type: 'point', at: [1, 0] },
              { type: 'point', at: [-1, Math.PI] },
            ],
          },
        ],
      },
    },
    {
      title: 'Cancellation works in one direction only',
      concept:
        '$\\sin(\\sin^{-1} x) = x$ for every $x$ in $[-1,1]$. But $\\sin^{-1}(\\sin x) = x$ only when $x$ is already in $\\left[-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right]$. Outside that interval the inverse returns the principal angle with the same sine, not $x$ itself.',
      conditions:
        'Outer-trig, inner-inverse: always cancels on the domain of the inverse. Outer-inverse, inner-trig: cancels only on the principal range.',
      commonTraps: [
        'Writing $\\sin^{-1}\\!\\left(\\sin\\frac{3\\pi}{4}\\right) = \\frac{3\\pi}{4}$. The correct value is $\\frac{\\pi}{4}$, because $\\frac{3\\pi}{4}$ is not in $\\left[-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right]$.',
        'Writing $\\cos^{-1}(\\cos(-x)) = -x$. Cosine is even and the range is $[0,\\pi]$, so for $0 \\le x \\le \\pi$ the value is $x$.',
      ],
      tip: 'For mixed compositions such as $\\cos(\\sin^{-1} x)$, let $\\theta = \\sin^{-1} x$, draw a right triangle with opposite $x$ and hypotenuse $1$, and read off $\\cos\\theta = \\sqrt{1-x^2}$. The root is positive because $\\cos\\theta \\ge 0$ on $\\left[-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right]$.',
      figure: {
        kind: 'plot',
        caption: '$y = \\sin^{-1}(\\sin x)$ agrees with $y = x$ only on $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$. Everywhere else it folds back into that band, giving a zigzag.',
        x: [-6.6, 6.6],
        y: [-2.2, 2.2],
        aspect: 2.1,
        xTicks: piTicks(-4, 4),
        yTicks: piTicks(-1, 1),
        items: [
          { type: 'polygon', points: [[-Math.PI / 2, -2.2], [Math.PI / 2, -2.2], [Math.PI / 2, 2.2], [-Math.PI / 2, 2.2]], tone: 'muted' },
          { type: 'fn', f: (x) => x, tone: 2, dashed: true, label: 'y = x', labelAt: [2, 2], anchor: 'w' },
          { type: 'fn', f: (x) => Math.asin(Math.sin(x)), label: 'y = \\sin^{-1}(\\sin x)', labelAt: [4.2, -1.1], anchor: 's' },
        ],
      },
    },
    {
      title: 'Where the derivative formulas come from',
      concept:
        "Apply the theorem on derivatives of inverses, $(f^{-1})'(x) = \\dfrac{1}{f'(f^{-1}(x))}$, with $f = \\sin$. Replacing $\\cos$ by $+\\sqrt{1 - \\sin^2}$ is legal because cosine is non-negative on the principal range of $\\sin^{-1}$.",
      display: "\\begin{aligned} D_x\\left(\\sin^{-1} x\\right) &= \\frac{1}{\\cos\\left(\\sin^{-1} x\\right)} \\\\ &= \\frac{1}{\\sqrt{1 - \\left[\\sin\\left(\\sin^{-1} x\\right)\\right]^2}} \\\\ &= \\frac{1}{\\sqrt{1 - x^2}} \\end{aligned}",
      conditions:
        '$\\sin^{-1}$ and $\\cos^{-1}$ are differentiable only on the open interval $(-1,1)$: at $x = \\pm 1$ the denominator is $0$ and the tangent line is vertical. $\\sec^{-1}$ and $\\csc^{-1}$ are differentiable only for $|x| > 1$.',
      commonTraps: [
        'Claiming $\\sin^{-1} x$ is differentiable on $[-1,1]$. It is continuous there, differentiable only on $(-1,1)$.',
        'Being unable to rebuild a forgotten formula. If you blank, set $y = \\tan^{-1} x$, write $\\tan y = x$, differentiate implicitly: $\\sec^2 y \\, y\' = 1$, so $y\' = \\dfrac{1}{1+\\tan^2 y} = \\dfrac{1}{1+x^2}$.',
      ],
      tip: 'The implicit-differentiation derivation takes four lines. Practise it once for each of $\\sin^{-1}$, $\\tan^{-1}$, $\\sec^{-1}$ so the table is recoverable under pressure.',
      figure: {
        kind: 'triangle',
        caption: 'Let $\\theta = \\sin^{-1} x$, so $\\sin\\theta = \\frac{x}{1}$. Pythagoras gives the third side, and $\\cos\\theta = \\sqrt{1-x^2}$ with no $\\pm$ because $\\theta$ lies in $\\left[-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right]$.',
        opposite: 'x',
        hypotenuse: '1',
        adjacent: '\\sqrt{1-x^2}',
        highlight: 'adjacent',
      },
    },
    {
      title: 'The derivative table and its chain-rule factor',
      concept:
        "There are only three shapes. Each co-function has the same shape with a minus sign, and every derivative is multiplied by $D_x u$.",
      table: {
        head: ["Function", "Derivative", "Co-function"],
        rows: [
          ["$\\sin^{-1} u$", "$\\dfrac{D_x u}{\\sqrt{1-u^2}}$", "$\\cos^{-1} u$: $\\;-\\dfrac{D_x u}{\\sqrt{1-u^2}}$"],
          ["$\\tan^{-1} u$", "$\\dfrac{D_x u}{1+u^2}$", "$\\cot^{-1} u$: $\\;-\\dfrac{D_x u}{1+u^2}$"],
          ["$\\sec^{-1} u$", "$\\dfrac{D_x u}{|u|\\sqrt{u^2-1}}$", "$\\csc^{-1} u$: $\\;-\\dfrac{D_x u}{|u|\\sqrt{u^2-1}}$"],
        ],
      },
      conditions:
        'The cofunction pairs differ by a sign because they add to a constant: $\\sin^{-1}x + \\cos^{-1}x = \\tan^{-1}x + \\cot^{-1}x = \\sec^{-1}x + \\csc^{-1}x = \\frac{\\pi}{2}$ on their common domains.',
      commonTraps: [
        'Dropping the factor $D_x u$. $D_x(\\sin^{-1} 3x)$ is $\\dfrac{3}{\\sqrt{1-9x^2}}$, not $\\dfrac{1}{\\sqrt{1-9x^2}}$.',
        'Squaring only part of $u$: for $u = 3x$, $u^2 = 9x^2$, not $3x^2$.',
        'Swapping the two radicals: $\\sqrt{1-u^2}$ belongs to $\\sin^{-1}$, $\\sqrt{u^2-1}$ belongs to $\\sec^{-1}$.',
        'Dropping the absolute value in $|u|\\sqrt{u^2-1}$. It matters whenever $u$ can be negative.',
        'Leaving $\\sqrt{x^2}$ as $x$. It is $|x|$.',
      ],
      tip: 'Write $u = \\ldots$ and $D_x u = \\ldots$ on a separate line before touching the formula. One extra line prevents the two most common errors in this unit.',
    },
    {
      title: 'Direct integrals: reading the table backwards',
      concept:
        "Read the derivative table backwards. Only three antiderivatives are needed: the derivatives of $\\cos^{-1}$, $\\cot^{-1}$ and $\\csc^{-1}$ are the negatives of these, so they give nothing new.",
      table: {
        head: ["Integral", "Antiderivative", "With $a^2$ in place of $1$"],
        rows: [
          ["$\\displaystyle\\int \\frac{du}{\\sqrt{1-u^2}}$", "$\\sin^{-1} u + C$", "$\\sin^{-1}\\dfrac{u}{a} + C$"],
          ["$\\displaystyle\\int \\frac{du}{1+u^2}$", "$\\tan^{-1} u + C$", "$\\dfrac1a\\tan^{-1}\\dfrac{u}{a} + C$"],
          ["$\\displaystyle\\int \\frac{du}{u\\sqrt{u^2-1}}$", "$\\sec^{-1}|u| + C$", "$\\dfrac1a\\sec^{-1}\\left|\\dfrac{u}{a}\\right| + C$"],
        ],
      },
      conditions:
        'The numerator must be exactly $du$ (up to a constant factor). $\\sin^{-1}$ form needs $|u| < a$; $\\sec^{-1}$ form needs $|u| > a$; $\\tan^{-1}$ form has no restriction on $u$.',
      commonTraps: [
        'Putting $\\frac{1}{a}$ in front of the $\\sin^{-1}$ form. Only the $\\tan^{-1}$ and $\\sec^{-1}$ forms carry $\\frac{1}{a}$.',
        'Using $a^2$ where $a$ is needed: in $\\displaystyle\\int \\frac{dx}{9+x^2}$, $a = 3$, not $9$.',
        'Forcing an inverse-trig form when a plain substitution works: $\\displaystyle\\int \\frac{x\\,dx}{\\sqrt{1-x^2}}$ has an $x$ on top, so $u = 1-x^2$ gives $-\\sqrt{1-x^2} + C$. No $\\sin^{-1}$ appears.',
        'Confusing $\\displaystyle\\int \\frac{dx}{1+x^2} = \\tan^{-1}x + C$ with $\\displaystyle\\int \\frac{x\\,dx}{1+x^2} = \\tfrac12\\ln(1+x^2) + C$.',
      ],
      tip: 'Look at the numerator first. A bare constant over a quadratic or a square root of a quadratic points to an inverse trig form. A numerator that is the derivative of what is under the root or in the denominator points to an ordinary $u$-substitution.',
    },
  ],

  // ───────────────────────────── FORMULAS ─────────────────────────────
  keyFormulas: [
    {
      id: 'inv-trig-d-arcsin',
      name: 'Derivative of inverse sine',
      formulaLatex: 'D_x(\\sin^{-1} u) = \\frac{1}{\\sqrt{1-u^2}}\\, D_x u',
      whenToUse: 'Differentiating $\\sin^{-1}$ of any differentiable inner function $u$.',
      restrictions: '$|u| < 1$.',
      example: 'D_x\\left(\\sin^{-1} 3x\\right) = \\frac{3}{\\sqrt{1-9x^2}}',
    },
    {
      id: 'inv-trig-d-arccos',
      name: 'Derivative of inverse cosine',
      formulaLatex: 'D_x(\\cos^{-1} u) = \\frac{-1}{\\sqrt{1-u^2}}\\, D_x u',
      whenToUse: 'Same shape as $\\sin^{-1}$ with a minus sign.',
      restrictions: '$|u| < 1$.',
      example: 'D_x\\left(\\cos^{-1} 3x\\right) = \\frac{-3}{\\sqrt{1-9x^2}}',
    },
    {
      id: 'inv-trig-d-arctan',
      name: 'Derivative of inverse tangent',
      formulaLatex: 'D_x(\\tan^{-1} u) = \\frac{1}{1+u^2}\\, D_x u',
      whenToUse: 'Differentiating $\\tan^{-1}$ of any differentiable $u$. No square root appears.',
      restrictions: 'None: valid for all real $u$.',
      example: 'D_x\\left(\\tan^{-1} x^2\\right) = \\frac{2x}{1+x^4}',
    },
    {
      id: 'inv-trig-d-arccot',
      name: 'Derivative of inverse cotangent',
      formulaLatex: 'D_x(\\cot^{-1} u) = \\frac{-1}{1+u^2}\\, D_x u',
      whenToUse: 'Same shape as $\\tan^{-1}$ with a minus sign.',
      restrictions: 'None: valid for all real $u$.',
      example: 'D_x\\left(\\cot^{-1} 2x\\right) = \\frac{-2}{1+4x^2}',
    },
    {
      id: 'inv-trig-d-arcsec',
      name: 'Derivative of inverse secant',
      formulaLatex: 'D_x(\\sec^{-1} u) = \\frac{1}{|u|\\sqrt{u^2-1}}\\, D_x u',
      whenToUse: 'Differentiating $\\sec^{-1}$ of a differentiable $u$. Keep the absolute value unless you know $u > 0$.',
      restrictions: '$|u| > 1$.',
      example: 'D_x\\left(\\sec^{-1} 2x\\right) = \\frac{2}{|2x|\\sqrt{4x^2-1}} = \\frac{1}{|x|\\sqrt{4x^2-1}}',
    },
    {
      id: 'inv-trig-d-arccsc',
      name: 'Derivative of inverse cosecant',
      formulaLatex: 'D_x(\\csc^{-1} u) = \\frac{-1}{|u|\\sqrt{u^2-1}}\\, D_x u',
      whenToUse: 'Same shape as $\\sec^{-1}$ with a minus sign.',
      restrictions: '$|u| > 1$.',
      example: 'D_x\\left(\\csc^{-1} x^2\\right) = \\frac{-2x}{x^2\\sqrt{x^4-1}} = \\frac{-2}{x\\sqrt{x^4-1}}',
    },
    {
      id: 'inv-trig-inverse-derivative',
      name: 'Derivative of an inverse function',
      formulaLatex: '\\left(f^{-1}\\right)\'(x) = \\frac{1}{f\'\\!\\left(f^{-1}(x)\\right)}',
      whenToUse: 'Deriving any of the six formulas above, or differentiating an inverse you have no formula for.',
      restrictions: '$f$ one-to-one and differentiable, with $f\'\\!\\left(f^{-1}(x)\\right) \\ne 0$.',
      example: 'D_x(\\sin^{-1}x) = \\frac{1}{\\cos(\\sin^{-1}x)} = \\frac{1}{\\sqrt{1-x^2}}',
    },
    {
      id: 'inv-trig-cofunction',
      name: 'Cofunction identities',
      formulaLatex:
        '\\begin{gathered} \\sin^{-1}x + \\cos^{-1}x = \\frac{\\pi}{2} \\\\[1ex] \\tan^{-1}x + \\cot^{-1}x = \\frac{\\pi}{2} \\\\[1ex] \\sec^{-1}x + \\csc^{-1}x = \\frac{\\pi}{2} \\end{gathered}',
      whenToUse: 'Spotting that a sum of a function and its cofunction is constant, so its derivative is $0$. Also explains why each "co" derivative is the negative of its partner.',
      restrictions: '$|x| \\le 1$ for the first; all real $x$ for the second; $|x| \\ge 1$ for the third.',
      example: 'D_t\\left(\\sec^{-1}5t + \\csc^{-1}5t\\right) = D_t\\left(\\frac{\\pi}{2}\\right) = 0',
    },
    {
      id: 'inv-trig-int-arcsin',
      name: 'Integral yielding inverse sine',
      formulaLatex: '\\int \\frac{du}{\\sqrt{a^2-u^2}} = \\sin^{-1}\\frac{u}{a} + C',
      whenToUse: 'Constant numerator over the square root of (constant squared minus variable squared).',
      restrictions: '$a > 0$ and $|u| < a$. There is no $\\frac{1}{a}$ in front.',
      example: '\\int \\frac{dx}{\\sqrt{16-x^2}} = \\sin^{-1}\\frac{x}{4} + C',
    },
    {
      id: 'inv-trig-int-arctan',
      name: 'Integral yielding inverse tangent',
      formulaLatex: '\\int \\frac{du}{a^2+u^2} = \\frac{1}{a}\\tan^{-1}\\frac{u}{a} + C',
      whenToUse: 'Constant numerator over a sum of squares with no square root.',
      restrictions: '$a \\ne 0$ (take $a > 0$). Valid for all real $u$.',
      example: '\\int \\frac{dx}{25+x^2} = \\frac{1}{5}\\tan^{-1}\\frac{x}{5} + C',
    },
    {
      id: 'inv-trig-int-arcsec',
      name: 'Integral yielding inverse secant',
      formulaLatex: '\\int \\frac{du}{u\\sqrt{u^2-a^2}} = \\frac{1}{a}\\sec^{-1}\\left|\\frac{u}{a}\\right| + C',
      whenToUse: 'A factor $u$ outside the root and (variable squared minus constant squared) inside it.',
      restrictions: '$a > 0$ and $|u| > a$.',
      example: '\\int \\frac{dx}{x\\sqrt{x^2-4}} = \\frac{1}{2}\\sec^{-1}\\left|\\frac{x}{2}\\right| + C',
    },
  ],

  // ───────────────────────────── WORKED EXAMPLES ─────────────────────────────
  workedExamples: [
    {
      id: 'inv-trig-we-1',
      title: 'A sum with a nested inverse',
      problemLatex: 'h(x) = \\cos^{-1}(3x) + \\tan^{-1}\\left(\\sin^{-1}x\\right)',
      keyIdea:
        'Differentiate term by term. In the second term the inner function is itself an inverse trig function, so the chain rule produces a second inverse-trig derivative.',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Name the inner function of each term',
          mathLatex:
            '\\begin{aligned} \\text{Term 1: } & u = 3x, & D_x u &= 3 \\\\ \\text{Term 2: } & u = \\sin^{-1}x, & D_x u &= \\frac{1}{\\sqrt{1-x^2}} \\end{aligned}',
          explanation:
            'Each term is an inverse trig function of something other than plain $x$. That is the signal for the chain rule. Listing $u$ and $D_x u$ first means the formula step is pure substitution.',
          ruleApplied: 'Chain rule setup',
          pitfall: 'In term 2 the inner function is $\\sin^{-1}x$, the whole thing, not $x$.',
        },
        {
          stepNumber: 2,
          title: 'Apply the two derivative formulas',
          mathLatex:
            'h\'(x) = \\frac{-1}{\\sqrt{1-(3x)^2}}\\,(3) + \\frac{1}{1+\\left(\\sin^{-1}x\\right)^2}\\left(\\frac{1}{\\sqrt{1-x^2}}\\right)',
          explanation:
            'Term 1 uses the $\\cos^{-1}$ formula (minus sign, square root). Term 2 uses the $\\tan^{-1}$ formula (no root, plus sign in the denominator), and $u^2$ there is $(\\sin^{-1}x)^2$.',
          ruleApplied: '$D_x(\\cos^{-1}u)$ and $D_x(\\tan^{-1}u)$',
          pitfall: '$(\\sin^{-1}x)^2$ is the square of an angle. It does not simplify to $x^2$ or to $\\sin^{-2}x$.',
        },
        {
          stepNumber: 3,
          title: 'Tidy up',
          mathLatex:
            'h\'(x) = \\frac{-3}{\\sqrt{1-9x^2}} + \\frac{1}{\\left[1+\\left(\\sin^{-1}x\\right)^2\\right]\\sqrt{1-x^2}}',
          explanation:
            'The two terms have unrelated denominators, so combining them into one fraction would not simplify anything. Stop here. Both terms need $|x| < \\tfrac13$ to be defined.',
          ruleApplied: 'Algebraic simplification',
          pitfall: '$(3x)^2 = 9x^2$, not $3x^2$.',
        },
      ],
    },
    {
      id: 'inv-trig-we-2',
      title: 'Product rule with inverse secant of a reciprocal',
      problemLatex: 'f(x) = x\\,\\sec^{-1}\\frac{1}{x}',
      keyIdea:
        'Product rule outside, chain rule inside. The absolute values from $|u|$ and from $\\sqrt{x^2}$ multiply to $x^2$, which is why the answer has no absolute value.',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Product rule',
          mathLatex:
            'f\'(x) = x\\,D_x\\!\\left(\\sec^{-1}\\frac{1}{x}\\right) + \\sec^{-1}\\frac{1}{x}\\cdot D_x(x)',
          explanation:
            'Two factors that both depend on $x$ are multiplied, so the product rule comes first. The chain rule is only needed inside the first piece.',
          ruleApplied: 'Product rule',
          pitfall: 'Differentiating only the inverse secant and forgetting the second product-rule term.',
        },
        {
          stepNumber: 2,
          title: 'Differentiate the inverse secant',
          mathLatex:
            'D_x\\!\\left(\\sec^{-1}\\frac{1}{x}\\right) = \\frac{1}{\\left|\\frac{1}{x}\\right|\\sqrt{\\frac{1}{x^2}-1}}\\left(-\\frac{1}{x^2}\\right)',
          explanation:
            'Here $u = \\frac{1}{x}$ and $D_x u = -\\frac{1}{x^2}$. The domain requires $\\left|\\frac1x\\right| > 1$, that is $0 < |x| < 1$, so $x$ may be negative and the absolute value must stay.',
          ruleApplied: '$D_x(\\sec^{-1}u)$ with the chain rule',
          pitfall: 'Writing $D_x\\left(\\frac1x\\right) = \\frac{1}{x^2}$ and losing the minus sign.',
        },
        {
          stepNumber: 3,
          title: 'Simplify the radical',
          mathLatex:
            '\\sqrt{\\frac{1}{x^2}-1} = \\sqrt{\\frac{1-x^2}{x^2}} = \\frac{\\sqrt{1-x^2}}{|x|} \\quad\\Longrightarrow\\quad \\left|\\frac{1}{x}\\right|\\sqrt{\\frac{1}{x^2}-1} = \\frac{\\sqrt{1-x^2}}{x^2}',
          explanation:
            'A compound fraction under a root is easier to handle after combining over a common denominator. The goal is a single $\\sqrt{1-x^2}$. Note $\\sqrt{x^2} = |x|$, and $|x| \\cdot |x| = x^2$.',
          ruleApplied: '$\\sqrt{x^2} = |x|$',
          pitfall: 'Replacing $\\sqrt{x^2}$ by $x$. Here the two absolute values happen to cancel, but in general that shortcut gives the wrong sign for negative $x$.',
        },
        {
          stepNumber: 4,
          title: 'Assemble',
          mathLatex:
            'f\'(x) = x\\cdot\\frac{x^2}{\\sqrt{1-x^2}}\\left(-\\frac{1}{x^2}\\right) + \\sec^{-1}\\frac{1}{x} = \\frac{-x}{\\sqrt{1-x^2}} + \\sec^{-1}\\frac{1}{x}',
          explanation:
            'The $x^2$ factors cancel. Sanity check: $\\sec^{-1}\\frac1x = \\cos^{-1}x$, so $f(x) = x\\cos^{-1}x$, whose derivative is $\\cos^{-1}x - \\frac{x}{\\sqrt{1-x^2}}$. Same answer.',
          ruleApplied: 'Algebraic simplification',
        },
      ],
    },
    {
      id: 'inv-trig-we-3',
      title: 'A derivative that collapses',
      problemLatex: 'r(x) = 4\\sin^{-1}\\frac{x}{2} + x\\sqrt{4-x^2}',
      keyIdea:
        'Rewrite every piece over the same radical $\\sqrt{4-x^2}$. Exam problems of this shape are built so that the terms combine.',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate the inverse sine term',
          mathLatex:
            'D_x\\!\\left(4\\sin^{-1}\\frac{x}{2}\\right) = 4\\cdot\\frac{1}{\\sqrt{1-\\frac{x^2}{4}}}\\cdot\\frac{1}{2} = \\frac{2}{\\sqrt{\\frac{4-x^2}{4}}} = \\frac{4}{\\sqrt{4-x^2}}',
          explanation:
            'With $u = \\frac{x}{2}$, $D_x u = \\frac12$. Combining $1 - \\frac{x^2}{4}$ over a common denominator and pulling $\\sqrt4 = 2$ out of the root produces the radical $\\sqrt{4-x^2}$ that already appears in the second term.',
          ruleApplied: '$D_x(\\sin^{-1}u)$ with the chain rule',
          pitfall: 'Forgetting the $\\frac12$ from $D_x\\left(\\frac{x}{2}\\right)$, or pulling $4$ instead of $2$ out of the square root.',
        },
        {
          stepNumber: 2,
          title: 'Differentiate the product',
          mathLatex:
            'D_x\\!\\left(x\\sqrt{4-x^2}\\right) = x\\cdot\\frac{1}{2\\sqrt{4-x^2}}(-2x) + \\sqrt{4-x^2} = \\frac{-x^2}{\\sqrt{4-x^2}} + \\sqrt{4-x^2}',
          explanation:
            'A product of $x$ and a root: product rule, with the chain rule on $\\sqrt{4-x^2}$.',
          ruleApplied: 'Product rule and chain rule',
          pitfall: 'Dropping the inner derivative $-2x$ of $4 - x^2$.',
        },
        {
          stepNumber: 3,
          title: 'Combine over the common radical',
          mathLatex:
            'r\'(x) = \\frac{4-x^2}{\\sqrt{4-x^2}} + \\sqrt{4-x^2} = \\sqrt{4-x^2} + \\sqrt{4-x^2} = 2\\sqrt{4-x^2}',
          explanation:
            'The first two fractions share a denominator, and $\\frac{A}{\\sqrt{A}} = \\sqrt{A}$. Read backwards, this result says $\\int 2\\sqrt{4-x^2}\\,dx = 4\\sin^{-1}\\frac{x}{2} + x\\sqrt{4-x^2} + C$, an integral you will meet again under trigonometric substitution.',
          ruleApplied: '$\\dfrac{A}{\\sqrt{A}} = \\sqrt{A}$ for $A > 0$',
          pitfall: 'Stopping at three separate terms. An unsimplified answer usually loses marks when a clean form exists.',
        },
      ],
    },
    {
      id: 'inv-trig-we-4',
      title: 'A function and its cofunction',
      problemLatex: 'g(t) = \\sec^{-1}5t + \\csc^{-1}5t',
      keyIdea:
        'The two derivatives are exact negatives of each other. Equivalently, $\\sec^{-1}u + \\csc^{-1}u = \\frac{\\pi}{2}$ is constant.',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Differentiate each term',
          mathLatex:
            'g\'(t) = \\frac{1}{|5t|\\sqrt{(5t)^2-1}}\\,(5) + \\frac{-1}{|5t|\\sqrt{(5t)^2-1}}\\,(5)',
          explanation:
            'Both terms have the same inner function $u = 5t$ with $D_t u = 5$. The $\\sec^{-1}$ and $\\csc^{-1}$ formulas are identical except for the sign.',
          ruleApplied: '$D_x(\\sec^{-1}u)$ and $D_x(\\csc^{-1}u)$',
          pitfall: 'Writing $5t$ instead of $|5t|$ in the denominator. It makes no difference to this particular answer, but it is wrong for $t < 0$ in general.',
        },
        {
          stepNumber: 2,
          title: 'Add',
          mathLatex: 'g\'(t) = \\frac{5}{|5t|\\sqrt{25t^2-1}} - \\frac{5}{|5t|\\sqrt{25t^2-1}} = 0',
          explanation:
            'The terms cancel exactly, for every $t$ with $|5t| > 1$. A zero derivative means $g$ is constant on each interval of its domain; indeed $g(t) = \\frac{\\pi}{2}$.',
          ruleApplied: 'Cofunction identity',
          pitfall: 'Doubting a zero answer and going back to "fix" it. Check with the identity instead.',
        },
      ],
    },
    {
      id: 'inv-trig-we-5',
      title: 'A direct integral with a coefficient on the variable',
      problemLatex: '\\int \\frac{dx}{\\sqrt{4-9x^2}}',
      keyIdea:
        'Match the form $\\sqrt{a^2-u^2}$. The coefficient $9$ belongs inside $u$, and $du$ must be made to match.',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Identify a and u',
          mathLatex: '4 - 9x^2 = 2^2 - (3x)^2 \\quad\\Longrightarrow\\quad a = 2,\\; u = 3x,\\; du = 3\\,dx',
          explanation:
            'A constant numerator over the root of (constant minus a multiple of $x^2$) is the $\\sin^{-1}$ form. There is no $x$ in the numerator, so the substitution $u = 4-9x^2$ would fail: its $du = -18x\\,dx$ is not available.',
          ruleApplied: 'Pattern matching to $\\int \\frac{du}{\\sqrt{a^2-u^2}}$',
          pitfall: 'Taking $u = 9x$ or $u = x$. The quantity being squared is $3x$.',
        },
        {
          stepNumber: 2,
          title: 'Substitute',
          mathLatex: '\\int \\frac{dx}{\\sqrt{4-9x^2}} = \\int \\frac{\\frac{1}{3}\\,du}{\\sqrt{2^2-u^2}} = \\frac{1}{3}\\int \\frac{du}{\\sqrt{2^2-u^2}}',
          explanation: 'Since $du = 3\\,dx$, replace $dx$ by $\\frac13\\,du$. The constant comes out in front.',
          ruleApplied: '$u$-substitution',
          pitfall: 'Leaving out the $\\frac13$. This is the single most common lost mark on these integrals.',
        },
        {
          stepNumber: 3,
          title: 'Apply the formula and return to x',
          mathLatex: '= \\frac{1}{3}\\sin^{-1}\\frac{u}{2} + C = \\frac{1}{3}\\sin^{-1}\\frac{3x}{2} + C',
          explanation:
            'The $\\frac13$ here came from $du$, not from the formula; the $\\sin^{-1}$ form has no $\\frac1a$. Check by differentiating: $\\frac13\\cdot\\frac{1}{\\sqrt{1-\\frac{9x^2}{4}}}\\cdot\\frac32 = \\frac{1}{\\sqrt{4-9x^2}}$.',
          ruleApplied: '$\\int \\frac{du}{\\sqrt{a^2-u^2}} = \\sin^{-1}\\frac{u}{a} + C$',
          pitfall: 'Writing $\\frac12\\sin^{-1}\\frac{3x}{2}$ by borrowing the $\\frac1a$ from the $\\tan^{-1}$ form.',
        },
      ],
    },
  ],

  // ───────────────────────────── PRACTICE PROBLEMS ─────────────────────────────
  problems: [
    {
      id: 'inv-trig-p01',
      problemNumber: 1,
      difficulty: 'Basic',
      prompt: 'Find the derivative.',
      questionLatex: 'y = \\sin^{-1}\\left(x^2\\right)',
      hint: 'What is $u$? Write $u$ and $D_x u$ before using the formula, then be careful computing $u^2$.',
      steps: [
        {
          stepNumber: 1,
          title: 'Identify the inner function',
          mathLatex: 'u = x^2, \\qquad D_x u = 2x',
          explanation:
            'The argument of $\\sin^{-1}$ is $x^2$, not $x$. Anything other than a bare variable inside an inverse trig function signals the chain rule.',
          ruleApplied: 'Chain rule setup',
          pitfall: 'Reading $\\sin^{-1}(x^2)$ as $(\\sin^{-1}x)^2$. The square is on the input, not on the function.',
        },
        {
          stepNumber: 2,
          title: 'Apply the inverse sine formula',
          mathLatex: 'y\' = \\frac{1}{\\sqrt{1-\\left(x^2\\right)^2}}\\cdot 2x',
          explanation:
            'Substitute $u$ into $\\frac{1}{\\sqrt{1-u^2}}$ with parentheses around it, then multiply by $D_x u$. Keeping the parentheses for one line makes the exponent in the next step unambiguous.',
          ruleApplied: '$D_x(\\sin^{-1}u) = \\dfrac{1}{\\sqrt{1-u^2}}\\,D_x u$',
          pitfall: 'Stopping at $\\frac{1}{\\sqrt{1-x^4}}$ with no $2x$.',
        },
        {
          stepNumber: 3,
          title: 'Simplify',
          mathLatex: 'y\' = \\frac{2x}{\\sqrt{1-x^4}}, \\qquad |x| < 1',
          explanation:
            '$(x^2)^2 = x^4$. The derivative exists where $1 - x^4 > 0$, i.e. on $(-1,1)$.',
          ruleApplied: 'Power of a power',
          pitfall: 'Writing $\\sqrt{1-x^2}$ under the root by forgetting to square $u$.',
        },
      ],
    },
    {
      id: 'inv-trig-p02',
      problemNumber: 2,
      difficulty: 'Basic',
      prompt: 'Find the derivative.',
      questionLatex: 'y = \\tan^{-1}\\sqrt{x}',
      hint: 'The inner function is a root. Its square is very simple.',
      steps: [
        {
          stepNumber: 1,
          title: 'Identify the inner function',
          mathLatex: 'u = \\sqrt{x} = x^{1/2}, \\qquad D_x u = \\frac{1}{2\\sqrt{x}}',
          explanation:
            'Rewriting the root as a power makes the derivative a direct power-rule computation.',
          ruleApplied: 'Power rule',
          pitfall: 'Writing $D_x\\sqrt{x} = \\frac{1}{\\sqrt{x}}$ and losing the $\\frac12$.',
        },
        {
          stepNumber: 2,
          title: 'Apply the inverse tangent formula',
          mathLatex: 'y\' = \\frac{1}{1+\\left(\\sqrt{x}\\right)^2}\\cdot\\frac{1}{2\\sqrt{x}}',
          explanation:
            'The $\\tan^{-1}$ formula has no square root of its own and a plus sign: $1 + u^2$. That is the visual difference from the $\\sin^{-1}$ shape.',
          ruleApplied: '$D_x(\\tan^{-1}u) = \\dfrac{1}{1+u^2}\\,D_x u$',
          pitfall: 'Using $\\frac{1}{\\sqrt{1-u^2}}$ out of habit.',
        },
        {
          stepNumber: 3,
          title: 'Simplify',
          mathLatex: 'y\' = \\frac{1}{2\\sqrt{x}\\,(1+x)}, \\qquad x > 0',
          explanation:
            '$(\\sqrt{x})^2 = x$ for $x \\ge 0$. The function is defined at $x = 0$ but the derivative is not, because of the $\\sqrt{x}$ in the denominator.',
          ruleApplied: 'Algebraic simplification',
          pitfall: 'Distributing incorrectly: $2\\sqrt{x}(1+x)$ is not $2\\sqrt{x} + x$.',
        },
      ],
    },
    {
      id: 'inv-trig-p03',
      problemNumber: 3,
      difficulty: 'Exam-Level',
      prompt: 'Find the derivative and simplify completely.',
      questionLatex: 'f(t) = \\cos^{-1}(1-2t)',
      hint: 'Two minus signs appear. After the formula, expand $1 - (1-2t)^2$ and look for a common factor you can take out of the root.',
      steps: [
        {
          stepNumber: 1,
          title: 'Identify the inner function',
          mathLatex: 'u = 1-2t, \\qquad D_t u = -2',
          explanation: 'A linear inner function. Its derivative is negative, which will interact with the minus sign in the $\\cos^{-1}$ formula.',
          ruleApplied: 'Chain rule setup',
          pitfall: 'Taking $D_t u = 2$.',
        },
        {
          stepNumber: 2,
          title: 'Apply the inverse cosine formula',
          mathLatex: 'f\'(t) = \\frac{-1}{\\sqrt{1-(1-2t)^2}}\\,(-2) = \\frac{2}{\\sqrt{1-(1-2t)^2}}',
          explanation: 'The formula contributes one minus sign and $D_t u$ contributes another. Resolve the signs now, before the algebra.',
          ruleApplied: '$D_x(\\cos^{-1}u) = \\dfrac{-1}{\\sqrt{1-u^2}}\\,D_x u$',
          pitfall: 'Forgetting that $\\cos^{-1}$ carries a minus sign, which gives a final answer with the wrong sign.',
        },
        {
          stepNumber: 3,
          title: 'Expand the radicand',
          mathLatex: '1-(1-2t)^2 = 1 - \\left(1 - 4t + 4t^2\\right) = 4t - 4t^2 = 4\\left(t - t^2\\right)',
          explanation:
            'An unexpanded square under a root is a signal that the answer can be simplified further. The target is a perfect-square factor that can leave the radical.',
          ruleApplied: 'Binomial expansion',
          pitfall: 'Sign error when subtracting the bracket: $-(1 - 4t + 4t^2) = -1 + 4t - 4t^2$.',
        },
        {
          stepNumber: 4,
          title: 'Extract the factor and cancel',
          mathLatex: 'f\'(t) = \\frac{2}{\\sqrt{4\\left(t-t^2\\right)}} = \\frac{2}{2\\sqrt{t-t^2}} = \\frac{1}{\\sqrt{t-t^2}}, \\qquad 0 < t < 1',
          explanation:
            '$\\sqrt4 = 2$ cancels the numerator. The domain $0 < t < 1$ comes from $|1-2t| < 1$, and it is exactly where $t - t^2 > 0$.',
          ruleApplied: '$\\sqrt{ab} = \\sqrt{a}\\sqrt{b}$ for $a, b \\ge 0$',
          pitfall: 'Pulling out $4$ instead of $\\sqrt4 = 2$.',
        },
      ],
    },
    {
      id: 'inv-trig-p04',
      problemNumber: 4,
      difficulty: 'Exam-Level',
      prompt: 'Find the derivative and simplify completely.',
      questionLatex: 'f(x) = x\\tan^{-1}x - \\frac{1}{2}\\ln\\left(1+x^2\\right)',
      hint: 'Differentiate the two terms separately. Compare what the product rule leaves over with the derivative of the logarithm.',
      steps: [
        {
          stepNumber: 1,
          title: 'Product rule on the first term',
          mathLatex: 'D_x\\left(x\\tan^{-1}x\\right) = x\\cdot\\frac{1}{1+x^2} + \\tan^{-1}x\\cdot 1 = \\frac{x}{1+x^2} + \\tan^{-1}x',
          explanation:
            '$x$ multiplies $\\tan^{-1}x$, so both factors vary. The inner function of $\\tan^{-1}$ is just $x$, so no chain-rule factor is needed.',
          ruleApplied: 'Product rule; $D_x(\\tan^{-1}x) = \\dfrac{1}{1+x^2}$',
          pitfall: 'Treating $x$ as a constant coefficient and writing only $\\frac{x}{1+x^2}$.',
        },
        {
          stepNumber: 2,
          title: 'Chain rule on the logarithm',
          mathLatex: 'D_x\\left(\\frac{1}{2}\\ln\\left(1+x^2\\right)\\right) = \\frac{1}{2}\\cdot\\frac{1}{1+x^2}\\cdot 2x = \\frac{x}{1+x^2}',
          explanation:
            '$D_x(\\ln u) = \\frac{1}{u}D_x u$ with $u = 1 + x^2$. The $\\frac12$ and the $2x$ combine to give the same fraction that the product rule produced.',
          ruleApplied: '$D_x(\\ln u) = \\dfrac{1}{u}\\,D_x u$',
          pitfall: 'Leaving out the $2x$.',
        },
        {
          stepNumber: 3,
          title: 'Subtract',
          mathLatex: 'f\'(x) = \\frac{x}{1+x^2} + \\tan^{-1}x - \\frac{x}{1+x^2} = \\tan^{-1}x',
          explanation:
            'The rational terms cancel. The problem is built this way: it shows that $\\int \\tan^{-1}x\\,dx = x\\tan^{-1}x - \\frac12\\ln(1+x^2) + C$, a result you will derive by integration by parts in Unit 2.',
          ruleApplied: 'Algebraic simplification',
          pitfall: 'Dropping the minus sign in front of the logarithm term, which doubles the fraction instead of cancelling it.',
        },
      ],
    },
    {
      id: 'inv-trig-p05',
      problemNumber: 5,
      difficulty: 'Exam-Level',
      prompt: 'Find the derivative for $x > 0$ and simplify.',
      questionLatex: 'y = \\sec^{-1}\\left(e^x\\right)',
      hint: 'What is the sign of $e^x$? That settles the absolute value.',
      steps: [
        {
          stepNumber: 1,
          title: 'Identify the inner function and the domain',
          mathLatex: 'u = e^x, \\qquad D_x u = e^x, \\qquad |u| > 1 \\iff x > 0',
          explanation:
            '$\\sec^{-1}$ is differentiable only where $|u| > 1$. Since $e^x > 1$ exactly when $x > 0$, the stated restriction is the natural domain of the derivative.',
          ruleApplied: 'Chain rule setup; $D_x(e^x) = e^x$',
          pitfall: 'Ignoring the domain. For $x < 0$ the function is not even defined.',
        },
        {
          stepNumber: 2,
          title: 'Apply the inverse secant formula',
          mathLatex: 'y\' = \\frac{1}{\\left|e^x\\right|\\sqrt{\\left(e^x\\right)^2-1}}\\cdot e^x',
          explanation:
            'Write the absolute value first and remove it only with a reason. The radicand is $u^2 - 1$, the reverse order from the $\\sin^{-1}$ shape.',
          ruleApplied: '$D_x(\\sec^{-1}u) = \\dfrac{1}{|u|\\sqrt{u^2-1}}\\,D_x u$',
          pitfall: 'Writing $\\sqrt{1 - e^{2x}}$, which is not real for $x > 0$.',
        },
        {
          stepNumber: 3,
          title: 'Remove the absolute value and cancel',
          mathLatex: 'y\' = \\frac{e^x}{e^x\\sqrt{e^{2x}-1}} = \\frac{1}{\\sqrt{e^{2x}-1}}',
          explanation:
            '$e^x > 0$ for all $x$, so $|e^x| = e^x$, and it cancels with $D_x u$. Also $(e^x)^2 = e^{2x}$.',
          ruleApplied: 'Laws of exponents',
          pitfall: 'Writing $(e^x)^2 = e^{x^2}$.',
        },
      ],
    },
    {
      id: 'inv-trig-p06',
      problemNumber: 6,
      difficulty: 'Exam-Level',
      prompt: 'Use implicit differentiation to find $\\dfrac{dy}{dx}$.',
      questionLatex: '\\tan^{-1}\\frac{y}{x} = \\ln\\sqrt{x^2+y^2}',
      hint: 'Simplify the right side with a log property first. After differentiating, both sides will have the same denominator.',
      steps: [
        {
          stepNumber: 1,
          title: 'Rewrite the logarithm',
          mathLatex: '\\tan^{-1}\\frac{y}{x} = \\frac{1}{2}\\ln\\left(x^2+y^2\\right)',
          explanation:
            'A root inside a logarithm is an exponent of $\\frac12$ that can be moved in front. Doing this before differentiating avoids a chain rule through the square root.',
          ruleApplied: '$\\ln a^r = r\\ln a$',
          pitfall: 'Differentiating $\\ln\\sqrt{\\;\\cdot\\;}$ directly and losing a factor in the three-layer chain.',
        },
        {
          stepNumber: 2,
          title: 'Differentiate the left side',
          mathLatex:
            'D_x\\!\\left(\\tan^{-1}\\frac{y}{x}\\right) = \\frac{1}{1+\\frac{y^2}{x^2}}\\cdot\\frac{x\\,y\' - y}{x^2} = \\frac{x\\,y\' - y}{x^2+y^2}',
          explanation:
            '$u = \\frac{y}{x}$ is a quotient in which $y$ depends on $x$, so $D_x u$ needs the quotient rule and produces $y\'$. Multiplying $1 + \\frac{y^2}{x^2}$ by the $x^2$ from the quotient rule clears the compound fraction.',
          ruleApplied: '$D_x(\\tan^{-1}u)$; quotient rule; implicit differentiation',
          pitfall: 'Treating $y$ as a constant and writing $D_x\\left(\\frac{y}{x}\\right) = -\\frac{y}{x^2}$.',
        },
        {
          stepNumber: 3,
          title: 'Differentiate the right side',
          mathLatex: 'D_x\\!\\left(\\frac{1}{2}\\ln\\left(x^2+y^2\\right)\\right) = \\frac{1}{2}\\cdot\\frac{2x + 2y\\,y\'}{x^2+y^2} = \\frac{x + y\\,y\'}{x^2+y^2}',
          explanation: 'The derivative of $y^2$ with respect to $x$ is $2y\\,y\'$. The result has the same denominator as the left side.',
          ruleApplied: '$D_x(\\ln u)$; implicit differentiation',
          pitfall: 'Writing $D_x(y^2) = 2y$ with no $y\'$.',
        },
        {
          stepNumber: 4,
          title: 'Equate and clear the denominator',
          mathLatex: '\\frac{x\\,y\' - y}{x^2+y^2} = \\frac{x + y\\,y\'}{x^2+y^2} \\quad\\Longrightarrow\\quad x\\,y\' - y = x + y\\,y\'',
          explanation: 'Both sides are over $x^2 + y^2$, which is positive, so multiply through by it. What remains is linear in $y\'$.',
          ruleApplied: 'Multiplying both sides by a non-zero quantity',
        },
        {
          stepNumber: 5,
          title: 'Solve for the derivative',
          mathLatex: 'x\\,y\' - y\\,y\' = x + y \\quad\\Longrightarrow\\quad \\frac{dy}{dx} = \\frac{x+y}{x-y}, \\qquad x \\ne y',
          explanation: 'Collect the $y\'$ terms on one side, factor, and divide.',
          ruleApplied: 'Solving a linear equation in $y\'$',
          pitfall: 'A sign slip when moving $y\\,y\'$ across, giving $\\frac{x+y}{x+y}$ or $\\frac{x-y}{x+y}$.',
        },
      ],
    },
    {
      id: 'inv-trig-p07',
      problemNumber: 7,
      difficulty: 'Exam-Level',
      prompt: 'Find $\\dfrac{dy}{dx}$, then find the slope of the tangent line at the origin.',
      questionLatex: '\\sin^{-1}y + \\tan^{-1}x = xy',
      hint: 'Every $y$ contributes a $y\'$ when differentiated. The right side is a product.',
      steps: [
        {
          stepNumber: 1,
          title: 'Check the point is on the curve',
          mathLatex: '\\sin^{-1}0 + \\tan^{-1}0 = 0 = (0)(0)',
          explanation: 'A tangent line at a point only makes sense if the point satisfies the equation. This takes one line and is often worth a mark.',
          ruleApplied: 'Substitution',
        },
        {
          stepNumber: 2,
          title: 'Differentiate both sides with respect to x',
          mathLatex: '\\frac{1}{\\sqrt{1-y^2}}\\,y\' + \\frac{1}{1+x^2} = y + x\\,y\'',
          explanation:
            '$\\sin^{-1}y$ has inner function $y$, so its chain-rule factor is $y\'$. $\\tan^{-1}x$ has inner function $x$, so no extra factor. The right side is a product of $x$ and $y$.',
          ruleApplied: 'Implicit differentiation; product rule',
          pitfall: 'Writing $D_x(xy) = y\'$ or $= y$. The product rule gives two terms.',
        },
        {
          stepNumber: 3,
          title: 'Collect the y′ terms',
          mathLatex: 'y\'\\left(\\frac{1}{\\sqrt{1-y^2}} - x\\right) = y - \\frac{1}{1+x^2}',
          explanation: 'Move everything containing $y\'$ to the left and everything else to the right, then factor.',
          ruleApplied: 'Solving a linear equation in $y\'$',
          pitfall: 'Moving $x\\,y\'$ across without changing its sign.',
        },
        {
          stepNumber: 4,
          title: 'Solve for the derivative',
          mathLatex: '\\frac{dy}{dx} = \\frac{y - \\dfrac{1}{1+x^2}}{\\dfrac{1}{\\sqrt{1-y^2}} - x}',
          explanation: 'This form is acceptable. Clearing the inner fractions is optional and does not make evaluation at the origin any easier.',
          ruleApplied: 'Division',
        },
        {
          stepNumber: 5,
          title: 'Evaluate at (0, 0)',
          mathLatex: '\\left.\\frac{dy}{dx}\\right|_{(0,0)} = \\frac{0 - 1}{1 - 0} = -1',
          explanation: 'Substitute both coordinates. The tangent line at the origin is $y = -x$.',
          ruleApplied: 'Evaluation',
          pitfall: 'Substituting only $x = 0$ and leaving $y$ in the answer.',
        },
      ],
    },
    {
      id: 'inv-trig-p08',
      problemNumber: 8,
      difficulty: 'Challenge',
      prompt: 'Find the derivative for $0 < |x| < 1$. State the result on each side of $0$.',
      questionLatex: 'y = \\sin^{-1}\\sqrt{1-x^2}',
      hint: 'Compute $1 - u^2$ carefully, then ask what $\\sqrt{x^2}$ equals when $x$ is negative.',
      steps: [
        {
          stepNumber: 1,
          title: 'Identify the inner function',
          mathLatex: 'u = \\sqrt{1-x^2}, \\qquad D_x u = \\frac{1}{2\\sqrt{1-x^2}}\\,(-2x) = \\frac{-x}{\\sqrt{1-x^2}}',
          explanation: 'The inner function is itself a composite, so $D_x u$ needs its own chain rule.',
          ruleApplied: 'Chain rule',
          pitfall: 'Dropping the $-2x$ from the derivative of $1 - x^2$.',
        },
        {
          stepNumber: 2,
          title: 'Compute the radical in the formula',
          mathLatex: '1 - u^2 = 1 - \\left(1-x^2\\right) = x^2 \\quad\\Longrightarrow\\quad \\sqrt{1-u^2} = \\sqrt{x^2} = |x|',
          explanation:
            'This is the crux. The square root of a square is the absolute value. The problem allows negative $x$, so $|x|$ cannot be replaced by $x$.',
          ruleApplied: '$\\sqrt{x^2} = |x|$',
          pitfall: 'Writing $\\sqrt{x^2} = x$. That gives an answer that is wrong on the whole interval $-1 < x < 0$.',
        },
        {
          stepNumber: 3,
          title: 'Assemble',
          mathLatex: 'y\' = \\frac{1}{|x|}\\cdot\\frac{-x}{\\sqrt{1-x^2}} = \\frac{-x}{|x|\\sqrt{1-x^2}}',
          explanation: 'The ratio $\\frac{x}{|x|}$ is $+1$ for positive $x$ and $-1$ for negative $x$, so the derivative changes sign across $0$.',
          figure: {
            kind: 'plot',
            caption: 'The function equals $\\cos^{-1}|x|$: a peak with a corner at $x = 0$. The slope is positive on the left, negative on the right, and undefined at $0$.',
            x: [-1.3, 1.3],
            y: [-0.25, 1.9],
            aspect: 1.6,
            xTicks: [-1, 1],
            yTicks: piTicks(1, 1),
            items: [
              { type: 'fn', f: (x) => Math.asin(Math.sqrt(1 - x * x)), from: -1, to: 0, tone: 2, label: "y' > 0", labelAt: [-0.55, 1], anchor: 'w' },
              { type: 'fn', f: (x) => Math.asin(Math.sqrt(1 - x * x)), from: 0, to: 1, label: "y' < 0", labelAt: [0.55, 1], anchor: 'e' },
              { type: 'point', at: [0, Math.PI / 2], tone: 'ink', hollow: true, label: '\\text{corner}', anchor: 'ne' },
            ],
          },
          ruleApplied: '$D_x(\\sin^{-1}u) = \\dfrac{1}{\\sqrt{1-u^2}}\\,D_x u$',
        },
        {
          stepNumber: 4,
          title: 'Write the two cases',
          mathLatex:
            'y\' = \\begin{cases} \\dfrac{-1}{\\sqrt{1-x^2}}, & 0 < x < 1 \\\\[2ex] \\dfrac{1}{\\sqrt{1-x^2}}, & -1 < x < 0 \\end{cases}',
          explanation:
            'For $0 < x < 1$ this is the derivative of $\\cos^{-1}x$, and in fact $y = \\cos^{-1}x$ there. For $-1 < x < 0$, $y = \\pi - \\cos^{-1}x$. The one-sided derivatives at $0$ are $-1$ and $+1$, so the graph has a corner and $y\'(0)$ does not exist.',
          ruleApplied: 'Definition of absolute value',
          pitfall: 'Claiming $\\sin^{-1}\\sqrt{1-x^2} = \\cos^{-1}x$ for all $x$. The left side is even in $x$; the right side is not.',
        },
      ],
    },
    {
      id: 'inv-trig-p09',
      problemNumber: 9,
      difficulty: 'Basic',
      prompt: 'Evaluate the definite integral.',
      questionLatex: '\\int_0^3 \\frac{dx}{9+x^2}',
      hint: 'Sum of squares, no square root, constant numerator. What is $a$?',
      steps: [
        {
          stepNumber: 1,
          title: 'Match the form',
          mathLatex: '9 + x^2 = 3^2 + x^2 \\quad\\Longrightarrow\\quad a = 3,\\; u = x,\\; du = dx',
          explanation:
            'A constant over a sum of squares with no radical is the $\\tan^{-1}$ form. A logarithm would need the numerator to be a multiple of $x$, the derivative of the denominator, and here it is not.',
          ruleApplied: 'Pattern matching to $\\int \\frac{du}{a^2+u^2}$',
          pitfall: 'Answering $\\ln(9+x^2)$. That requires $2x\\,dx$ on top.',
        },
        {
          stepNumber: 2,
          title: 'Find the antiderivative',
          mathLatex: '\\int_0^3 \\frac{dx}{3^2+x^2} = \\left[\\frac{1}{3}\\tan^{-1}\\frac{x}{3}\\right]_0^3',
          explanation: 'The $\\tan^{-1}$ form carries a factor $\\frac1a$ in front and $\\frac{u}{a}$ inside.',
          ruleApplied: '$\\int \\frac{du}{a^2+u^2} = \\frac{1}{a}\\tan^{-1}\\frac{u}{a} + C$',
          pitfall: 'Using $a = 9$, or leaving out the $\\frac13$.',
        },
        {
          stepNumber: 3,
          title: 'Evaluate',
          mathLatex: '= \\frac{1}{3}\\left(\\tan^{-1}1 - \\tan^{-1}0\\right) = \\frac{1}{3}\\left(\\frac{\\pi}{4} - 0\\right) = \\frac{\\pi}{12}',
          explanation: '$\\tan^{-1}1$ is the angle in $\\left(-\\frac{\\pi}{2},\\frac{\\pi}{2}\\right)$ whose tangent is $1$, namely $\\frac{\\pi}{4}$. Angles are in radians.',
          figure: {
            kind: 'plot',
            caption: 'The value $\\frac{\\pi}{12} \\approx 0.262$ is the shaded area under $y = \\frac{1}{9 + x^2}$ from $0$ to $3$.',
            x: [-1, 7],
            y: [0, 0.13],
            aspect: 1.9,
            xTicks: [1, 2, 3, 4, 5, 6],
            yTicks: [0.05, 0.1],
            items: [
              { type: 'area', f: (x) => 1 / (9 + x * x), from: 0, to: 3 },
              { type: 'fn', f: (x) => 1 / (9 + x * x), label: 'y = \\frac{1}{9+x^2}', labelAt: [3.6, 0.046], anchor: 'ne' },
              { type: 'label', at: [1.5, 0.04], text: '\\tfrac{\\pi}{12}' },
            ],
          },
          ruleApplied: 'Fundamental Theorem of Calculus',
          pitfall: 'Writing $\\tan^{-1}1 = 45$. Degrees have no place in a calculus answer.',
        },
      ],
    },
    {
      id: 'inv-trig-p10',
      problemNumber: 10,
      difficulty: 'Exam-Level',
      prompt: 'Evaluate the indefinite integral.',
      questionLatex: '\\int \\frac{dx}{x\\sqrt{4x^2-9}}',
      hint: 'Variable squared minus a constant under the root, and a lone $x$ outside. Choose $u$ so that $u^2 = 4x^2$, and convert the outside $x$ as well.',
      steps: [
        {
          stepNumber: 1,
          title: 'Match the form',
          mathLatex: '4x^2 - 9 = (2x)^2 - 3^2 \\quad\\Longrightarrow\\quad u = 2x,\\; a = 3,\\; du = 2\\,dx',
          explanation:
            'The radicand is (variable)$^2$ minus (constant)$^2$ and there is a factor of the variable outside the root: the $\\sec^{-1}$ form. If the order were $9 - 4x^2$ with no outside factor it would be $\\sin^{-1}$ instead.',
          ruleApplied: 'Pattern matching to $\\int \\frac{du}{u\\sqrt{u^2-a^2}}$',
          pitfall: 'Trying $u = 4x^2 - 9$. Its $du = 8x\\,dx$ needs an $x$ in the numerator, and the $x$ here is in the denominator.',
        },
        {
          stepNumber: 2,
          title: 'Convert every x, including the one outside the root',
          mathLatex:
            '\\int \\frac{dx}{x\\sqrt{4x^2-9}} = \\int \\frac{\\frac{1}{2}\\,du}{\\frac{u}{2}\\sqrt{u^2-9}} = \\int \\frac{du}{u\\sqrt{u^2-3^2}}',
          explanation:
            'Both $dx = \\frac12\\,du$ and $x = \\frac{u}{2}$ must be replaced. The two factors of $\\frac12$ cancel, so here no constant is left in front.',
          ruleApplied: '$u$-substitution',
          pitfall: 'Replacing $dx$ but leaving the outside $x$ as $u$, which produces a spurious factor of $\\frac12$.',
        },
        {
          stepNumber: 3,
          title: 'Apply the formula',
          mathLatex: '= \\frac{1}{3}\\sec^{-1}\\left|\\frac{u}{3}\\right| + C',
          explanation: 'Like the $\\tan^{-1}$ form, the $\\sec^{-1}$ form has $\\frac1a$ in front. The absolute value makes the result valid on both $u > a$ and $u < -a$.',
          ruleApplied: '$\\int \\frac{du}{u\\sqrt{u^2-a^2}} = \\frac{1}{a}\\sec^{-1}\\left|\\frac{u}{a}\\right| + C$',
          pitfall: 'Leaving out the $\\frac13$, or using $a = 9$.',
        },
        {
          stepNumber: 4,
          title: 'Return to x',
          mathLatex: '\\int \\frac{dx}{x\\sqrt{4x^2-9}} = \\frac{1}{3}\\sec^{-1}\\left|\\frac{2x}{3}\\right| + C, \\qquad |x| > \\frac{3}{2}',
          explanation:
            'Check for $x > \\frac32$: $D_x\\left(\\frac13\\sec^{-1}\\frac{2x}{3}\\right) = \\frac13\\cdot\\frac{1}{\\frac{2x}{3}\\sqrt{\\frac{4x^2}{9}-1}}\\cdot\\frac23 = \\frac{1}{x\\sqrt{4x^2-9}}$.',
          ruleApplied: 'Back-substitution',
          pitfall: 'Leaving the answer in terms of $u$.',
        },
      ],
    },
  ],
};
