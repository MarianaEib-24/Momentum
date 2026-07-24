import { useState } from 'react';
import { Plus, CheckCircle2, Telescope, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { Btn, Card, Chip, Empty, FadeIn, Field, Modal, inputCls } from '../components/ui';
import { ICONS, PALETTE } from '../components/Icon';
import { uid } from '../lib/utils';
import type { Plan } from '../lib/types';

const BUCKETS: { k: Plan['when']; label: string; sub: string }[] = [
  { k: 'soon', label: 'Next 6 months', sub: 'Locked in, nearly real' },
  { k: 'yr1', label: 'Within a year', sub: 'Planned and funded' },
  { k: 'yr3', label: '3 years', sub: 'The climb' },
  { k: 'yr5', label: '5 years', sub: 'The summit' },
];

const IMG_CHOICES = [
  { src: '/img/court_photo.jpg', label: 'Courtside' },
  { src: '/img/japan_photo.jpg', label: 'Kyoto' },
  { src: '/img/beach.jpg', label: 'Beach' },
  { src: '/img/car.jpg', label: 'GT3' },
  { src: '/img/skyline.jpg', label: 'Skyline' },
  { src: '/img/desk_photo.jpg', label: 'Studio' },
];

export default function Future() {
  const { data, update, toast, fire } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('Travel');
  const [when, setWhen] = useState<Plan['when']>('yr1');
  const [note, setNote] = useState('');
  const [img, setImg] = useState(IMG_CHOICES[2].src);

  const create = () => {
    if (!title.trim()) return;
    update((d) => { d.plans.unshift({ id: `pl${uid()}`, title: title.trim(), cat, when, note: note.trim() || 'The dream, written down.', img }); },
      { action: 'added a future plan', target: title.trim() });
    toast('Added to the vision board', 'compass');
    setOpen(false); setTitle(''); setNote('');
  };

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Future Plans</h1>
          <p className="text-[12.5px] text-mut mt-0.5">The vision board. Look at it when the weeks get heavy.</p>
        </div>
        <Btn icon={Plus} className="ms-auto" onClick={() => setOpen(true)}>Add a plan</Btn>
      </FadeIn>

      {data.plans.length === 0 ? (
        <Card><Empty icon={Telescope} title="No plans yet" body="Dream on the record." action={<Btn icon={Plus} onClick={() => setOpen(true)}>Add a plan</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {BUCKETS.map((b, bi) => {
            const plans = data.plans.filter((p) => p.when === b.k);
            return (
              <FadeIn key={b.k} delay={bi * 0.06}>
                <div className="rounded-2xl border border-line bg-elev/40 p-3">
                  <div className="px-2 py-1.5">
                    <h2 className="text-[13px] font-bold tracking-tight">{b.label}</h2>
                    <p className="text-[10.5px] text-mut">{b.sub} · {plans.length}</p>
                  </div>
                  <div className="space-y-3 mt-1.5">
                    {plans.length === 0 && <p className="text-[11px] text-mut px-2 py-6 text-center">Nothing here yet.</p>}
                    {plans.map((pl) => (
                      <div key={pl.id} className={`rounded-2xl border border-line bg-surface overflow-hidden transition-all hover:shadow-xl card-hover relative ${pl.done ? 'opacity-75' : ''}`}>
                        <div className="relative h-32 overflow-hidden">
                          <img src={pl.img} alt={pl.title} className="h-full w-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                          <span className="absolute bottom-2 left-2.5 text-[9.5px] font-bold uppercase tracking-widest text-white/90">{pl.cat}</span>
                          {pl.done && (
                            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[9.5px] font-bold px-2 py-1">
                              <CheckCircle2 size={10} /> ACHIEVED
                            </span>
                          )}
                        </div>
                        <div className="p-3.5">
                          <p className="text-[13.5px] font-bold leading-snug">{pl.title}</p>
                          <p className="mt-1 text-[11.5px] text-mut leading-relaxed">{pl.note}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <button
                              onClick={() => {
                                update((d) => { const x = d.plans.find((v) => v.id === pl.id); if (x) x.done = !x.done; },
                                  pl.done ? undefined : { action: 'made it real', target: pl.title });
                                if (!pl.done) { fire(); toast(`It happened — ${pl.title}`, 'trophy'); }
                              }}
                              className={`h-7.5 px-2.5 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${pl.done ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10' : 'border-line text-mut hover:text-ink hover:bg-elev'}`}
                            >
                              {pl.done ? 'Achieved' : 'Mark achieved'}
                            </button>
                            <button
                              onClick={() => update((d) => { d.plans = d.plans.filter((x) => x.id !== pl.id); })}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-mut hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add a future plan">
        <div className="p-5 space-y-4">
          <Field label="Plan">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Sunrise court time in Manila" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {['Travel', 'Cars', 'Basketball', 'Home', 'Workspace', 'Finance', 'Fitness'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Horizon">
              <select value={when} onChange={(e) => setWhen(e.target.value as Plan['when'])} className={`${inputCls} cursor-pointer`}>
                {BUCKETS.map((b) => <option key={b.k} value={b.k}>{b.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Note">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`${inputCls} h-auto! py-2 resize-none`} placeholder="Why it matters…" />
          </Field>
          <Field label="Artwork">
            <div className="grid grid-cols-3 gap-2">
              {IMG_CHOICES.map((c) => (
                <button key={c.src} type="button" onClick={() => setImg(c.src)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${img === c.src ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={c.src} alt={c.label} className="h-14 w-full object-cover" />
                  <span className="absolute inset-0 flex items-end p-1.5 text-[9px] font-bold text-white bg-gradient-to-t from-black/55 to-transparent">{c.label}</span>
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={create} disabled={!title.trim()}>Add plan</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
