import type { Step } from '../types/curriculum';
import { FigureView } from './figures/Figure';
import { MathRenderer, MathText } from './MathRenderer';

/** One solution step: the mathematics, then a separate "Why this step?" block. */
export function StepView({ step }: { step: Step }) {
  return (
    <li className="grid grid-cols-1 gap-3">
      <div className="flex items-baseline gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-strong text-xs font-semibold tabular-nums text-ink2">
          {step.stepNumber}
        </span>
        <h4 className="text-sm font-semibold"><MathText text={step.title} /></h4>
      </div>

      <MathRenderer latex={step.mathLatex} display />
      {step.figure && <FigureView figure={step.figure} className="my-1" />}

      <div className="rounded bg-inset px-4 py-3 text-sm leading-relaxed">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink3">Why this step?</p>
        <p className="mt-1.5 text-ink"><MathText text={step.explanation} /></p>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
          <dt className="font-medium text-ink3">Rule</dt>
          <dd className="min-w-0 text-ink2"><MathText text={step.ruleApplied} /></dd>
          {step.pitfall && (
            <>
              <dt className="font-medium text-ink3">Watch out</dt>
              <dd className="min-w-0 text-ink2"><MathText text={step.pitfall} /></dd>
            </>
          )}
        </dl>
      </div>
    </li>
  );
}
