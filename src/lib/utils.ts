export const pad = (n: number) => String(n).padStart(2, '0');
export const uid = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => fmtDate(new Date());
export const nowIso = () => new Date().toISOString();
export const shiftDays = (n: number, from?: Date) => {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() + n);
  return fmtDate(d);
};
export const parseD = (s: string) => new Date(s + 'T12:00:00');
export const pretty = (s: string) => parseD(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const prettyFull = (s: string) => parseD(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
export const daysUntil = (s: string) => Math.round((parseD(s).getTime() - parseD(todayStr()).getTime()) / 86400000);
export const relTime = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
export const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};
export const lastNDays = (n: number) => Array.from({ length: n }, (_, i) => shiftDays(i - (n - 1)));
export const weekDayShort = (s: string) => parseD(s).toLocaleDateString('en-US', { weekday: 'narrow' });
export const monthLabel = (y: number, m: number) => new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
export const recentWeekday = (wd: number) => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() - wd + 7) % 7));
  return fmtDate(d);
};
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const pct = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));

export function habitStreak(days: Record<string, 1>): number {
  let s = 0;
  let cursor = days[todayStr()] ? 0 : -1;
  for (;;) {
    const key = shiftDays(cursor);
    if (days[key]) { s++; cursor--; } else break;
  }
  return s;
}

export const fmtSize = (bytes: number) =>
  bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
