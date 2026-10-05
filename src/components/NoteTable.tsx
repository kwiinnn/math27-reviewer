import type { NoteTable as Table } from '../types/curriculum';
import { MathText } from './MathRenderer';

/** Rough rendered width of a cell in characters: each command counts as about two. */
function width(cell: string) {
  return cell
    .replace(/\$|\\(left|right|displaystyle|dfrac|frac|[,;!])/g, '')
    .replace(/\\[a-zA-Z]+/g, 'ab')
    .replace(/[{}^_]/g, '').length;
}
/** Rows narrower than this fit a phone screen as an ordinary table. */
const PHONE_ROW = 40;

/**
 * A real table. On phones a table with wide rows turns each row into a small
 * card with the column names as labels, so nothing scrolls sideways.
 */
export function NoteTable({ table, className = '' }: { table: Table; className?: string }) {
  const { head, rows } = table;
  const fitsPhone = rows.every((row) => row.reduce((n, cell) => n + width(cell), 0) <= PHONE_ROW);
  return (
    <div className={className}>
      <table className={`${fitsPhone ? 'table' : 'hidden sm:table'} w-full border-collapse text-sm`}>
        {head && (
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-ink3">
              {head.map((h, i) => <th key={i} scope="col" className="py-2 pr-4 font-semibold"><MathText text={h} /></th>)}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-line last:border-0">
              {row.map((cell, c) => (
                <td key={c} className={`py-2.5 pr-4 align-middle leading-relaxed ${c === 0 ? 'font-medium text-ink' : 'text-ink2'}`}>
                  <MathText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {!fitsPhone && <ul className="grid grid-cols-1 gap-2 text-sm sm:hidden">
        {rows.map((row, r) => (
          <li key={r} className="rounded bg-inset px-3 py-2.5 leading-relaxed">
            <p className="font-medium text-ink"><MathText text={row[0]} /></p>
            {row.slice(1).map((cell, c) => (
              <p key={c} className="mt-1 text-ink2">
                {head?.[c + 1] && <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-ink3"><MathText text={head[c + 1]} /></span>}
                <MathText text={cell} />
              </p>
            ))}
          </li>
        ))}
      </ul>}
    </div>
  );
}
