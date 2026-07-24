import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Target, Flame, CalendarDays, PenLine, Lightbulb, Telescope,
  Library, BarChart3, Bell, User as UserIcon, Settings, Search, Moon, Sun,
  Menu, X, FolderKanban, LogOut, Check, Wifi, WifiOff, ChevronsRight,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar } from './ui';
import { Ico, pal } from './Icon';
import { Confetti } from './Confetti';
import { relTime } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';

export const NAV: { section: string; items: { to: string; label: string; icon: LucideIcon }[] }[] = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/goals', label: 'Goals', icon: Target },
      { to: '/habits', label: 'Habits', icon: Flame },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    section: 'Create',
    items: [
      { to: '/journal', label: 'Journal', icon: PenLine },
      { to: '/brainstorm', label: 'Brainstorm', icon: Lightbulb },
      { to: '/future', label: 'Future Plans', icon: Telescope },
      { to: '/resources', label: 'Resources', icon: Library },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { to: '/stats', label: 'Statistics', icon: BarChart3 },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile', icon: UserIcon },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="relative h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-[0_6px_16px_-4px_var(--accent)]"
        style={{ background: 'linear-gradient(135deg, #0d1b3e, var(--accent))' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div className="text-[15px] font-bold tracking-tight leading-none">Momentum</div>
        <div className="text-[10px] font-medium text-mut mt-1 tracking-wide">PRIVATE WORKSPACE</div>
      </div>
    </div>
  );
}

function SyncChip() {
  const [online, setOnline] = useState(navigator.onLine);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.clearInterval(id); };
  }, []);
  void tick;
  return (
    <div className="hidden md:flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 h-8 text-[11px] font-medium text-mut">
      {online
        ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" /><Wifi size={12} className="text-emerald-500" /> Synced</>
        : <><span className="h-1.5 w-1.5 rounded-full bg-amber-500 pulse-dot" /><WifiOff size={12} className="text-amber-500" /> Offline · saved locally</>}
    </div>
  );
}

