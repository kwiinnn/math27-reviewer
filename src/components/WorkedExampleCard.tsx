import type { WorkedExample } from '../types/curriculum';
import { FigureView } from './figures/Figure';
import { ChevronIcon } from './Icons';
import { MathRenderer, MathText } from './MathRenderer';
import { StepView } from './StepView';
import { card } from './ui';

export function WorkedExampleCard({ example, index }: { example: WorkedExample; index: number }) {
  return (
    <details className={`${card} group`}>
      <summary className="cursor-pointer list-none p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold">
            <span className="mr-2 tabular-nums text-ink3">Example {index + 1}</span>
            {example.title}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-xs text-ink3">
            <span className="group-open:hidden">Show solution</span>
            <span className="hidden group-open:inline">Hide solution</span>
            <span className="transition-transform group-open:rotate-90"><ChevronIcon /></span>
          </span>
        </div>
        {example.prompt && <p className="mt-3 text-sm leading-relaxed text-ink2"><MathText text={example.prompt} /></p>}
        <MathRenderer latex={example.problemLatex} display className="mt-2 sm:text-lg" />
        <p className="text-sm leading-relaxed text-ink2">
          <span className="font-semibold text-ink">Key idea. </span>
          <MathText text={example.keyIdea} />
        </p>
      </summary>
      {example.figure && (
        <div className="border-t border-line p-5 sm:p-6">
          <FigureView figure={example.figure} />
        </div>
      )}
      <ol className="grid grid-cols-1 gap-7 border-t border-line p-5 sm:p-6">
        {example.solutionSteps.map((step) => (
          <StepView key={step.stepNumber} step={step} />
        ))}
      </ol>
    </details>
  );
}
