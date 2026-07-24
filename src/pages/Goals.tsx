import { useState } from 'react';
import { Plus, Minus, Target, CalendarClock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, Chip, Empty, FadeIn, Field, Modal, Progress, Btn, inputCls } from '../components/ui';
import { Ring } from '../components/charts';
import { IconTile, pal, PALETTE } from '../components/Icon';
import { daysUntil, pretty, shiftDays, uid } from '../lib/utils';

const CAT_ICON: Record<string, string> = {
  Finance: 'wallet', Product: 'rocket', Cars: 'car', Basketball: 'trophy',
  Fitness: 'dumbbell', Travel: 'plane', Home: 'building', Craft: 'pen',
};

export default function Goals() {
  const { data, update, toast, fire } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('Finance');
  const [color, setColor] = useState('gold');
  const [target, setTarget] = useState('100');
  const [unit, setUnit] = useState('%');
  const [deadline, setDeadline] = useState(shiftDays(60));

  const bump = (id: string, dir: 1 | -1) => {
    const g = data.goals.find((x) => x.id === id);
    if (!g) return;
    const step = Math.max(1, Math.round(g.target / 20));
    const next = Math.min(g.target, Math.max(0, g.current + dir * step));
    update((d) => { const gg = d.goals.find((x) => x.id === id); if (gg) gg.current = next; },
      next >= g.target ? { action: 'crushed the goal', target: g.title } : undefined);
    if (next >= g.target) { fire(); toast(`Goal complete — ${g.title}`, 'target'); }
  };

  const create = () => {
    const t = parseFloat(target);
    if (!title.trim() || !isFinite(t) || t <= 0) return;
    update((d) => {
      d.goals.unshift({ id: `g${uid()}`, title: title.trim(), cat, color, target: t, current: 0, unit: unit.trim() || '%', deadline });
    }, { action: 'set a new goal', target: title.trim() });
    toast('Goal added', 'target');
    setOpen(false); setTitle(''); setTarget('100'); setUnit('%');
  };

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Goals</h1>
          <p className="text-[12.5px] text-mut mt-0.5">Long games, scoreboard visible. Increment as you earn it.</p>
        </div>
        <Btn icon={Plus} className="ms-auto" onClick={() => setOpen(true)}>New goal</Btn>
      </FadeIn>

      {data.goals.length === 0 ? (
        <Card><Empty icon={Target} title="No goals yet" body="Set one goal that scares you a little." action={<Btn icon={Plus} onClick={() => setOpen(true)}>New goal</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.goals.map((g, i) => {
            const p = pal(g.color);
            const v = Math.min(1, g.current / g.target);
            const complete = g.current >= g.target;
            const dl = daysUntil(g.deadline);
            return (
              <FadeIn key={g.id} delay={i * 0.05}>
                <Card hover className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <IconTile icon={CAT_ICON[g.cat] ?? 'target'} color={g.color} size={42} />
                    <Ring value={v} size={58} stroke={5.5} color={complete ? '#0da678' : p.hex}>
                      {complete ? <CheckCircle2 size={18} className="text-emerald-500" /> : <span className="text-[11px] font-bold">{Math.round(v * 100)}%</span>}
                    </Ring>
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold tracking-tight leading-snug">{g.title}</h3>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Chip hex={p.hex} soft={p.soft}>{g.cat}</Chip>
                    <span className={`text-[10.5px] font-semibold inline-flex items-center gap-1 ${dl < 0 ? 'text-rose-500' : dl <= 10 ? 'text-amber-500' : 'text-mut'}`}>
                      <CalendarClock size={11} /> {pretty(g.deadline)}{dl >= 0 ? ` · ${dl}d` : ' · passed'}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Progress value={v * 100} color={complete ? '#0da678' : p.hex} />
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold">
                        <span style={{ color: complete ? '#0da678' : p.hex }}>{g.current.toLocaleString()}</span>
                        <span className="text-mut"> / {g.target.toLocaleString()} {g.unit}</span>
                      </p>
                      <div className="flex gap-1.5">
                        <button onClick={() => bump(g.id, -1)} disabled={g.current <= 0}
                          className="h-7.5 w-7.5 rounded-lg border border-line flex items-center justify-center text-mut hover:text-ink hover:bg-elev transition cursor-pointer disabled:opacity-40">
                          <Minus size={13} />
                        </button>
                        <button onClick={() => bump(g.id, 1)} disabled={complete}
                          className="h-7.5 w-7.5 rounded-lg border border-line flex items-center justify-center text-white transition cursor-pointer disabled:opacity-40"
                          style={{ background: p.hex }}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New goal">
        <div className="p-5 space-y-4">
          <Field label="Goal">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Run a marathon under 4 hours" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {Object.keys(CAT_ICON).map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Color">
              <div className="flex gap-1.5 flex-wrap pt-1">
                {Object.keys(PALETTE).map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface' : 'opacity-70 hover:opacity-100'}`}
                    style={{ background: PALETTE[c].hex }} />
                ))}
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Target" className="col-span-1">
              <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" className={inputCls} />
            </Field>
            <Field label="Unit" className="col-span-1">
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} placeholder="%, $K, pages…" />
            </Field>
            <Field label="Deadline" className="col-span-1">
              <input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" className={inputCls} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={create} disabled={!title.trim()}>Add goal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
