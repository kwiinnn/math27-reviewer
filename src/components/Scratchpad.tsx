import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { Problem } from '../types/curriculum';
import { recognise, snapLine, type ShapeKind } from '../lib/ink';
import {
  EraserIcon, ExpandIcon, HighlighterIcon, PenIcon, RedoIcon, ShrinkIcon, TrashIcon, UndoIcon,
} from './Icons';
import { MathRenderer, MathText } from './MathRenderer';
import { btnQuiet, segGroup, segItem } from './ui';

type Mode = 'text' | 'draw';
type Tool = 'pen' | 'highlighter' | 'eraser';
type Colour = 'ink' | 'blue' | 'orange' | 'green';
type Paper = 'blank' | 'grid' | 'lines';
/** Points are flat x, y pairs in CSS pixels; y = 0 is the top of the drawing area. */
interface Stroke { tool: Tool; colour?: Colour; points: number[] }

const MODE_KEY = 'math27-scratch-mode';
const PREFS_KEY = 'math27-scratch-prefs';
const workKey = (id: string) => `math27-scratch:${id}`;

const WIDTH: Record<Tool, number> = { pen: 2.25, highlighter: 16, eraser: 18 };
/** Pen colours follow the theme through the figure colour tokens. */
const COLOURS: { id: Colour; name: string; css: string }[] = [
  { id: 'ink', name: 'Ink', css: '--ink' },
  { id: 'blue', name: 'Blue', css: '--viz1' },
  { id: 'orange', name: 'Orange', css: '--viz2' },
  { id: 'green', name: 'Green', css: '--viz3' },
];
const HIGHLIGHT = 'rgba(250, 204, 21, 0.38)';
/**
 * In full screen the page ends this fraction of a screen below the lowest mark,
 * so there is always room to keep writing but never a long empty stretch to
 * scroll into. Writing lower extends the page.
 */
const PAGE_MARGIN = 0.5;
/** If a second finger lands within this many ms of the first, the first finger's mark was the start of a scroll. */
const PAN_GRACE_MS = 250;
/** Holding the pointer this still (px) for this long (ms) at the end of a stroke cleans up its shape. */
const HOLD_PX = 5;
const HOLD_MS = 500;

/**
 * Set once a stylus touches any pad: from then on a single finger scrolls
 * instead of drawing, so a resting palm leaves no marks.
 */
let penSeen = false;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable; the work still lives in memory */
  }
}

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
  colour: Colour;
  setColour: (c: Colour) => void;
  paper: Paper;
  setPaper: (p: Paper) => void;
  add: (s: Stroke) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface History { past: Stroke[][]; present: Stroke[]; future: Stroke[][] }

/**
 * Typed notes or a freehand drawing, inline under the problem or full screen.
 * Both views share the same text and drawing, and each problem's work is saved
 * on the device so it survives a reload.
 */
