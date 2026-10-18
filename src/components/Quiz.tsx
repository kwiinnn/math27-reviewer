import { useEffect, useRef, useState } from 'react';
import type { QuizItem } from '../lib/quiz';
import { topicHref } from '../lib/router';
import type { Topic } from '../types/curriculum';
import { CheckIcon, CloseIcon, MinusIcon } from './Icons';
import { MathRenderer, MathText } from './MathRenderer';
import { btnPrimary, btnQuiet, card, label } from './ui';

const LETTERS = 'ABCDEF';

interface Props {
  /** Called for every attempt: returns the questions, choices already shuffled. */
  draw: () => QuizItem[];
  /** Name the lesson each question comes from (unit and course quizzes). */
  showSource?: boolean;
  /** The button that starts another attempt. */
  againLabel?: string;
}

/** `open` has not been answered yet; `skipped` was passed over and is still unanswered. */
type Status = 'correct' | 'wrong' | 'skipped' | 'open';

const STATUS_LABEL: Record<Status, string> = { correct: 'correct', wrong: 'incorrect', skipped: 'skipped', open: 'not answered' };
const tileTone: Record<Status, string> = {
  correct: 'border-basic text-basic',
  wrong: 'border-strong bg-inset text-ink2',
  skipped: 'border-dashed border-strong text-ink3',
  open: 'border-line text-ink3',
};
const StatusIcon = ({ status }: { status: Status }) =>
  status === 'correct' ? <CheckIcon /> : status === 'wrong' ? <CloseIcon /> : <MinusIcon />;

