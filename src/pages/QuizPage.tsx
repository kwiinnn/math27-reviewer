import { getChapterGroups, sortedTopics } from '../data/registry';
import { drawQuiz, QUIZ_LENGTH } from '../lib/quiz';
import { homeHref, quizHref } from '../lib/router';
import { Quiz } from '../components/Quiz';
import { label } from '../components/ui';

/** A unit quiz (`unit` is a chapter number) or, without one, the course quiz. */
export function QuizPage({ unit }: { unit?: string }) {
  const groups = getChapterGroups();
  const group = unit ? groups.find((g) => g.chapter.number === unit) : undefined;
  if (unit && !group) {
    return (
      <p className="text-sm">
        That unit does not exist. <a className="underline underline-offset-4" href={homeHref}>Go to the overview</a>.
      </p>
    );
  }
  const topics = group ? group.topics : sortedTopics;
  const bank = topics.reduce((n, t) => n + t.quiz.length, 0);
  const first = topics[0].unitNumber;
  const last = topics[topics.length - 1].unitNumber;
  const link = (on: boolean) =>
    `rounded border px-3 py-2 text-sm transition-colors ${on ? 'border-primary font-medium text-ink' : 'border-line text-ink2 hover:border-strong hover:text-ink'}`;

  return (
    <>
      <p className="text-sm text-ink3">{group ? `Unit ${group.chapter.number} · ${group.chapter.title}` : 'MATH 27'}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{group ? `Unit ${group.chapter.number} Quiz` : 'Course Quiz'}</h1>
      <p className="mt-4 max-w-[70ch] text-sm leading-7 text-ink2">
        {QUIZ_LENGTH} conceptual questions from lessons {first} to {last}, spread so that{' '}
        {topics.length >= QUIZ_LENGTH ? 'each comes from a different lesson' : 'every lesson is covered'}. Each attempt draws a new
        set from {bank} questions, and every answer is explained.
      </p>

      <div className="mt-8">
        <Quiz draw={() => drawQuiz(topics)} showSource againLabel="New Questions" />
      </div>

      <nav aria-label="Other quizzes" className="mt-14">
        <h2 className={`${label} mb-3`}>Other quizzes</h2>
        <div className="flex flex-wrap gap-2">
          {groups.map(({ chapter }) => (
            <a key={chapter.number} href={quizHref(chapter.number)} className={link(unit === chapter.number)}
              aria-current={unit === chapter.number ? 'page' : undefined}>
              Unit {chapter.number}
            </a>
          ))}
          <a href={quizHref()} className={link(!unit)} aria-current={!unit ? 'page' : undefined}>Whole course</a>
        </div>
      </nav>
    </>
  );
}
