/** Shared class strings so controls look identical everywhere. */
export const label = 'text-xs font-semibold uppercase tracking-wider text-ink3';
export const card = 'rounded-md border border-line bg-surface';
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';
export const btnPrimary = `${btnBase} border-primary bg-primary text-onprimary hover:opacity-85`;
export const btnQuiet = `${btnBase} border-line text-ink2 hover:border-strong hover:text-ink`;
export const iconBtn =
  'inline-flex h-9 items-center gap-2 rounded border border-line px-2.5 text-sm text-ink2 transition-colors hover:border-strong hover:text-ink';
/** A row of mutually exclusive options. */
export const segGroup = 'inline-flex rounded border border-line p-0.5';
export const segItem = (on: boolean) =>
  `rounded-sm px-3 py-1.5 text-sm transition-colors ${on ? 'bg-primary font-medium text-onprimary' : 'text-ink2 hover:text-ink'}`;
