/**
 * Parses every LaTeX string in the registry with KaTeX in strict mode and
 * checks structural rules. Run with `npm run check:math`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import katex from 'katex';
import { topics } from '../src/data/registry';
import type { Figure, PlotItem } from '../src/types/figure';

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

let figures = 0;
function plotItems(items: PlotItem[], w: string) {
  for (const it of items) {
    if ('label' in it && it.label) math(it.label, `${w}.label`, false);
    if (it.type === 'label') math(it.text, `${w}.label`, false);
  }
}
/** Figures: every label is inline LaTeX, every caption is prose; animations are sampled across their range. */
function figure(f: Figure | undefined, w: string) {
  if (!f) return;
  figures++;
  if (f.caption) prose(f.caption, `${w}.caption`);
  switch (f.kind) {
    case 'plot': {
      if (f.title) prose(f.title, `${w}.title`);
      plotItems(f.items, w);
      [...(f.xTicks ?? []), ...(f.yTicks ?? [])].forEach((t) => typeof t !== 'number' && math(t[1], `${w}.tick`, false));
      const a = f.animate;
      if (a) {
        math(a.param, `${w}.param`, false);
        for (let i = 0; i <= 8; i++) {
          const t = a.range[0] + ((a.range[1] - a.range[0]) * i) / 8;
          plotItems(a.frame(t), `${w}.frame`);
          if (a.readout) prose(a.readout(t), `${w}.readout`);
        }
      }
      break;
    }
    case 'triangle':
      if (f.title) prose(f.title, `${w}.title`);
      [f.opposite, f.adjacent, f.hypotenuse, f.angle ?? '\\theta'].forEach((x) => math(x, `${w}.side`, false));
      break;
    case 'group':
      f.figures.forEach((g, i) => figure(g, `${w}.group[${i}]`));
      figures--;
      break;
    case 'sequence':
      f.steps.forEach((st) => {
        if (st.label) prose(st.label, w);
        if (st.latex) math(st.latex, w, false);
        if (st.text) prose(st.text, w);
      });
      break;
    case 'flow':
      f.head?.forEach((h) => prose(h, w));
      f.rows.forEach((r) => { prose(r.when, w); prose(r.then, w); });
      break;
    case 'tabular':
      [...f.d, ...f.i].forEach((x) => math(x, w, false));
      if (f.result) math(f.result, w, true);
      break;
  }
}

const ids = new Set<string>();
const uniq = (id: string) => (ids.has(id) ? errors.push(`duplicate id ${id}`) : ids.add(id));

for (const t of topics) {
  uniq(t.id);
  prose(t.summary, `${t.id}.summary`);
  t.examNotes.forEach((n, i) => {
    const w = `${t.id}.note[${i}]`;
    prose(n.concept, w); prose(n.conditions, w); prose(n.tip, w); figure(n.figure, w);
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
      figure(s.figure, `${w}.step${s.stepNumber}`);
    });
  t.workedExamples.forEach((e) => {
    uniq(e.id); figure(e.figure, e.id); math(e.problemLatex, e.id, true); prose(e.keyIdea, e.id); if (e.prompt) prose(e.prompt, e.id); steps(e.solutionSteps, e.id);
  });
  t.problems.forEach((p, i) => {
    uniq(p.id);
    if (p.problemNumber !== i + 1) errors.push(`${p.id}: problem numbering`);
    math(p.questionLatex, p.id, true); figure(p.figure, p.id); prose(p.prompt, p.id); prose(p.hint, p.id); steps(p.steps, p.id);
  });
  if (new Set(t.problems.map((p) => p.questionLatex)).size !== t.problems.length) errors.push(`${t.id}: repeated problem`);
  console.log(`${t.unitNumber} ${t.title}: ${t.examNotes.length} notes, ${t.keyFormulas.length} formulas, ${t.workedExamples.length} examples, ${t.problems.length} problems`);
}

// A single backslash before a letter silently drops the backslash ("\pm" -> "pm"),
// so it parses fine; catch it in the source instead.
const dir = new URL('../src/data/topics/', import.meta.url);
for (const file of readdirSync(dir)) {
  readFileSync(new URL(file, dir), 'utf8').split('\n').forEach((line, i) => {
    if (/(?<!\\)\\[a-zA-Z;,:! ]/.test(line.replace(/\\\\/g, ''))) errors.push(`${file}:${i + 1}: single-escaped backslash`);
  });
}

console.log(`${figures} figures, ${checked} LaTeX strings parsed, ${errors.length} errors`);
errors.forEach((e) => console.error(' -', e));
process.exit(errors.length ? 1 : 0);
