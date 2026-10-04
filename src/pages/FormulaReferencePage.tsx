import { useMemo, useState } from 'react';
import { getAllFormulas } from '../data/registry';
import { topicHref } from '../lib/router';
import { FormulaCard } from '../components/FormulaCard';

/** Built entirely from the registry: adding a topic adds its formulas here. */
export function FormulaReferencePage() {
  const [query, setQuery] = useState('');
  const all = useMemo(() => getAllFormulas(), []);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .map((g) => ({
        ...g,
        formulas: q
          ? g.formulas.filter((f) => `${f.name} ${f.whenToUse} ${f.formulaLatex}`.toLowerCase().includes(q))
          : g.formulas,
      }))
      .filter((g) => g.formulas.length > 0);
  }, [all, query]);
  const total = all.reduce((n, g) => n + g.formulas.length, 0);
  const shown = groups.reduce((n, g) => n + g.formulas.length, 0);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Formula Reference</h1>
      <p className="mt-4 text-sm leading-7 text-ink2">Every key formula in the course, grouped by unit.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          id="formula-filter" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter, for example: secant, integral, hyperbolic" aria-label="Filter formulas"
          className="min-w-0 flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink3"
        />
        <span className="text-xs tabular-nums text-ink3" aria-live="polite">{shown} of {total}</span>
      </div>

      {!query && (
        <nav aria-label="Units" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {all.map(({ topic }) => (
            <a key={topic.id} href={`#${topic.id}`} className="text-ink3 underline-offset-4 hover:text-ink hover:underline"
              onClick={(e) => { e.preventDefault(); document.getElementById(topic.id)?.scrollIntoView(); }}>
              {topic.unitNumber}
            </a>
          ))}
        </nav>
      )}

      {groups.length === 0 && <p className="mt-10 text-sm text-ink3">No formulas match “{query}”. Try a shorter word.</p>}

      {groups.map(({ topic, formulas }) => (
        <section key={topic.id} id={topic.id} className="mt-10 scroll-mt-20">
          <h2 className="mb-3 flex items-baseline justify-between gap-3 text-sm font-semibold">
            <span><span className="mr-2 tabular-nums text-ink3">{topic.unitNumber}</span>{topic.title}</span>
            <a href={topicHref(topic.slug, 'formulas')} className="shrink-0 text-xs font-normal text-ink3 underline underline-offset-4 hover:text-ink">
              Open unit
            </a>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {formulas.map((f) => <FormulaCard key={f.id} formula={f} />)}
          </div>
        </section>
      ))}
    </>
  );
}
