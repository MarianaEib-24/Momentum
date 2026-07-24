import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { produce } from 'immer';
import type { AppData, User } from './types';
import { seedData } from '../data/seed';
import { ACHIEVEMENTS } from './achievements';
import { nowIso, uid } from './utils';

const DATA_KEY = 'momentum:data';
const ME_KEY = 'momentum:me';
const THEME_KEY = 'momentum:theme';

export interface Toast { id: string; msg: string; icon?: string; }

type Theme = 'light' | 'dark';

interface Ctx {
  data: AppData;
  me: string | null;
  meUser: User | null;
  partner: User | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
  login: (id: string) => void;
  logout: () => void;
  update: (fn: (d: AppData) => void, act?: { action: string; target: string }) => void;
  toasts: Toast[];
  toast: (msg: string, icon?: string) => void;
  confetti: number;
  fire: () => void;
  resetDemo: () => void;
  importData: (raw: string) => boolean;
}

const StoreCtx = createContext<Ctx | null>(null);

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 3 && Array.isArray(parsed.projects)) return parsed as AppData;
    }
  } catch { /* fall through to seed */ }
  return seedData();
}

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') return t;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [me, setMe] = useState<string | null>(() => {
    try { return localStorage.getItem(ME_KEY); } catch { return null; }
  });
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); } catch { /* quota */ }
  }, [data]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const toast = useCallback((msg: string, icon?: string) => {
    const id = uid();
    setToasts((ts) => [...ts.slice(-3), { id, msg, icon }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4200);
  }, []);

  const fire = useCallback(() => setConfetti((c) => c + 1), []);

  const login = useCallback((id: string) => {
    setMe(id);
    try { localStorage.setItem(ME_KEY, id); } catch { /* ignore */ }
  }, []);

  const logout = useCallback(() => {
    setMe(null);
    try { localStorage.removeItem(ME_KEY); } catch { /* ignore */ }
  }, []);

  const update = useCallback((fn: (d: AppData) => void, act?: { action: string; target: string }) => {
    setData((prev) => produce(prev, (d) => {
      fn(d);
      if (act) {
        d.activity.unshift({ id: uid(), actor: me ?? 'alex', action: act.action, target: act.target, at: nowIso() });
        if (d.activity.length > 60) d.activity.length = 60;
      }
    }));
  }, [me]);

  const resetDemo = useCallback(() => {
    setData(seedData());
    toast('Workspace restored to demo data', 'sparkles');
  }, [toast]);

  const importData = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projects) && Array.isArray(parsed.tasks)) {
        setData({ ...parsed, v: 3 });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Achievement engine — watches the workspace, celebrates new unlocks.
  useEffect(() => {
    const fresh = ACHIEVEMENTS.filter((a) => !data.unlocked.includes(a.id) && a.check(data));
    if (fresh.length === 0) return;
    const t = window.setTimeout(() => {
      setData((prev) => produce(prev, (d) => {
        for (const a of fresh) {
          if (d.unlocked.includes(a.id)) continue;
          d.unlocked.push(a.id);
          d.notifs.unshift({ id: uid(), icon: a.icon, text: `Achievement unlocked — ${a.title}`, at: nowIso(), read: false, type: 'achievement' });
        }
      }));
      fresh.forEach((a, i) => window.setTimeout(() => toast(`Achievement unlocked — ${a.title}`, a.icon), i * 600));
      fire();
    }, 900);
    return () => window.clearTimeout(t);
  }, [data, toast, fire]);

  const value = useMemo<Ctx>(() => ({
    data, me,
    meUser: me ? data.users[me] ?? null : null,
    partner: me ? data.users[me === 'alex' ? 'jordan' : 'alex'] ?? null : null,
    theme, setTheme, login, logout, update,
    toasts, toast, confetti, fire, resetDemo, importData,
  }), [data, me, theme, setTheme, login, logout, update, toasts, toast, confetti, fire, resetDemo, importData]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
