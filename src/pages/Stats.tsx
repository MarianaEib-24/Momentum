import { useMemo, useState } from 'react';
import { TrendingUp, PieChart as PieIcon, Activity, BrainCircuit } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, SectionTitle, FadeIn, IconStat } from './StatsBits';
import { AreaChart, Donut, Bars, Heatmap } from '../components/charts';
import { pal } from '../components/Icon';
import { habitStreak, lastNDays, weekDayShort } from '../lib/utils';

export default function Stats() {
  const { data } = useStore();
  const [heatHabit, setHeatHabit] = useState(data.habits[0]?.id ?? '');

  const stats = useMemo(() => {
    const total = data.tasks.length;
    const done = data.tasks.filter((t) => t.status === 'done').length;
    const day14 = lastNDays(14);
    const perDay = day14.map((d) => data.tasks.filter((t) => t.doneAt === d).length);
    const comments = data.tasks.reduce((n, t) => n + t.comments.length, 0);
    const bestStreak = data.habits.reduce((m, h) => Math.max(m, habitStreak(h.days)), 0);
    const goalPct = Math.round(data.goals.reduce((n, g) => n + Math.min(1, g.current / g.target), 0) / Math.max(1, data.goals.length) * 100);
    const byStatus = [
      { label: 'To do', value: data.tasks.filter((t) => t.status === 'todo').length, color: '#8d99b5' },
      { label: 'In progress', value: data.tasks.filter((t) => t.status === 'active').length, color: '#2f6bff' },
      { label: 'Review', value: data.tasks.filter((t) => t.status === 'review').length, color: '#d99a17' },
      { label: 'Done', value: done, color: '#0da678' },
    ];
    const perProject = data.projects.map((p) => {
      const ts = data.tasks.filter((t) => t.projectId === p.id);
      const dn = ts.filter((t) => t.status === 'done').length;
      return { label: p.name.split(' ')[0], value: ts.length ? Math.round((dn / ts.length) * 100) : 0, color: pal(p.color).hex };
    });
    const insights: string[] = [];
    const busiest = Math.max(...perDay);
    if (busiest > 0) insights.push(`Best day in the last two weeks: ${busiest} task${busiest > 1 ? 's' : ''} completed.`);
    const topStreakHabit = data.habits.find((h) => habitStreak(h.days) === bestStreak);
    if (topStreakHabit) insights.push(`"${topStreakHabit.name}" holds the longest active streak at ${bestStreak} days.`);
    const riskProjects = data.projects.filter((p) => p.status === 'at-risk').length;
    if (riskProjects > 0) insights.push(`${riskProjects} project${riskProjects > 1 ? 's are' : ' is'} flagged at-risk — worth a review in the next partner sync.`);
    const overdue = data.tasks.filter((t) => t.due && t.status !== 'done' && t.due < new Date().toISOString().slice(0, 10)).length;
    insights.push(overdue ? `${overdue} overdue task${overdue > 1 ? 's' : ''} need triage.` : 'Zero overdue tasks — the queue is clean.');
    if (goalPct >= 60) insights.push(`Collective goal completion is ${goalPct}% — compounding nicely.`);
    return { total, done, perDay, day14, comments, bestStreak, goalPct, byStatus, perProject, insights };
  }, [data]);

  const habit = data.habits.find((h) => h.id === heatHabit) ?? data.habits[0];

  return (
    <div className="space-y-5">
      <FadeIn>
        <h1 className="text-[22px] font-bold tracking-tight">Statistics</h1>
        <p className="text-[12.5px] text-mut mt-0.5">The scoreboard for two. Numbers update live from the workspace.</p>
      </FadeIn>

      <FadeIn delay={0.04} className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <IconStat label="Completion rate" value={`${stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%`} sub={`${stats.done}/${stats.total} tasks`} hex="#2f6bff" />
        <IconStat label="Best streak" value={`${stats.bestStreak}d`} sub="across all habits" hex="#f07030" />
        <IconStat label="Comments posted" value={String(stats.comments)} sub="partner conversation" hex="#7c5cff" />
        <IconStat label="Goal completion" value={`${stats.goalPct}%`} sub={`${data.goals.length} goals`} hex="#0da678" />
      </FadeIn>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <FadeIn delay={0.08} className="xl:col-span-2 space-y-5">
          <Card className="p-5">
            <SectionTitle title="Throughput" sub="Completed tasks per day — last 14 days" right={<TrendingUp size={16} className="text-accent" />} />
            <AreaChart values={stats.perDay} height={190} labels={stats.day14.filter((_, i) => i % 2 === 0).map((d) => weekDayShort(d))} />
          </Card>
          <Card className="p-5">
            <SectionTitle title="Project progress" sub="Percent of tasks completed, per project" right={<Activity size={16} className="text-accent" />} />
            <Bars data={stats.perProject} height={170} />
          </Card>
          <Card className="p-5">
            <SectionTitle title="Insights" sub="What the numbers are telling you" right={<BrainCircuit size={16} className="text-accent" />} />
            <ul className="space-y-2">
              {stats.insights.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-ink/90">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </FadeIn>

        <FadeIn delay={0.12} className="space-y-5">
          <Card className="p-5">
            <SectionTitle title="Task mix" sub="Board distribution" right={<PieIcon size={16} className="text-accent" />} />
            <div className="flex items-center gap-5">
              <div className="relative">
                <Donut slices={stats.byStatus} size={150} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-bold">{stats.total}</span>
                  <span className="text-[10px] text-mut -mt-0.5">tasks</span>
                </div>
              </div>
              <div className="space-y-2.5 flex-1">
                {stats.byStatus.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-[12px] font-medium">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="flex-1">{s.label}</span>
                    <span className="font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle
              title="Consistency"
              sub="Habit history — season view"
              right={
                <select value={habit?.id ?? ''} onChange={(e) => setHeatHabit(e.target.value)}
                  className="h-7.5 rounded-lg border border-line bg-surface px-2 text-[11.5px] font-medium cursor-pointer outline-none">
                  {data.habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              }
            />
            {habit && (
              <>
                <Heatmap days={habit.days} weeks={20} color={pal(habit.color).hex} className="justify-center" />
                <div className="mt-3 flex items-center justify-between text-[10.5px] text-mut">
                  <span>20 weeks ago</span>
                  <span className="inline-flex items-center gap-1">
                    Less <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: 'var(--line)' }} />
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: pal(habit.color).hex, opacity: 0.5 }} />
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: pal(habit.color).hex }} /> More
                  </span>
                  <span>Today</span>
                </div>
              </>
            )}
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
