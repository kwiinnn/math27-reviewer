import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"
    >
      {children}
    </svg>
  );
}

export const MenuIcon = () => <Icon><path d="M2 4h12M2 8h12M2 12h12" /></Icon>;
export const CloseIcon = () => <Icon><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></Icon>;
export const ChevronIcon = () => <Icon><path d="M6 3.5L10.5 8 6 12.5" /></Icon>;
/** Three sliders: the conventional mark for display settings. */
export const SettingsIcon = () => (
  <Icon>
    <path d="M2 4h5M11 4h3M2 8h2M8 8h6M2 12h7M13 12h1" />
    <circle cx="9" cy="4" r="1.6" /><circle cx="6" cy="8" r="1.6" /><circle cx="11" cy="12" r="1.6" />
  </Icon>
);
