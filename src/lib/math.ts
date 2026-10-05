/**
 * Display math that can wrap on narrow screens.
 *
 * KaTeX's display mode never breaks a line, so a long derivation scrolls
 * sideways on a phone. Inline mode does break, after top-level relations and
 * operators, so display math is rendered inline with \displaystyle (same size
 * and limits as display mode). \allowbreak after each \quad, \qquad and ",\;"
 * also lets separate clauses ("u = ..., \qquad du = ...") move to their own lines.
 */
export function breakableDisplay(latex: string): string {
  const breaks = latex
    .replace(/\\q?quad(?![a-zA-Z])/g, (m) => `${m}\\allowbreak `)
    .replace(/,\\;/g, ',\\;\\allowbreak ');
  return '\\displaystyle ' + breaks;
}

const ENV = /\\begin\{(aligned|gathered)\}([\s\S]*?)\\end\{\1\}/;

/**
 * The rows of an aligned or gathered environment, each usable on its own, or
 * null when there is none. Used when the formula is too wide: rows set
 * separately can each wrap. Anything before or after the environment becomes
 * its own row. In aligned, the odd-numbered & are alignment points (dropped)
 * and the even-numbered ones separate column pairs (kept as a breakable gap).
 */
export function stackRows(latex: string): string[] | null {
  const m = ENV.exec(latex);
  if (!m) return null;
  const rows: string[] = [];
  let depth = 0;
  let start = 0;
  const body = m[2];
  for (let i = 0; i < body.length; i++) {
    if (body.startsWith('\\begin{', i)) depth++;
    else if (body.startsWith('\\end{', i)) depth--;
    else if (depth === 0 && body.startsWith('\\\\', i)) {
      rows.push(body.slice(start, i));
      i += 1;
      // Skip an optional row gap such as \\[1ex].
      const gap = /^\[[^\]]*\]/.exec(body.slice(i + 1));
      if (gap) i += gap[0].length;
      start = i + 1;
    }
  }
  rows.push(body.slice(start));
  const before = latex.slice(0, m.index);
  const after = latex.slice(m.index + m[0].length).replace(/^\s*\\q?quad(?![a-zA-Z])/, '');
  return [
    before,
    ...rows.map((row) => {
      if (m[1] !== 'aligned') return row;
      let n = 0;
      return row.replace(/(?<!\\)&/g, () => (n++ % 2 === 0 ? '' : '\\qquad '));
    }),
    after,
  ]
    .map((row) => row.trim())
    .filter(Boolean);
}
