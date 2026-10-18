import type { QuizQuestion, Topic } from '../types/curriculum';

export const QUIZ_LENGTH = 10;

/** One question as it is shown: its choices in a fresh random order. */
export interface QuizItem {
  question: QuizQuestion;
  topic: Topic;
  choices: string[];
  /** Index of the answer in `choices`. */
  correct: number;
}

function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draws a quiz from the question banks of the given topics. The topics take
 * turns in a random order, so a unit or course quiz covers as many lessons as
 * it can before any lesson contributes a second question.
 */
export function drawQuiz(from: Topic[], length = QUIZ_LENGTH): QuizItem[] {
  const pools = shuffle(from).map((topic) => ({ topic, left: shuffle(topic.quiz) }));
  const picked: { question: QuizQuestion; topic: Topic }[] = [];
  while (picked.length < length && pools.some((p) => p.left.length > 0)) {
    for (const p of pools) {
      const question = p.left.pop();
      if (question && picked.length < length) picked.push({ question, topic: p.topic });
    }
  }
  return shuffle(picked).map(({ question, topic }) => {
    const choices = shuffle([question.answer, ...question.distractors]);
    return { question, topic, choices, correct: choices.indexOf(question.answer) };
  });
}
