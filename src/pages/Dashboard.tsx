import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Flame, CheckCircle2, Timer, Target, SlidersHorizontal, ArrowRight, Lock, Quote, Sparkles,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, SectionTitle, Progress, Avatar, FadeIn, Empty, Toggle, Chip } from '../components/ui';
import { AreaChart } from '../components/charts';
import { Ico, IconTile, pal } from '../components/Icon';
import { greet, habitStreak, lastNDays, pretty, prettyFull, relTime, todayStr, daysUntil, weekDayShort, getVisibleProjects, getVisibleTasks } from '../lib/utils';

const QUOTES = [
  { t: 'We are what we repeatedly do. Excellence is not an act, but a habit.', by: 'Will Durant' },
  { t: 'The way to get started is to quit talking and begin doing.', by: 'Walt Disney' },
  { t: 'Champions keep playing until they get it right.', by: 'Billie Jean King' },
  { t: 'Everything negative — pressure, challenges — is an opportunity to rise.', by: 'Kobe Bryant' },
  { t: 'Compound interest is the eighth wonder of the world.', by: 'attr. Albert Einstein' },
  { t: 'A river cuts through rock not because of its power, but its persistence.', by: 'Jim Watkins' },
  { t: 'Great things in business are never done by one person.', by: 'Steve Jobs' },
  { t: 'The future belongs to those who prepare for it today.', by: 'Malcolm X' },
];

interface Deadline { id: string; title: string; date: string; color: string; icon: string; to: string; kind: string; }

