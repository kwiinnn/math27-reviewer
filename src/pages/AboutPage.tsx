import type { ComponentType } from 'react';
import avatar from '../assets/avatar.jpg';
import { developer, site, type ProfileLink } from '../data/site';
import { DevIcon, FacebookIcon, GitHubIcon, LinkedInIcon } from '../components/BrandIcons';
import { MailIcon } from '../components/Icons';
import { btnQuiet, label } from '../components/ui';

const ICON: Record<ProfileLink['label'], ComponentType> = {
  LinkedIn: LinkedInIcon,
  GitHub: GitHubIcon,
  Facebook: FacebookIcon,
  DEV: DevIcon,
};

export function AboutPage() {
  return (
    <>
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

      <p className="mt-6 max-w-[70ch] text-sm leading-7 text-ink2">{developer.bio}</p>

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
          The {site.courseCode} Reviewer is built from the course lecture decks: exam notes with the common traps,
          formula sheets, worked examples, and practice problems that reveal one step at a time. The source code is
          on{' '}
          <a href={site.repository} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
            GitHub
          </a>
          .
        </p>
      </section>
    </>
  );
}
