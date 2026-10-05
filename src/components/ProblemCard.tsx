import { useState, type ReactNode } from 'react';
import type { Problem } from '../types/curriculum';
import { DifficultyBadge } from './DifficultyBadge';
import { FigureView } from './figures/Figure';
import { ChevronIcon } from './Icons';
import { MathRenderer, MathText } from './MathRenderer';
import { Scratchpad } from './Scratchpad';
import { StepView } from './StepView';
import { btnPrimary, btnQuiet, card } from './ui';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded border border-line">
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-3 py-2 text-sm font-medium text-ink2 hover:text-ink">
        <span className="transition-transform group-open:rotate-90"><ChevronIcon /></span>
        {title}
      </summary>
      <div className="border-t border-line p-3">{children}</div>
    </details>
  );
}

/** Progressive disclosure: statement first, then one step at a time. */
export function ProblemCard({ problem }: { problem: Problem }) {
  const [revealed, setRevealed] = useState(0);
  const total = problem.steps.length;
  const done = revealed >= total;

  return (
    <article id={problem.id} className={`${card} scroll-mt-28`}>
      <div className="p-5 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tabular-nums">Problem {problem.problemNumber}</h3>
          <DifficultyBadge difficulty={problem.difficulty} />
        </header>

        <p className="mt-4 text-sm leading-relaxed text-ink2"><MathText text={problem.prompt} /></p>
        <MathRenderer latex={problem.questionLatex} display className="mt-1 sm:text-lg" />
        {problem.figure && <FigureView figure={problem.figure} className="mt-2" />}

        {/* Separate panels, so the scratchpad can be used without seeing the hint. */}
        <div className="mt-3 grid grid-cols-1 gap-2">
          <Panel title="Hint">
            <p className="text-sm leading-relaxed"><MathText text={problem.hint} /></p>
          </Panel>
          <Panel title="Scratchpad">
            <Scratchpad problem={problem} />
          </Panel>
        </div>
      </div>

      {revealed > 0 && (
        <ol className="grid grid-cols-1 gap-7 border-t border-line p-5 sm:p-6" aria-live="polite">
          {problem.steps.slice(0, revealed).map((step) => (
            <StepView key={step.stepNumber} step={step} />
          ))}
        </ol>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
        <button type="button" className={btnPrimary} disabled={done} onClick={() => setRevealed((n) => n + 1)}>
          {revealed === 0 ? 'Show First Step' : done ? 'Solution Complete' : 'Show Next Step'}
        </button>
        <button type="button" className={btnQuiet} disabled={done} onClick={() => setRevealed(total)}>
          Reveal Full Solution
        </button>
        {revealed > 0 && (
          <button type="button" className={btnQuiet} onClick={() => setRevealed(0)}>Hide</button>
        )}
        <div className="ml-auto flex items-center gap-2" aria-label={`${revealed} of ${total} steps shown`}>
          <span className="flex gap-1" aria-hidden="true">
            {problem.steps.map((s) => (
              <span key={s.stepNumber} className={`h-1 w-4 rounded-full ${s.stepNumber <= revealed ? 'bg-primary' : 'bg-line'}`} />
            ))}
          </span>
          <span className="text-xs tabular-nums text-ink3">{revealed}/{total}</span>
        </div>
      </footer>
    </article>
  );
}
