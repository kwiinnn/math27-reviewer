/**
 * Parses every LaTeX string in the registry with KaTeX in strict mode and
 * checks structural rules. Run with `npm run check:math`.
 */
import katex from 'katex';
import { topics } from '../src/data/registry';

let checked = 0;
const errors: string[] = [];

function math(latex: string, where: string, displayMode: boolean) {
  checked++;
  if (/[\x00-\x09\x0b-\x1f]/.test(latex)) errors.push(`${where}: control character (single-escaped backslash?)`);
  try {
    katex.renderToString(latex, { displayMode, throwOnError: true });
  } catch (e) {
    errors.push(`${where}: ${(e as Error).message}`);
  }
}
function prose(text: string, where: string) {
  if ((text.match(/\$/g) ?? []).length % 2) errors.push(`${where}: unbalanced $`);
  if (/[\x00-\x09\x0b-\x1f]/.test(text)) errors.push(`${where}: control character`);
  text.split(/(\$[^$]+\$)/g).forEach((p) => {
    if (p.length > 2 && p.startsWith('$') && p.endsWith('$')) math(p.slice(1, -1), where, false);
  });
}

const ids = new Set<string>();
const uniq = (id: string) => (ids.has(id) ? errors.push(`duplicate id ${id}`) : ids.add(id));

for (const t of topics) {
  uniq(t.id);
  prose(t.summary, `${t.id}.summary`);
  t.examNotes.forEach((n, i) => {
    const w = `${t.id}.note[${i}]`;
    prose(n.concept, w); prose(n.conditions, w); prose(n.tip, w);
    n.commonTraps.forEach((c) => prose(c, w));
  });
  t.keyFormulas.forEach((f) => {
    uniq(f.id);
    math(f.formulaLatex, f.id, true); math(f.example, f.id, true);
    prose(f.whenToUse, f.id); prose(f.restrictions, f.id);
  });
  const steps = (list: typeof t.problems[number]['steps'], w: string) =>
    list.forEach((s, i) => {
      if (s.stepNumber !== i + 1) errors.push(`${w}: step numbering`);
      math(s.mathLatex, `${w}.step${s.stepNumber}`, true);
      prose(s.title, w); prose(s.explanation, w); prose(s.ruleApplied, w);
      if (s.pitfall) prose(s.pitfall, w);
    });
  t.workedExamples.forEach((e) => {
    uniq(e.id); math(e.problemLatex, e.id, true); prose(e.keyIdea, e.id); if (e.prompt) prose(e.prompt, e.id); steps(e.solutionSteps, e.id);
  });
  t.problems.forEach((p, i) => {
    uniq(p.id);
    if (p.problemNumber !== i + 1) errors.push(`${p.id}: problem numbering`);
    math(p.questionLatex, p.id, true); prose(p.prompt, p.id); prose(p.hint, p.id); steps(p.steps, p.id);
  });
  if (new Set(t.problems.map((p) => p.questionLatex)).size !== t.problems.length) errors.push(`${t.id}: repeated problem`);
  console.log(`${t.unitNumber} ${t.title}: ${t.examNotes.length} notes, ${t.keyFormulas.length} formulas, ${t.workedExamples.length} examples, ${t.problems.length} problems`);
}

console.log(`${checked} LaTeX strings parsed, ${errors.length} errors`);
errors.forEach((e) => console.error(' -', e));
process.exit(errors.length ? 1 : 0);