export default function Dashboard() {
  const { data, meUser, partner, update, me } = useStore();
  const nav = useNavigate();
  const [qi, setQi] = useState(0);
  const [customizing, setCustomizing] = useState(false);
  const custRef = useRef<HTMLDivElement>(null);
  const prefs = data.widgetPrefs;

  useEffect(() => {
    const id = window.setInterval(() => setQi((i) => (i + 1) % QUOTES.length), 9000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!custRef.current?.contains(e.target as Node)) setCustomizing(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const stats = useMemo(() => {
    const week = lastNDays(7);
    const visibleProjects = getVisibleProjects(data.projects, me);
    const visibleTasks = getVisibleTasks(data.tasks, visibleProjects, me);
    const doneThisWeek = visibleTasks.filter((t) => t.doneAt && week.includes(t.doneAt)).length;
    const perDay = week.map((d) => visibleTasks.filter((t) => t.doneAt === d).length);
    const bestStreak = data.habits.reduce((m, h) => Math.max(m, habitStreak(h.days)), 0);
    const deepFocus = data.habits.find((h) => h.name.includes('Deep work'));
    const focusHours = deepFocus ? week.filter((d) => deepFocus.days[d]).length * 2 : 0;
    const goalPct = Math.round(data.goals.reduce((n, g) => n + Math.min(1, g.current / g.target), 0) / Math.max(1, data.goals.length) * 100);
    const openTasks = visibleTasks.filter((t) => t.status !== 'done').length;
    return { week, doneThisWeek, perDay, bestStreak, focusHours, goalPct, openTasks };
  }, [data, me]);

  const deadlines = useMemo<Deadline[]>(() => {
    const visibleProjects = getVisibleProjects(data.projects, me);
    const visibleTasks = getVisibleTasks(data.tasks, visibleProjects, me);
    const out: Deadline[] = [];
    for (const t of visibleTasks) {
      if (t.status === 'done' || !t.due || daysUntil(t.due) < 0 || daysUntil(t.due) > 10) continue;
      const p = visibleProjects.find((x) => x.id === t.projectId);
      out.push({ id: t.id, title: t.title, date: t.due, color: pal(p?.color ?? 'blue').hex, icon: p?.icon ?? 'flag', to: `/projects/${t.projectId}`, kind: 'Task' });
    }
    for (const p of visibleProjects) {
      for (const m of p.milestones) {
        if (m.done || daysUntil(m.date) < 0 || daysUntil(m.date) > 10) continue;
        out.push({ id: m.id, title: `${m.title} — ${p.name}`, date: m.date, color: pal(p.color).hex, icon: 'flag', to: `/projects/${p.id}`, kind: 'Milestone' });
      }
    }
    for (const e of data.events) {
      if (daysUntil(e.date) < 0 || daysUntil(e.date) > 10) continue;
      out.push({ id: e.id, title: `${e.title} · ${e.time}`, date: e.date, color: pal(e.color).hex, icon: 'compass', to: '/calendar', kind: 'Event' });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  }, [data]);

  const dueLabel = (d: string) => {
    const n = daysUntil(d);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    return `${n}d`;
  };

  const kpis = [
    { icon: CheckCircle2, label: 'Completed this week', value: String(stats.doneThisWeek), sub: `${stats.openTasks} open across ${getVisibleProjects(data.projects, me).length} projects`, hex: pal('blue').hex, soft: pal('blue').soft },
    { icon: Flame, label: 'Best active streak', value: `${stats.bestStreak} days`, sub: data.habits.find((h) => habitStreak(h.days) === stats.bestStreak)?.name ?? '', hex: pal('orange').hex, soft: pal('orange').soft },
    { icon: Timer, label: 'Focus hours (7d)', value: `${stats.focusHours}h`, sub: 'Deep work blocks logged', hex: pal('violet').hex, soft: pal('violet').soft },
    { icon: Target, label: 'Goals on track', value: `${stats.goalPct}%`, sub: `${data.goals.length} active goals`, hex: pal('emerald').hex, soft: pal('emerald').soft },
  ];

  const prefItems: { key: keyof typeof prefs; label: string }[] = [
    { key: 'quote', label: 'Daily quote' },
    { key: 'kpis', label: 'KPI cards' },
    { key: 'chart', label: 'Productivity chart' },
    { key: 'habits', label: 'Habit tracker' },
    { key: 'deadlines', label: 'Upcoming deadlines' },
    { key: 'activity', label: 'Recent activity' },
    { key: 'achieve', label: 'Achievements' },
    { key: 'notif', label: 'Notifications' },
  ];

  const allOff = Object.values(prefs).every((v) => !v);

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-line mesh bg-surface p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mut">{prettyFull(todayStr())}</p>
              <h1 className="mt-1.5 text-[24px] sm:text-[28px] font-bold tracking-tight leading-tight">
                {greet()}, {meUser?.name.split(' ')[0]}.
              </h1>
              <p className="mt-1 text-[13px] text-mut">
                {partner?.name.split(' ')[0]} is {stats.openTasks > 0 ? `in sync — ${stats.openTasks} open tasks, ${deadlines.length} deadlines ahead.` : 'away.'}
              </p>
            </div>
            <div className="relative" ref={custRef}>
              <button
                onClick={() => setCustomizing((c) => !c)}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-line bg-surface/70 text-[12.5px] font-medium hover:bg-elev transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={14} /> Customize
              </button>
              <AnimatePresence>
                {customizing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-11 z-40 w-64 rounded-2xl border border-line bg-surface shadow-2xl p-2"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-mut">Dashboard widgets</p>
                    {prefItems.map((p) => (
                      <div key={p.key} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-elev">
                        <span className="text-[13px] font-medium">{p.label}</span>
                        <Toggle on={prefs[p.key]} onChange={(v) => update((d) => { d.widgetPrefs[p.key] = v; })} />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {prefs.quote && (
            <div className="mt-5 flex items-start gap-3">
              <span className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: pal('gold').soft, color: pal('gold').hex }}>
                <Quote size={15} />
              </span>
              <div className="min-h-[42px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={qi}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45 }}
                  >
                    <p className="text-[14.5px] font-medium leading-snug italic">“{QUOTES[qi].t}”</p>
                    <p className="text-[11px] text-mut mt-1 not-italic">— {QUOTES[qi].by}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {allOff && (
        <Card>
          <Empty icon={Sparkles} title="A blank canvas" body="Every widget is hidden. Turn some back on to see your momentum."
            action={<Chip className="cursor-pointer px-3! !py-1.5" ><button onClick={() => update((d) => { d.widgetPrefs = { quote: true, kpis: true, chart: true, habits: true, deadlines: true, activity: true, achieve: true, notif: true }; })} className="cursor-pointer">Restore all widgets</button></Chip>} />
        </Card>
      )}

      {/* KPI row */}
      {prefs.kpis && (
        <FadeIn delay={0.05} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card hover className="p-4.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mut">{k.label}</p>
                    <p className="mt-1.5 text-[26px] font-bold tracking-tight leading-none">{k.value}</p>
                    <p className="mt-1.5 text-[11px] text-mut truncate">{k.sub}</p>
                  </div>
                  <span className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.soft, color: k.hex }}>
                    <k.icon size={19} />
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </FadeIn>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left 2 cols */}
        <div className="xl:col-span-2 space-y-5">
          {prefs.chart && (
            <FadeIn delay={0.1}>
              <Card className="p-5">
                <SectionTitle
                  title="Productivity"
                  sub="Tasks completed per day, last 7 days"
                  right={<Chip className="text-[11px]!">{stats.doneThisWeek} done this week</Chip>}
                />
                <AreaChart values={stats.perDay} labels={stats.week.map((d) => weekDayShort(d))} height={170} />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {data.projects.slice(0, 3).map((p) => {
                    const ts = data.tasks.filter((t) => t.projectId === p.id);
                    const done = ts.filter((t) => t.status === 'done').length;
                    const v = ts.length ? done / ts.length : 0;
                    return (
                      <Link key={p.id} to={`/projects/${p.id}`} className="rounded-xl border border-line p-3 hover:bg-elev/60 transition-colors">
                        <div className="flex items-center gap-2">
                          <Ico name={p.icon} size={13} className="shrink-0" />
                          <p className="text-[11.5px] font-semibold truncate">{p.name}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={v * 100} color={pal(p.color).hex} h={5} />
                          <span className="text-[10.5px] font-bold text-mut shrink-0">{Math.round(v * 100)}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </FadeIn>
          )}

          {prefs.activity && (
            <FadeIn delay={0.15}>
              <Card className="p-5">
                <SectionTitle title="Recent activity" sub="Everything both of you touched, instantly synced" />
                <div className="space-y-1">
                  {data.activity.slice(0, 7).map((a, i) => {
                    const u = data.users[a.actor];
                    if (!u) return null;
                    return (
                      <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-elev/60 transition-colors">
                        <Avatar user={u} size={30} />
                        <p className="text-[13px] min-w-0 flex-1 truncate">
                          <span className="font-semibold">{u.name.split(' ')[0]}</span>
                          <span className="text-mut"> {a.action} </span>
                          <span className="font-medium">{a.target}</span>
                        </p>
                        <span className="text-[11px] text-mut shrink-0">{relTime(a.at)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>
            </FadeIn>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {prefs.habits && (
            <FadeIn delay={0.12}>
              <Card className="p-5">
                <SectionTitle
                  title="Today's habits"
                  sub="Small promises, kept daily"
                  right={<Link to="/habits" className="text-[11.5px] font-semibold text-accent inline-flex items-center gap-1">All <ArrowRight size={11} /></Link>}
                />
                <div className="space-y-2">
                  {data.habits.map((h) => {
                    const on = !!h.days[todayStr()];
                    const streak = habitStreak(h.days);
                    const p = pal(h.color);
                    return (
                      <button
                        key={h.id}
                        onClick={() => update((d) => {
                          const hh = d.habits.find((x) => x.id === h.id);
                          if (!hh) return;
                          if (hh.days[todayStr()]) delete hh.days[todayStr()];
                          else hh.days[todayStr()] = 1;
                        }, { action: on ? 'unchecked habit' : 'checked off', target: h.name })}
                        className="w-full flex items-center gap-3 rounded-xl border border-line p-2.5 hover:bg-elev/60 transition-all cursor-pointer group"
                      >
                        <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all" style={{ background: on ? p.hex : p.soft, color: on ? '#fff' : p.hex }}>
                          <Ico name={h.icon} size={16} />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className={`block text-[13px] font-semibold truncate ${on ? 'line-through opacity-50' : ''}`}>{h.name}</span>
                          <span className="text-[10.5px] text-mut inline-flex items-center gap-1">
                            <Flame size={10} style={{ color: p.hex }} /> {streak} day streak
                          </span>
                        </span>
                        <span className={`h-5.5 w-5.5 rounded-full border-2 flex items-center justify-center transition-all ${on ? 'border-transparent' : 'border-line group-hover:border-accent'}`} style={{ background: on ? p.hex : 'transparent' }}>
                          {on && <CheckCircle2 size={13} className="text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </FadeIn>
          )}

          {prefs.deadlines && (
            <FadeIn delay={0.18}>
              <Card className="p-5">
                <SectionTitle title="Upcoming deadlines" sub="Next 10 days" right={
                  <Link to="/calendar" className="text-[11.5px] font-semibold text-accent inline-flex items-center gap-1">Calendar <ArrowRight size={11} /></Link>
                } />
                <div className="space-y-1.5">
                  {deadlines.length === 0 && <p className="text-[12.5px] text-mut py-3">Nothing due soon — clear skies.</p>}
                  {deadlines.map((d) => (
                    <button key={d.id + d.kind} onClick={() => nav(d.to)} className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-elev/60 transition-colors cursor-pointer text-left">
                      <IconTile icon={d.icon} color="blue" size={30} radius={9} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-medium truncate">{d.title}</span>
                        <span className="text-[10.5px] text-mut">{d.kind} · {pretty(d.date)}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${daysUntil(d.date) === 0 ? 'text-white' : 'text-mut bg-elev'}`} style={daysUntil(d.date) === 0 ? { background: '#e24a6d' } : undefined}>
                        {dueLabel(d.date)}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}

          {prefs.notif && (
            <FadeIn delay={0.22}>
              <Card className="p-5">
                <SectionTitle title="Notifications" sub="What's new since you looked" right={
                  <Link to="/notifications" className="text-[11.5px] font-semibold text-accent inline-flex items-center gap-1">View all <ArrowRight size={11} /></Link>
                } />
                <div className="space-y-1.5">
                  {data.notifs.slice(0, 4).map((n) => (
                    <Link to="/notifications" key={n.id} className="flex items-start gap-2.5 rounded-xl px-2 py-2 hover:bg-elev/60 transition-colors">
                      <IconTile icon={n.icon} color={n.type === 'achievement' ? 'gold' : n.type === 'mention' ? 'blue' : 'emerald'} size={30} radius={9} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[12.5px] leading-snug ${n.read ? 'text-mut' : 'font-medium'}`}>{n.text}</span>
                        <span className="text-[10.5px] text-mut">{relTime(n.at)}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />}
                    </Link>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}

          {prefs.achieve && (
            <FadeIn delay={0.26}>
              <Card className="p-5">
                <SectionTitle title="Achievements" sub={`${data.unlocked.length} of 8 unlocked`} right={
                  <Link to="/profile" className="text-[11.5px] font-semibold text-accent inline-flex items-center gap-1">Showcase <ArrowRight size={11} /></Link>
                } />
                <AchievementGrid compact />
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}

import { ACHIEVEMENTS } from '../lib/achievements';

export function AchievementGrid({ compact = false }: { compact?: boolean }) {
  const { data } = useStore();
  return (
    <div className={`grid ${compact ? 'grid-cols-4 gap-2' : 'grid-cols-2 sm:grid-cols-4 gap-3'}`}>
      {ACHIEVEMENTS.map((a) => {
        const un = data.unlocked.includes(a.id);
        const p = pal(a.color);
        return (
          <div
            key={a.id}
            title={a.desc}
            className={`rounded-xl border p-3 text-center transition-all ${un ? 'border-line bg-elev/50' : 'border-dashed border-line opacity-55'}`}
          >
            <div
              className="mx-auto h-10 w-10 rounded-xl flex items-center justify-center relative"
              style={{ background: un ? p.soft : 'var(--elev)', color: un ? p.hex : 'var(--mut)' }}
            >
              {un ? <Ico name={a.icon} size={18} /> : <Lock size={15} />}
            </div>
            <p className="mt-2 text-[10.5px] font-bold leading-tight truncate">{a.title}</p>
            {!compact && <p className="mt-0.5 text-[9.5px] text-mut leading-tight">{a.desc}</p>}
          </div>
        );
      })}
    </div>
  );
}
