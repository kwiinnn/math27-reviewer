import { useEffect, useState } from 'react';

export type TopicView = 'notes' | 'formulas' | 'problems';
export const TOPIC_VIEWS: { id: TopicView; label: string }[] = [
  { id: 'notes', label: 'Exam Notes' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'problems', label: 'Practice Problems' },
];

export type Route =
  | { page: 'topic'; slug: string; view: TopicView }
  | { page: 'formula-reference' }
  | { page: 'home' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'formulas') return { page: 'formula-reference' };
  if (parts[0] === 'topic' && parts[1]) {
    const view = TOPIC_VIEWS.some((v) => v.id === parts[2]) ? (parts[2] as TopicView) : 'notes';
    return { page: 'topic', slug: parts[1], view };
  }
  return { page: 'home' };
}

export const homeHref = '#/';
export const topicHref = (slug: string, view: TopicView = 'notes') => `#/topic/${slug}/${view}`;
export const formulaReferenceHref = '#/formulas';

/**
 * Minimal hash router: no server config needed, works from a static file.
 * In-app links (href="#/...") are handled in memory first, so navigation
 * still works in sandboxed frames where the URL hash cannot be changed.
 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const go = (hash: string) => {
      setRoute(parseHash(hash));
      window.scrollTo({ top: 0 });
    };
    const onHashChange = () => go(window.location.hash);
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#/"]');
      const href = link?.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      go(href);
      try {
        window.history.pushState(null, '', href);
      } catch {
        /* URL is not writable here; in-memory state is enough */
      }
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
      document.removeEventListener('click', onClick);
    };
  }, []);
  return route;
}
