import type { Topic } from '../types/curriculum';
import { homeHref, TOPIC_VIEWS, topicHref, type Route, type TopicView } from '../lib/router';
import type { Settings } from '../lib/settings';
import { MenuIcon, SettingsIcon } from './Icons';
import { SettingsPanel } from './SettingsPanel';
import { iconBtn } from './ui';

interface HeaderProps {
  route: Route;
  topic?: Topic;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const count = (topic: Topic, view: TopicView) =>
  view === 'notes' ? topic.examNotes.length : view === 'formulas' ? topic.keyFormulas.length : topic.problems.length;

export function Header(p: HeaderProps) {
  const { route, topic } = p;
  const here =
    route.page === 'formula-reference' ? 'Formula Reference'
    : route.page === 'about' ? 'About the Developer'
    : route.page === 'home' ? 'Overview'
    : topic ? `${topic.unitNumber} ${topic.title}` : 'Not found';

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 border-b border-line bg-bg">
      <div className="relative flex items-center gap-3 px-4 py-2.5">
        <button type="button" className={iconBtn} onClick={p.onToggleSidebar}
          aria-expanded={p.sidebarOpen} aria-controls="sidebar" aria-label={p.sidebarOpen ? 'Hide menu' : 'Show menu'}>
          <MenuIcon />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-2 text-sm text-ink3">
            <li className="hidden shrink-0 sm:block"><a href={homeHref} className="rounded hover:text-ink">MATH 27</a></li>
            <li className="hidden sm:block" aria-hidden="true">/</li>
            <li className="truncate font-medium text-ink" aria-current="page">{here}</li>
          </ol>
        </nav>

        <button type="button" data-settings-toggle className={iconBtn} onClick={() => p.setSettingsOpen(!p.settingsOpen)}
          aria-expanded={p.settingsOpen} aria-controls="settings-panel">
          <SettingsIcon />
          <span className="hidden sm:inline">Settings</span>
          <span className="sr-only sm:hidden">Settings</span>
        </button>

        {p.settingsOpen && (
          <SettingsPanel settings={p.settings} update={p.updateSettings} reset={p.resetSettings}
            onClose={() => p.setSettingsOpen(false)} />
        )}
      </div>

      {route.page === 'topic' && topic && (
        <div role="tablist" aria-label="Topic views" className="-mb-px flex gap-1 px-2 sm:px-4">
          {TOPIC_VIEWS.map((v) => {
            const selected = route.view === v.id;
            return (
              <a key={v.id} role="tab" aria-selected={selected} href={topicHref(topic.slug, v.id)}
                className={`flex flex-1 items-baseline justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-sm transition-colors sm:flex-none sm:justify-start sm:gap-2 sm:px-3 ${
                  selected ? 'border-primary font-medium text-ink' : 'border-transparent text-ink3 hover:text-ink'
                }`}>
                <span className="sm:hidden">{v.short}</span>
                <span className="hidden sm:inline">{v.label}</span>
                <span className="text-xs tabular-nums text-ink3">{count(topic, v.id)}</span>
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}
