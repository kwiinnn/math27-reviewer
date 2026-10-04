import { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  /** Display (block) math when true, inline math otherwise. */
  display?: boolean;
  className?: string;
}

function render(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: true, strict: 'ignore' });
  } catch (err) {
    // Never crash the page on a bad string: show the source and the reason.
    const message = err instanceof Error ? err.message : String(err);
    const safe = latex.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return `<code title="${message.replace(/"/g, '&quot;')}" style="color:var(--ink);text-decoration:underline wavy">${safe}</code>`;
  }
}

/**
 * KaTeX wrapper. Display math sits in a horizontally scrollable box so long
 * derivations and tall fractions are never clipped on narrow screens.
 */
export function MathRenderer({ latex, display = false, className = '' }: MathRendererProps) {
  const html = useMemo(() => render(latex, display), [latex, display]);
  if (!display) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <div
      className={`max-w-full overflow-x-auto overflow-y-hidden py-2 text-center ${className}`}
      tabIndex={0}
      role="math"
      aria-label={latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
