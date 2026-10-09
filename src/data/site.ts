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
  // Placeholder: replace with your own bio.
  bio: 'Student and developer of this reviewer. A longer introduction is coming soon.',
  email: 'solomon23charles@gmail.com',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/charles-solomon-34aa1b2a1/' },
    { label: 'GitHub', href: 'https://github.com/kwiinnn' },
    { label: 'Facebook', href: 'https://www.facebook.com/Charles.10solomon/' },
    { label: 'DEV', href: 'https://dev.to/kwiinnn' },
  ] satisfies ProfileLink[],
};
