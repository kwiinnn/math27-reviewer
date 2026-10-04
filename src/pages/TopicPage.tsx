import { useState } from 'react';
import type { Difficulty, Topic } from '../types/curriculum';
import { sortedTopics } from '../data/registry';
import { topicHref, type TopicView } from '../lib/router';
import { ExamNoteCard } from '../components/ExamNoteCard';
import { FormulaCard } from '../components/FormulaCard';
import { MathText } from '../components/MathRenderer';
import { ProblemCard } from '../components/ProblemCard';
import { WorkedExampleCard } from '../components/WorkedExampleCard';
import { label, segGroup, segItem } from '../components/ui';

const DIFFICULTIES: Difficulty[] = ['Basic', 'Exam-Level', 'Challenge'];

function SectionTitle({ children }: { children: string }) {
  return <h2 className={`${label} mb-3 mt-10`}>{children}</h2>;
}

function UnitPager({ topic, view }: { topic: Topic; view: TopicView }) {
  const i = sortedTopics.findIndex((t) => t.id === topic.id);
  const prev = sortedTopics[i - 1];
  const next = sortedTopics[i + 1];
  const link = 'group block rounded-md border border-line p-4 transition-colors hover:border-strong';
  return (
    <nav aria-label="Units" className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {prev ? (
        <a href={topicHref(prev.slug, view)} className={link}>
          <span className="block text-xs text-ink3">Previous unit</span>
          <span className="mt-1 block text-sm font-medium">{prev.unitNumber} {prev.title}</span>
        </a>
      ) : <span className="hidden sm:block" />}
      {next && (
        <a href={topicHref(next.slug, view)} className={`${link} sm:text-right`}>
          <span className="block text-xs text-ink3">Next unit</span>
          <span className="mt-1 block text-sm font-medium">{next.unitNumber} {next.title}</span>
        </a>
      )}
    </nav>
  );
}

export function TopicPage({ topic, view }: { topic: Topic; view: TopicView }) {
  const [filter, setFilter] = useState<Difficulty | 'All'>('All');
  const problems = filter === 'All' ? topic.problems : topic.problems.filter((p) => p.difficulty === filter);

  return (
    <>
      <p className="text-sm tabular-nums text-ink3">Unit {topic.unitNumber}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{topic.title}</h1>
      <p className="mt-4 max-w-[70ch] text-sm leading-7 text-ink2"><MathText text={topic.summary} /></p>

      {view === 'notes' && (
        <>
          <SectionTitle>Exam notes</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            {topic.examNotes.map((note, i) => <ExamNoteCard key={note.title} note={note} index={i} />)}
          </div>
          <SectionTitle>Worked examples</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            {topic.workedExamples.map((ex, i) => <WorkedExampleCard key={ex.id} example={ex} index={i} />)}
          </div>
        </>
      )}

      {view === 'formulas' && (
        <>
          <SectionTitle>Key formulas</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            {topic.keyFormulas.map((f) => <FormulaCard key={f.id} formula={f} />)}
          </div>
        </>
      )}

      {view === 'problems' && (
        <>
          <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-3">
            <h2 className={label}>Practice problems</h2>
            <div className={segGroup} role="group" aria-label="Filter by difficulty">
              {(['All', ...DIFFICULTIES] as const).map((d) => {
                const n = d === 'All' ? topic.problems.length : topic.problems.filter((p) => p.difficulty === d).length;
                if (n === 0) return null;
                return (
                  <button key={d} type="button" aria-pressed={filter === d} className={segItem(filter === d)}
                    onClick={() => setFilter(d)}>
                    {d} <span className="tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {problems.map((p) => <ProblemCard key={p.id} problem={p} />)}
          </div>
        </>
      )}

      <UnitPager topic={topic} view={view} />
    </>
  );
}
