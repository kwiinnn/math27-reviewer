import type { Difficulty } from '../types/curriculum';

const styles: Record<Difficulty, string> = {
  Basic: 'border-basic text-basic',
  'Exam-Level': 'border-exam text-exam',
  Challenge: 'border-primary bg-primary text-onprimary',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${styles[difficulty]}`}>{difficulty}</span>
  );
}
