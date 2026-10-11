import type { ComponentType } from 'react';
import avatar from '../assets/avatar.jpg';
import { developer, lecturers, site, type ProfileLink } from '../data/site';
import { DevIcon, FacebookIcon, GitHubIcon, LinkedInIcon } from '../components/BrandIcons';
import { MailIcon, PersonIcon } from '../components/Icons';
import { btnQuiet, label } from '../components/ui';

const ICON: Record<ProfileLink['label'], ComponentType> = {
  LinkedIn: LinkedInIcon,
  GitHub: GitHubIcon,
  Facebook: FacebookIcon,
  DEV: DevIcon,
};

export function AboutPage() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
      <div className="min-w-0">
        <p className={label}>About the developer</p>

        <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <img src={avatar} alt={`Profile picture of ${developer.name}`} width={96} height={96}
            className="h-24 w-24 shrink-0 rounded-full border border-line object-cover" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{developer.name}</h1>
            <p className="mt-1 text-sm text-ink3">
              You can call me {developer.nicknames.join(' or ')}.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className={`${label} mb-3`}>Find me online</h2>
          <ul className="flex flex-wrap gap-2">
            {developer.links.map((l) => {
              const Icon = ICON[l.label];
              return (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className={btnQuiet}>
                    <Icon />
                    {l.label}
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              );
            })}
            <li>
              <a href={`mailto:${developer.email}`} className={btnQuiet}>
                <MailIcon />
                Email
              </a>
            </li>
          </ul>
          <p className="mt-3 text-sm text-ink3">
            Or write to <span className="select-all text-ink2">{developer.email}</span>
          </p>
        </section>

        <section className="mt-10">
          <h2 className={`${label} mb-3`}>About this reviewer</h2>
          <p className="max-w-[70ch] text-sm leading-7 text-ink2">
            The {site.courseCode} Reviewer is built from the course lecture decks: notes with the common traps,
            formula sheets, worked examples, and practice problems that reveal one step at a time. The source code is
            on{' '}
            <a href={site.repository} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
              GitHub
            </a>
            .
          </p>
        </section>
      </div>

      <aside className="mt-12 lg:mt-0" aria-labelledby="lecturers">
        <h2 id="lecturers" className={`${label} mb-4`}>Lecturers</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {lecturers.map((l, i) => (
            <li key={i} className="flex items-start gap-4">
              {l.photo ? (
                <img src={l.photo} alt="" width={80} height={80} className="h-20 w-20 shrink-0 rounded-full border border-line object-cover" />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-line bg-inset text-4xl text-ink3">
                  <PersonIcon />
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-lg font-semibold leading-snug tracking-tight text-ink">{l.name}</span>
                <span className="mt-1 block text-sm leading-snug text-ink2">{l.department}</span>
                <span className="mt-1 block text-sm leading-snug text-ink3">{l.university}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
