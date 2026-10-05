import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { Problem } from '../types/curriculum';
import { EraserIcon, ExpandIcon, PenIcon, ShrinkIcon, TrashIcon, UndoIcon } from './Icons';
import { MathRenderer, MathText } from './MathRenderer';
import { btnQuiet, segGroup, segItem } from './ui';

type Mode = 'text' | 'draw';
type Tool = 'pen' | 'eraser';
/** Points are flat x, y pairs in CSS pixels; y = 0 is the top of the drawing area. */
interface Stroke { tool: Tool; points: number[] }

const MODE_KEY = 'math27-scratch-mode';
const PEN_WIDTH = 2.25;
const ERASER_WIDTH = 18;
/**
 * In full screen the page ends this fraction of a screen below the lowest mark,
 * so there is always room to keep writing but never a long empty stretch to
 * scroll into. Writing lower extends the page.
 */
const PAGE_MARGIN = 0.5;
/** If a second finger lands within this many ms of the first, the first finger's mark was the start of a scroll. */
const PAN_GRACE_MS = 250;

function loadMode(): Mode {
  try {
    return window.localStorage.getItem(MODE_KEY) === 'draw' ? 'draw' : 'text';
  } catch {
    return 'text';
  }
}

/** The drawing shared by the inline pad and the full-screen page. */
interface Pad {
  strokes: Stroke[];
  tool: Tool;
  setTool: (t: Tool) => void;
  add: (s: Stroke) => void;
  undo: () => void;
  clear: () => void;
  canUndo: boolean;
}

/**
 * Typed notes or a freehand drawing, inline under the problem or full screen.
 * Both views share the same text and drawing, so switching keeps the work.
 */
export function Scratchpad({ problem }: { problem: Problem }) {
  const [mode, setMode] = useState<Mode>(loadMode);
  const [text, setText] = useState('');
  const [tool, setTool] = useState<Tool>('pen');
  // Each entry is the full drawing after one action, so undo also reverses Clear.
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [full, setFull] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const strokes = history[history.length - 1];

  const pad: Pad = {
    strokes,
    tool,
    setTool,
    add: (s) => setHistory((h) => [...h, [...h[h.length - 1], s]]),
    undo: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    clear: () => setHistory((h) => [...h, []]),
    canUndo: history.length > 1,
  };

  const choose = (m: Mode) => {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m); // the last choice becomes the default
    } catch {
      /* not remembered; the choice still applies here */
    }
  };

  const open = () => {
    setFull(true);
    // Real full screen also hides the browser's bars where it is supported (not on iPhone).
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const close = useCallback(() => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    opener.current?.focus();
  }, []);

  const label = `Scratchpad for problem ${problem.problemNumber}`;

  return (
    <div className="grid grid-cols-1 gap-2">
      {/* One compact row of controls; full screen lives in the pad's corner. */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <ModeSwitch mode={mode} choose={choose} compact />
        {mode === 'draw' && <DrawTools pad={pad} compact />}
      </div>

      <div className={`relative ${mode === 'draw' ? 'h-64 min-h-40 resize-y overflow-hidden rounded border border-line bg-bg' : ''}`}>
        {mode === 'text' ? (
          <textarea
            id={`${problem.id}-scratch`}
            aria-label={label}
            placeholder="Work it out here before revealing any steps."
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="block w-full resize-y rounded border border-line bg-bg p-2 pr-11 font-mono text-sm text-ink placeholder:text-ink3"
          />
        ) : (
          <Surface pad={pad} label={label} />
        )}
        <button ref={opener} type="button" onClick={open} aria-label="Full screen" title="Full screen"
          className="absolute right-1.5 top-1.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded border border-line bg-surface text-ink2 shadow-sm transition-colors hover:border-strong hover:text-ink">
          <ExpandIcon />
        </button>
      </div>

      {full && (
        <FullScreenPad problem={problem} mode={mode} choose={choose} text={text} setText={setText}
          pad={pad} label={label} onClose={close} />
      )}
    </div>
  );
}

