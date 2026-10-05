import type {
  Figure,
  FlowFigure,
  PlotFigure,
  PlotItem,
  SequenceFigure,
  TabularFigure,
  TriangleFigure,
} from '../../types/figure';
import { ArrowIcon } from '../Icons';
import { MathRenderer, MathText } from '../MathRenderer';
import { Plot } from './Plot';

/** Width over height of a plot as drawn. */
const plotAspect = (f: PlotFigure) => (f.equal ? (f.x[1] - f.x[0]) / (f.y[1] - f.y[0]) : f.aspect ?? 1.5);
/** A plot this wide needs the full column to stay legible. */
const isWide = (f: Figure) => f.kind === 'plot' && plotAspect(f) >= 1.9;

/** Triangles and squarish plots are small enough to sit beside text; the rest want the full width. */
export const isCompact = (f: Figure) => f.kind === 'triangle' || (f.kind === 'plot' && !isWide(f));

/** A right triangle drawn as a plot: angle at (0,0), right angle at (4,0), apex at (4,2.6). */
function trianglePlot(t: TriangleFigure): PlotFigure {
  const A: [number, number] = [0, 0];
  const B: [number, number] = [4, 0];
  const C: [number, number] = [4, 2.6];
  const side = (which: TriangleFigure['highlight'], from: [number, number], to: [number, number]): PlotItem => ({
    type: 'segment', from, to, tone: t.highlight === which ? 1 : 'ink', width: t.highlight === which ? 3 : 2,
  });
  return {
    kind: 'plot',
    title: t.title,
    axes: false,
    equal: true,
    x: [-1.4, 6.6],
    y: [-0.75, 3],
    items: [
      { type: 'polygon', points: [A, B, C], tone: 1 },
      side('adjacent', A, B),
      side('opposite', B, C),
      side('hypotenuse', A, C),
      { type: 'angle', at: B, a: A, b: C, right: true },
      { type: 'angle', at: A, a: B, b: C, label: t.angle ?? '\\theta', radius: 30 },
      { type: 'label', at: [2, 0], text: t.adjacent, anchor: 's' },
      { type: 'label', at: [4, 1.3], text: t.opposite, anchor: 'e' },
      { type: 'label', at: [2, 1.3], text: t.hypotenuse, anchor: 'nw' },
    ],
  };
}

