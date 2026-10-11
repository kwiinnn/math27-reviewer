import type { ReactNode } from 'react';
import type { ObjectItem, Vec } from '../../types/figure';

/** Maps plot coordinates to the viewBox. */
interface Scale {
  sx: (x: number) => number;
  sy: (y: number) => number;
}

/** Objects scale with the figure, so their strokes are in viewBox units too. */
const METAL = 'var(--ink2)';
const SHADOW = 'var(--strong)';
const MARK = 'var(--viz2)';
const WATER = 'var(--viz1)';
const ROPE = 'color-mix(in srgb, var(--ink3) 60%, #b08a5a)';

const pt = ([x, y]: Vec) => `${x.toFixed(2)},${y.toFixed(2)}`;

/** The screen frame of a straight object: start, unit direction, unit normal (to the left of travel), and length. */
function frame(s: Scale, from: Vec, to: Vec) {
  const a: Vec = [s.sx(from[0]), s.sy(from[1])];
  const b: Vec = [s.sx(to[0]), s.sy(to[1])];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const u: Vec = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const n: Vec = [u[1], -u[0]];
  const at = (d: number, off = 0): Vec => [a[0] + u[0] * d + n[0] * off, a[1] + u[1] * d + n[1] * off];
  return { a, b, u, n, len, at, deg: (Math.atan2(u[1], u[0]) * 180) / Math.PI };
}

const inMark = (mark: Vec | undefined, f: number) => !!mark && f >= Math.min(...mark) && f <= Math.max(...mark);

/** Walks a screen-space polyline: the point and direction (in degrees) at a distance along it. */
function walker(pts: Vec[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1] || 1;
  const at = (d: number): { p: Vec; deg: number } => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < d) i++;
    const [a, b] = [pts[i - 1], pts[i]];
    const seg = cum[i] - cum[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (d - cum[i - 1]) / seg));
    return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
  };
  return { len, at };
}

function chain(it: Extract<ObjectItem, { type: 'chain' }>, s: Scale): ReactNode {
  const { len, at } = walker(it.points.map(([x, y]): Vec => [s.sx(x), s.sy(y)]));
  const L = it.link ?? 16;
  const w = L * 0.55;
  const pitch = L * 0.72;
  const links: ReactNode[] = [];
  for (let i = 0, d = 0; d + L <= len + 0.5; i++, d += pitch) {
    const { p: [cx, cy], deg } = at(d + L / 2);
    const colour = inMark(it.mark, (d + L / 2) / len) ? MARK : METAL;
    const t = `rotate(${deg.toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)})`;
    links.push(
      i % 2 === 0 ? (
        // Seen face-on: an oval ring.
        <rect key={i} x={cx - L / 2} y={cy - w / 2} width={L} height={w} rx={w / 2} transform={t}
          fill="none" stroke={colour} strokeWidth={2} />
      ) : (
        // Seen edge-on: a bar, drawn over its neighbours' ends.
        <rect key={i} x={cx - L / 2} y={cy - 1.6} width={L} height={3.2} rx={1.6} transform={t}
          fill={colour} stroke="var(--surface)" strokeWidth={0.8} />
      ),
    );
  }
  return links;
}

function rope(it: Extract<ObjectItem, { type: 'rope' }>, s: Scale): ReactNode {
  const { len, at } = frame(s, it.from, it.to);
  const w = it.width ?? (it.kind === 'rope' ? 6 : 5);
  const body = it.kind === 'rope' ? ROPE : METAL;
  const strands: ReactNode[] = [];
  // Twisted strands show as short slanted lines across the body.
  const gap = w * 0.75;
  for (let i = 0, d = gap / 2; d < len - gap / 2; i++, d += gap) {
    const marked = inMark(it.mark, d / len);
    strands.push(
      <g key={i}>
        {marked && <path d={`M${pt(at(d - gap / 2))}L${pt(at(d + gap / 2))}`} stroke={MARK} strokeWidth={w} />}
        <path d={`M${pt(at(d - w * 0.35, -w / 2))}L${pt(at(d + w * 0.35, w / 2))}`} stroke="var(--surface)" strokeOpacity={0.55} strokeWidth={0.9} />
      </g>,
    );
  }
  return (
    <>
      <path d={`M${pt(at(0))}L${pt(at(len))}`} stroke={body} strokeWidth={w} />
      {strands}
    </>
  );
}

