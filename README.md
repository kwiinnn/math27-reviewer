# MATH 27 Reviewer

Exam-preparation app for MATH 27 (Analytic and Geometric Calculus II), built from the course lecture decks.

    npm install
    npm run dev            # local dev server
    npm run build          # production build in dist/ (deploy anywhere static, e.g. Vercel)
    npm run build:single   # one self-contained dist-single/index.html that works offline
    npm run check:math     # parses every LaTeX string with KaTeX and checks numbering/ids

## Adding a topic

1. Create `src/data/topics/<slug>.ts` exporting a typed `Topic` (see `src/types/curriculum.ts`).
2. Import it in `src/data/registry.ts` and add it to the `topics` array.

The sidebar, topic pages and the Formula Reference page are generated from the registry.

## Data conventions

- Fields ending in `Latex` (and `Formula.example`) are display LaTeX.
- Other text fields are prose; wrap inline math in single dollar signs.
- Every backslash in a `.ts` string is double-escaped (`\\frac`).

## Figures

Exam notes, worked examples, problems and individual solution steps take an optional
`figure` (see `src/types/figure.ts`), rendered by `src/components/figures/`:

- `plot`: graphs, shaded areas and geometry diagrams in SVG with KaTeX labels. Labelled
  graphs get a hover readout; an `animate` block adds a play button and a slider that
  drive extra items through `frame(t)`.
- `triangle`, `group`, `sequence`, `flow` and `tabular` for reference triangles, small
  multiples, procedures, "if you see / do this" tables and the DI method.

A problem's own figure is shown with the question, so it must not give the answer away;
put solution visuals on a step. `npm run check:math` also parses every figure label and
caption, samples each animation across its range, and flags single-escaped backslashes.
