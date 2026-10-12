import type { ReactNode } from 'react';
import { ChevronIcon } from './Icons';

/** A collapsible bordered section, closed until its title is clicked. */
export function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <details className={`group rounded border border-line ${className}`}>
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 px-3 py-2 text-sm font-medium text-ink2 hover:text-ink">
        <span className="transition-transform group-open:rotate-90"><ChevronIcon /></span>
        {title}
      </summary>
      <div className="border-t border-line p-3">{children}</div>
    </details>
  );
}
