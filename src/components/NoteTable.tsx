import { useLayoutEffect, useRef, useState } from 'react';
import type { NoteTable as Table } from '../types/curriculum';
import { MathText } from './MathRenderer';

/**
 * A real table when it fits the column (math in a cell never wraps, so a
 * cramped cell counts as not fitting). When its natural width is wider than
 * the column (usually on phones), each row becomes a small card with the
 * column names as labels, so nothing scrolls sideways. The table stays in the
 * layout invisibly so the fit can be re-measured when the column resizes.
 */
export function NoteTable({ table, className = '' }: { table: Table; className?: string }) {
  const { head, rows } = table;
  const box = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [cards, setCards] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      if (box.current && tableRef.current) setCards(tableRef.current.offsetWidth > box.current.clientWidth + 1);
    };
    measure();
    if (!('ResizeObserver' in window) || !box.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className={`relative ${cards ? 'overflow-hidden' : ''} ${className}`}>
      <table ref={tableRef} aria-hidden={cards || undefined}
        className={`border-collapse text-sm [&_.katex]:whitespace-nowrap ${cards ? 'pointer-events-none invisible absolute left-0 top-0 w-max' : 'w-full'}`}>
        {head && (
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-ink3">
              {head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap py-2 pr-4 font-semibold"><MathText text={h} /></th>)}
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

      {cards && (
        <ul className="grid grid-cols-1 gap-2 text-sm">
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
        </ul>
      )}
    </div>
  );
}
