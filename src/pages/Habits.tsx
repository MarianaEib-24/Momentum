import { useMemo, useState } from 'react';
import { Plus, Flame, Trash2, CheckCircle2, Trophy, CalendarCheck2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, FadeIn, Field, Modal, Btn, Empty, Chip } from '../components/ui';
import { WeekStrip, Heatmap } from '../components/charts';
import { IconTile, pal, PALETTE, ICONS } from '../components/Icon';
import { habitStreak, lastNDays, todayStr, uid } from '../lib/utils';

export default function Habits() {
  const { data, update, toast } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('flame');
  const [color, setColor] = useState('orange');

  const stats = useMemo(() => {
    const today = todayStr();
    const doneToday = data.habits.filter((h) => h.days[today]).length;
    const week = lastNDays(7);
    const checkins = data.habits.reduce((n, h) => n + week.filter((d) => h.days[d]).length, 0);
    const best = data.habits.reduce((m, h) => Math.max(m, habitStreak(h.days)), 0);
    return { doneToday, checkins, best };
  }, [data]);

  const toggle = (habitId: string, date: string) => {
    const h = data.habits.find((x) => x.id === habitId);
    update((d) => {
      const hh = d.habits.find((x) => x.id === habitId);
      if (!hh) return;
      if (hh.days[date]) delete hh.days[date]; else hh.days[date] = 1;
    }, date === todayStr() && h && !h.days[date] ? { action: 'checked off habit', target: h.name } : undefined);
  };

  const create = () => {
    if (!name.trim()) return;
    update((d) => { d.habits.push({ id: `h${uid()}`, name: name.trim(), icon, color, days: {} }); }, { action: 'started habit', target: name.trim() });
    toast('Habit added — day one starts now', icon);
    setOpen(false); setName('');
  };

  const summary = [
    { icon: CheckCircle2, label: 'Done today', value: `${stats.doneToday}/${data.habits.length}`, hex: pal('emerald').hex },
    { icon: CalendarCheck2, label: 'Check-ins (7d)', value: String(stats.checkins), hex: pal('blue').hex },
    { icon: Trophy, label: 'Best streak', value: `${stats.best} days`, hex: pal('gold').hex },
  ];

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Habits</h1>
          <p className="text-[12.5px] text-mut mt-0.5">The quiet engine. Never miss twice.</p>
        </div>
        <Btn icon={Plus} className="ms-auto" onClick={() => setOpen(true)}>New habit</Btn>
      </FadeIn>

      <FadeIn delay={0.04} className="grid grid-cols-3 gap-3">
        {summary.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-elev flex items-center justify-center shrink-0" style={{ color: s.hex }}><s.icon size={17} /></span>
            <div>
              <p className="text-[16px] font-bold tracking-tight leading-none">{s.value}</p>
              <p className="text-[10.5px] text-mut mt-1">{s.label}</p>
            </div>
          </Card>
        ))}
      </FadeIn>

      {data.habits.length === 0 ? (
        <Card><Empty icon={Flame} title="No habits yet" body="Start with one tiny daily promise." action={<Btn icon={Plus} onClick={() => setOpen(true)}>New habit</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data.habits.map((h, i) => {
            const p = pal(h.color);
            const on = !!h.days[todayStr()];
            const streak = habitStreak(h.days);
            return (
              <FadeIn key={h.id} delay={i * 0.05}>
                <Card hover className="p-5">
                  <div className="flex items-center gap-3">
                    <IconTile icon={h.icon} color={h.color} size={42} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold tracking-tight truncate">{h.name}</h3>
                      <p className="text-[11px] font-semibold inline-flex items-center gap-1" style={{ color: p.hex }}>
                        <Flame size={11} /> {streak} day streak
                        {streak >= 7 && <Chip hex={pal('gold').hex} className="ms-1">On fire</Chip>}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(h.id, todayStr())}
                      className="h-9 px-3.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer active:scale-95 border"
                      style={on
                        ? { background: p.hex, borderColor: p.hex, color: '#fff', boxShadow: `0 6px 16px -6px ${p.hex}` }
                        : { borderColor: 'var(--line)', color: 'var(--mut)' }}
                    >
                      {on ? 'Done today' : 'Mark done'}
                    </button>
                    <button
                      onClick={() => update((d) => { d.habits = d.habits.filter((x) => x.id !== h.id); }, { action: 'retired habit', target: h.name })}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-mut hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete habit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1.5">Last 3 weeks — tap to fill gaps</p>
                    <WeekStrip days={h.days} color={p.hex} count={21} onToggle={(d) => toggle(h.id, d)} />
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1.5">Season view</p>
                    <Heatmap days={h.days} weeks={16} color={p.hex} />
                  </div>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New habit">
        <div className="p-5 space-y-4">
          <Field label="Habit">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9.5 rounded-xl border border-line bg-elev/60 px-3 text-[13px] outline-none focus:border-accent transition" placeholder="e.g. Meditate 10 minutes" autoFocus />
          </Field>
          <Field label="Icon">
            <div className="grid grid-cols-8 gap-1.5">
              {Object.keys(ICONS).slice(0, 24).map((k) => (
                <button key={k} type="button" onClick={() => setIcon(k)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${icon === k ? 'text-white' : 'bg-elev text-mut hover:text-ink'}`}
                  style={icon === k ? { background: pal(color).hex } : undefined}>
                  <IconTileGlyph name={k} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Color">
            <div className="flex gap-1.5 flex-wrap">
              {Object.keys(PALETTE).map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface' : 'opacity-70 hover:opacity-100'}`}
                  style={{ background: PALETTE[c].hex }} />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={create} disabled={!name.trim()}>Add habit</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { Ico } from '../components/Icon';
function IconTileGlyph({ name }: { name: string }) { return <Ico name={name} size={14} />; }
