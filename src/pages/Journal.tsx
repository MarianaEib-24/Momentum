import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Trash2, Bold, Italic, Heading3, List, Eye, PenLine, CloudCheck, Loader2, type LucideIcon } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, Chip, FadeIn, Btn, Empty } from '../components/ui';
import { Md } from '../components/Markdown';
import { pal } from '../components/Icon';
import { prettyFull, todayStr, uid } from '../lib/utils';
import type { Mood } from '../lib/types';

const MOODS: { k: Mood; label: string; hex: string }[] = [
  { k: 'great', label: 'Great', hex: '#0da678' },
  { k: 'good', label: 'Good', hex: '#2f6bff' },
  { k: 'ok', label: 'Okay', hex: '#d99a17' },
  { k: 'low', label: 'Low', hex: '#e24a6d' },
];

export default function Journal() {
  const { data, update, toast } = useStore();
  const [selId, setSelId] = useState<string | null>(data.journal[0]?.id ?? null);
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [newTag, setNewTag] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const entry = data.journal.find((j) => j.id === selId) ?? null;
  const timer = useRef<number | null>(null);

  const filtered = useMemo(() =>
    [...data.journal]
      .filter((j) => !q || (j.title + j.body + j.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date)),
  [data.journal, q]);

  const mutate = (fn: (j: typeof entry & object) => void) => {
    if (!entry) return;
    update((d) => { const j = d.journal.find((x) => x.id === entry.id); if (j) fn(j as never); });
  };

  const onBody = (v: string) => {
    setSaveState('saving');
    mutate((j) => { j.body = v; });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaveState('saved'), 650);
  };

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const insert = (type: 'bold' | 'italic' | 'h' | 'list') => {
    const el = areaRef.current;
    if (!el || !entry) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e) || 'text';
    let next = value, pos = e;
    if (type === 'bold') { next = value.slice(0, s) + `**${sel}**` + value.slice(e); pos = e + 4; }
    if (type === 'italic') { next = value.slice(0, s) + `*${sel}*` + value.slice(e); pos = e + 2; }
    if (type === 'h') { next = value.slice(0, s) + (s > 0 && value[s - 1] !== '\n' ? '\n## ' : '## ') + sel + value.slice(e); pos = e + 4; }
    if (type === 'list') { next = value.slice(0, s) + (s > 0 && value[s - 1] !== '\n' ? '\n- ' : '- ') + sel + value.slice(e); pos = e + 3; }
    onBody(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  };

  const newEntry = () => {
    const id = `j${uid()}`;
    update((d) => { d.journal.unshift({ id, title: 'Untitled entry', body: '# ', date: todayStr(), mood: 'good', tags: [] }); },
      { action: 'started a journal entry', target: 'Untitled entry' });
    setSelId(id); setPreview(false);
  };

  const words = entry ? entry.body.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Journal</h1>
          <p className="text-[12.5px] text-mut mt-0.5">{data.journal.length} entries — think in writing, remember in ink.</p>
        </div>
        <Btn icon={Plus} className="ms-auto" onClick={newEntry}>New entry</Btn>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        <FadeIn delay={0.05}>
          <Card className="p-3">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries…"
                className="w-full h-9 rounded-xl border border-line bg-elev/60 pl-9 pr-3 text-[12.5px] outline-none focus:border-accent transition" />
            </div>
            <div className="space-y-1 max-h-[62vh] overflow-y-auto scroll-thin pe-1">
              {filtered.length === 0 && <p className="text-center text-[12px] text-mut py-8">No entries match.</p>}
              {filtered.map((j) => {
                const mood = MOODS.find((mo) => mo.k === j.mood) ?? MOODS[1];
                return (
                  <button key={j.id} onClick={() => { setSelId(j.id); setPreview(false); }}
                    className={`w-full text-left rounded-xl p-3 transition-all cursor-pointer border ${selId === j.id ? 'border-accent bg-accent/[.05]' : 'border-transparent hover:bg-elev/60'}`}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: mood.hex }} />
                      <p className="text-[13px] font-semibold truncate">{j.title}</p>
                    </div>
                    <p className="text-[11px] text-mut mt-1">{prettyFull(j.date)}</p>
                    {j.tags.length > 0 && (
                      <div className="mt-1.5 flex gap-1 flex-wrap">
                        {j.tags.map((t) => <Chip key={t} className="text-[9px]">#{t}</Chip>)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.08}>
          {!entry ? (
            <Card><Empty icon={PenLine} title="Nothing selected" body="Pick an entry or start a fresh page." action={<Btn icon={Plus} onClick={newEntry}>New entry</Btn>} /></Card>
          ) : (
            <Card className="p-5">
              <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-line">
                <ToolbarBtn icon={Bold} label="Bold" onClick={() => insert('bold')} />
                <ToolbarBtn icon={Italic} label="Italic" onClick={() => insert('italic')} />
                <ToolbarBtn icon={Heading3} label="Heading" onClick={() => insert('h')} />
                <ToolbarBtn icon={List} label="List" onClick={() => insert('list')} />
                <span className="w-px h-5 bg-line mx-1" />
                <Btn size="sm" variant={preview ? 'primary' : 'ghost'} icon={Eye} onClick={() => setPreview((p) => !p)}>
                  {preview ? 'Editing off' : 'Preview'}
                </Btn>
                <div className="ms-auto flex items-center gap-3 text-[11px] text-mut">
                  <span>{words} words</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                    {saveState === 'saving' ? <Loader2 size={11} className="animate-spin" /> : <CloudCheck size={12} />}
                    {saveState === 'saving' ? 'Saving…' : 'Autosaved'}
                  </span>
                </div>
              </div>

              <input
                value={entry.title}
                onChange={(e) => mutate((j) => { j.title = e.target.value; })}
                placeholder="Give it a title…"
                className="w-full mt-4 text-[24px] font-bold tracking-tight bg-transparent outline-none placeholder:text-mut/40"
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {MOODS.map((mo) => (
                  <button key={mo.k} onClick={() => mutate((j) => { j.mood = mo.k; })}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${entry.mood === mo.k ? 'text-white border-transparent' : 'text-mut border-line hover:text-ink'}`}
                    style={entry.mood === mo.k ? { background: mo.hex } : undefined}>
                    {mo.label}
                  </button>
                ))}
                <span className="w-px h-4 bg-line mx-1" />
                {entry.tags.map((t) => (
                  <Chip key={t} className="!text-[10.5px]">
                    #{t}
                    <button className="cursor-pointer hover:text-rose-500" onClick={() => mutate((j) => { j.tags = j.tags.filter((x) => x !== t); })}>×</button>
                  </Chip>
                ))}
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="+ tag"
                  onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim()) { mutate((j) => { j.tags.push(newTag.trim().toLowerCase()); }); setNewTag(''); } }}
                  className="h-6.5 w-16 rounded-md bg-elev px-2 text-[11px] outline-none" />
                <button
                  onClick={() => { update((d) => { d.journal = d.journal.filter((x) => x.id !== entry.id); }); setSelId(data.journal.find((x) => x.id !== entry.id)?.id ?? null); toast('Entry deleted', 'pen'); }}
                  className="ms-auto h-8 w-8 rounded-lg flex items-center justify-center text-mut hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer" title="Delete entry">
                  <Trash2 size={14} />
                </button>
              </div>

              {preview ? (
                <div className="mt-5 rounded-2xl border border-line bg-elev/40 p-5 min-h-[380px]">
                  <Md text={entry.body} className="text-[14px]" />
                </div>
              ) : (
                <textarea
                  ref={areaRef}
                  value={entry.body}
                  onChange={(e) => onBody(e.target.value)}
                  placeholder="# Dear Momentum…\n\nMarkdown welcome: **bold**, *italic*, ## headings, - lists"
                  className="w-full mt-4 min-h-[380px] resize-y rounded-2xl border border-line bg-elev/40 p-5 text-[14px] leading-relaxed outline-none focus:border-accent transition placeholder:text-mut/40"
                />
              )}
            </Card>
          )}
        </FadeIn>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: I, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      className="h-8 w-8 rounded-lg border border-line flex items-center justify-center text-mut hover:text-ink hover:bg-elev transition cursor-pointer">
      <I size={14} />
    </button>
  );
}
