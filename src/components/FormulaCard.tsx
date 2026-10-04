import type { Formula } from '../types/curriculum';
import { MathRenderer, MathText } from './MathRenderer';
import { card } from './ui';

export function FormulaCard({ formula }: { formula: Formula }) {
  return (
    <article className={card}>
      <div className="px-5 pt-5 sm:px-6">
        <h3 className="text-sm font-semibold">{formula.name}</h3>
        <MathRenderer latex={formula.formulaLatex} display className="my-2 text-lg" />
      </div>
      <dl className="grid grid-cols-1 gap-x-5 gap-y-2 border-t border-line px-5 py-4 text-sm leading-relaxed sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:px-6">
        <dt className="font-medium text-ink3">When to use</dt>
        <dd className="min-w-0 text-ink2"><MathText text={formula.whenToUse} /></dd>
        <dt className="font-medium text-ink3">Restrictions</dt>
        <dd className="min-w-0 text-ink2"><MathText text={formula.restrictions} /></dd>
        <dt className="font-medium text-ink3">Example</dt>
        <dd className="min-w-0"><MathRenderer latex={formula.example} display className="!py-0 !text-left" /></dd>
      </dl>
    </article>
  );
}
