import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { produce } from 'immer';
import type { AppData, User } from './types';
import { ACHIEVEMENTS } from './achievements';
import { nowIso, todayStr, uid } from './utils';
import { supabase } from './supabase';
import { fetchWorkspaceApi, importWorkspaceApi, resetWorkspaceApi, saveWorkspaceApi, signInApi, signOutApi, signUpApi } from './api';

const THEME_KEY = 'momentum:theme';

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

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') return t;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createEmptyData({ id: '', name: '', email: '', role: '', grad: ['#2f6bff', '#7c5cff'], focus: '' }));
  const [me, setMe] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const hash = window.location.hash;
      const isRecovery = /[?&]type=recovery/.test(hash);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      if (isRecovery) {
        setAuthReady(true);
        return;
      }
      if (sessionData.session?.user) {
        const userId = sessionData.session.user.id;
        const email = sessionData.session.user.email ?? '';
        try {
          const payload = await fetchWorkspaceApi(userId);
          setMe(userId);
          if (payload) {
            setData(payload);
          } else {
            setData(createEmptyData({ id: userId, name: email.split('@')[0], email, role: 'Workspace owner', grad: ['#2f6bff', '#7c5cff'], focus: '' }));
          }
        } catch {
          setMe(null);
        }
      }
      setAuthReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || !session?.user) {
          setMe(null);
          setData(createEmptyData({ id: '', name: '', email: '', role: '', grad: ['#2f6bff', '#7c5cff'], focus: '' }));
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const userId = session.user.id;
          const email = session.user.email ?? '';
          if (me !== userId) {
            setMe(userId);
            try {
              const payload = await fetchWorkspaceApi(userId);
              if (payload) setData(payload);
              else setData(createEmptyData({ id: userId, name: email.split('@')[0], email, role: 'Workspace owner', grad: ['#2f6bff', '#7c5cff'], focus: '' }));
            } catch { /* ignore */ }
          }
        }
      })();
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const result = await signInApi(email, password);
    setMe(result.user.id);
    if (result.data) {
      setData(result.data);
    } else {
      setData(createEmptyData({ id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, grad: result.user.grad, focus: result.user.focus }));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await signUpApi(name, email, password);
    setMe(result.user.id);
    setData(result.data);
  }, []);

  const logout = useCallback(async () => {
    await signOutApi();
    setMe(null);
    setData(createEmptyData({ id: '', name: '', email: '', role: '', grad: ['#2f6bff', '#7c5cff'], focus: '' }));
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
      if (me) {
        void saveWorkspaceApi(me, next).catch(() => {
          toast('Unable to save workspace to the server', 'flag');
        });
      }
      return next;
    });
  }, [me, toast]);

  const resetWorkspace = useCallback(async () => {
    if (me) {
      await resetWorkspaceApi(me);
      const user = data.users[me] ?? { id: me, name: 'You', email: '', role: '', grad: ['#2f6bff', '#7c5cff'], focus: '' };
      setData(createEmptyData(user));
      toast('Workspace reset on server', 'sparkles');
      return;
    }
  }, [data.users, me, toast]);

  const importData = useCallback(async (raw: string): Promise<boolean> => {
    if (me) {
      const ok = await importWorkspaceApi(me, raw).then(() => true).catch(() => false);
      if (ok) {
        const parsed = JSON.parse(raw);
        setData({ ...parsed, v: 3 });
      }
      return ok;
    }
    return false;
  }, [me]);

  // Achievement engine — watches the workspace, celebrates new unlocks.
  useEffect(() => {
    if (!me) return;
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
  }, [data, me, toast, fire]);

  const value = useMemo<Ctx>(() => ({
    data, me,
    meUser: me ? data.users[me] ?? null : null,
    partner: Object.values(data.users).find((u) => u.id !== me) ?? null,
    theme, setTheme, login, register, logout, update,
    toasts, toast, confetti, fire, resetWorkspace, importData,
  }), [data, me, theme, setTheme, login, register, logout, update, toasts, toast, confetti, fire, resetWorkspace, importData]);

  if (!authReady && !me) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#4d84ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