function spring(it: Extract<ObjectItem, { type: 'spring' }>, s: Scale): ReactNode {
  const { len, at } = frame(s, it.from, it.to);
  const r = it.radius ?? 12;
  const coils = it.coils ?? 14;
  const lead = Math.min(8, len * 0.05);
  // A helix seen slightly from one end: each turn is an upright loop, about as
  // wide as the gap between turns but no wider than the coil radius.
  const loop = Math.min(0.75 * ((len - 2 * lead) / coils), r);
  // The wire starts and ends at the top of a turn (θ = 0), where it runs
  // straight along the spring, and an S-bend with level ends joins it to the
  // attachment on the axis, so there is no corner and no stem through a loop.
  const x0 = lead + loop;
  const pitch = (len - 2 * x0) / coils;
  const bend = (from: Vec, to: Vec) => {
    const mx = (from[0] + to[0]) / 2;
    return `M${pt(at(...from))}C${pt(at(mx, from[1]))} ${pt(at(mx, to[1]))} ${pt(at(...to))}`;
  };
  // The whole coil is one colour; a gap in the surface colour around the front
  // half shows which wire passes in front where they cross.
  // Each half turn is one unbroken polyline, so its gap has no seams.
  let front = '';
  let back = '';
  const steps = coils * 48;
  let prev: Vec = at(x0, r);
  let run = '';
  let isFront = true;
  for (let i = 1; i <= steps; i++) {
    const th = (2 * Math.PI * coils * i) / steps;
    const p = at(x0 + (pitch * th) / (2 * Math.PI) + loop * Math.sin(th), r * Math.cos(th));
    const f = Math.sin(th - Math.PI / steps) >= 0;
    if (f !== isFront) {
      if (isFront) front += run; else back += run;
      run = '';
      isFront = f;
    }
    run += `${run ? '' : `M${pt(prev)}`}L${pt(p)}`;
    prev = p;
  }
  if (isFront) front += run; else back += run;
  return (
    <>
      <path d={back} stroke={METAL} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={front} stroke="var(--surface)" strokeWidth={5} strokeLinecap="butt" strokeLinejoin="round" />
      <path d={front} stroke={METAL} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Square ends, so the wire stops exactly at the wall and the block. */}
      <path d={bend([0, 0], [x0, r]) + bend([len - x0, r], [len, 0])} stroke={METAL} strokeWidth={2} strokeLinecap="butt" />
    </>
  );
}

function support(it: Extract<ObjectItem, { type: 'support' }>, s: Scale): ReactNode {
  const { len, at } = frame(s, it.from, it.to);
  const side = it.side === 'right' ? -1 : 1;
  const hatch: string[] = [];
  for (let d = 3; d <= len; d += 6) hatch.push(`M${pt(at(d))}L${pt(at(d - 6, 6 * side))}`);
  return (
    <>
      <path d={hatch.join('')} stroke={SHADOW} strokeWidth={1} />
      <path d={`M${pt(at(0))}L${pt(at(len))}`} stroke={METAL} strokeWidth={2.5} strokeLinecap="round" />
    </>
  );
}

/** Coal heaped in a pail: one solid shape with a jagged top that rises in the middle. */
function coalHeap(cx: number, cy: number, fh: number, S: number, bw: number, halfAt: (h: number) => number): ReactNode {
  const jag = [0, 0.04, -0.01, 0.05, 0.02, 0.06, 0, 0.03, 0];
  const w = halfAt(fh) * 0.96;
  const top = jag.map((j, i): Vec => {
    const u = (2 * i) / (jag.length - 1) - 1;
    return [cx + u * w, cy - fh - S * (0.13 * (1 - u * u) + j)];
  });
  const heap: Vec[] = [[cx - bw / 2, cy], [cx + bw / 2, cy], [cx + halfAt(fh), cy - fh], ...top.reverse(), [cx - halfAt(fh), cy - fh]];
  return <path d={heap.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('') + 'Z'} fill="var(--ink3)" />;
}

