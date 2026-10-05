import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { EraserIcon, PenIcon, TrashIcon, UndoIcon } from './Icons';
import { btnQuiet, segGroup, segItem } from './ui';

type Mode = 'text' | 'draw';
type Tool = 'pen' | 'eraser';
/** Points are flat x, y pairs in CSS pixels from the canvas's top-left corner. */
interface Stroke { tool: Tool; points: number[] }

const MODE_KEY = 'math27-scratch-mode';
const PEN_WIDTH = 2.25;
const ERASER_WIDTH = 18;

function loadMode(): Mode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'draw' ? 'draw' : 'text';
  } catch {
    return 'text';
  }
}

/** Typed notes or a freehand canvas. Both stay mounted so switching keeps the work. */
export function Scratchpad({ id, problemNumber }: { id: string; problemNumber: number }) {
  const [mode, setMode] = useState<Mode>(loadMode);

  const choose = (m: Mode) => {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m); // the last choice becomes the default
    } catch {
      /* not remembered; the choice still applies here */
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <div role="group" aria-label="Scratchpad mode" className={`${segGroup} justify-self-start`}>
        {(['text', 'draw'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} className={segItem(mode === m)} onClick={() => choose(m)}>
            {m === 'text' ? 'Type' : 'Draw'}
          </button>
        ))}
      </div>
      <textarea
        id={`${id}-scratch`}
        aria-label={`Scratchpad for problem ${problemNumber}`}
        placeholder="Work it out here before revealing any steps."
        rows={4}
        className={`${mode === 'text' ? '' : 'hidden'} w-full resize-y rounded border border-line bg-bg p-2 font-mono text-sm text-ink placeholder:text-ink3`}
      />
      <DrawPad visible={mode === 'draw'} problemNumber={problemNumber} />
    </div>
  );
}

function inkColour() {
  return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#18181b';
}

function setStyle(ctx: CanvasRenderingContext2D, tool: Tool, ink: string) {
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = tool === 'eraser' ? ERASER_WIDTH : PEN_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, ink: string) {
  setStyle(ctx, s.tool, ink);
  const p = s.points;
  if (p.length === 2) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.stroke();
}

function DrawPad({ visible, problemNumber }: { visible: boolean; problemNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  // Each entry is the full drawing after one action, so undo also reverses Clear.
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const strokes = history[history.length - 1];
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const active = useRef<{ stroke: Stroke; pointerId: number; rect: DOMRect } | null>(null);
  const [drawing, setDrawing] = useState(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return; // collapsed or hidden
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ink = inkColour();
    for (const s of strokesRef.current) drawStroke(ctx, s, ink);
  };

  useEffect(redraw, [strokes]);

  // Redraw when the pad is resized or shown, and when the theme changes the ink colour.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(redraw);
    ro.observe(canvas);
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const pointAt = (e: { clientX: number; clientY: number }, rect: DOMRect) => [e.clientX - rect.left, e.clientY - rect.top];

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (active.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    // A stylus's eraser end (button 5) erases regardless of the selected tool.
    const stroke: Stroke = { tool: e.button === 5 ? 'eraser' : tool, points: pointAt(e, rect) };
    active.current = { stroke, pointerId: e.pointerId, rect };
    setDrawing(true);
    drawStroke(ctx, stroke, inkColour());
  };

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const a = active.current;
    const ctx = e.currentTarget.getContext('2d');
    if (!a || a.pointerId !== e.pointerId || !ctx) return;
    const p = a.stroke.points;
    setStyle(ctx, a.stroke.tool, inkColour());
    ctx.beginPath();
    ctx.moveTo(p[p.length - 2], p[p.length - 1]);
    // Coalesced events keep fast strokes smooth on high-rate pens and mice.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const [x, y] = pointAt(ev, a.rect);
      p.push(x, y);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    active.current = null;
    setDrawing(false);
    setHistory((h) => [...h, [...h[h.length - 1], a.stroke]]);
  };

  const empty = strokes.length === 0;

  return (
    <div className={`${visible ? 'grid' : 'hidden'} grid-cols-1 gap-2`}>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Drawing tool" className={segGroup}>
          {(['pen', 'eraser'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={tool === t} onClick={() => setTool(t)}
              className={`${segItem(tool === t)} inline-flex items-center gap-1.5`}>
              {t === 'pen' ? <PenIcon /> : <EraserIcon />}
              {t === 'pen' ? 'Pen' : 'Eraser'}
            </button>
          ))}
        </div>
        <button type="button" className={btnQuiet} disabled={history.length === 1}
          onClick={() => setHistory((h) => h.slice(0, -1))}>
          <UndoIcon /> Undo
        </button>
        <button type="button" className={btnQuiet} disabled={empty}
          onClick={() => setHistory((h) => [...h, []])}>
          <TrashIcon /> Clear
        </button>
      </div>
      <div className="relative h-64 min-h-40 resize-y overflow-hidden rounded border border-line bg-bg">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Drawing scratchpad for problem ${problemNumber}`}
          className={`absolute inset-0 h-full w-full touch-none ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        {empty && !drawing && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-ink3">
            Sketch with a mouse, pen, or finger.
          </p>
        )}
      </div>
    </div>
  );
}
