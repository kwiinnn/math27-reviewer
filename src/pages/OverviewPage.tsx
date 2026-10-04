import { getChapterGroups, sortedTopics } from '../data/registry';
import { formulaReferenceHref, topicHref } from '../lib/router';
import { MathText } from '../components/MathRenderer';
import { label } from '../components/ui';

export function OverviewPage() {
  const groups = getChapterGroups();
  const problems = sortedTopics.reduce((n, t) => n + t.problems.length, 0);
  const formulas = sortedTopics.reduce((n, t) => n + t.keyFormulas.length, 0);

  return (
    <>
      <p className="text-sm text-ink3">MATH 27</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Analytic and Geometric Calculus II</h1>
      <p className="mt-4 max-w-[70ch] text-sm leading-7 text-ink2">
        A reviewer built from the course lecture decks. Each unit has exam notes with the common traps, a formula
        sheet, worked examples, and ten practice problems that reveal one step at a time with the reasoning behind it.
      </p>
      <p className="mt-3 text-sm tabular-nums text-ink3">
        {sortedTopics.length} units · {problems} practice problems ·{' '}
        <a href={formulaReferenceHref} className="underline underline-offset-4 hover:text-ink">{formulas} formulas</a>
      </p>

      {groups.map(({ chapter, topics }) => (
        <section key={chapter.number} className="mt-10">
          <h2 className={`${label} mb-3`}>Unit {chapter.number} · {chapter.title}</h2>
          <ol className="divide-y divide-line rounded-md border border-line bg-surface">
            {topics.map((t) => (
              <li key={t.id}>
                <a href={topicHref(t.slug)} className="grid grid-cols-1 gap-x-4 gap-y-1 p-4 transition-colors hover:bg-inset sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:p-5">
                  <span className="text-sm tabular-nums text-ink3">{t.unitNumber}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink2"><MathText text={t.summary} /></span>
                    <span className="mt-2 block text-xs tabular-nums text-ink3">
                      {t.examNotes.length} notes · {t.keyFormulas.length} formulas · {t.workedExamples.length} examples · {t.problems.length} problems
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