function bucket(it: Extract<ObjectItem, { type: 'bucket' }>, s: Scale): ReactNode {
  const S = it.size ?? 30;
  const cx = s.sx(it.at[0]);
  const cy = s.sy(it.at[1]);
  const bw = S * 0.76;
  const halfAt = (h: number) => (bw + (S - bw) * (h / S)) / 2;
  const fill = Math.min(1, Math.max(0, it.fill ?? 0));
  const fh = fill * S * 0.92;
  const coal = it.contents === 'coal';
  const drops = it.leak
    ? [[-3, 8], [1.5, 17], [-1.5, 27]].map(([dx, dy], i) => {
        const [x, y] = [cx + dx, cy + dy];
        return <path key={i} d={`M${x},${y - 3.2}Q${x + 2.6},${y + 0.6} ${x},${y + 2.4}Q${x - 2.6},${y + 0.6} ${x},${y - 3.2}Z`} fill={WATER} fillOpacity={0.75} />;
      })
    : null;
  return (
    <>
      {drops}
      {fh > 0 && !coal && (
        <path d={`M${cx - bw / 2},${cy}L${cx + bw / 2},${cy}L${cx + halfAt(fh)},${cy - fh}L${cx - halfAt(fh)},${cy - fh}Z`}
          fill={WATER} fillOpacity={0.45} />
      )}
      {fh > 0 && coal && coalHeap(cx, cy, fh, S, bw, halfAt)}
      {!coal && fh > 0 && <path d={`M${cx - halfAt(fh)},${cy - fh}H${cx + halfAt(fh)}`} stroke={WATER} strokeWidth={1.6} />}
      <path d={`M${cx - S / 2},${cy - S}Q${cx},${cy - 2 * S} ${cx + S / 2},${cy - S}`} fill="none" stroke={METAL} strokeWidth={1.6} />
      <path d={`M${cx - S / 2},${cy - S}L${cx - bw / 2},${cy}L${cx + bw / 2},${cy}L${cx + S / 2},${cy - S}`} fill="none" stroke={METAL} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${cx - S / 2 - 1.5},${cy - S}H${cx + S / 2 + 1.5}`} stroke={METAL} strokeWidth={2.6} strokeLinecap="round" />
    </>
  );
}

function pulley(it: Extract<ObjectItem, { type: 'pulley' }>, s: Scale): ReactNode {
  const r = it.radius ?? 12;
  const cx = s.sx(it.at[0]);
  const cy = s.sy(it.at[1]);
  const spokes = [0, 60, 120].map((a) => {
    const t = (a * Math.PI) / 180;
    const [dx, dy] = [Math.cos(t) * (r - 2), Math.sin(t) * (r - 2)];
    return `M${cx - dx},${cy - dy}L${cx + dx},${cy + dy}`;
  });
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="var(--surface)" stroke={METAL} strokeWidth={2.4} />
      <path d={spokes.join('')} stroke={SHADOW} strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={2.4} fill={METAL} />
    </>
  );
}

function liquid(it: Extract<ObjectItem, { type: 'liquid' }>, s: Scale, uid: string): ReactNode {
  const pts = it.points.map(([x, y]): Vec => [s.sx(x), s.sy(y)]);
  const top = Math.min(...pts.map(([, y]) => y));
  const surface = pts
    .map((p, i) => [p, pts[(i + 1) % pts.length]] as const)
    .filter(([p, q]) => Math.abs(p[1] - top) < 0.5 && Math.abs(q[1] - top) < 0.5)
    .map(([p, q]) => `M${pt(p)}L${pt(q)}`)
    .join('');
  return (
    <>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WATER} stopOpacity={0.18} />
          <stop offset="1" stopColor={WATER} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('') + 'Z'} fill={`url(#${uid})`} />
      <path d={surface} stroke={WATER} strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function bar(it: Extract<ObjectItem, { type: 'bar' }>, s: Scale, uid: string): ReactNode {
  const { a, b, len, at } = frame(s, it.from, it.to);
  const w = it.width ?? 10;
  const body = [at(0, w / 2), at(len, w / 2), at(len, -w / 2), at(0, -w / 2)];
  const d = body.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('') + 'Z';
  // Heavier shading where denser: the opacity of the metal follows the density.
  const stops = it.density
    ? Array.from({ length: 17 }, (_, i) => {
        const u = i / 16;
        const k = Math.min(1, Math.max(0, it.density!(u)));
        return <stop key={i} offset={u} stopColor={METAL} stopOpacity={0.08 + 0.82 * k} />;
      })
    : null;
  return (
    <>
      {stops && (
        <defs>
          <linearGradient id={uid} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>{stops}</linearGradient>
        </defs>
      )}
      <path d={d} fill="var(--surface)" />
      <path d={d} fill={stops ? `url(#${uid})` : METAL} fillOpacity={stops ? 1 : 0.85} stroke={METAL} strokeWidth={1.2} strokeLinejoin="round" />
    </>
  );
}

function weight(it: Extract<ObjectItem, { type: 'weight' }>, s: Scale): ReactNode {
  const S = it.size ?? 24;
  const cx = s.sx(it.at[0]);
  const cy = s.sy(it.at[1]);
  const h = S * 0.62;
  const top = S * 0.68;
  const knob = S * 0.3;
  // A cast-iron weight: a trapezoid with a knob on top.
  const d = `M${cx - S / 2},${cy}L${cx + S / 2},${cy}L${cx + top / 2},${cy - h}L${cx - top / 2},${cy - h}Z` +
    `M${cx - knob / 2},${cy - h}L${cx - knob / 2},${cy - h - S * 0.16}L${cx + knob / 2},${cy - h - S * 0.16}L${cx + knob / 2},${cy - h}Z`;
  return <path d={d} fill={METAL} fillOpacity={0.85} stroke={METAL} strokeWidth={1.2} strokeLinejoin="round" />;
}

function ladder(it: Extract<ObjectItem, { type: 'ladder' }>, s: Scale): ReactNode {
  const { len, at } = frame(s, it.from, it.to);
  const w = it.width ?? 12;
  const rungs: string[] = [];
  for (let d = 14; d < len - 6; d += 18) rungs.push(`M${pt(at(d, w / 2))}L${pt(at(d, -w / 2))}`);
  return (
    <>
      <path d={rungs.join('')} stroke={METAL} strokeWidth={2} />
      <path d={`M${pt(at(0, w / 2))}L${pt(at(len, w / 2))}M${pt(at(0, -w / 2))}L${pt(at(len, -w / 2))}`} stroke={METAL} strokeWidth={3} strokeLinecap="round" />
    </>
  );
}

function plate(it: Extract<ObjectItem, { type: 'plate' }>, s: Scale, uid: string): ReactNode {
  const pts = it.points.map(([x, y]): Vec => [s.sx(x), s.sy(y)]);
  return (
    <>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={METAL} stopOpacity={0.1} />
          <stop offset="0.55" stopColor={METAL} stopOpacity={0.24} />
          <stop offset="1" stopColor={METAL} stopOpacity={0.14} />
        </linearGradient>
      </defs>
      <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join('') + 'Z'} fill={`url(#${uid})`} stroke={METAL} strokeWidth={1.5} strokeLinejoin="round" />
    </>
  );
}

function pin(it: Extract<ObjectItem, { type: 'pin' }>, s: Scale): ReactNode {
  const cx = s.sx(it.at[0]);
  const cy = s.sy(it.at[1]);
  return (
    <>
      <circle cx={cx + 1.6} cy={cy + 1.8} r={6.5} fill="#000" fillOpacity={0.22} />
      <circle cx={cx} cy={cy} r={6.5} fill={MARK} stroke="var(--surface)" strokeWidth={1.2} />
      <circle cx={cx - 2} cy={cy - 2} r={2} fill="var(--surface)" fillOpacity={0.75} />
    </>
  );
}

function rocket(it: Extract<ObjectItem, { type: 'rocket' }>, s: Scale): ReactNode {
  const L = it.size ?? 40;
  const w = L * 0.28;
  const cx = s.sx(it.at[0]);
  const cy = s.sy(it.at[1]);
  const top = cy - L / 2;
  const bottom = cy + L / 2;
  const shoulder = top + L * 0.3;
  const body = `M${cx},${top}C${cx + w * 0.55},${top + L * 0.08} ${cx + w / 2},${shoulder - L * 0.06} ${cx + w / 2},${shoulder}` +
    `L${cx + w / 2},${bottom}L${cx - w / 2},${bottom}L${cx - w / 2},${shoulder}` +
    `C${cx - w / 2},${shoulder - L * 0.06} ${cx - w * 0.55},${top + L * 0.08} ${cx},${top}Z`;
  const fin = (side: 1 | -1) =>
    `M${cx + (side * w) / 2},${bottom - L * 0.28}L${cx + side * w * 1.05},${bottom + L * 0.02}L${cx + (side * w) / 2},${bottom}Z`;
  const flame = `M${cx - w * 0.38},${bottom}Q${cx - w * 0.3},${bottom + L * 0.28} ${cx},${bottom + L * 0.48}Q${cx + w * 0.3},${bottom + L * 0.28} ${cx + w * 0.38},${bottom}Z`;
  const core = `M${cx - w * 0.2},${bottom}Q${cx - w * 0.14},${bottom + L * 0.16} ${cx},${bottom + L * 0.28}Q${cx + w * 0.14},${bottom + L * 0.16} ${cx + w * 0.2},${bottom}Z`;
  return (
    <>
      {it.flame && <path d={flame} fill={MARK} fillOpacity={0.85} />}
      {it.flame && <path d={core} fill="#ffd54a" />}
      <path d={fin(1) + fin(-1)} fill={MARK} stroke={METAL} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={body} fill="var(--surface)" stroke={METAL} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={cx} cy={shoulder + L * 0.12} r={w * 0.22} fill={WATER} fillOpacity={0.6} stroke={METAL} strokeWidth={1.1} />
    </>
  );
}

function camera(it: Extract<ObjectItem, { type: 'camera' }>, s: Scale): ReactNode {
  const S = it.size ?? 24;
  const { at, deg } = frame(s, it.at, it.aim);
  // Drawn in its own frame, then turned to face the target: +x runs along the
  // line of sight, which passes through the middle of the body and the lens.
  const h = S * 0.3;
  const box = [at(0, -h), at(S, -h), at(S, h), at(0, h)];
  const lens = [at(S, -h * 0.55), at(S * 1.35, -h * 0.85), at(S * 1.35, h * 0.85), at(S, h * 0.55)];
  const poly = (p: Vec[]) => p.map((q, i) => `${i ? 'L' : 'M'}${pt(q)}`).join('') + 'Z';
  const [vx, vy] = at(S * 0.3, h * 1.25);
  const [gx, gy] = at(S * 0.62, 0);
  return (
    <>
      <path d={poly(box)} fill={METAL} fillOpacity={0.85} stroke={METAL} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={poly(lens)} fill={METAL} stroke={METAL} strokeWidth={1.2} strokeLinejoin="round" />
      <rect x={vx - S * 0.13} y={vy - S * 0.08} width={S * 0.26} height={S * 0.16} transform={`rotate(${deg.toFixed(2)} ${vx.toFixed(2)} ${vy.toFixed(2)})`} fill={METAL} />
      <circle cx={gx} cy={gy} r={S * 0.14} fill="var(--surface)" fillOpacity={0.35} />
    </>
  );
}

/** Draw one physical object. `uid` must be unique on the page, for gradients. */
export function renderObject(it: ObjectItem, key: string, s: Scale, uid: string): ReactNode {
  let body: ReactNode;
  switch (it.type) {
    case 'chain': body = chain(it, s); break;
    case 'rope': body = rope(it, s); break;
    case 'spring': body = spring(it, s); break;
    case 'support': body = support(it, s); break;
    case 'bucket': body = bucket(it, s); break;
    case 'pulley': body = pulley(it, s); break;
    case 'liquid': body = liquid(it, s, uid); break;
    case 'bar': body = bar(it, s, uid); break;
    case 'weight': body = weight(it, s); break;
    case 'ladder': body = ladder(it, s); break;
    case 'plate': body = plate(it, s, uid); break;
    case 'pin': body = pin(it, s); break;
    case 'rocket': body = rocket(it, s); break;
    case 'camera': body = camera(it, s); break;
  }
  return <g key={key} fill="none">{body}</g>;
}
