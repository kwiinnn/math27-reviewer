import { useCallback, useState, type ReactNode } from 'react';
import type { Topic } from '../types/curriculum';
import type { Route } from '../lib/router';
import { useSettings } from '../lib/settings';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const isWide = () => window.matchMedia?.('(min-width: 1024px)').matches ?? true;

export function Layout({ route, topic, children }: { route: Route; topic?: Topic; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(isWide);
  const [settingsOpen, setSettingsOpenState] = useState(false);
  const setSettingsOpen = useCallback((open: boolean) => setSettingsOpenState(open), []);
  const { settings, update, reset } = useSettings();

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <>
          {/* On small screens the sidebar is an overlay with a dismissable backdrop. */}
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)} />
          <aside id="sidebar"
            className="fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] shrink-0 border-r border-line bg-surface lg:sticky lg:top-0 lg:z-0 lg:h-screen">
            <Sidebar route={route} onNavigate={() => !isWide() && setSidebarOpen(false)} onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          route={route} topic={topic}
          sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((o) => !o)}
          settings={settings} updateSettings={update} resetSettings={reset}
          settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen}
        />
        <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">{children}</main>
      </div>
    </div>
  );
}
