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
export const PenIcon = () => <Icon><path d="M10.5 2.5l3 3-8 8H2.5v-3z" /><path d="M9 4l3 3" /></Icon>;
export const EraserIcon = () => (
  <Icon><path d="M6 13.5h7.5M6 13.5L2.5 10l7-7 4.5 4.5-6 6" /><path d="M6 6.5l4.5 4.5" /></Icon>
);
export const UndoIcon = () => <Icon><path d="M5.5 3L2.5 6l3 3" /><path d="M2.5 6h7a4 4 0 010 8h-3" /></Icon>;
export const TrashIcon = () => (
  <Icon><path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.5h6.6L12 4" /></Icon>
);
export const PlayIcon = () => <Icon><path d="M5 3.5v9l7-4.5z" fill="currentColor" /></Icon>;
export const PauseIcon = () => <Icon><path d="M5.5 3.5v9M10.5 3.5v9" strokeWidth="2" /></Icon>;
export const ArrowIcon = () => <Icon><path d="M2.5 8h11M9.5 4l4 4-4 4" /></Icon>;
export const ExpandIcon = () => <Icon><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></Icon>;
export const ShrinkIcon = () => <Icon><path d="M6 2.5V6H2.5M13.5 6H10V2.5M10 13.5V10h3.5M2.5 10H6v3.5" /></Icon>;