function ModeSwitch({ mode, choose, compact = false }: { mode: Mode; choose: (m: Mode) => void; compact?: boolean }) {
  return (
    <div role="group" aria-label="Scratchpad mode" className={segGroup}>
      {(['text', 'draw'] as const).map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => choose(m)}
          className={`${segItem(mode === m)} ${compact ? '!px-2.5 sm:!px-3' : ''}`}>
          {m === 'text' ? 'Type' : 'Draw'}
        </button>
      ))}
    </div>
  );
}

/**
 * Pen, eraser, undo and clear, kept together as one group after a divider.
 * `compact` shows icons only on phones so the whole toolbar fits on one row.
 */
function DrawTools({ pad, compact = false }: { pad: Pad; compact?: boolean }) {
  const word = compact ? 'hidden sm:inline' : '';
  const tight = compact ? '!px-2.5 sm:!px-3' : '';
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-line sm:block" />
      <div role="group" aria-label="Drawing tool" className={segGroup}>
        {(['pen', 'eraser'] as const).map((t) => (
          <button key={t} type="button" aria-pressed={pad.tool === t} onClick={() => pad.setTool(t)}
            aria-label={t === 'pen' ? 'Pen' : 'Eraser'} title={t === 'pen' ? 'Pen' : 'Eraser'}
            className={`${segItem(pad.tool === t)} ${tight} inline-flex items-center gap-1.5`}>
            {t === 'pen' ? <PenIcon /> : <EraserIcon />}
            <span className={word}>{t === 'pen' ? 'Pen' : 'Eraser'}</span>
          </button>
        ))}
      </div>
      <button type="button" className={`${btnQuiet} ${tight}`} disabled={!pad.canUndo} onClick={pad.undo}
        aria-label="Undo" title="Undo">
        <UndoIcon /> <span className={word}>Undo</span>
      </button>
      <button type="button" className={`${btnQuiet} ${tight}`} disabled={pad.strokes.length === 0} onClick={pad.clear}
        aria-label="Clear" title="Clear">
        <TrashIcon /> <span className={word}>Clear</span>
      </button>
    </div>
  );
}

/** The problem statement at the top left of the full-screen page. */
function ProblemHeader({ problem }: { problem: Problem }) {
  return (
    <div className="max-w-2xl px-4 pb-3 pt-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink3">Problem {problem.problemNumber}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink2"><MathText text={problem.prompt} /></p>
      <MathRenderer latex={problem.questionLatex} display className="!text-left" />
    </div>
  );
}

interface FullScreenProps {
  problem: Problem;
  mode: Mode;
  choose: (m: Mode) => void;
  text: string;
  setText: (t: string) => void;
  pad: Pad;
  label: string;
  onClose: () => void;
}

function FullScreenPad({ problem, mode, choose, text, setText, pad, label, onClose }: FullScreenProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the page behind still, and start with focus inside the dialog.
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = 'hidden';
    // The drawing surface or textarea focuses itself first; fall back to the dialog.
    if (!root.current?.contains(document.activeElement)) root.current?.focus();
    // Leaving the browser's full screen (Esc, Back) also leaves this view.
    let entered = !!document.fullscreenElement;
    const onChange = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) onClose();
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      html.style.overflow = before;
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, [onClose]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={onKey}
      className="fixed inset-0 z-50 flex flex-col bg-bg outline-none">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
        <ModeSwitch mode={mode} choose={choose} />
        {mode === 'draw' && <DrawTools pad={pad} compact />}
        <button type="button" className={`${btnQuiet} ml-auto`} onClick={onClose} aria-label="Exit full screen">
          <ShrinkIcon /> <span className="hidden sm:inline">Exit full screen</span>
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        {mode === 'draw' ? (
          <Surface pad={pad} label={label} header={<ProblemHeader problem={problem} />} autoFocus />
        ) : (
          <div className="flex h-full flex-col">
            <ProblemHeader problem={problem} />
            <textarea aria-label={label} value={text} onChange={(e) => setText(e.target.value)} autoFocus
              placeholder="Work it out here before revealing any steps."
              className="min-h-0 flex-1 resize-none overscroll-contain border-t border-dashed border-line bg-transparent px-4 py-3 font-mono text-sm text-ink outline-none placeholder:text-ink3 sm:px-6" />
          </div>
        )}
      </div>
    </div>,
    document.body,
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

