import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { produce } from 'immer';
import type { AppData, User } from './types';
import { seedData } from '../data/seed';
import { ACHIEVEMENTS } from './achievements';
import { nowIso, todayStr, uid } from './utils';
import { fetchDataApi, getMeApi, importDataApi, loginApi, registerApi, resetWorkspaceApi, saveDataApi } from './api';

const TOKEN_KEY = 'momentum:token';
const THEME_KEY = 'momentum:theme';

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function createEmptyData(user: User): AppData {
  return {
    v: 3,
    users: { [user.id]: user },
    workspace: { name: 'Momentum', since: todayStr() },
    projects: [],
    tasks: [],
    habits: [],
    goals: [],
    journal: [],
    ideas: [],
    plans: [],
    resources: [],
    events: [],
    notifs: [],
    activity: [],
    unlocked: [],
    widgetPrefs: { quote: true, kpis: true, chart: true, habits: true, deadlines: true, activity: true, achieve: true, notif: true },
    settings: {
      notif_mentions: true,
      notif_comments: true,
      notif_deadlines: true,
      notif_habits: true,
      sounds: true,
      weekly_digest: true,
    },
  };
}

export interface Toast { id: string; msg: string; icon?: string; }

type Theme = 'light' | 'dark';

interface Ctx {
  data: AppData;
  me: string | null;
  meUser: User | null;
  partner: User | null;
  theme: Theme;
  setTheme: (t: Theme) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  update: (fn: (d: AppData) => void, act?: { action: string; target: string }) => void;
  toasts: Toast[];
  toast: (msg: string, icon?: string) => void;
  confetti: number;
  fire: () => void;
  resetWorkspace: () => Promise<void>;
  importData: (raw: string) => Promise<boolean>;
}

const StoreCtx = createContext<Ctx | null>(null);

function loadData(): AppData {
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
  const [me, setMe] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    async function init() {
      const authToken = loadToken();
      if (!authToken) return;
      try {
        const { user } = await getMeApi(authToken);
        const payload = await fetchDataApi(authToken);
        const users = await fetchUsersApi();
        const usersMap = Object.fromEntries(users.users.map((u) => [u.id, u]));
        setMe(user.id);
        setToken(authToken);
        setData({ ...payload?.data ?? createEmptyData(user), users: usersMap });
      } catch {
        setToken(null);
        setMe(null);
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      }
    }
    init();
  }, []);

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

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password);
    const users = await fetchUsersApi();
    const usersMap = Object.fromEntries(users.users.map((u) => [u.id, u]));
    setToken(result.token);
    setMe(result.user.id);
    try { localStorage.setItem(TOKEN_KEY, result.token); } catch { /* ignore */ }
    setData({ ...result.data ?? createEmptyData(result.user), users: usersMap });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await registerApi(name, email, password);
    const users = await fetchUsersApi();
    const usersMap = Object.fromEntries(users.users.map((u) => [u.id, u]));
    setToken(result.token);
    setMe(result.user.id);
    try { localStorage.setItem(TOKEN_KEY, result.token); } catch { /* ignore */ }
    setData({ ...result.data ?? createEmptyData(result.user), users: usersMap });
  }, []);

  const logout = useCallback(() => {
    setMe(null);
    setToken(null);
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  }, []);

  const update = useCallback((fn: (d: AppData) => void, act?: { action: string; target: string }) => {
    setData((prev) => {
      const next = produce(prev, (d) => {
        fn(d);
        if (act) {
          d.activity.unshift({ id: uid(), actor: me ?? 'unknown', action: act.action, target: act.target, at: nowIso() });
          if (d.activity.length > 60) d.activity.length = 60;
        }
      });
      if (token) {
        void saveDataApi(token, next).catch(() => {
          toast('Unable to save workspace to the server', 'flag');
        });
      }
      return next;
    });
  }, [me, token, toast]);

  const resetWorkspace = useCallback(async () => {
    if (token && me) {
      await resetWorkspaceApi(token);
      const user = data.users[me] ?? { id: me, name: 'You', email: '', role: '', grad: ['#2f6bff', '#7c5cff'], focus: '' };
      setData(createEmptyData(user));
      toast('Workspace reset on server', 'sparkles');
      return;
    }
    setData(seedData());
    toast('Workspace restored to demo data', 'sparkles');
  }, [data.users, me, token, toast]);

  const importData = useCallback(async (raw: string): Promise<boolean> => {
    if (token) {
      const ok = await importDataApi(token, raw).then(() => true).catch(() => false);
      if (ok) {
        const parsed = JSON.parse(raw);
        setData({ ...parsed, v: 3 });
      }
      return ok;
    }
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
  }, [token]);

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
    partner: Object.values(data.users).find((u) => u.id !== me) ?? null,
    theme, setTheme, login, register, logout, update,
    toasts, toast, confetti, fire, resetWorkspace, importData,
  }), [data, me, theme, setTheme, login, register, logout, update, toasts, toast, confetti, fire, resetWorkspace, importData]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

// // Achievement engine — watches the workspace, celebrates new unlocks.
// useEffect(() => {
//   const fresh = ACHIEVEMENTS.filter((a) => !data.unlocked.includes(a.id) && a.check(data));
//   if (fresh.length === 0) return;
//   const t = window.setTimeout(() => {
//     setData((prev) => produce(prev, (d) => {
//       for (const a of fresh) {
//         if (d.unlocked.includes(a.id)) continue;
//         d.unlocked.push(a.id);
//         d.notifs.unshift({ id: uid(), icon: a.icon, text: `Achievement unlocked — ${a.title}`, at: nowIso(), read: false, type: 'achievement' });
//       }
//     }));
//     fresh.forEach((a, i) => window.setTimeout(() => toast(`Achievement unlocked — ${a.title}`, a.icon), i * 600));
//     fire();
//   }, 900);
//   return () => window.clearTimeout(t);
// }, [data, toast, fire]);

// const value = useMemo<Ctx>(() => ({
//   data, me,
//   meUser: me ? data.users[me] ?? null : null,
//   partner: me ? data.users[me === 'alex' ? 'jordan' : 'alex'] ?? null : null,
//   theme, setTheme, login, logout, update,
//   toasts, toast, confetti, fire, resetDemo, importData,
// }), [data, me, theme, setTheme, login, logout, update, toasts, toast, confetti, fire, resetDemo, importData]);

// return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
// }

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
