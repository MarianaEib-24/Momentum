import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, CalendarClock } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, Chip, DuoAvatars, Empty, FadeIn, Field, Modal, Btn, inputCls } from '../components/ui';
import { Ring } from '../components/charts';
import { Ico, IconTile, pal, PALETTE, ICONS } from '../components/Icon';
import { daysUntil, pretty, uid, getVisibleProjects, getVisibleTasks } from '../lib/utils';
import type { Project } from '../lib/types';

const STATUS_TABS = [
  { k: 'all', label: 'All' },
  { k: 'on-track', label: 'On track' },
  { k: 'at-risk', label: 'At risk' },
  { k: 'paused', label: 'Paused' },
  { k: 'done', label: 'Done' },
] as const;

export default function Projects() {
  const { data, me, update, toast } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<string>('all');
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('blue');
  const [icon, setIcon] = useState('rocket');
  const [visibility, setVisibility] = useState<'personal' | 'team'>('personal');
  const [members, setMembers] = useState<string[]>([]);

  const visibleProjects = useMemo(() => getVisibleProjects(data.projects, me), [data.projects, me]);
  const visibleTasks = useMemo(() => getVisibleTasks(data.tasks, visibleProjects, me), [data.tasks, visibleProjects, me]);

  const filtered = useMemo(() => visibleProjects.filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (q && !(`${p.name} ${p.tag} ${p.desc}`).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [visibleProjects, tab, q]);

  const createProject = () => {
    if (!name.trim()) return;
    const id = `pj${uid()}`;
    const currentUser = me ?? 'alex';
    update((d) => {
      d.projects.unshift({
        id, name: name.trim(), tag: tag.trim().toUpperCase() || 'NEW', color, icon,
        desc: desc.trim() || 'A brand new chapter.', status: 'on-track',
        visibility,
        ownerId: currentUser,
        members: visibility === 'team' ? members : [],
        milestones: [{ id: `ms${uid()}`, title: 'Kickoff', date: new Date().toISOString().slice(0, 10), done: false }],
      });
    }, { action: 'created project', target: name.trim() });
    toast('Project created', icon);
    setCreateOpen(false);
    setName(''); setTag(''); setDesc(''); setVisibility('personal'); setMembers([]);
    nav(`/projects/${id}`);
  };

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Projects</h1>
          <p className="text-[12.5px] text-mut mt-0.5">{visibleProjects.filter((p) => p.status === 'on-track').length} on track · {visibleProjects.length} total</p>
        </div>
        <div className="ms-auto flex items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter projects…" className={`${inputCls} w-48! pl-9!`} />
          </div>
          <Btn icon={Plus} onClick={() => setCreateOpen(true)}>New project</Btn>
        </div>
      </FadeIn>

      <FadeIn delay={0.04} className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`h-8 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${tab === t.k ? 'bg-ink text-bg' : 'bg-surface border border-line text-mut hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </FadeIn>

      {filtered.length === 0 ? (
        <Card><Empty icon={FolderKanban} title="No projects here" body="Try a different filter, or start something new together." action={<Btn icon={Plus} onClick={() => setCreateOpen(true)}>New project</Btn>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const tasks = data.tasks.filter((t) => t.projectId === p.id);
            const done = tasks.filter((t) => t.status === 'done').length;
            const v = tasks.length ? done / tasks.length : 0;
            const open = tasks.length - done;
            const pal_ = pal(p.color);
            const nextMs = p.milestones.filter((m) => !m.done).sort((a, b) => a.date.localeCompare(b.date))[0];
            const statusMeta = {
              'on-track': { c: '#0da678', label: 'On track' },
              'at-risk': { c: '#e24a6d', label: 'At risk' },
              'paused': { c: '#d99a17', label: 'Paused' },
              'done': { c: '#2f6bff', label: 'Done' },
            }[p.status];
            return (
              <FadeIn key={p.id} delay={i * 0.05}>
                <Card hover className="p-5 h-full cursor-pointer" >
                  <button onClick={() => nav(`/projects/${p.id}`)} className="w-full text-left cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <IconTile icon={p.icon} color={p.color} size={42} />
                      <Ring value={v} size={52} stroke={5} color={pal_.hex}>
                        <span className="text-[10px] font-bold">{Math.round(v * 100)}%</span>
                      </Ring>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <h3 className="text-[15px] font-bold tracking-tight leading-snug min-w-0 truncate">{p.name}</h3>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <Chip hex={pal_.hex} soft={pal_.soft}>{p.tag}</Chip>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-mut">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.c }} />
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] text-mut leading-relaxed line-clamp-2 min-h-[36px]">{p.desc}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-[11px] font-medium text-mut">
                        <span className="inline-flex items-center gap-1"><FolderKanban size={12} /> {open} open</span>
                        {nextMs && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={12} /> {pretty(nextMs.date)}
                            {daysUntil(nextMs.date) >= 0 && daysUntil(nextMs.date) <= 5 && <span className="text-rose-500 font-bold">· {daysUntil(nextMs.date)}d</span>}
                          </span>
                        )}
                      </div>
                      <DuoAvatars users={Object.values(data.users)} size={24} />
                    </div>
                  </button>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New project">
        <div className="p-5 space-y-4">
          <Field label="Project name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Launch week plan" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tag">
              <input value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls} placeholder="PRODUCT" />
            </Field>
            <Field label="Color">
              <div className="flex gap-1.5 flex-wrap pt-1">
                {Object.keys(PALETTE).map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-lg transition-all cursor-pointer ${color === c ? 'ring-2 ring-offset-2 ring-offset-surface scale-110' : 'opacity-70 hover:opacity-100'}`}
                    style={{ background: PALETTE[c].hex, ...(color === c ? { ['--tw-ring-color' as never]: PALETTE[c].hex } : {}) }} />
                ))}
              </div>
            </Field>
          </div>
          <Field label="Icon">
            <div className="grid grid-cols-8 gap-1.5">
              {Object.keys(ICONS).slice(0, 24).map((k: string) => (
                <button key={k} type="button" onClick={() => setIcon(k)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${icon === k ? 'text-white' : 'bg-elev text-mut hover:text-ink'}`}
                  style={icon === k ? { background: pal(color).hex } : undefined}>
                  <Ico name={k} size={14} />
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setVisibility('personal');
                setMembers([]);
              }}
              className={`rounded-3xl border p-3 text-left text-[13px] transition-all ${visibility === 'personal' ? 'border-accent bg-accent/[.08]' : 'border-line bg-surface hover:border-white/20'}`}>
              <p className="font-semibold">Personal project</p>
              <p className="text-[12px] text-mut mt-1">Only you can see and edit this project.</p>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('team')}
              className={`rounded-3xl border p-3 text-left text-[13px] transition-all ${visibility === 'team' ? 'border-accent bg-accent/[.08]' : 'border-line bg-surface hover:border-white/20'}`}>
              <p className="font-semibold">Shared project</p>
              <p className="text-[12px] text-mut mt-1">Invite collaborators to work together on this project.</p>
            </button>
          </div>
          {visibility === 'team' && (
            <Field label="Collaborators">
              <div className="grid grid-cols-2 gap-2">
                {Object.values(data.users).filter((u) => u.id !== (me ?? 'alex')).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setMembers((current) => current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id])}
                    className={`rounded-2xl border px-3 py-2 text-left transition-all ${members.includes(user.id) ? 'border-accent bg-accent/[.08]' : 'border-line bg-surface hover:border-white/20'}`}>
                    <p className="font-semibold">{user.name.split(' ')[0]}</p>
                    <p className="text-[11px] text-mut mt-1">{user.role.split(' · ')[1] ?? user.email}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-mut mt-2">Leave collaborators empty for now; you can invite people later.</p>
            </Field>
          )}
          <Field label="Description">
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className={`${inputCls} h-auto! py-2 resize-none`} placeholder="What is this project about?" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn onClick={createProject} disabled={!name.trim()}>Create project</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
