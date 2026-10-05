import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject, type SVGProps } from 'react';
import type { Anchor, PlotAnimation, PlotFigure, PlotItem, Tick, Tone, Vec } from '../../types/figure';
import { fmt, niceTicks } from '../../lib/plot';
import { PauseIcon, PlayIcon } from '../Icons';
import { MathRenderer, MathText } from '../MathRenderer';

/** viewBox width; strokes use non-scaling-stroke so widths are screen pixels. */
const W = 480;
const PAD = 12;

const TONE: Record<Tone, string> = {
  1: 'var(--viz1)',
  2: 'var(--viz2)',
  3: 'var(--viz3)',
  ink: 'var(--ink2)',
  muted: 'var(--strong)',
};
const colour = (t: Tone | undefined) => TONE[t ?? 1];

/** Offsets that put a label beside its point instead of on it. */
const ANCHOR: Record<Anchor, string> = {
  c: 'translate(-50%, -50%)',
  n: 'translate(-50%, calc(-100% - 5px))',
  s: 'translate(-50%, 5px)',
  e: 'translate(6px, -50%)',
  w: 'translate(calc(-100% - 6px), -50%)',
  ne: 'translate(4px, calc(-100% - 3px))',
  nw: 'translate(calc(-100% - 4px), calc(-100% - 3px))',
  se: 'translate(4px, 3px)',
  sw: 'translate(calc(-100% - 4px), 3px)',
};

/** The surface colour as a halo keeps labels legible where they cross lines. */
const HALO = '0 0 2px var(--surface), 0 0 3px var(--surface), 0 0 5px var(--surface)';

interface Label {
  at: Vec; // screen coordinates
  text: string;
  anchor: Anchor;
  latex: boolean;
  small?: boolean;
}

interface Scale {
  h: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  /** Screen x back to a plot x. */
  ix: (px: number) => number;
}

/** Rough width of a tick label in viewBox units. */
const tickWidth = ([, text, latex]: [number, string, boolean]) =>
  (latex ? text.replace(/\\[a-zA-Z]+/g, 'a').replace(/[{}^_]/g, '') : text).length * 8;

function makeScale(fig: PlotFigure): Scale {
  const [x0, x1] = fig.x;
  const [y0, y1] = fig.y;
  // An axis running along the left or bottom edge has its tick labels outside
  // the plot area, so make room for them.
  const axes = fig.axes ?? true;
  const yTicks = axes && !(x0 < 0 && x1 > 0) ? tickList(fig.yTicks, y0, y1) : [];
  const xTicks = axes && !(y0 < 0 && y1 > 0) ? tickList(fig.xTicks, x0, x1) : [];
  const left = PAD + (yTicks.length ? 8 + Math.max(...yTicks.map(tickWidth)) : 0);
  const bottom = PAD + (xTicks.length ? 16 : 0);
  const iw = W - left - PAD;
  const ih = fig.equal ? (iw * (y1 - y0)) / (x1 - x0) : W / (fig.aspect ?? 1.5) - PAD - bottom;
  return {
    h: ih + PAD + bottom,
    sx: (x) => left + ((x - x0) / (x1 - x0)) * iw,
    sy: (y) => PAD + ((y1 - y) / (y1 - y0)) * ih,
    ix: (px) => x0 + ((px - left) / iw) * (x1 - x0),
  };
}

/** Sample a curve into SVG path data, lifting the pen across asymptotes and gaps. */
function tracePath(points: Vec[], s: Scale, yRange: Vec): string {
  const span = yRange[1] - yRange[0];
  const lo = yRange[0] - span;
  const hi = yRange[1] + span;
  let d = '';
  let pen = false;
  let prev: Vec | null = null;
  for (const [x, y] of points) {
    if (!Number.isFinite(y) || !Number.isFinite(x)) {
      pen = false;
      prev = null;
      continue;
    }
    // A jump from far above to far below (or back) is an asymptote, not a line.
    if (prev && ((prev[1] > yRange[1] && y < yRange[0]) || (prev[1] < yRange[0] && y > yRange[1]))) pen = false;
    const cy = Math.min(hi, Math.max(lo, y));
    d += `${pen ? 'L' : 'M'}${s.sx(x).toFixed(2)},${s.sy(cy).toFixed(2)}`;
    pen = true;
    prev = [x, y];
  }
  return d;
}