function Sequence({ fig }: { fig: SequenceFigure }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {fig.steps.map((step, i) => (
        <li key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink3" aria-hidden="true"><ArrowIcon /></span>}
          <div className="rounded border border-line bg-bg px-3 py-2 text-center">
            {step.label && (
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink3">
                <span className="mr-1 tabular-nums">{i + 1}</span><MathText text={step.label} />
              </p>
            )}
            {step.latex && <MathRenderer latex={step.latex} className="mt-0.5 block text-sm" />}
            {step.text && <p className="mt-0.5 text-xs leading-snug text-ink2"><MathText text={step.text} /></p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Flow({ fig }: { fig: FlowFigure }) {
  const [when, then] = fig.head ?? ['If you see', 'Do this'];
  return (
    <div className="grid grid-cols-1 gap-2 text-sm">
      <div className="hidden grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1.25fr)] gap-3 text-xs font-semibold uppercase tracking-wider text-ink3 sm:grid">
        <span><MathText text={when} /></span><span /><span><MathText text={then} /></span>
      </div>
      {fig.rows.map((row, i) => (
        <div key={i} className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1.25fr)] sm:gap-3">
          <div className="rounded bg-inset px-3 py-2 leading-relaxed"><MathText text={row.when} /></div>
          <span className="hidden justify-center text-ink3 sm:flex" aria-hidden="true"><ArrowIcon /></span>
          <div className="border-l-2 py-1 pl-3 leading-relaxed text-ink2"
            style={{ borderColor: `var(--viz${(i % 3) + 1})` }}>
            <MathText text={row.then} />
          </div>
        </div>
      ))}
    </div>
  );
}

const ROW = 2.75; // rem

/** D and I columns with the diagonal arrows of the tabular method; each arrow carries the sign beside its D entry. */
function Tabular({ fig }: { fig: TabularFigure }) {
  const n = Math.max(fig.d.length, fig.i.length);
  const arrows = Math.min(fig.d.length, fig.i.length) - 1;
  const h = n * ROW;
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="mx-auto grid grid-cols-[auto_5.5rem_auto] text-sm">
        <span className="pb-1 text-right text-xs font-semibold uppercase tracking-wider text-ink3">D: differentiate</span>
        <span />
        <span className="pb-1 text-xs font-semibold uppercase tracking-wider text-ink3">I: integrate</span>
        <div>
          {fig.d.map((d, k) => (
            <div key={k} className="flex items-center justify-end gap-3 pr-1" style={{ height: `${ROW}rem` }}>
              {k < arrows && (
                <span className="w-3 text-center font-semibold text-ink" aria-label={k % 2 ? 'minus' : 'plus'}>
                  {k % 2 ? '\u2212' : '+'}
                </span>
              )}
              <MathRenderer latex={d} />
            </div>
          ))}
        </div>
        <div className="relative" style={{ height: `${h}rem` }} aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 88 ${h * 16}`} preserveAspectRatio="none">
            {Array.from({ length: arrows }, (_, k) => {
              const y1 = (k + 0.5) * ROW * 16;
              const y2 = (k + 1.5) * ROW * 16;
              return (
                <g key={k} stroke={`var(--viz${k % 2 ? 2 : 1})`} strokeWidth={2} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
                  <path d={`M6,${y1 + 4}L80,${y2 - 4}`} vectorEffect="non-scaling-stroke" />
                  <path d={`M71,${y2 - 4}L80,${y2 - 4}L74.4,${y2 - 11.1}`} vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </svg>
        </div>
        <div>
          {fig.i.map((v, k) => (
            <div key={k} className="flex items-center pl-1" style={{ height: `${ROW}rem` }}>
              <MathRenderer latex={v} />
            </div>
          ))}
        </div>
      </div>
      {fig.result && <MathRenderer latex={fig.result} display className="rounded bg-inset px-3" />}
    </div>
  );
}

function Body({ fig }: { fig: Figure }) {
  switch (fig.kind) {
    case 'plot':
      return <Plot fig={fig} />;
    case 'triangle':
      return <Plot fig={trianglePlot(fig)} />;
    case 'group':
      return (
        <div className={`grid gap-x-5 gap-y-4 ${fig.figures.length % 2 === 0 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {fig.figures.map((f, i) => (
            <div key={i} className="min-w-0">
              {f.title && <p className="mb-1 text-center text-xs font-medium text-ink2"><MathText text={f.title} /></p>}
              <Body fig={f} />
              {f.caption && <p className="mt-1 text-center text-xs leading-relaxed text-ink3"><MathText text={f.caption} /></p>}
            </div>
          ))}
        </div>
      );
    case 'sequence':
      return <Sequence fig={fig} />;
    case 'flow':
      return <Flow fig={fig} />;
    case 'tabular':
      return <Tabular fig={fig} />;
  }
}

/** A figure with its caption. Compact figures are capped so they never dominate a wide column. */
export function FigureView({ figure, className = '' }: { figure: Figure; className?: string }) {
  const titled = (figure.kind === 'plot' || figure.kind === 'triangle') && figure.title;
  return (
    <figure className={`mx-auto w-full ${isCompact(figure) ? 'max-w-sm' : isWide(figure) || figure.kind === 'group' ? 'max-w-2xl' : ''} ${className}`}>
      {titled && <p className="mb-1 text-center text-xs font-medium text-ink2"><MathText text={figure.title!} /></p>}
      <Body fig={figure} />
      {figure.caption && (
        <figcaption className="mt-2 text-xs leading-relaxed text-ink3"><MathText text={figure.caption} /></figcaption>
      )}
    </figure>
  );
}