/** The lowest pen mark, in drawing coordinates. */
function lowestMark(strokes: Stroke[]) {
  let y = 0;
  for (const s of strokes) {
    if (s.tool !== 'pen') continue;
    for (let i = 1; i < s.points.length; i += 2) y = Math.max(y, s.points[i]);
  }
  return y;
}

interface SurfaceProps {
  pad: Pad;
  label: string;
  /** Present in full screen: the page scrolls, with this above the drawing area. */
  header?: ReactNode;
  autoFocus?: boolean;
}

/**
 * The drawing canvas. One finger, a pen or the mouse draws; two fingers scroll.
 * Inline, two fingers scroll the page around it. In full screen it scrolls its
 * own page (also with the wheel and keyboard), which ends PAGE_MARGIN of a
 * screen below the lowest mark.
 */
function Surface({ pad, label, header, autoFocus }: SurfaceProps) {
  const isPage = header !== undefined;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [drawing, setDrawing] = useState(false);

  const bottom = useMemo(() => lowestMark(pad.strokes), [pad.strokes]);
  const maxScroll = isPage ? Math.max(0, headerH + bottom - viewH * (1 - PAGE_MARGIN)) : 0;

  // Event handlers read the latest values through this ref.
  const live = useRef({ scroll, headerH, maxScroll, strokes: pad.strokes });
  live.current = { scroll, headerH, maxScroll, strokes: pad.strokes };
  const active = useRef<{ stroke: Stroke; pointerId: number; rect: DOMRect; start: number } | null>(null);
  const touches = useRef(new Map<number, number>()); // touch pointer id -> clientY
  const pan = useRef<{ y: number } | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return; // collapsed or hidden
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Shift the drawing below the header and up by the scroll position.
    ctx.setTransform(dpr, 0, 0, dpr, 0, (live.current.headerH - live.current.scroll) * dpr);
    const ink = inkColour();
    for (const s of live.current.strokes) drawStroke(ctx, s, ink);
    if (active.current) drawStroke(ctx, active.current.stroke, ink);
  }, []);

  useLayoutEffect(redraw, [pad.strokes, scroll, headerH, redraw]);

  // Undo or Clear can shorten the page under the current scroll position.
  useEffect(() => {
    if (scroll > maxScroll) setScroll(maxScroll);
  }, [scroll, maxScroll]);

  // Redraw when resized or shown, and when the theme changes the ink colour.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      setViewH(canvas.clientHeight);
      if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
      redraw();
    });
    ro.observe(canvas);
    if (headerRef.current) ro.observe(headerRef.current);
    const mo = new MutationObserver(redraw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [redraw]);

  useEffect(() => {
    if (autoFocus) boxRef.current?.focus();
  }, [autoFocus]);

  const scrollBy = (d: number) => {
    if (!isPage) {
      window.scrollBy(0, d);
      return;
    }
    setScroll((s) => Math.min(live.current.maxScroll, Math.max(0, s + d)));
  };

  const toDrawing = (e: { clientX: number; clientY: number }, rect: DOMRect) =>
    [e.clientX - rect.left, e.clientY - rect.top + live.current.scroll - live.current.headerH];

  const midY = () => {
    const ys = [...touches.current.values()];
    return ys.reduce((a, b) => a + b, 0) / ys.length;
  };

  const startPan = (now: number) => {
    const a = active.current;
    if (a) {
      active.current = null;
      setDrawing(false);
      // A mark that only just began was the first finger of the scroll, so drop it.
      if (now - a.start > PAN_GRACE_MS) pad.add(a.stroke);
      else redraw();
    }
    pan.current = { y: midY() };
  };

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const canvas = e.currentTarget;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, e.clientY);
      if (touches.current.size >= 2) {
        startPan(e.timeStamp);
        return;
      }
      if (pan.current) return; // fingers from a scroll are still down
    }
    if (active.current) return;
    const rect = canvas.getBoundingClientRect();
    const [x, y] = toDrawing(e, rect);
    if (y < 0) return; // on the problem statement, above the drawing area
    // A stylus's eraser end (button 5) erases regardless of the selected tool.
    const stroke: Stroke = { tool: e.button === 5 ? 'eraser' : pad.tool, points: [x, y] };
    active.current = { stroke, pointerId: e.pointerId, rect, start: e.timeStamp };
    setDrawing(true);
    const ctx = canvas.getContext('2d');
    if (ctx) drawStroke(ctx, stroke, inkColour());
  };

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && touches.current.has(e.pointerId)) touches.current.set(e.pointerId, e.clientY);
    if (pan.current) {
      if (touches.current.size >= 2) {
        const y = midY();
        scrollBy(pan.current.y - y);
        pan.current.y = y;
      }
      return;
    }
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
      const [x, y] = toDrawing(ev, a.rect);
      p.push(x, y);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') touches.current.delete(e.pointerId);
    if (pan.current) {
      if (touches.current.size === 0) pan.current = null;
      return;
    }
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    active.current = null;
    setDrawing(false);
    pad.add(a.stroke);
  };

  const onWheel = (e: WheelEvent) => {
    if (!isPage) return; // inline, the wheel scrolls the page as usual
    scrollBy(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewH : 1));
  };

  const onKey = (e: KeyboardEvent) => {
    if (!isPage) return;
    const step = { ArrowDown: 40, ArrowUp: -40, PageDown: viewH * 0.9, PageUp: -viewH * 0.9, ' ': viewH * 0.9 }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      scrollBy(step);
    } else if (e.key === 'Home') setScroll(0);
    else if (e.key === 'End') setScroll(maxScroll);
  };

  const empty = pad.strokes.length === 0;
  const barH = maxScroll > 0 ? Math.max(32, (viewH * viewH) / (viewH + maxScroll)) : 0;

  return (
    <div ref={boxRef} tabIndex={isPage ? 0 : -1} onKeyDown={onKey} onWheel={onWheel}
      className="absolute inset-0 overflow-hidden outline-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className={`absolute inset-0 h-full w-full touch-none ${pad.tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {isPage && (
        <div ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-line"
          style={{ transform: `translateY(${-scroll}px)` }}>
          {header}
        </div>
      )}

      {empty && !drawing && (
        <p className="pointer-events-none absolute inset-x-0 p-4 text-center text-sm text-ink3"
          style={isPage ? { top: headerH - scroll + 16 } : { top: '50%', transform: 'translateY(-50%)' }}>
          Write with a mouse, pen, or one finger. Scroll with two fingers{isPage ? ' or the mouse wheel' : ''}.
        </p>
      )}

      {/* Inline, say so when the work continues below the visible part. */}
      {!isPage && bottom > viewH && (
        <p className="pointer-events-none absolute bottom-1 right-2 rounded bg-surface px-1.5 text-xs text-ink3">
          More below. Open full screen to see it all.
        </p>
      )}

      {isPage && maxScroll > 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute right-1 top-0 w-1 rounded-full bg-strong opacity-60"
          style={{ height: barH, transform: `translateY(${(scroll / maxScroll) * (viewH - barH)}px)` }} />
      )}
    </div>
  );
}
