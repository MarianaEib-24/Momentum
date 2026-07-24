import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Repeat, CalendarDays } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, Chip, FadeIn, Field, Btn, Modal, inputCls } from '../components/ui';
import { pal, PALETTE } from '../components/Icon';
import { daysUntil, fmtDate, monthLabel, parseD, pretty, prettyFull, todayStr, uid } from '../lib/utils';
import type { CalEvent, Task } from '../lib/types';

const KIND_COLOR: Record<CalEvent['kind'], string> = { meeting: 'blue', deadline: 'rose', personal: 'emerald', travel: 'violet' };

export default function Calendar() {
  const { data, update, toast } = useStore();
  const now = new Date();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [selected, setSelected] = useState(todayStr());
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00');
  const [kind, setKind] = useState<CalEvent['kind']>('meeting');
  const [color, setColor] = useState('blue');
  const [recur, setRecur] = useState(false);

  const [y, m] = ym;

  const cells = useMemo(() => {
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday start
    const daysIn = new Date(y, m + 1, 0).getDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= daysIn; d++) out.push(fmtDate(new Date(y, m, d)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [y, m]);

  const eventsOn = (date: string): CalEvent[] =>
    data.events.filter((e) =>
      e.date === date || (e.recur === 'weekly' && parseD(e.date).getDay() === parseD(date).getDay() && e.date <= date));

  const tasksOn = (date: string): Task[] => data.tasks.filter((t) => t.due === date && t.status !== 'done');

  const selEvents = eventsOn(selected);
  const selTasks = tasksOn(selected);

  const shift = (n: number) => {
    const d = new Date(y, m + n, 1);
    setYm([d.getFullYear(), d.getMonth()]);
  };

  const addEvent = () => {
    if (!title.trim()) return;
    update((d) => {
      d.events.push({ id: `e${uid()}`, title: title.trim(), date: selected, time, kind, recur: recur ? 'weekly' : null, color });
    }, { action: 'scheduled', target: title.trim() });
    toast(recur ? 'Recurring event added — repeats weekly' : 'Event added', 'star');
    setAddOpen(false); setTitle('');
  };

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Calendar</h1>
          <p className="text-[12.5px] text-mut mt-0.5">Meetings, deadlines and life — one shared clock. Weekly events repeat automatically.</p>
        </div>
        <Btn icon={Plus} className="ms-auto" onClick={() => setAddOpen(true)}>Add on {pretty(selected)}</Btn>
      </FadeIn>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <FadeIn delay={0.05} className="xl:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold tracking-tight">{monthLabel(y, m)}</h2>
              <div className="flex items-center gap-1.5">
                <button onClick={() => shift(-1)} className="h-8 w-8 rounded-lg border border-line flex items-center justify-center text-mut hover:text-ink hover:bg-elev transition cursor-pointer"><ChevronLeft size={15} /></button>
                <button onClick={() => { setYm([now.getFullYear(), now.getMonth()]); setSelected(todayStr()); }} className="h-8 px-3 rounded-lg border border-line text-[12px] font-semibold text-mut hover:text-ink hover:bg-elev transition cursor-pointer">Today</button>
                <button onClick={() => shift(1)} className="h-8 w-8 rounded-lg border border-line flex items-center justify-center text-mut hover:text-ink hover:bg-elev transition cursor-pointer"><ChevronRight size={15} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-mut py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="min-h-[74px] rounded-xl bg-elev/30" />;
                const evs = eventsOn(date);
                const tsk = tasksOn(date);
                const isToday = date === todayStr();
                const isSel = date === selected;
                const past = date < todayStr();
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(date)}
                    className={`min-h-[74px] rounded-xl border p-1.5 text-left transition-all cursor-pointer flex flex-col ${
                      isSel ? 'border-accent ring-2 ring-accent/20 bg-accent/[.04]' : 'border-transparent hover:border-line hover:bg-elev/50'
                    }`}
                  >
                    <span className={`text-[11px] font-bold h-5.5 w-5.5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-accent text-white' : past ? 'text-mut/70' : ''
                    }`}>
                      {parseInt(date.slice(8), 10)}
                    </span>
                    <div className="mt-1 space-y-0.5 w-full min-w-0">
                      {evs.slice(0, 2).map((e) => {
                        const p = pal(e.color);
                        return (
                          <div key={e.id} className="truncate rounded px-1 py-0.5 text-[9px] font-semibold" style={{ background: p.soft, color: p.hex }}>
                            {e.recur === 'weekly' && <Repeat size={7} className="inline me-0.5 -mt-0.5" />}
                            {e.title}
                          </div>
                        );
                      })}
                      {tsk.length > 0 && (
                        <div className="truncate rounded px-1 py-0.5 text-[9px] font-semibold" style={{ background: pal('gold').soft, color: pal('gold').hex }}>
                          {tsk.length} task{tsk.length > 1 ? 's' : ''} due
                        </div>
                      )}
                      {evs.length > 2 && <div className="text-[9px] font-semibold text-mut px-1">+{evs.length - 2} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">{prettyFull(selected)}</h2>
                <p className="text-[11px] text-mut mt-0.5">{daysUntil(selected) === 0 ? 'Today' : daysUntil(selected) > 0 ? `In ${daysUntil(selected)} days` : 'In the past'}</p>
              </div>
              <Btn size="sm" variant="soft" icon={Plus} onClick={() => setAddOpen(true)}>Event</Btn>
            </div>
            {selEvents.length === 0 && selTasks.length === 0 && (
              <div className="text-center py-10">
                <CalendarDays size={26} className="mx-auto text-mut/50" />
                <p className="text-[12.5px] text-mut mt-2">Clear day. Guard it or book it.</p>
              </div>
            )}
            <div className="space-y-2">
              {selEvents.map((e) => {
                const p = pal(e.color);
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border border-line p-3 group">
                    <span className="h-9 w-1.5 rounded-full shrink-0" style={{ background: p.hex }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold truncate">{e.title}</p>
                      <p className="text-[11px] text-mut inline-flex items-center gap-1.5">
                        <Clock size={10} /> {e.time}
                        {e.recur === 'weekly' && <span className="inline-flex items-center gap-0.5"><Repeat size={9} /> weekly</span>}
                      </p>
                    </div>
                    <Chip hex={p.hex} soft={p.soft} className="capitalize">{e.kind}</Chip>
                    <button
                      onClick={() => update((d) => { d.events = d.events.filter((x) => x.id !== e.id); }, { action: 'removed event', target: e.title })}
                      className="opacity-0 group-hover:opacity-100 text-mut hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {selTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-dashed border-line p-3">
                  <span className="h-9 w-1.5 rounded-full shrink-0" style={{ background: pal('gold').hex }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate">{t.title}</p>
                    <p className="text-[11px] text-mut capitalize">Task due · {t.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add event — ${pretty(selected)}`}>
        <div className="p-5 space-y-4">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Partner dinner" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Kind">
              <select value={kind} onChange={(e) => setKind(e.target.value as CalEvent['kind'])} className={`${inputCls} cursor-pointer capitalize`}>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="personal">Personal</option>
                <option value="travel">Travel</option>
              </select>
            </Field>
          </div>
          <Field label="Color">
            <div className="flex gap-1.5 flex-wrap">
              {Object.keys(PALETTE).map((c) => (
                <button key={c} type="button" onClick={() => { setColor(c); setKind(KIND_COLOR[kind] === c ? kind : kind); }}
                  className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface' : 'opacity-70 hover:opacity-100'}`}
                  style={{ background: PALETTE[c].hex }} />
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={recur} onChange={(e) => setRecur(e.target.checked)} className="chk" />
            <span className="text-[13px] font-medium inline-flex items-center gap-1.5"><Repeat size={13} className="text-accent" /> Repeat every week</span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn>
            <Btn onClick={addEvent} disabled={!title.trim()}>Add event</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
