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
