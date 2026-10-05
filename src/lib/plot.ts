import type { Tick } from '../types/figure';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Ticks at multiples of pi/per, from lo*pi/per to hi*pi/per, labelled in LaTeX.
 * piTicks(-2, 2) gives -pi, -pi/2, pi/2, pi (zero is left to the axes).
 */
export function piTicks(lo: number, hi: number, per = 2): Tick[] {
  const ticks: Tick[] = [];
  for (let k = lo; k <= hi; k++) {
    if (k === 0) continue;
    const g = gcd(Math.abs(k), per);
    const n = k / g;
    const d = per / g;
    const sign = n < 0 ? '-' : '';
    const coef = Math.abs(n) === 1 ? '' : String(Math.abs(n));
    ticks.push([(k * Math.PI) / per, d === 1 ? `${sign}${coef}\\pi` : `${sign}\\frac{${coef}\\pi}{${d}}`]);
  }
  return ticks;
}

/** Round, evenly spaced ticks across [lo, hi], about `target` of them. */
export function niceTicks(lo: number, hi: number, target = 6): number[] {
  const raw = (hi - lo) / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < 1e-9 ? 0 : +v.toPrecision(12));
  return out;
}

/** A number for use inside LaTeX: fixed decimals, never "-0.00". */
export function fmt(n: number, digits = 2): string {
  const s = n.toFixed(digits);
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
}
