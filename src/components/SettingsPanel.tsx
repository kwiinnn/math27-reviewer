import { useEffect, useRef } from 'react';
import {
  DEFAULT_SETTINGS, FONT_OPTIONS, SCALE_MAX, SCALE_MIN, SCALE_STEP,
  type Contrast, type Settings, type ThemeChoice,
} from '../lib/settings';
import { CloseIcon } from './Icons';
import { btnQuiet, iconBtn, label, segGroup, segItem } from './ui';

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  onClose: () => void;
}

const themes: { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'System' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' },
];
const contrasts: { id: Contrast; label: string }[] = [
  { id: 'low', label: 'Low' }, { id: 'standard', label: 'Standard' }, { id: 'high', label: 'High' },
];

export function SettingsPanel({ settings, update, reset, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!ref.current?.contains(t) && !t.closest('[data-settings-toggle]')) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const step = (dir: 1 | -1) =>
    update({ scale: Math.min(SCALE_MAX, Math.max(SCALE_MIN, settings.scale + dir * SCALE_STEP)) });
  const isDefault = JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS);

  return (
    <div
      ref={ref}
      id="settings-panel"
      role="dialog"
      aria-label="Display settings"
      tabIndex={-1}
      className="absolute right-4 top-full z-40 mt-2 max-h-[calc(100vh-5rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-strong bg-surface p-4 shadow-lg outline-none"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Display settings</h2>
        <button type="button" className={`${iconBtn} border-transparent`} onClick={onClose} aria-label="Close settings">
          <CloseIcon />
        </button>
      </div>

      <fieldset className="mt-4">
        <legend className={label}>Theme</legend>
        <div className={`${segGroup} mt-2`}>
          {themes.map((t) => (
            <button key={t.id} type="button" aria-pressed={settings.theme === t.id}
              className={segItem(settings.theme === t.id)} onClick={() => update({ theme: t.id })}>
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className={label}>Contrast</legend>
        <div className={`${segGroup} mt-2`}>
          {contrasts.map((c) => (
            <button key={c.id} type="button" aria-pressed={settings.contrast === c.id}
              className={segItem(settings.contrast === c.id)} onClick={() => update({ contrast: c.id })}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className={label}>Text size</legend>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className={`${btnQuiet} h-9 w-9 px-0`} onClick={() => step(-1)}
            disabled={settings.scale <= SCALE_MIN} aria-label="Decrease text size">
            <span className="text-xs">A</span>
          </button>
          <input
            id="text-size" type="range" min={SCALE_MIN} max={SCALE_MAX} step={SCALE_STEP} value={settings.scale}
            onChange={(e) => update({ scale: Number(e.target.value) })}
            aria-label="Text size" className="min-w-0 flex-1 accent-[var(--primary)]"
          />
          <button type="button" className={`${btnQuiet} h-9 w-9 px-0`} onClick={() => step(1)}
            disabled={settings.scale >= SCALE_MAX} aria-label="Increase text size">
            <span className="text-lg leading-none">A</span>
          </button>
          <output htmlFor="text-size" className="w-12 text-right text-sm tabular-nums text-ink2">{settings.scale}%</output>
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className={label}>Typeface</legend>
        <p className="mt-1 text-xs text-ink3">Mathematics always uses the KaTeX face.</p>
        <div className="mt-2 divide-y divide-line rounded border border-line">
          {FONT_OPTIONS.map((f) => {
            const on = settings.font === f.id;
            return (
              <label key={f.id} className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${on ? 'bg-inset' : ''}`}>
                <input type="radio" name="typeface" value={f.id} checked={on}
                  onChange={() => update({ font: f.id })} className="accent-[var(--primary)]" />
                <span className="min-w-0">
                  <span className="block text-sm" style={{ fontFamily: `${f.family}, system-ui, sans-serif` }}>{f.label}</span>
                  <span className="block text-xs text-ink3">{f.note}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button type="button" className={`${btnQuiet} mt-5 w-full`} onClick={reset} disabled={isDefault}>
        Reset to defaults
      </button>
    </div>
  );
}
