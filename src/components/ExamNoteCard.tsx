import type { ExamNote } from '../types/curriculum';
import { MathText } from './MathRenderer';
import { card, label } from './ui';

export function ExamNoteCard({ note, index }: { note: ExamNote; index: number }) {
  return (
    <article className={`${card} p-5 sm:p-6`}>
      <h3 className="flex items-baseline gap-3 text-base font-semibold">
        <span className="text-sm tabular-nums text-ink3">{index + 1}</span>
        {note.title}
      </h3>
      <p className="mt-3 text-sm leading-7"><MathText text={note.concept} /></p>

      <h4 className={`${label} mt-5`}>Conditions</h4>
      <p className="mt-1.5 text-sm leading-7 text-ink2"><MathText text={note.conditions} /></p>

      <h4 className={`${label} mt-5`}>Common traps</h4>
      <ul className="mt-1.5 grid grid-cols-1 gap-1.5 text-sm leading-7 text-ink2">
        {note.commonTraps.map((trap, i) => (
          <li key={i} className="grid grid-cols-[1rem_minmax(0,1fr)]">
            <span aria-hidden="true" className="text-ink3">×</span>
            <span className="min-w-0"><MathText text={trap} /></span>
          </li>
        ))}
      </ul>

      <p className="mt-5 rounded bg-inset px-4 py-3 text-sm leading-7">
        <span className="font-semibold text-basic">Tip. </span>
        <MathText text={note.tip} />
      </p>
    </article>
  );
}