function verdict(score: number, total: number) {
  if (score === total) return 'Perfect score.';
  if (score >= 0.8 * total) return 'Strong. Read the explanations for the ones you missed.';
  if (score >= 0.5 * total) return 'Getting there. Read the explanations below, then the notes for the lessons you missed.';
  return 'Worth another pass through the notes before you try again.';
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * One question at a time; each answer is checked and explained before moving
 * on. Questions can be skipped and returned to; submitting shows a results board.
 */
export function Quiz({ draw, showSource = false, againLabel = 'Retake Quiz' }: Props) {
  const [items, setItems] = useState(draw);
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<(number | undefined)[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [skipped, setSkipped] = useState<boolean[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const n = items.length;
  const item = items[at];
  const pick = picks[at];
  const isChecked = !!checked[at];
  const status = (i: number): Status =>
    checked[i] ? (picks[i] === items[i].correct ? 'correct' : 'wrong') : skipped[i] || submitted ? 'skipped' : 'open';
  const statuses = items.map((_, i) => status(i));
  const count = (s: Status) => statuses.filter((x) => x === s).length;
  const score = count('correct');
  const unanswered = n - checked.filter(Boolean).length;

  /** The next unanswered question after `from`, wrapping round to skipped ones; -1 if there is none. */
  const nextOpen = (from: number) => {
    for (let k = 1; k < n; k++) {
      const i = (from + k) % n;
      if (!checked[i]) return i;
    }
    return -1;
  };
  const target = nextOpen(at);

  const scrollTop = () => top.current?.scrollIntoView({ block: 'nearest' });
  const goTo = (i: number) => {
    setAt(i);
    setConfirming(false);
    scrollTop();
  };
  const choose = (i: number) => !isChecked && setPicks((p) => Object.assign([...p], { [at]: i }));
  const check = () => {
    if (pick === undefined) return;
    setChecked((c) => Object.assign([...c], { [at]: true }));
    setSkipped((s) => Object.assign([...s], { [at]: false }));
  };
  const skip = () => {
    if (isChecked) return;
    setSkipped((s) => Object.assign([...s], { [at]: true }));
    if (target === -1) setConfirming(true);
    else goTo(target);
  };
  const submit = () => {
    setSubmitted(true);
    setConfirming(false);
    scrollTop();
  };
  const requestSubmit = () => (unanswered === 0 ? submit() : setConfirming(true));
  const advance = () => (target === -1 ? submit() : goTo(target));
  const restart = () => {
    setItems(draw());
    setAt(0);
    setPicks([]);
    setChecked([]);
    setSkipped([]);
    setConfirming(false);
    setSubmitted(false);
    scrollTop();
  };

  // Number keys choose, S skips, Enter checks and then moves on (unless another button or link has focus).
  useEffect(() => {
    if (submitted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = Number(e.key);
      if (Number.isInteger(k) && k >= 1 && k <= item.choices.length) choose(k - 1);
      else if (e.key.toLowerCase() === 's' && !isChecked) skip();
      else if (e.key === 'Enter' && !confirming && !t?.closest('button:not([role="radio"]), a')) {
        e.preventDefault();
        (isChecked ? advance : check)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (submitted) {
    return (
      <div ref={top} className="scroll-mt-28">
        <ResultsBoard items={items} statuses={statuses} showSource={showSource} againLabel={againLabel} onAgain={restart} />
        <h2 className={`${label} mb-3 mt-10`}>Review</h2>
        <ol className="grid grid-cols-1 gap-4">
          {items.map((it, i) => (
            <ReviewItem key={it.question.id} item={it} index={i} status={statuses[i]} pick={picks[i]} />
          ))}
        </ol>
      </div>
    );
  }

  const q = item.question;
  const right = pick === item.correct;
  const backTo = target !== -1 && target < at;
  return (
    <div ref={top} className="scroll-mt-28">
      <article className={card}>
        <div className="p-5 sm:p-6">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold tabular-nums">
              Question {at + 1} of {n}
              {skipped[at] && !isChecked && <span className="ml-2 font-normal text-ink3">· skipped earlier</span>}
            </h3>
            {showSource && <span className="text-xs text-ink3">{item.topic.unitNumber} {item.topic.title}</span>}
          </header>

          <p className="mt-4 text-base leading-7"><MathText text={q.question} /></p>
          {q.questionLatex && <MathRenderer latex={q.questionLatex} display className="mt-1 sm:text-lg" />}

          <div role="radiogroup" aria-label="Choices" className="mt-5 grid grid-cols-1 gap-2">
            {item.choices.map((choice, i) => {
              const selected = pick === i;
              const isAnswer = i === item.correct;
              const state = !isChecked
                ? selected ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-strong'
                : isAnswer ? 'border-basic ring-1 ring-basic' : selected ? 'border-strong' : 'border-line opacity-60';
              return (
                <button key={i} type="button" role="radio" aria-checked={selected} disabled={isChecked}
                  onClick={() => choose(i)}
                  className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-3 rounded border bg-surface px-4 py-3 text-left text-sm leading-relaxed transition-colors disabled:cursor-default ${state}`}>
                  <span className={`flex h-6 w-6 translate-y-px items-center justify-center rounded-full border text-xs font-semibold ${
                    selected && !isChecked ? 'border-primary bg-primary text-onprimary' : 'border-strong text-ink2'}`} aria-hidden="true">
                    {LETTERS[i]}
                  </span>
                  <span className="min-w-0"><MathText text={choice} /></span>
                  {isChecked && (isAnswer || selected) && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${isAnswer ? 'text-basic' : 'text-ink3'}`}>
                      {isAnswer ? <CheckIcon /> : <CloseIcon />}
                      <span className="hidden sm:inline">{isAnswer ? 'Answer' : 'Your answer'}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isChecked && (
            <div className="mt-5 rounded bg-inset px-4 py-3 text-sm leading-relaxed" aria-live="polite">
              <p className={`font-semibold ${right ? 'text-basic' : 'text-ink'}`}>{right ? 'Correct.' : 'Not quite.'}</p>
              <p className="mt-1.5 text-ink2"><MathText text={q.explanation} /></p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
          {isChecked ? (
            <button type="button" className={btnPrimary} onClick={advance}>
              {target === -1 ? 'Submit Quiz' : backTo ? `Back to Question ${target + 1}` : 'Next Question'}
            </button>
          ) : (
            <>
              <button type="button" className={btnPrimary} disabled={pick === undefined} onClick={check}>Check Answer</button>
              <button type="button" className={btnQuiet} onClick={skip}>Skip</button>
            </>
          )}
          <span className="ml-auto text-xs tabular-nums text-ink3">
            {n - unanswered} answered · {count('skipped')} skipped · {score} correct
          </span>
        </footer>
      </article>

      {confirming && (
        <div role="alertdialog" aria-labelledby="quiz-confirm" className={`${card} mt-3 flex flex-wrap items-center gap-3 p-4 sm:px-6`}>
          <p id="quiz-confirm" className="min-w-0 flex-1 text-sm leading-relaxed">
            {plural(unanswered, 'question')} still {unanswered === 1 ? 'has' : 'have'} no answer and will count as skipped.
          </p>
          <button type="button" className={btnPrimary} onClick={submit}>Submit Anyway</button>
          <button type="button" className={btnQuiet} onClick={() => setConfirming(false)}>Keep Going</button>
        </div>
      )}

      <nav aria-label="Questions" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <ol className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <li key={it.question.id}>
              <button type="button" onClick={() => goTo(i)} aria-current={i === at ? 'step' : undefined}
                aria-label={`Question ${i + 1}, ${STATUS_LABEL[statuses[i]]}`}
                className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-medium tabular-nums transition-colors hover:border-ink ${tileTone[statuses[i]]} ${
                  i === at ? 'ring-2 ring-primary ring-offset-1 ring-offset-bg' : ''}`}>
                {i + 1}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className={`${btnQuiet} ml-auto`} onClick={requestSubmit}>Submit Quiz</button>
      </nav>
      <p className="mt-3 hidden text-xs text-ink3 sm:block">
        Keys: 1 to {item.choices.length} to choose, Enter to check and continue, S to skip.
      </p>
    </div>
  );
}

interface BoardProps {
  items: QuizItem[];
  statuses: Status[];
  showSource: boolean;
  againLabel: string;
  onAgain: () => void;
}

/** The summary shown once the quiz is submitted. */
function ResultsBoard({ items, statuses, showSource, againLabel, onAgain }: BoardProps) {
  const n = items.length;
  const tally = (s: Status) => statuses.filter((x) => x === s).length;
  const score = tally('correct');

  // Per lesson, in unit order, for quizzes that mix lessons.
  const lessons = new Map<string, { topic: Topic; total: number; correct: number }>();
  items.forEach((it, i) => {
    const row = lessons.get(it.topic.id) ?? { topic: it.topic, total: 0, correct: 0 };
    row.total++;
    if (statuses[i] === 'correct') row.correct++;
    lessons.set(it.topic.id, row);
  });
  const byLesson = [...lessons.values()].sort((a, b) =>
    a.topic.unitNumber.localeCompare(b.topic.unitNumber, undefined, { numeric: true }));

  const stats: { status: Status; label: string }[] = [
    { status: 'correct', label: 'Correct' },
    { status: 'wrong', label: 'Incorrect' },
    { status: 'skipped', label: 'Skipped' },
  ];

  return (
    <section className={card} aria-labelledby="quiz-results">
      <div className="p-5 sm:p-6">
        <h3 id="quiz-results" className={label}>Results</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-4xl font-semibold tabular-nums">{score} / {n}</p>
          <p className="text-sm tabular-nums text-ink3">{Math.round((100 * score) / n)}%</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink2" aria-live="polite">{verdict(score, n)}</p>

        <dl className="mt-5 grid grid-cols-3 gap-2">
          {stats.map(({ status, label: name }) => (
            <div key={status} className="rounded border border-line px-3 py-2.5">
              <dt className={`flex items-center gap-1.5 text-xs ${status === 'correct' ? 'text-basic' : 'text-ink3'}`}>
                <StatusIcon status={status} /> {name}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{tally(status)}</dd>
            </div>
          ))}
        </dl>

        <h4 className={`${label} mt-6`}>Question by question</h4>
        <ol className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {items.map((it, i) => (
            <li key={it.question.id}>
              <a href={`#review-${it.question.id}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(`review-${it.question.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
                aria-label={`Question ${i + 1}, ${STATUS_LABEL[statuses[i]]}`}
                className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded border text-xs font-medium tabular-nums transition-colors hover:border-ink ${tileTone[statuses[i]]}`}>
                <span>{i + 1}</span>
                <StatusIcon status={statuses[i]} />
              </a>
            </li>
          ))}
        </ol>

        {showSource && byLesson.length > 1 && (
          <>
            <h4 className={`${label} mt-6`}>By lesson</h4>
            <ul className="mt-2 divide-y divide-line rounded border border-line">
              {byLesson.map(({ topic, total, correct }) => (
                <li key={topic.id} className="flex items-baseline gap-3 px-3 py-2 text-sm">
                  <span className="w-10 shrink-0 tabular-nums text-ink3">{topic.unitNumber}</span>
                  <a href={topicHref(topic.slug)} className="min-w-0 flex-1 underline-offset-4 hover:underline">{topic.title}</a>
                  <span className={`shrink-0 tabular-nums ${correct === total ? 'text-basic' : 'text-ink2'}`}>{correct} / {total}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <footer className="border-t border-line px-5 py-4 sm:px-6">
        <button type="button" className={btnPrimary} onClick={onAgain}>{againLabel}</button>
      </footer>
    </section>
  );
}

function ReviewItem({ item, index, status, pick }: { item: QuizItem; index: number; status: Status; pick?: number }) {
  const q = item.question;
  return (
    <li id={`review-${q.id}`} className={`${card} scroll-mt-28 p-5 sm:p-6`}>
      <div className="flex items-baseline gap-3">
        <span className={`flex h-6 w-6 shrink-0 translate-y-1 items-center justify-center rounded-full border ${tileTone[status]}`}
          aria-label={STATUS_LABEL[status]}>
          <StatusIcon status={status} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs tabular-nums text-ink3">Question {index + 1}</p>
          <p className="mt-1 text-sm font-medium leading-7"><MathText text={q.question} /></p>
          {q.questionLatex && <MathRenderer latex={q.questionLatex} display />}
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm leading-relaxed sm:grid-cols-[6.5rem_minmax(0,1fr)]">
            {status !== 'correct' && (
              <>
                <dt className="text-ink3">Your answer</dt>
                <dd className="min-w-0 text-ink2">
                  {status === 'skipped' ? <span className="italic">Skipped</span> : <MathText text={item.choices[pick ?? 0]} />}
                </dd>
              </>
            )}
            <dt className="text-ink3">Answer</dt>
            <dd className="min-w-0"><MathText text={q.answer} /></dd>
          </dl>
          <p className="mt-3 rounded bg-inset px-4 py-3 text-sm leading-relaxed text-ink2"><MathText text={q.explanation} /></p>
          {status !== 'correct' && (
            <a href={topicHref(item.topic.slug)} className="mt-3 inline-block text-xs text-ink3 underline underline-offset-4 hover:text-ink">
              Review {item.topic.unitNumber} {item.topic.title}
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
