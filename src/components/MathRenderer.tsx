import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { breakableDisplay, stackRows } from '../lib/math';

interface MathRendererProps {
  latex: string;
  /** Display (block) math when true, inline math otherwise. */
  display?: boolean;
  className?: string;
}

function render(latex: string, display: boolean): string {
  try {
    // Display math is set inline with \displaystyle so long lines can wrap (see lib/math).
    return katex.renderToString(display ? breakableDisplay(latex) : latex, { displayMode: false, throwOnError: true, strict: 'ignore' });
  } catch (err) {
    // Never crash the page on a bad string: show the source and the reason.
    const message = err instanceof Error ? err.message : String(err);
    const safe = latex.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<code title="${message.replace(/"/g, '&quot;')}" style="color:var(--ink);text-decoration:underline wavy">${safe}</code>`;
  }
}

/**
 * KaTeX wrapper. Display math wraps at relations and between clauses; the
 * scrollable box remains as a fallback for a single unbreakable term.
 */
export function MathRenderer({ latex, display = false, className = '' }: MathRendererProps) {
  const html = useMemo(() => render(latex, display), [latex, display]);
  if (!display) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <DisplayMath latex={latex} html={html} className={className} />;
}

/**
 * A multi-row aligned or gathered block cannot wrap, so when it is wider than
 * its box the rows are set as separate lines that can each wrap. It returns to
 * the aligned layout once the box is wide enough again.
 */
function DisplayMath({ latex, html, className }: { latex: string; html: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => stackRows(latex), [latex]);
  const stackedHtml = useMemo(() => rows?.map((r) => render(r, true)), [rows]);
  const [stacked, setStacked] = useState(false);
  const fullWidth = useRef(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !rows) return;
    const check = () => {
      if (!stacked && el.scrollWidth > el.clientWidth + 1) {
        fullWidth.current = el.scrollWidth;
        setStacked(true);
      } else if (stacked && el.clientWidth >= fullWidth.current) {
        setStacked(false);
      }
    };
    check();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows, stacked]);

  return (
    <div
      ref={ref}
      className={`max-w-full overflow-x-auto overflow-y-hidden py-2 text-center ${className}`}
      tabIndex={0}
      role="math"
      aria-label={latex}
    >
      {stacked && stackedHtml
        ? stackedHtml.map((h, i) => <div key={i} className="py-1.5 leading-snug" dangerouslySetInnerHTML={{ __html: h }} />)
        : <span dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}

/** Prose with inline math delimited by single dollar signs: "Let $u = x^2$". */
export function MathText({ text, className = '' }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g), [text]);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.length > 2 && part.startsWith('$') && part.endsWith('$') ? (
          <MathRenderer key={i} latex={part.slice(1, -1)} />
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