function sampleFn(f: (x: number) => number, from: number, to: number, n = 360): Vec[] {
  const pts: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const x = from + ((to - from) * i) / n;
    let y: number;
    try {
      y = f(x);
    } catch {
      y = NaN;
    }
    pts.push([x, y]);
  }
  return pts;
}

function sampleCurve(x: (t: number) => number, y: (t: number) => number, [a, b]: Vec, n = 360): Vec[] {
  const pts: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const t = a + ((b - a) * i) / n;
    pts.push([x(t), y(t)]);
  }
  return pts;
}

const lastVisible = (pts: Vec[], fig: PlotFigure): Vec | undefined =>
  [...pts].reverse().find(([x, y]) => Number.isFinite(y) && y >= fig.y[0] && y <= fig.y[1] && x >= fig.x[0] && x <= fig.x[1]);

const dash = (d?: boolean) => (d ? '5 4' : undefined);

/** Draw one item; labels are collected separately and rendered as HTML. */
function renderItem(item: PlotItem, key: string, fig: PlotFigure, s: Scale, labels: Label[]): ReactNode {
  const stroke = (tone: Tone | undefined, width = 2, dashed?: boolean): SVGProps<SVGPathElement> => ({
    fill: 'none',
    stroke: colour(tone),
    strokeWidth: width,
    strokeDasharray: dash(dashed),
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  });
  const label = (text: string | undefined, at: Vec | undefined, anchor: Anchor, latex = true) => {
    if (text && at) labels.push({ at: [s.sx(at[0]), s.sy(at[1])], text, anchor, latex });
  };

  switch (item.type) {
    case 'fn':
    case 'curve': {
      const pts =
        item.type === 'fn'
          ? sampleFn(item.f, Math.max(item.from ?? fig.x[0], fig.x[0]), Math.min(item.to ?? fig.x[1], fig.x[1]))
          : sampleCurve(item.x, item.y, item.t);
      label(item.label, item.labelAt ?? lastVisible(pts, fig), item.anchor ?? 'nw');
      return <path key={key} d={tracePath(pts, s, fig.y)} {...stroke(item.tone, item.width, item.dashed)} />;
    }
    case 'area': {
      const top = sampleFn(item.f, item.from, item.to, 200);
      const bottom = sampleFn(item.g ?? (() => 0), item.from, item.to, 200).reverse();
      const span = fig.y[1] - fig.y[0];
      const clamp = (y: number) => Math.min(fig.y[1] + span, Math.max(fig.y[0] - span, Number.isFinite(y) ? y : 0));
      const d = [...top, ...bottom].map(([x, y], i) => `${i ? 'L' : 'M'}${s.sx(x).toFixed(2)},${s.sy(clamp(y)).toFixed(2)}`).join('') + 'Z';
      return <path key={key} d={d} fill={colour(item.tone)} fillOpacity={0.16} stroke="none" />;
    }
    case 'polygon': {
      const d = item.points.map(([x, y], i) => `${i ? 'L' : 'M'}${s.sx(x).toFixed(2)},${s.sy(y).toFixed(2)}`).join('') + 'Z';
      return (
        <path key={key} d={d} fill={colour(item.tone)} fillOpacity={0.16}
          {...(item.outline ? { stroke: colour(item.tone), strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' } : {})} />
      );
    }
    case 'segment': {
      const [ax, ay] = [s.sx(item.from[0]), s.sy(item.from[1])];
      const [bx, by] = [s.sx(item.to[0]), s.sy(item.to[1])];
      label(item.label, item.labelAt ?? [(item.from[0] + item.to[0]) / 2, (item.from[1] + item.to[1]) / 2], item.anchor ?? 'n');
      let head: ReactNode = null;
      if (item.arrow) {
        const ang = Math.atan2(by - ay, bx - ax);
        const p = (da: number, r: number) => `${(bx - r * Math.cos(ang + da)).toFixed(2)},${(by - r * Math.sin(ang + da)).toFixed(2)}`;
        head = <path d={`M${p(0.42, 9)}L${bx},${by}L${p(-0.42, 9)}`} {...stroke(item.tone, item.width)} />;
      }
      return (
        <g key={key}>
          <path d={`M${ax},${ay}L${bx},${by}`} {...stroke(item.tone, item.width, item.dashed)} />
          {head}
        </g>
      );
    }
    case 'vline': {
      label(item.label, item.labelAt ?? [item.x, fig.y[1]], item.anchor ?? 'se');
      return <path key={key} d={`M${s.sx(item.x)},${s.sy(fig.y[0])}V${s.sy(fig.y[1])}`} {...stroke(item.tone ?? 'muted', item.width ?? 1.5, item.dashed ?? true)} />;
    }
    case 'hline': {
      label(item.label, item.labelAt ?? [fig.x[1], item.y], item.anchor ?? 'nw');
      return <path key={key} d={`M${s.sx(fig.x[0])},${s.sy(item.y)}H${s.sx(fig.x[1])}`} {...stroke(item.tone ?? 'muted', item.width ?? 1.5, item.dashed ?? true)} />;
    }
    case 'point': {
      label(item.label, item.at, item.anchor ?? 'ne');
      return (
        <circle key={key} cx={s.sx(item.at[0])} cy={s.sy(item.at[1])} r={4.5}
          fill={item.hollow ? 'var(--surface)' : colour(item.tone)}
          stroke={item.hollow ? colour(item.tone) : 'var(--surface)'}
          strokeWidth={item.hollow ? 2 : 2} vectorEffect="non-scaling-stroke" />
      );
    }
    case 'label':
      label(item.text, item.at, item.anchor ?? 'c');
      return null;
    case 'angle': {
      const [cx, cy] = [s.sx(item.at[0]), s.sy(item.at[1])];
      const unit = (p: Vec) => {
        const dx = s.sx(p[0]) - cx;
        const dy = s.sy(p[1]) - cy;
        const len = Math.hypot(dx, dy) || 1;
        return [dx / len, dy / len];
      };
      const [ux, uy] = unit(item.a);
      const [vx, vy] = unit(item.b);
      if (item.right) {
        const r = item.radius ?? 10;
        return (
          <path key={key} d={`M${cx + r * ux},${cy + r * uy}L${cx + r * (ux + vx)},${cy + r * (uy + vy)}L${cx + r * vx},${cy + r * vy}`}
            {...stroke(item.tone ?? 'ink', 1.25)} />
        );
      }
      const r = item.radius ?? 24;
      // Sweep from a to b the short way round; screen y points down.
      const cross = ux * vy - uy * vx;
      const mid = [ux + vx, uy + vy];
      const ml = Math.hypot(mid[0], mid[1]) || 1;
      if (item.label) {
        const lr = r + 11;
        labels.push({ at: [cx + (lr * mid[0]) / ml, cy + (lr * mid[1]) / ml], text: item.label, anchor: 'c', latex: true });
      }
      return (
        <path key={key} d={`M${cx + r * ux},${cy + r * uy}A${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${cx + r * vx},${cy + r * vy}`}
          {...stroke(item.tone ?? 'ink', 1.5)} />
      );
    }
  }
}

function tickList(ticks: Tick[] | undefined, lo: number, hi: number): [number, string, boolean][] {
  if (ticks) return ticks.map((t) => (typeof t === 'number' ? [t, String(t), false] : [t[0], t[1], true]));
  return niceTicks(lo, hi).map((v) => [v, String(v), false]);
}

const plain = (v: string) => v.replace('-', '−');

/** Called as a function, not a component, so its tick labels join this render's overlay. */
function renderAxes(fig: PlotFigure, s: Scale, labels: Label[]) {
  const [x0, x1] = fig.x;
  const [y0, y1] = fig.y;
  // Axes cross at the origin when it is in view, otherwise run along the edges.
  const ax = y0 <= 0 && y1 >= 0 ? 0 : y0;
  const ay = x0 <= 0 && x1 >= 0 ? 0 : x0;
  const xt = tickList(fig.xTicks, x0, x1).filter(([v]) => v >= x0 && v <= x1);
  const yt = tickList(fig.yTicks, y0, y1).filter(([v]) => v >= y0 && v <= y1);
  const crossInside = ax === 0 && ay === 0;
  for (const [v, text, latex] of xt) {
    if (v === ay && crossInside && !latex) continue;
    labels.push({ at: [s.sx(v), s.sy(ax)], text: latex ? text : plain(text), anchor: 's', latex, small: true });
  }
  for (const [v, text, latex] of yt) {
    if (v === ax && crossInside && !latex) continue;
    labels.push({ at: [s.sx(ay), s.sy(v)], text: latex ? text : plain(text), anchor: 'w', latex, small: true });
  }
  const grid = { stroke: 'var(--line)', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const };
  const axis = { stroke: 'var(--strong)', strokeWidth: 1.25, vectorEffect: 'non-scaling-stroke' as const };
  return (
    <g aria-hidden="true">
      {xt.map(([v]) => <path key={`gx${v}`} d={`M${s.sx(v)},${s.sy(y0)}V${s.sy(y1)}`} {...grid} />)}
      {yt.map(([v]) => <path key={`gy${v}`} d={`M${s.sx(x0)},${s.sy(v)}H${s.sx(x1)}`} {...grid} />)}
      <path d={`M${s.sx(x0)},${s.sy(ax)}H${s.sx(x1)}`} {...axis} />
      <path d={`M${s.sx(ay)},${s.sy(y0)}V${s.sy(y1)}`} {...axis} />
      {xt.map(([v]) => <path key={`tx${v}`} d={`M${s.sx(v)},${s.sy(ax) - 3}v6`} {...axis} />)}
      {yt.map(([v]) => <path key={`ty${v}`} d={`M${s.sx(ay) - 3},${s.sy(v)}h6`} {...axis} />)}
    </g>
  );
}

function usePrefersReducedMotion() {
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  return reduced;
}

function useInView(ref: RefObject<Element>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

const HOLD = 0.7; // seconds to rest at each end of a sweep

/** Drives an animation parameter back and forth while the figure is on screen. */
function usePlayback(anim: PlotAnimation | undefined, inView: boolean) {
  const reduced = usePrefersReducedMotion();
  const [lo, hi] = anim?.range ?? [0, 1];
  const [t, setT] = useState(anim?.initial ?? lo);
  const [playing, setPlaying] = useState(!!anim && !reduced);
  const pos = useRef(t);
  const dir = useRef(1);
  const hold = useRef(0);

  useEffect(() => {
    if (!anim || !playing || !inView) return;
    const speed = (hi - lo) / (anim.duration ?? 6);
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (hold.current > 0) {
        hold.current -= dt;
      } else {
        pos.current += dir.current * speed * dt;
        if (pos.current >= hi || pos.current <= lo) {
          pos.current = Math.min(hi, Math.max(lo, pos.current));
          dir.current *= -1;
          hold.current = HOLD;
        }
        const next = anim.step ? Math.round(pos.current / anim.step) * anim.step : pos.current;
        setT((cur) => (cur === next ? cur : next));
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [anim, playing, inView, lo, hi]);

  const scrub = (v: number) => {
    setPlaying(false);
    pos.current = v;
    setT(v);
  };
  return { t, playing, setPlaying, scrub };
}

/** Shift each label so it lies within the overlay box. Uses `translate`, which adds to the anchor transform. */
function keepInside(box: HTMLElement | null) {
  if (!box) return;
  const b = box.getBoundingClientRect();
  for (const el of Array.from(box.children) as HTMLElement[]) {
    el.style.translate = '';
    const r = el.getBoundingClientRect();
    const dx = r.width > b.width ? 0 : r.left < b.left ? b.left - r.left : r.right > b.right ? b.right - r.right : 0;
    const dy = r.top < b.top ? b.top - r.top : r.bottom > b.bottom ? b.bottom - r.bottom : 0;
    if (dx || dy) el.style.translate = `${dx}px ${dy}px`;
  }
}

interface Hover {
  px: number;
  x: number;
}

export function Plot({ fig }: { fig: PlotFigure }) {
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap);
  const { t, playing, setPlaying, scrub } = usePlayback(fig.animate, inView);
  const [hover, setHover] = useState<Hover | null>(null);
  const s = useMemo(() => makeScale(fig), [fig]);
  const H = s.h;
  const clipId = `clip${useId().replace(/:/g, '')}`;
  const axes = fig.axes ?? true;

  const items = fig.animate ? [...fig.items, ...fig.animate.frame(t)] : fig.items;
  const labels: Label[] = [];
  const axisNode = axes ? renderAxes(fig, s, labels) : null;
  const nodes = items.map((it, i) => renderItem(it, `i${i}`, fig, s, labels));

  // Hover readout: the value of every labelled graph at the pointer's x.
  const traced = axes ? items.filter((it): it is Extract<PlotItem, { type: 'fn' }> => it.type === 'fn' && !!it.label) : [];
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!traced.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const x = s.ix(px);
    setHover(x >= fig.x[0] && x <= fig.x[1] ? { px, x } : null);
  };
  const readings = hover
    ? traced
        .filter((it) => hover.x >= (it.from ?? -Infinity) && hover.x <= (it.to ?? Infinity))
        .map((it) => ({ it, y: it.f(hover.x) }))
        .filter(({ y }) => Number.isFinite(y))
    : [];

  // Nudge any label that would stick out of the figure back inside it, after
  // every render and whenever the figure is resized.
  useLayoutEffect(() => keepInside(overlay.current));
  useEffect(() => {
    const el = overlay.current;
    if (!el || !('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(() => keepInside(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const labelStyle = (l: Label): CSSProperties => ({
    left: pct(l.at[0], W),
    top: pct(l.at[1], H),
    transform: ANCHOR[l.anchor],
    textShadow: HALO,
  });

  return (
    <div ref={wrap}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible touch-pan-y" role="img"
          aria-label={fig.title ?? 'Figure'} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <defs>
            <clipPath id={clipId}>
              <rect x={s.sx(fig.x[0])} y={s.sy(fig.y[1])} width={s.sx(fig.x[1]) - s.sx(fig.x[0])} height={s.sy(fig.y[0]) - s.sy(fig.y[1])} />
            </clipPath>
          </defs>
          {axisNode}
          <g clipPath={axes ? `url(#${clipId})` : undefined}>{nodes}</g>
          {hover && (
            <g aria-hidden="true">
              <path d={`M${hover.px},${s.sy(fig.y[0])}V${s.sy(fig.y[1])}`} stroke="var(--strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              {readings.filter(({ y }) => y >= fig.y[0] && y <= fig.y[1]).map(({ it, y }, i) => (
                <circle key={i} cx={hover.px} cy={s.sy(y)} r={4.5} fill={colour(it.tone)} stroke="var(--surface)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          )}
        </svg>
        <div ref={overlay} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {labels.map((l, i) => (
            <span key={i} style={labelStyle(l)}
              className={`fig-label absolute whitespace-nowrap leading-none ${l.small ? 'text-[0.7rem] tabular-nums text-ink3' : 'text-[0.85rem] text-ink'}`}>
              {l.latex ? <MathRenderer latex={l.text} /> : l.text}
            </span>
          ))}
        </div>
        {hover && readings.length > 0 && (
          <div className="pointer-events-none absolute top-1 z-10 rounded border border-line bg-surface px-2 py-1.5 text-xs shadow-sm"
            style={hover.px < W / 2 ? { left: `calc(${pct(hover.px, W)} + 10px)` } : { right: `calc(${pct(W - hover.px, W)} + 10px)` }}>
            <div className="tabular-nums text-ink3"><MathRenderer latex={`x = ${fmt(hover.x)}`} /></div>
            {readings.map(({ it, y }, i) => (
              <div key={i} className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: colour(it.tone) }} />
                <MathRenderer latex={`${it.label}`} />
                <span className="tabular-nums text-ink2">{plain(fmt(y))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {fig.animate && (
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPlaying(!playing)}
              aria-label={playing ? 'Pause animation' : 'Play animation'}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line text-ink2 transition-colors hover:border-strong hover:text-ink">
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-ink2">
              <span className="w-16 shrink-0 tabular-nums"><MathRenderer latex={`${fig.animate.param} = ${fmt(t, fig.animate.step && fig.animate.step >= 1 ? 0 : 2)}`} /></span>
              <input type="range" className="min-w-0 flex-1 accent-ink" min={fig.animate.range[0]} max={fig.animate.range[1]}
                step={fig.animate.step ?? (fig.animate.range[1] - fig.animate.range[0]) / 500} value={t}
                onChange={(e) => scrub(Number(e.target.value))} />
            </label>
          </div>
          {fig.animate.readout && (
            <p className="min-h-[1.5rem] text-xs leading-relaxed text-ink2"><MathText text={fig.animate.readout(t)} /></p>
          )}
        </div>
      )}
    </div>
  );
}
