import { useEffect, useRef, useState } from 'react';
import type { QuizItem } from '../lib/quiz';
import { topicHref } from '../lib/router';
import { CheckIcon, CloseIcon } from './Icons';
import { MathRenderer, MathText } from './MathRenderer';
import { btnPrimary, card, label } from './ui';

const LETTERS = 'ABCDEF';

interface Props {
  /** Called for every attempt: returns the questions, choices already shuffled. */
  draw: () => QuizItem[];
  /** Name the lesson each question comes from (unit and course quizzes). */
  showSource?: boolean;
  /** The button that starts another attempt. */
  againLabel?: string;
}

function verdict(score: number, total: number) {
  if (score === total) return 'Perfect score.';
  if (score >= 0.8 * total) return 'Strong. Read the explanations for the ones you missed.';
  if (score >= 0.5 * total) return 'Getting there. Read the explanations below, then the notes for the lessons you missed.';
  return 'Worth another pass through the notes before you try again.';
}

/** One question at a time; each answer is checked and explained before the next. */
export function Quiz({ draw, showSource = false, againLabel = 'Retake Quiz' }: Props) {
  const [items, setItems] = useState(draw);
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<(number | undefined)[]>([]);
  const [checked, setChecked] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const finished = at >= items.length;
  const item = items[at];
  const pick = picks[at];
  const answered = checked ? at + 1 : at;
  const score = items.slice(0, answered).filter((it, i) => picks[i] === it.correct).length;

  const choose = (i: number) => !checked && setPicks((p) => Object.assign([...p], { [at]: i }));
  const check = () => pick !== undefined && setChecked(true);
  const next = () => {
    setAt((n) => n + 1);
    setChecked(false);
    top.current?.scrollIntoView({ block: 'nearest' });
  };
  const restart = () => {
    setItems(draw());
    setAt(0);
    setPicks([]);
    setChecked(false);
    top.current?.scrollIntoView({ block: 'nearest' });
  };

  // Number keys pick a choice; Enter checks, then moves on (unless another button or link has focus).
  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= item.choices.length) choose(n - 1);
      else if (e.key === 'Enter' && !target?.closest('button:not([role="radio"]), a')) {
        e.preventDefault();
        (checked ? next : check)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    return (
      <div ref={top} className="scroll-mt-28">
        <section className={`${card} p-5 sm:p-6`} aria-live="polite">
          <p className={label}>Result</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{score} / {items.length}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink2">{verdict(score, items.length)}</p>
          <button type="button" className={`${btnPrimary} mt-5`} onClick={restart}>{againLabel}</button>
        </section>

        <h2 className={`${label} mb-3 mt-10`}>Review</h2>
        <ol className="grid grid-cols-1 gap-4">
          {items.map((it, i) => {
            const right = picks[i] === it.correct;
            return (
              <li key={it.question.id} className={`${card} p-5 sm:p-6`}>
                <div className="flex items-baseline gap-3">
                  <span className={`flex h-6 w-6 shrink-0 translate-y-1 items-center justify-center rounded-full border ${right ? 'border-basic text-basic' : 'border-strong text-ink2'}`}
                    aria-label={right ? 'Correct' : 'Incorrect'}>
                    {right ? <CheckIcon /> : <CloseIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-7"><MathText text={it.question.question} /></p>
                    {it.question.questionLatex && <MathRenderer latex={it.question.questionLatex} display />}
                    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm leading-relaxed sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                      {!right && (
                        <>
                          <dt className="text-ink3">Your answer</dt>
                          <dd className="min-w-0 text-ink2"><MathText text={it.choices[picks[i] ?? 0]} /></dd>
                        </>
                      )}
                      <dt className="text-ink3">Answer</dt>
                      <dd className="min-w-0"><MathText text={it.question.answer} /></dd>
                    </dl>
                    <p className="mt-3 rounded bg-inset px-4 py-3 text-sm leading-relaxed text-ink2"><MathText text={it.question.explanation} /></p>
                    {!right && (
                      <a href={topicHref(it.topic.slug)} className="mt-3 inline-block text-xs text-ink3 underline underline-offset-4 hover:text-ink">
                        Review {it.topic.unitNumber} {it.topic.title}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const q = item.question;
  const right = pick === item.correct;
  return (
    <div ref={top} className="scroll-mt-28">
      <article className={card}>
        <div className="p-5 sm:p-6">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold tabular-nums">Question {at + 1} of {items.length}</h3>
            {showSource && <span className="text-xs text-ink3">{item.topic.unitNumber} {item.topic.title}</span>}
          </header>

          <p className="mt-4 text-base leading-7"><MathText text={q.question} /></p>
          {q.questionLatex && <MathRenderer latex={q.questionLatex} display className="mt-1 sm:text-lg" />}

          <div role="radiogroup" aria-label="Choices" className="mt-5 grid grid-cols-1 gap-2">
            {item.choices.map((choice, i) => {
              const selected = pick === i;
              const isAnswer = i === item.correct;
              const state = !checked
                ? selected ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-strong'
                : isAnswer ? 'border-basic ring-1 ring-basic' : selected ? 'border-strong' : 'border-line opacity-60';
              return (
                <button key={i} type="button" role="radio" aria-checked={selected} disabled={checked}
                  onClick={() => choose(i)}
                  className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded border bg-surface px-4 py-3 text-left text-sm leading-relaxed transition-colors disabled:cursor-default ${state}`}>
                  <span className={`flex h-6 w-6 translate-y-px items-center justify-center rounded-full border text-xs font-semibold ${
                    selected && !checked ? 'border-primary bg-primary text-onprimary' : 'border-strong text-ink2'}`} aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                  <span className="min-w-0"><MathText text={choice} /></span>
                  {checked && (isAnswer || selected) && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${isAnswer ? 'text-basic' : 'text-ink3'}`}>
                      {isAnswer ? <CheckIcon /> : <CloseIcon />}
                      <span className="hidden sm:inline">{isAnswer ? 'Answer' : 'Your answer'}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {checked && (
            <div className="mt-5 rounded bg-inset px-4 py-3 text-sm leading-relaxed" aria-live="polite">
              <p className={`font-semibold ${right ? 'text-basic' : 'text-ink'}`}>{right ? 'Correct.' : 'Not quite.'}</p>
              <p className="mt-1.5 text-ink2"><MathText text={q.explanation} /></p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
          {checked ? (
            <button type="button" className={btnPrimary} onClick={next}>
              {at + 1 === items.length ? 'See Results' : 'Next Question'}
            </button>
          ) : (
            <button type="button" className={btnPrimary} disabled={pick === undefined} onClick={check}>Check Answer</button>
          )}
          <div className="ml-auto flex items-center gap-2" aria-label={`Question ${at + 1} of ${items.length}, ${score} correct so far`}>
            <span className="flex gap-1" aria-hidden="true">
              {items.map((it, i) => {
                const done = i < at || (i === at && checked);
                return (
                  <span key={it.question.id} className={`h-1 w-3 rounded-full sm:w-4 ${
                    !done ? (i === at ? 'bg-strong' : 'bg-line') : picks[i] === it.correct ? 'bg-basic' : 'bg-ink3'}`} />
                );
              })}
            </span>
            <span className="text-xs tabular-nums text-ink3">{score} correct</span>
          </div>
        </footer>
      </article>
      <p className="mt-3 hidden text-xs text-ink3 sm:block">Keys: 1 to {item.choices.length} to choose, Enter to check and continue.</p>
    </div>
  );
}
