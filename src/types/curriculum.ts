/**
 * Curriculum data model.
 *
 * Conventions for every string field below:
 *  - Fields ending in `Latex` are pure LaTeX and are rendered as display math.
 *  - All other text fields are prose that may contain inline math wrapped in
 *    single dollar signs, e.g. "Let $u = x^2$".
 *  - Inside .ts files every LaTeX backslash is double-escaped ("\\frac").
 */

export type Difficulty = 'Basic' | 'Exam-Level' | 'Challenge';

export interface Step {
  stepNumber: number;
  /** Short imperative label, e.g. "Identify the inner function". */
  title: string;
  /** The mathematical execution of this step (display LaTeX). */
  mathLatex: string;
  /**
   * "Why this step?" — the visual clue that signalled the move, why this
   * method was chosen over the alternatives, and the form being driven toward.
   */
  explanation: string;
  /** Name of the theorem / rule / identity used. */
  ruleApplied: string;
  /** The error students most often make at this exact point. */
  pitfall?: string;
}

export interface Formula {
  id: string;
  name: string;
  formulaLatex: string;
  whenToUse: string;
  restrictions: string;
  /** A one-line instance of the formula (display LaTeX). */
  example: string;
}

export interface ExamNote {
  title: string;
  concept: string;
  conditions: string;
  commonTraps: string[];
  tip: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  /** Optional prose statement, for word problems. */
  prompt?: string;
  problemLatex: string;
  keyIdea: string;
  solutionSteps: Step[];
}

export interface Problem {
  id: string;
  problemNumber: number;
  difficulty: Difficulty;
  /** Plain-language instruction shown above the math, e.g. "Find dy/dx." */
  prompt: string;
  questionLatex: string;
  /** A nudge shown in the expandable scratchpad, without giving the answer. */
  hint: string;
  steps: Step[];
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  /** Matches the lecture deck numbering, e.g. "1.4". */
  unitNumber: string;
  summary: string;
  keyFormulas: Formula[];
  examNotes: ExamNote[];
  workedExamples: WorkedExample[];
  problems: Problem[];
}

/** A chapter groups topics in the sidebar ("1" -> 1.1, 1.2, ...). */
export interface Chapter {
  number: string;
  title: string;
}
