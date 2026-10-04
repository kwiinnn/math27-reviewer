import { useEffect, useState } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type Contrast = 'low' | 'standard' | 'high';

export interface FontOption {
  id: string;
  label: string;
  note: string;
  /** First entry of the CSS font-family stack; fallbacks are added in CSS. */
  family: string;
}

/** Typeface choices. All are open-licensed and loaded from Google Fonts. */
export const FONT_OPTIONS: FontOption[] = [
  { id: 'inter', label: 'Inter', note: 'Neutral sans, the default', family: "'Inter'" },
  { id: 'dm-sans', label: 'DM Sans', note: 'Geometric sans, round and open', family: "'DM Sans'" },
  { id: 'source-serif', label: 'Source Serif 4', note: 'Editorial serif, crisp at small sizes', family: "'Source Serif 4', Georgia" },
  { id: 'plex', label: 'IBM Plex Sans', note: 'Technical, slightly condensed', family: "'IBM Plex Sans'" },
  { id: 'atkinson', label: 'Atkinson Hyperlegible', note: 'Designed for low-vision legibility', family: "'Atkinson Hyperlegible'" },
  { id: 'literata', label: 'Literata', note: 'Book serif for long reading', family: "'Literata', Georgia" },
  { id: 'system', label: 'System default', note: 'Whatever your device uses', family: 'system-ui' },
];

export interface Settings {
  theme: ThemeChoice;
  contrast: Contrast;
  /** Text size as a percentage of the browser default. */
  scale: number;
  font: string;
}

export const SCALE_MIN = 85;
export const SCALE_MAX = 150;
export const SCALE_STEP = 5;

export const DEFAULT_SETTINGS: Settings = { theme: 'system', contrast: 'standard', scale: 100, font: 'inter' };

const KEY = 'math27-settings';
// A host page (for example an embedding viewer) may already have chosen a theme.
const hostTheme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null;

function load(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<Settings>;
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    if (!FONT_OPTIONS.some((f) => f.id === merged.font)) merged.font = DEFAULT_SETTINGS.font;
    merged.scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(merged.scale) || 100));
    return merged;
  } catch {
    return DEFAULT_SETTINGS; // storage unavailable or corrupted
  }
}

function systemTheme(): 'light' | 'dark' {
  if (hostTheme === 'light' || hostTheme === 'dark') return hostTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(s: Settings) {
  const root = document.documentElement;
  root.setAttribute('data-theme', s.theme === 'system' ? systemTheme() : s.theme);
  root.setAttribute('data-contrast', s.contrast);
  root.style.fontSize = `${s.scale}%`; // every size in the app is in rem
  const font = FONT_OPTIONS.find((f) => f.id === s.font) ?? FONT_OPTIONS[0];
  root.style.setProperty('--font-ui', font.family);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    apply(settings);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* not persisted; the settings still apply for this visit */
    }
  }, [settings]);

  // Follow the operating system while the theme is set to "system".
  useEffect(() => {
    if (settings.theme !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply(settings);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [settings]);

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const reset = () => setSettings(DEFAULT_SETTINGS);
  return { settings, update, reset };
}
