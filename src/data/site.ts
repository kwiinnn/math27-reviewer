/** Course and authorship details shown in the interface. Edit here only. */
export const site = {
  courseCode: 'MATH 27',
  courseName: 'Analytic and Geometric Calculus II',
  author: 'Selrahc',
  repository: 'https://github.com/kwiinnn/math27-reviewer',
};

export interface ProfileLink {
  label: 'LinkedIn' | 'GitHub' | 'Facebook' | 'DEV';
  href: string;
}

/** The About the developer page. */
export const developer = {
  name: 'Charles Solomon',
  nicknames: ['Cha', 'Selrahc'],
  email: 'solomon23charles@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/charles-solomon-34aa1b2a1/' },
    { label: 'GitHub', href: 'https://github.com/kwiinnn' },
    { label: 'Facebook', href: 'https://www.facebook.com/Charles.10solomon/' },
    { label: 'DEV', href: 'https://dev.to/kwiinnn' },
  ] satisfies ProfileLink[],
};

/** The course lecturers, shown beside the developer on the About page. */
export interface Lecturer {
  name: string;
  department: string;
  university: string;
  /** An imported image; a placeholder silhouette is shown when omitted. */
  photo?: string;
}

const DMPCS = 'Department of Mathematics, Physics and Computer Science';
const UPMIN = 'University of the Philippines Mindanao';

// Photos can be added as imports.
export const lecturers: Lecturer[] = [
  { name: 'Kenneth P. Montajes', department: DMPCS, university: UPMIN },
  { name: 'Eric V. Cagay', department: DMPCS, university: UPMIN },
];