function Presence() {
  const { partner } = useStore();
  const [i, setI] = useState(0);
  const states = ['Online now', 'In deep work', 'Active 4m ago', 'Online now'];
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % states.length), 22000);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!partner) return null;
  const online = states[i] !== 'Active 4m ago';
  return (
    <div className="rounded-xl border border-line bg-elev/50 p-2.5 flex items-center gap-2.5">
      <div className="relative">
        <Avatar user={partner} size={30} />
        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${online ? 'bg-emerald-500 pulse-dot' : 'bg-amber-500'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate">{partner.name.split(' ')[0]}</p>
        <p className="text-[10px] text-mut truncate">{states[i]}</p>
      </div>
      <span className="ml-auto text-[9.5px] font-semibold text-emerald-500 bg-emerald-500/10 rounded px-1.5 py-0.5">PARTNER</span>
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const loc = useLocation();

  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 40); } }, [open]);
  useEffect(() => { onClose(); }, [loc.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = (s: string) => !query || s.toLowerCase().includes(query);
    const pages = NAV.flatMap((s) => s.items).filter((p) => match(p.label)).map((p) => ({
      group: 'Go to', label: p.label, sub: 'Page', to: p.to, run: () => nav(p.to),
      icon: <p.icon size={16} className="text-mut" />,
    }));
    const projects = data.projects.filter((p) => match(p.name)).map((p) => ({
      group: 'Projects', label: p.name, sub: p.tag, to: `/projects/${p.id}`,
      icon: <Ico name={p.icon} size={15} className="" />, hex: pal(p.color).hex, run: () => nav(`/projects/${p.id}`),
    }));
    const tasks = data.tasks.filter((t) => t.status !== 'done' && match(t.title)).slice(0, 6).map((t) => ({
      group: 'Open tasks', label: t.title, sub: data.projects.find((p) => p.id === t.projectId)?.name ?? '', to: `/projects/${t.projectId}`,
      icon: <Check size={15} className="text-mut" />, run: () => nav(`/projects/${t.projectId}`),
    }));
    return [...projects, ...tasks, ...pages].slice(0, 12);
  }, [q, data, nav]);

  useEffect(() => setIdx(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(groups.length - 1, i + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    if (e.key === 'Enter' && groups[idx]) { groups[idx].run(); onClose(); }
    if (e.key === 'Escape') onClose();
  };

  let lastGroup = '';
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#060a14]/60 glass" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-xl rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-line">
              <Search size={17} className="text-mut shrink-0" />
              <input
                ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Search pages, projects, tasks…"
                className="w-full h-13 bg-transparent outline-none text-[15px] placeholder:text-mut/60"
              />
              <span className="kbd">ESC</span>
            </div>
            <div className="max-h-[46vh] overflow-y-auto scroll-thin p-2">
              {groups.length === 0 && <p className="text-sm text-mut text-center py-8">No results for “{q}”</p>}
              {groups.map((g, i) => {
                const head = g.group !== lastGroup;
                lastGroup = g.group;
                return (
                  <div key={i}>
                    {head && <p className="text-[10px] font-bold uppercase tracking-widest text-mut px-3 pt-3 pb-1.5">{g.group}</p>}
                    <button
                      onClick={() => { g.run(); onClose(); }}
                      onMouseEnter={() => setIdx(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${i === idx ? 'bg-elev' : ''}`}
                    >
                      <span className="h-8 w-8 rounded-lg bg-elev border border-line flex items-center justify-center shrink-0" style={{ color: (g as { hex?: string }).hex }}>{g.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium truncate">{g.label}</span>
                        <span className="block text-[11px] text-mut truncate">{g.sub}</span>
                      </span>
                      {i === idx && <span className="kbd">ENTER</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-5 right-5 z-[99] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 18, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/95 glass px-3.5 py-2.5 shadow-xl max-w-xs"
          >
            {t.icon && <span className="h-7 w-7 rounded-lg bg-elev flex items-center justify-center text-accent shrink-0"><Ico name={t.icon} size={15} /></span>}
            <p className="text-[12.5px] font-medium leading-snug">{t.msg}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function UserMenu() {
  const { meUser, logout } = useStore();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!meUser) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95">
        <Avatar user={meUser} size={34} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-11 w-60 rounded-2xl border border-line bg-surface shadow-2xl p-1.5 z-50"
          >
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <Avatar user={meUser} size={36} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate">{meUser.name}</p>
                <p className="text-[11px] text-mut truncate">{meUser.email}</p>
              </div>
            </div>
            <div className="h-px bg-line my-1" />
            {[{ to: '/profile', label: 'Profile', icon: UserIcon }, { to: '/settings', label: 'Settings', icon: Settings }].map((i) => (
              <button key={i.to} onClick={() => { nav(i.to); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-elev transition-colors cursor-pointer">
                <i.icon size={15} className="text-mut" /> {i.label}
              </button>
            ))}
            <div className="h-px bg-line my-1" />
            <button onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
              <LogOut size={15} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Shell() {
  const { theme, setTheme, data, confetti } = useStore();
  const [sideOpen, setSideOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const unread = data.notifs.filter((n) => !n.read).length;

  useEffect(() => { setSideOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Sidebar */}
      <AnimatePresence>
        {sideOpen && (
          <motion.div className="fixed inset-0 z-40 bg-[#060a14]/50 glass lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSideOpen(false)} />
        )}
      </AnimatePresence>
      <aside className={`fixed inset-y-0 left-0 z-50 w-66 flex flex-col border-r border-line bg-surface/80 dark:bg-surface/70 glass transition-transform duration-300 lg:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between pr-3 pl-4 shrink-0">
          <Logo />
          <button className="lg:hidden h-8 w-8 rounded-lg hover:bg-elev flex items-center justify-center text-mut cursor-pointer" onClick={() => setSideOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-2 space-y-5">
          {NAV.map((sec) => (
            <div key={sec.section}>
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mut/80">{sec.section}</p>
              <div className="space-y-0.5">
                {sec.items.map((item) => (
                  <NavLink
                    key={item.to} to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${isActive ? 'text-ink bg-elev shadow-[inset_0_0_0_1px_var(--line)]' : 'text-mut hover:text-ink hover:bg-elev/60'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <motion.span layoutId="nav-pill" className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-accent" />}
                        <item.icon size={16.5} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? 'text-accent' : 'group-hover:text-ink'} />
                        {item.label}
                        {item.to === '/notifications' && unread > 0 && (
                          <span className="ml-auto h-4.5 min-w-4.5 px-1 rounded-full bg-accent text-white text-[9.5px] font-bold flex items-center justify-center">{unread}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 space-y-2.5 shrink-0">
          <Presence />
          <div className="flex items-center justify-between rounded-xl border border-line bg-elev/50 px-3 py-2">
            <span className="text-[11px] font-medium text-mut flex items-center gap-1.5">
              {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />} {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative h-6 w-11 rounded-full bg-line transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow flex items-center justify-center ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`}>
                {theme === 'dark' ? <Moon size={11} className="text-[#0d1526]" /> : <Sun size={11} className="text-amber-500" />}
              </motion.span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-66 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 border-b border-line bg-bg/75 dark:bg-bg/70 glass">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3">
            <button className="lg:hidden h-9 w-9 rounded-xl hover:bg-elev flex items-center justify-center text-mut cursor-pointer" onClick={() => setSideOpen(true)}>
              <Menu size={18} />
            </button>
            <button
              onClick={() => setPalette(true)}
              className="flex items-center gap-2.5 h-9.5 w-full max-w-80 rounded-xl border border-line bg-surface/70 px-3 text-[13px] text-mut hover:border-accent/40 hover:bg-surface transition-all cursor-text"
            >
              <Search size={15} />
              <span className="flex-1 text-left truncate">Search anything…</span>
              <span className="kbd hidden sm:block">{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} K</span>
            </button>
            <div className="flex-1" />
            <SyncChip />
            <button
              onClick={() => nav('/notifications')}
              className="relative h-9.5 w-9.5 rounded-xl border border-line bg-surface/70 hover:bg-surface flex items-center justify-center text-mut hover:text-ink transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unread > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-bg">{unread}</span>}
            </button>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1440px] mx-auto">
          <Outlet />
        </main>
        <footer className="px-8 pb-6 text-[11px] text-mut/60 flex items-center gap-1.5">
          <ChevronsRight size={12} /> Momentum · private workspace for two · data lives in your browser · {relTime(data.activity[0]?.at ?? new Date().toISOString())} last activity
        </footer>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Toasts />
      <Confetti fireKey={confetti} />
    </div>
  );
}
