import { getChapterGroups } from '../data/registry';
import { site } from '../data/site';
import { formulaReferenceHref, homeHref, topicHref, type Route } from '../lib/router';
import { CloseIcon } from './Icons';
import { iconBtn, label } from './ui';

const item = 'flex gap-3 rounded px-3 py-2 text-sm leading-snug transition-colors';
const idle = 'text-ink2 hover:bg-inset hover:text-ink';
const active = 'bg-inset font-medium text-ink';

interface Props {
  route: Route;
  onNavigate: () => void;
  onClose: () => void;
}

export function Sidebar({ route, onNavigate, onClose }: Props) {
  const groups = getChapterGroups();
  return (
    <nav aria-label="Curriculum" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-line px-5 py-4">
        <a href={homeHref} onClick={onNavigate} className="block rounded">
          <span className="block text-sm font-semibold">{site.courseCode}</span>
          <span className="block text-xs text-ink3">{site.courseName}</span>
        </a>
        <button type="button" className={`${iconBtn} border-transparent lg:hidden`} onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-6 overflow-y-auto p-3 pt-5">
        <a href={homeHref} onClick={onNavigate} aria-current={route.page === 'home' ? 'page' : undefined}
          className={`${item} ${route.page === 'home' ? active : idle}`}>
          Overview
        </a>

        {groups.map(({ chapter, topics }) => (
          <section key={chapter.number}>
            <h2 className={`${label} px-3 pb-2`}>Unit {chapter.number} · {chapter.title}</h2>
            <ul className="grid grid-cols-1 gap-0.5">
              {topics.map((t) => {
                const isActive = route.page === 'topic' && route.slug === t.slug;
                return (
                  <li key={t.id}>
                    <a href={topicHref(t.slug)} onClick={onNavigate} aria-current={isActive ? 'page' : undefined}
                      className={`${item} ${isActive ? active : idle}`}>
                      <span className="w-6 shrink-0 tabular-nums text-ink3">{t.unitNumber}</span>
                      <span className="min-w-0">{t.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section>
          <h2 className={`${label} px-3 pb-2`}>Reference</h2>
          <a href={formulaReferenceHref} onClick={onNavigate}
            aria-current={route.page === 'formula-reference' ? 'page' : undefined}
            className={`${item} ${route.page === 'formula-reference' ? active : idle}`}>
            All formulas
          </a>
        </section>
      </div>

      <p className="border-t border-line px-5 py-3 text-xs text-ink3">Reviewer by {site.author}</p>
    </nav>
  );
}