export function Scratchpad({ problem }: { problem: Problem }) {
  const saved = useMemo(() => readJSON(workKey(problem.id), { text: '', strokes: [] as Stroke[] }), [problem.id]);
  const [mode, setMode] = useState<Mode>(loadMode);
  const [text, setText] = useState(saved.text);
  const [tool, setTool] = useState<Tool>('pen');
  const [prefs, setPrefs] = useState(() => readJSON(PREFS_KEY, { colour: 'ink' as Colour, paper: 'blank' as Paper }));
  // Every action stores the whole drawing, so undo also reverses Clear.
  const [history, setHistory] = useState<History>({ past: [], present: saved.strokes, future: [] });
  const [full, setFull] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  // Save the work shortly after it changes.
  useEffect(() => {
    const t = setTimeout(() => {
      const round = (s: Stroke) => ({ ...s, points: s.points.map((v) => Math.round(v * 10) / 10) });
      if (!text && history.present.length === 0) {
        try {
          window.localStorage.removeItem(workKey(problem.id));
        } catch {
          /* nothing saved */
        }
      } else writeJSON(workKey(problem.id), { text, strokes: history.present.map(round) });
    }, 400);
    return () => clearTimeout(t);
  }, [text, history.present, problem.id]);

  const setPref = (patch: Partial<typeof prefs>) =>
    setPrefs((p) => {
      const next = { ...p, ...patch };
      writeJSON(PREFS_KEY, next);
      return next;
    });

  const push = (next: Stroke[]) => setHistory((h) => ({ past: [...h.past, h.present], present: next, future: [] }));
  const pad: Pad = {
    strokes: history.present,
    tool,
    setTool,
    colour: prefs.colour,
    setColour: (colour) => {
      setPref({ colour });
      if (tool === 'eraser') setTool('pen');
    },
    paper: prefs.paper,
    setPaper: (paper) => setPref({ paper }),
    add: (s) => setHistory((h) => ({ past: [...h.past, h.present], present: [...h.present, s], future: [] })),
    undo: () => setHistory((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h)),
    redo: () => setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h)),
    clear: () => push([]),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
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
    <div className="grid grid-cols-1 gap-2" onKeyDown={(e) => shortcuts(e, pad)}>
      {/* Mode and drawing tools; on phones the tools take their own evenly spaced row. */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <ModeSwitch mode={mode} choose={choose} compact />
        {mode === 'draw' && <DrawTools pad={pad} />}
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

/** Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z or Ctrl+Y redoes. Typing keeps its own undo. */
function shortcuts(e: KeyboardEvent, pad: Pad) {
  if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
  const key = e.key.toLowerCase();
  if (key === 'z' && !e.shiftKey) pad.undo();
  else if ((key === 'z' && e.shiftKey) || key === 'y') pad.redo();
  else return;
  e.preventDefault();
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

const TOOLS: { id: Tool; name: string; icon: ReactNode }[] = [
  { id: 'pen', name: 'Pen', icon: <PenIcon /> },
  { id: 'highlighter', name: 'Highlight', icon: <HighlighterIcon /> },
  { id: 'eraser', name: 'Eraser', icon: <EraserIcon /> },
];

/** Square icon buttons on phones, icon and word from the sm breakpoint. */
const iconOnPhone = '!h-8 !w-8 !px-0 sm:!h-auto sm:!w-auto sm:!px-3';
const word = 'hidden sm:inline';
/** Always a square icon button; the name is in the tooltip and the accessible label. */
const iconOnly = '!h-8 !w-8 !px-0 sm:!h-9 sm:!w-9';

/**
 * Tools, colour and paper, undo, redo and clear. On phones the group fills its
 * own row with the buttons spread evenly; from sm it sits after a divider.
 */
function DrawTools({ pad, className = '' }: { pad: Pad; className?: string }) {
  return (
    <div className={`flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2 ${className}`}>
      <span aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-line sm:block" />
      <div role="group" aria-label="Drawing tool" className={segGroup}>
        {TOOLS.map((t) => (
          <button key={t.id} type="button" aria-pressed={pad.tool === t.id} onClick={() => pad.setTool(t.id)}
            aria-label={t.name} title={t.name}
            className={`${segItem(pad.tool === t.id)} ${iconOnPhone} inline-flex items-center justify-center gap-1.5`}>
            {t.icon}
            <span className={word}>{t.name}</span>
          </button>
        ))}
      </div>
      <PenOptions pad={pad} />
      <button type="button" className={`${btnQuiet} ${iconOnly}`} disabled={!pad.canUndo} onClick={pad.undo}
        aria-label="Undo" title="Undo (Ctrl+Z)">
        <UndoIcon />
      </button>
      <button type="button" className={`${btnQuiet} ${iconOnly}`} disabled={!pad.canRedo} onClick={pad.redo}
        aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
        <RedoIcon />
      </button>
      <button type="button" className={`${btnQuiet} ${iconOnly}`} disabled={pad.strokes.length === 0} onClick={pad.clear}
        aria-label="Clear" title="Clear">
        <TrashIcon />
      </button>
    </div>
  );
}

/** A swatch button that opens the pen colour and paper choices. */
function PenOptions({ pad }: { pad: Pad }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  const current = COLOURS.find((c) => c.id === pad.colour) ?? COLOURS[0];

  return (
    <div ref={box} className="relative" onKeyDown={(e) => e.key === 'Escape' && open && (e.stopPropagation(), setOpen(false))}>
      <button type="button" className={`${btnQuiet} ${iconOnly}`} aria-expanded={open} aria-haspopup="true"
        aria-label={`Pen colour and paper (${current.name})`} title="Pen colour and paper" onClick={() => setOpen(!open)}>
        <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: `var(${current.css})` }} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-1 w-56 -translate-x-1/2 rounded-md border border-line bg-surface p-3 shadow-lg sm:left-0 sm:translate-x-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink3">Pen colour</p>
          <div className="mt-2 flex gap-2" role="group" aria-label="Pen colour">
            {COLOURS.map((c) => (
              <button key={c.id} type="button" aria-pressed={pad.colour === c.id} aria-label={c.name} title={c.name}
                onClick={() => pad.setColour(c.id)}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${pad.colour === c.id ? 'border-ink' : 'border-transparent'}`}>
                <span className="h-5 w-5 rounded-full" style={{ background: `var(${c.css})` }} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ink3">Paper</p>
          <div className={`${segGroup} mt-2 flex`} role="group" aria-label="Paper">
            {(['blank', 'grid', 'lines'] as const).map((p) => (
              <button key={p} type="button" aria-pressed={pad.paper === p} onClick={() => pad.setPaper(p)}
                className={`${segItem(pad.paper === p)} flex-1 !px-2 capitalize`}>
                {p}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink3">
            Hold still at the end of a stroke to straighten a line or tidy a triangle, box or circle.
          </p>
        </div>
      )}
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
    // Keep the page behind still.
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
    else shortcuts(e, pad);
  };

  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onKeyDown={onKey}
      className="fixed inset-0 z-50 flex flex-col bg-bg outline-none">
      {/* Phones: mode and exit on top, tools in a full row below. From sm: one row. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
        <ModeSwitch mode={mode} choose={choose} compact />
        {mode === 'draw' && <DrawTools pad={pad} className="order-3 sm:order-2" />}
        <button type="button" className={`${btnQuiet} order-2 ml-auto !px-2.5 sm:order-3 sm:!px-3`} onClick={onClose}
          aria-label="Exit full screen" title="Exit full screen (Esc)">
          <ShrinkIcon /> <span className={word}>Exit full screen</span>
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

/** Resolve the theme's colours once per redraw. */
function palette(): Record<Colour, string> {
  const css = getComputedStyle(document.documentElement);
  const get = (v: string) => css.getPropertyValue(v).trim() || '#18181b';
  return { ink: get('--ink'), blue: get('--viz1'), orange: get('--viz2'), green: get('--viz3') };
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, colours: Record<Colour, string>) {
  const colour = s.tool === 'highlighter' ? HIGHLIGHT : colours[s.colour ?? 'ink'];
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = WIDTH[s.tool];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const p = s.points;
  ctx.beginPath();
  if (p.length === 2) {
    ctx.arc(p[0], p[1], ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  ctx.stroke();
}

/** The lowest mark, in drawing coordinates. */
function lowestMark(strokes: Stroke[]) {
  let y = 0;
  for (const s of strokes) {
    if (s.tool === 'eraser') continue;
    for (let i = 1; i < s.points.length; i += 2) y = Math.max(y, s.points[i]);
  }
  return y;
}

/** Grid or ruled paper as a CSS background, so the eraser never removes it. */
function paperStyle(paper: Paper, offset: number): CSSProperties {
  const line = 'var(--line)';
  if (paper === 'grid') {
    return {
      backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      backgroundPosition: `0 ${offset}px`,
    };
  }
  if (paper === 'lines') {
    return { backgroundImage: `linear-gradient(transparent 31px, ${line} 31px)`, backgroundSize: '100% 32px', backgroundPosition: `0 ${offset}px` };
  }
  return {};
}

interface Active {
  stroke: Stroke;
  pointerId: number;
  rect: DOMRect;
  start: number;
  /** Set once the stroke has been cleaned into a shape; a line keeps following the pointer. */
  shape?: ShapeKind;
}

interface SurfaceProps {
  pad: Pad;
  label: string;
  /** Present in full screen: the page scrolls, with this above the drawing area. */
  header?: ReactNode;
  autoFocus?: boolean;
}

/**
 * The drawing canvas. One finger, a pen or the mouse draws; two fingers scroll
 * (one finger, once a stylus has been used). Inline, scrolling moves the page
 * around the pad. In full screen it scrolls its own page (also with the wheel
 * and keyboard), which ends PAGE_MARGIN of a screen below the lowest mark.
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
  const active = useRef<Active | null>(null);
  const touches = useRef(new Map<number, number>()); // touch pointer id -> clientY
  const pan = useRef<{ y: number } | null>(null);
  const hold = useRef<{ x: number; y: number; timer: number } | null>(null);

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
    const colours = palette();
    for (const s of live.current.strokes) drawStroke(ctx, s, colours);
    if (active.current) drawStroke(ctx, active.current.stroke, colours);
  }, []);

  useLayoutEffect(redraw, [pad.strokes, scroll, headerH, redraw]);

  // Undo or Clear can shorten the page under the current scroll position.
  useEffect(() => {
    if (scroll > maxScroll) setScroll(maxScroll);
  }, [scroll, maxScroll]);

  // Redraw when resized or shown, and when the theme changes the colours.
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
      if (hold.current) clearTimeout(hold.current.timer);
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

  const stopHold = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };

  /** Restart the hold timer from the pointer's current spot. */
  const armHold = (x: number, y: number) => {
    stopHold();
    const timer = window.setTimeout(() => {
      const a = active.current;
      if (!a || a.shape || a.stroke.tool === 'eraser') return;
      const shape = recognise(a.stroke.points);
      if (!shape) return;
      a.stroke.points = shape.points;
      a.shape = shape.kind;
      navigator.vibrate?.(10);
      redraw();
    }, HOLD_MS);
    hold.current = { x, y, timer };
  };

  const startPan = (now: number) => {
    stopHold();
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
    if (e.pointerType === 'pen') penSeen = true;
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, e.clientY);
      // With a stylus in use, fingers only scroll; otherwise it takes two.
      if (touches.current.size >= 2 || penSeen) {
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
    const tool: Tool = e.button === 5 ? 'eraser' : pad.tool;
    const stroke: Stroke = { tool, points: [x, y], ...(tool === 'pen' ? { colour: pad.colour } : {}) };
    active.current = { stroke, pointerId: e.pointerId, rect, start: e.timeStamp };
    setDrawing(true);
    armHold(e.clientX, e.clientY);
    redraw();
  };

  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && touches.current.has(e.pointerId)) touches.current.set(e.pointerId, e.clientY);
    if (pan.current) {
      if (touches.current.size >= (penSeen ? 1 : 2)) {
        const y = midY();
        scrollBy(pan.current.y - y);
        pan.current.y = y;
      }
      return;
    }
    const a = active.current;
    const ctx = e.currentTarget.getContext('2d');
    if (!a || a.pointerId !== e.pointerId || !ctx) return;

    if (a.shape) {
      // A straightened line keeps following the pointer; other shapes stay put.
      if (a.shape === 'line') {
        const [x, y] = toDrawing(e, a.rect);
        a.stroke.points = snapLine(a.stroke.points[0], a.stroke.points[1], x, y);
        redraw();
      }
      return;
    }

    const h = hold.current;
    if (!h || Math.hypot(e.clientX - h.x, e.clientY - h.y) > HOLD_PX) armHold(e.clientX, e.clientY);

    const p = a.stroke.points;
    // Coalesced events keep fast strokes smooth on high-rate pens and mice.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const [x, y] = toDrawing(ev, a.rect);
      p.push(x, y);
    }
    if (a.stroke.tool === 'highlighter') {
      redraw(); // translucent ink must be drawn as one path, or the joins darken
      return;
    }
    // Draw just the new piece: from the previous point through the points added now.
    const added = events.length || 1;
    drawStroke(ctx, { ...a.stroke, points: p.slice(Math.max(0, p.length - 2 - 2 * added)) }, palette());
  };

  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') touches.current.delete(e.pointerId);
    if (pan.current) {
      if (touches.current.size === 0) pan.current = null;
      return;
    }
    const a = active.current;
    if (!a || a.pointerId !== e.pointerId) return;
    stopHold();
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
  const cursor = pad.tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair';

  return (
    <div ref={boxRef} tabIndex={isPage ? 0 : -1} onKeyDown={onKey} onWheel={onWheel}
      className="absolute inset-0 overflow-hidden outline-none" style={paperStyle(pad.paper, headerH - scroll)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className={`absolute inset-0 h-full w-full touch-none ${cursor}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {isPage && (
        <div ref={headerRef} className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-line bg-bg"
          style={{ transform: `translateY(${-scroll}px)` }}>
          {header}
        </div>
      )}

      {empty && !drawing && (
        <p className="pointer-events-none absolute inset-x-0 px-4 text-center text-sm text-ink3"
          style={isPage ? { top: headerH - scroll + 16 } : { top: '50%', transform: 'translateY(-50%)' }}>
          Write with a mouse, pen, or one finger; scroll with two fingers.
          <span className="block text-xs">Hold still at the end of a stroke to straighten it or tidy a shape.</span>
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
