import { useMemo, useState } from 'react';
import { Plus, Search, Library, ExternalLink, Link2, Newspaper, Video, FileText, Wrench, Podcast, type LucideIcon } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, Btn, Card, Chip, Empty, FadeIn, Field, Modal, inputCls } from '../components/ui';
import { uid } from '../lib/utils';
import type { Res } from '../lib/types';

const KINDS: { k: Res['kind'] | 'all'; label: string; icon?: LucideIcon }[] = [
  { k: 'all', label: 'All' },
  { k: 'article', label: 'Articles', icon: Newspaper },
  { k: 'video', label: 'Videos', icon: Video },
  { k: 'doc', label: 'Docs', icon: FileText },
  { k: 'tool', label: 'Tools', icon: Wrench },
  { k: 'podcast', label: 'Podcasts', icon: Podcast },
];

const KIND_HEX: Record<Res['kind'], string> = { article: '#2f6bff', video: '#e24a6d', doc: '#d99a17', tool: '#0da678', podcast: '#7c5cff' };

export default function Resources() {
  const { data, update, me, toast } = useStore();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Res['kind'] | 'all'>('all');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [k2, setK2] = useState<Res['kind']>('article');
  const [tags, setTags] = useState('');

  const filtered = useMemo(() => data.resources.filter((r) => {
    if (kind !== 'all' && r.kind !== kind) return false;
    if (q && !(`${r.title} ${r.domain} ${r.tags.join(' ')}`).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [data.resources, q, kind]);

  const copy = async (r: Res) => {
    try {
      await navigator.clipboard.writeText(`https://${r.domain}`);
      toast('Link copied to clipboard', 'flag');
    } catch {
      toast('Could not access clipboard', 'flag');
    }
  };

  const add = () => {
    const dom = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!title.trim() || !dom) return;
    update((d) => {
      d.resources.unshift({
        id: `r${uid()}`, title: title.trim(), domain: dom, kind: k2,
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean), by: me ?? 'alex',
      });
    }, { action: 'saved a resource', target: title.trim() });
    toast('Resource saved to the library', 'book');
    setOpen(false); setTitle(''); setDomain(''); setTags('');
  };

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Resources</h1>
          <p className="text-[12.5px] text-mut mt-0.5">The shared library — {data.resources.length} saved and counting.</p>
        </div>
        <div className="ms-auto flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search library…" className={`${inputCls} w-48! pl-9!`} />
          </div>
          <Btn icon={Plus} onClick={() => setOpen(true)}>Save link</Btn>
        </div>
      </FadeIn>

      <FadeIn delay={0.04} className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {KINDS.map((t) => (
          <button key={t.k} onClick={() => setKind(t.k)}
            className={`h-8 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${kind === t.k ? 'bg-ink text-bg' : 'bg-surface border border-line text-mut hover:text-ink'}`}>
            {t.icon && <t.icon size={12} />} {t.label}
          </button>
        ))}
      </FadeIn>

      {filtered.length === 0 ? (
        <Card><Empty icon={Library} title="Nothing found" body="Adjust the filter or save something worth re-reading." action={<Btn icon={Plus} onClick={() => setOpen(true)}>Save link</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r, i) => {
            const hex = KIND_HEX[r.kind];
            const by = data.users[r.by];
            return (
              <FadeIn key={r.id} delay={i * 0.04}>
                <Card hover className="p-4.5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0" style={{ background: hex + '1f', color: hex }}>
                      {r.domain[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold tracking-tight leading-snug">{r.title}</h3>
                      <p className="text-[11px] text-mut mt-0.5">{r.domain}</p>
                    </div>
                    {by && <Avatar user={by} size={22} />}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Chip hex={hex}>{r.kind}</Chip>
                    {r.tags.map((t) => <Chip key={t}>#{t}</Chip>)}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <a href={`https://${r.domain}`} target="_blank" rel="noreferrer"
                      className="flex-1 h-8.5 rounded-lg bg-elev hover:bg-line/70 text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition">
                      <ExternalLink size={12} /> Open
                    </a>
                    <button onClick={() => copy(r)}
                      className="h-8.5 w-9 rounded-lg border border-line flex items-center justify-center text-mut hover:text-ink hover:bg-elev transition cursor-pointer" title="Copy link">
                      <Link2 size={13} />
                    </button>
                  </div>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Save a resource">
        <div className="p-5 space-y-4">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. The playbook we keep referencing" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Domain">
              <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputCls} placeholder="example.com" />
            </Field>
            <Field label="Kind">
              <select value={k2} onChange={(e) => setK2(e.target.value as Res['kind'])} className={`${inputCls} cursor-pointer`}>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="doc">Doc</option>
                <option value="tool">Tool</option>
                <option value="podcast">Podcast</option>
              </select>
            </Field>
          </div>
          <Field label="Tags (comma separated)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="startups, design, mindset" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={add} disabled={!title.trim() || !domain.trim()}>Save resource</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
