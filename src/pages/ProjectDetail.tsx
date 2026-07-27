import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Check, Flag, MessageSquare, Paperclip, Pin, PinOff, Trash2,
  CalendarDays, Tag as TagIcon, X, Send, CheckCircle2, ListChecks, Milestone, AtSign,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, Btn, Chip, Empty, Modal, Progress, DuoAvatars, FadeIn, inputCls } from '../components/ui';
import { Ring } from '../components/charts';
import { Ico, IconTile, pal, PALETTE } from '../components/Icon';
import { Md } from '../components/Markdown';
import { daysUntil, fmtSize, nowIso, pretty, relTime, todayStr, uid, projectIsVisible } from '../lib/utils';
import type { Assignee, Priority, ReactionKey, Task, TaskStatus } from '../lib/types';
import type { LucideIcon } from 'lucide-react';
import { Flame, ThumbsUp, Lightbulb, Target, Heart } from 'lucide-react';

const COLS: { k: TaskStatus; label: string; dot: string }[] = [
  { k: 'todo', label: 'To do', dot: '#8d99b5' },
  { k: 'active', label: 'In progress', dot: '#2f6bff' },
  { k: 'review', label: 'Review', dot: '#d99a17' },
  { k: 'done', label: 'Done', dot: '#0da678' },
];

const PRIO: Record<Priority, { label: string; hex: string }> = {
  urgent: { label: 'Urgent', hex: '#e24a6d' },
  high: { label: 'High', hex: '#f07030' },
  medium: { label: 'Medium', hex: '#2f6bff' },
  low: { label: 'Low', hex: '#8d99b5' },
};

const REACTIONS: { k: ReactionKey; icon: LucideIcon }[] = [
  { k: 'flame', icon: Flame }, { k: 'thumbs', icon: ThumbsUp }, { k: 'bulb', icon: Lightbulb },
  { k: 'target', icon: Target }, { k: 'heart', icon: Heart },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, update, toast, me } = useStore();
  const project = data.projects.find((p) => p.id === id);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [quickAdd, setQuickAdd] = useState<Partial<Record<TaskStatus, string>>>({});
  const dragId = useRef<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  if (!project || !projectIsVisible(project, me)) {
    return <Card404 onBack={() => nav('/projects')} />;
  }

  const tasks = useMemo(() => data.tasks.filter((t) => t.projectId === id), [data.tasks, id]);

  const p = pal(project.color);
  const done = tasks.filter((t) => t.status === 'done').length;
  const collaborators = project.members.map((userId) => data.users[userId]).filter(Boolean);
  const v = tasks.length ? done / tasks.length : 0;
  const pinned = tasks.filter((t) => t.pinned && t.status !== 'done');
  const msDone = project.milestones.filter((m) => m.done).length;

  const moveTask = (taskId: string, status: TaskStatus) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t || t.status === status) return;
    update((d) => {
      const tt = d.tasks.find((x) => x.id === taskId);
      if (!tt) return;
      tt.status = status;
      tt.doneAt = status === 'done' ? todayStr() : null;
    }, status === 'done' ? { action: 'completed', target: t.title } : { action: `moved to ${COLS.find((c) => c.k === status)?.label?.toLowerCase()}`, target: t.title });
    if (status === 'done') toast('Task completed — nice work', 'target');
  };

  const addTask = (status: TaskStatus) => {
    const title = (quickAdd[status] ?? '').trim();
    if (!title) return;
    update((d) => {
      d.tasks.unshift({
        id: `tk${uid()}`, projectId: project.id, title, status, priority: 'medium',
        tags: [], assignee: 'both', due: null, doneAt: null, subs: [], comments: [],
        reactions: {}, attachments: [], createdAt: nowIso(),
      });
    }, { action: 'added task', target: title });
    setQuickAdd((q) => ({ ...q, [status]: '' }));
  };

  const toggleMilestone = (msId: string) => {
    const m = project.milestones.find((x) => x.id === msId);
    update((d) => {
      const pr = d.projects.find((x) => x.id === project.id);
      const mm = pr?.milestones.find((x) => x.id === msId);
      if (mm) mm.done = !mm.done;
    }, { action: m?.done ? 'reopened milestone' : 'reached milestone', target: m?.title ?? '' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <FadeIn>
        <button onClick={() => nav('/projects')} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-mut hover:text-ink transition-colors cursor-pointer mb-3">
          <ArrowLeft size={14} /> All projects
        </button>
        <div className="rounded-3xl border border-line bg-surface mesh p-6">
          <div className="flex flex-wrap items-start gap-4">
            <IconTile icon={project.icon} color={project.color} size={52} radius={15} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-bold tracking-tight">{project.name}</h1>
                <Chip hex={p.hex} soft={p.soft}>{project.tag}</Chip>
              </div>
              <p className="mt-1 text-[13px] text-mut max-w-xl leading-relaxed">{project.desc}</p>
            </div>
            <div className="flex items-center gap-4">
              <Ring value={v} size={64} stroke={6} color={p.hex}>
                <span className="text-[12px] font-bold">{Math.round(v * 100)}%</span>
              </Ring>
              <div className="space-y-0.5 text-[11.5px] text-mut">
                <p><span className="font-bold text-ink">{tasks.length - done}</span> open tasks</p>
                <p><span className="font-bold text-ink">{done}</span> completed</p>
                <p><span className="font-bold text-ink">{msDone}/{project.milestones.length}</span> milestones</p>
                <div className="pt-1"><DuoAvatars users={collaborators.length > 0 ? collaborators : [data.users[project.ownerId]]} size={22} /></div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-[11px] font-semibold text-mut">
              {project.visibility === 'team' ? 'Shared project' : 'Personal project'}
            </div>
            <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-[11px] font-semibold text-mut">
              Owner: {data.users[project.ownerId]?.name ?? 'Unknown'}
            </div>
            {project.visibility === 'team' && (
              <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-[11px] font-semibold text-mut">
                {collaborators.length} collaborator{collaborators.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
          {me === project.ownerId && (
            <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-[14px] font-semibold tracking-tight">Project access</h2>
                  <p className="text-[12px] text-mut">Manage visibility and team members for this project.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-elev p-4">
                  <p className="text-[12px] text-mut mb-3">Visibility</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => update((d) => { const pr = d.projects.find((x) => x.id === project.id); if (pr) { pr.visibility = 'personal'; pr.members = []; } }, { action: 'updated visibility of', target: project.name })}
                      className={`rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all ${project.visibility === 'personal' ? 'border-accent bg-accent/[.08]' : 'border-line bg-surface hover:border-white/20'}`}>
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => update((d) => { const pr = d.projects.find((x) => x.id === project.id); if (pr) pr.visibility = 'team'; }, { action: 'updated visibility of', target: project.name })}
                      className={`rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all ${project.visibility === 'team' ? 'border-accent bg-accent/[.08]' : 'border-line bg-surface hover:border-white/20'}`}>
                      Shared
                    </button>
                  </div>
                </div>
                {project.visibility === 'team' && (
                  <div className="rounded-2xl border border-line bg-elev p-4">
                    <p className="text-[12px] text-mut mb-3">Collaborators</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(data.users).filter((u) => u.id !== project.ownerId).map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => update((d) => {
                            const pr = d.projects.find((x) => x.id === project.id);
                            if (!pr) return;
                            if (pr.members.includes(user.id)) {
                              pr.members = pr.members.filter((id) => id !== user.id);
                            } else {
                              pr.members.push(user.id);
                            }
                          }, { action: 'updated collaborators for', target: project.name })}
                          className={`rounded-2xl border p-3 text-left transition-all ${project.members.includes(user.id) ? 'border-accent bg-accent/[.08]' : 'border-line bg-surface hover:border-white/20'}`}>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-[11px] text-mut mt-1">{user.role}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-mut mt-3">Selected collaborators can access this project.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <select
              value={project.status}
              onChange={(e) => update((d) => { const pr = d.projects.find((x) => x.id === project.id); if (pr) pr.status = e.target.value as typeof project.status; }, { action: 'updated status of', target: project.name })}
              className="h-8 rounded-lg border border-line bg-surface px-2 text-[12px] font-medium cursor-pointer outline-none"
            >
              <option value="on-track">On track</option>
              <option value="at-risk">At risk</option>
              <option value="paused">Paused</option>
              <option value="done">Done</option>
            </select>
            <Btn size="sm" variant="danger" icon={Trash2} className="ms-auto" onClick={() => setConfirmDel(true)}>Delete project</Btn>
          </div>
        </div>
      </FadeIn>

      {/* Milestones */}
      <FadeIn delay={0.06}>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold tracking-tight flex items-center gap-2"><Milestone size={15} className="text-accent" /> Milestones</h2>
            <button
              className="text-[11.5px] font-semibold text-accent cursor-pointer inline-flex items-center gap-1"
              onClick={() => {
                const title = window.prompt('Milestone title');
                if (!title?.trim()) return;
                const date = window.prompt('Date (YYYY-MM-DD)', todayStr());
                if (!date) return;
                update((d) => { const pr = d.projects.find((x) => x.id === project.id); pr?.milestones.push({ id: `ms${uid()}`, title: title.trim(), date, done: false }); }, { action: 'added milestone', target: title.trim() });
              }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex gap-0 overflow-x-auto no-scrollbar">
            {project.milestones.map((m, i) => (
              <button key={m.id} onClick={() => toggleMilestone(m.id)} className="flex-1 min-w-[130px] text-left group cursor-pointer">
                <div className="flex items-center">
                  <span className={`h-4 w-4 rounded-full border-[3px] shrink-0 transition-all ${m.done ? 'bg-emerald-500 border-emerald-500' : 'bg-surface group-hover:scale-110'}`} style={m.done ? undefined : { borderColor: p.hex }} />
                  {i < project.milestones.length - 1 && <span className={`h-[2px] flex-1 ${project.milestones[i + 1]?.done ? 'bg-emerald-500' : 'bg-line'}`} />}
                </div>
                <p className={`mt-2 text-[12px] font-semibold pr-3 leading-snug ${m.done ? 'text-mut line-through' : ''}`}>{m.title}</p>
                <p className="text-[10.5px] text-mut">{pretty(m.date)}{!m.done && daysUntil(m.date) >= 0 ? ` · ${daysUntil(m.date)}d left` : ''}</p>
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Pinned updates */}
      {pinned.length > 0 && (
        <FadeIn delay={0.09} className="space-y-2">
          {pinned.map((t) => (
            <button key={t.id} onClick={() => setOpenTask(t.id)}
              className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left cursor-pointer transition-colors hover:bg-elev/40"
              style={{ borderColor: pal('gold').soft2, background: pal('gold').soft }}>
              <Pin size={14} style={{ color: pal('gold').hex }} className="shrink-0" />
              <p className="text-[13px] font-medium truncate flex-1">{t.title}</p>
              {t.due && <Chip hex={pal('gold').hex}>Due {pretty(t.due)}</Chip>}
            </button>
          ))}
        </FadeIn>
      )}

      {/* Board */}
      <FadeIn delay={0.12}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLS.map((col) => {
            const list = tasks.filter((t) => t.status === col.k);
            return (
              <div
                key={col.k}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.k); }}
                onDragLeave={() => setOverCol((c) => (c === col.k ? null : c))}
                onDrop={(e) => { e.preventDefault(); if (dragId.current) moveTask(dragId.current, col.k); dragId.current = null; setOverCol(null); }}
                className={`rounded-2xl border p-3 transition-colors ${overCol === col.k ? 'border-accent bg-accent/[.05]' : 'border-line bg-elev/40'}`}
              >
                <div className="flex items-center gap-2 px-1.5 pb-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.dot }} />
                  <span className="text-[12.5px] font-bold">{col.label}</span>
                  <span className="text-[10.5px] font-semibold text-mut bg-surface border border-line rounded-md px-1.5 py-0.5">{list.length}</span>
                </div>
                <div className="space-y-2.5 min-h-[60px]">
                  <AnimatePresence initial={false}>
                    {list.map((t) => (
                      <TaskCard key={t.id} task={t} onOpen={() => setOpenTask(t.id)} dragRef={dragId} />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  <input
                    value={quickAdd[col.k] ?? ''}
                    onChange={(e) => setQuickAdd((q) => ({ ...q, [col.k]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTask(col.k); }}
                    placeholder="+ Quick add"
                    className="w-full h-8.5 rounded-lg bg-surface border border-line px-2.5 text-[12px] outline-none focus:border-accent transition placeholder:text-mut/60"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </FadeIn>

      <TaskModal taskId={openTask} onClose={() => setOpenTask(null)} />

      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete project?">
        <div className="p-5">
          <p className="text-[13px] text-mut leading-relaxed">This removes <span className="font-semibold text-ink">{project.name}</span> and its {tasks.length} tasks. There is no undo — export a backup first if you need one.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setConfirmDel(false)}>Keep it</Btn>
            <Btn variant="danger" onClick={() => {
              update((d) => {
                d.projects = d.projects.filter((x) => x.id !== project.id);
                d.tasks = d.tasks.filter((x) => x.projectId !== project.id);
              });
              toast('Project deleted', 'trash' as never);
              nav('/projects');
            }}>Delete forever</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Card404({ onBack }: { onBack: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <Empty icon={Flag} title="Project not found" body="It may have been deleted." action={<Btn icon={ArrowLeft} onClick={onBack}>Back to projects</Btn>} />
    </div>
  );
}

function TaskCard({ task, onOpen, dragRef }: { task: Task; onOpen: () => void; dragRef: React.MutableRefObject<string | null> }) {
  const { data } = useStore();
  const pr = PRIO[task.priority];
  const subsDone = task.subs.filter((s) => s.done).length;
  const overdue = task.due && task.status !== 'done' && daysUntil(task.due) < 0;
  const dueSoon = task.due && task.status !== 'done' && daysUntil(task.due) >= 0 && daysUntil(task.due) <= 1;
  const reactionTotal = Object.values(task.reactions).reduce((n, u) => n + (u?.length ?? 0), 0);
  const assignees = task.assignee === 'both' ? Object.values(data.users) : [data.users[task.assignee]].filter(Boolean);

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
      draggable
      onDragStart={(e) => { dragRef.current = task.id; (e as unknown as React.DragEvent).dataTransfer?.setData('text/plain', task.id); }}
      onClick={onOpen}
      className="rounded-xl border border-line bg-surface p-3 cursor-pointer hover:border-accent/40 hover:shadow-lg transition-all group active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <p className={`text-[13px] font-semibold leading-snug flex-1 ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
        {task.pinned && <Pin size={12} style={{ color: pal('gold').hex }} className="shrink-0 mt-0.5" />}
      </div>
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tg) => <Chip key={tg} className="text-[9.5px]!">#{tg}</Chip>)}
        </div>
      )}
      {task.subs.length > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <Progress value={(subsDone / task.subs.length) * 100} h={4} className="flex-1" />
          <span className="text-[10px] font-semibold text-mut inline-flex items-center gap-1"><ListChecks size={11} /> {subsDone}/{task.subs.length}</span>
        </div>
      )}
      <div className="mt-2.5 flex items-center gap-2.5 text-mut">
        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold" style={{ color: pr.hex }}><Flag size={11} /> {pr.label}</span>
        {task.due && (
          <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${overdue ? 'text-rose-500' : dueSoon ? 'text-amber-500' : ''}`}>
            <CalendarDays size={11} /> {overdue ? 'Overdue' : pretty(task.due)}
          </span>
        )}
        <span className="ms-auto flex items-center gap-2 text-[10.5px] font-medium">
          {task.comments.length > 0 && <span className="inline-flex items-center gap-0.5"><MessageSquare size={11} /> {task.comments.length}</span>}
          {reactionTotal > 0 && <span className="inline-flex items-center gap-0.5"><Flame size={11} /> {reactionTotal}</span>}
          {task.attachments.length > 0 && <Paperclip size={11} />}
        </span>
        <DuoAvatars users={assignees} size={18} />
      </div>
    </motion.div>
  );
}

function TaskModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { data, update, me, toast } = useStore();
  const task = data.tasks.find((t) => t.id === taskId);
  const [comment, setComment] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newTag, setNewTag] = useState('');
  const [mentionOpen, setMentionOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const users = Object.values(data.users);
  const task_ = task;

  if (!task_) {
    return <Modal open={!!taskId} onClose={onClose} title="">{null}</Modal>;
  }

  const mutate = (fn: (t: Task) => void, act?: { action: string; target: string }) =>
    update((d) => { const t = d.tasks.find((x) => x.id === task_.id); if (t) fn(t); }, act);

  const sendComment = () => {
    if (!comment.trim() || !me) return;
    const mentioned = users.find((u) => comment.includes(`@${u.name.split(' ')[0]}`));
    mutate((t) => { t.comments.push({ id: `c${uid()}`, author: me, text: comment.trim(), at: nowIso() }); }, { action: 'commented on', target: task_.title });
    if (mentioned && mentioned.id !== me) {
      update((d) => { d.notifs.unshift({ id: uid(), icon: 'target', text: `${data.users[me].name.split(' ')[0]} mentioned you on “${task_.title}”`, at: nowIso(), read: false, type: 'mention' }); });
    }
    setComment('');
    setMentionOpen(false);
  };

  const subsDone = task_.subs.filter((s) => s.done).length;

  return (
    <Modal open={!!taskId} onClose={onClose} title={
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: COLS.find((c) => c.k === task_.status)?.dot }} />
        <span className="truncate">{task_.title}</span>
      </span>
    } wide>
      <div className="p-5 space-y-5">
        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-mut mb-1">Status</span>
            <select value={task_.status} onChange={(e) => {
              const ns = e.target.value as TaskStatus;
              mutate((t) => { t.status = ns; t.doneAt = ns === 'done' ? todayStr() : null; }, ns === 'done' ? { action: 'completed', target: task_.title } : undefined);
            }} className={`${inputCls} h-8.5! text-[12px]! cursor-pointer`}>
              {COLS.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-mut mb-1">Priority</span>
            <select value={task_.priority} onChange={(e) => mutate((t) => { t.priority = e.target.value as Priority; })} className={`${inputCls} h-8.5! text-[12px]! cursor-pointer`}>
              {(Object.keys(PRIO) as Priority[]).map((k) => <option key={k} value={k}>{PRIO[k].label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-mut mb-1">Assignee</span>
            <select value={task_.assignee} onChange={(e) => mutate((t) => { t.assignee = e.target.value as Assignee; })} className={`${inputCls} h-8.5! text-[12px]! cursor-pointer`}>
              <option value="both">Both partners</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-mut mb-1">Due date</span>
            <input type="date" value={task_.due ?? ''} onChange={(e) => mutate((t) => { t.due = e.target.value || null; })} className={`${inputCls} h-8.5! text-[12px]!`} />
          </label>
        </div>

        {/* Title edit + pin */}
        <div className="flex gap-2">
          <input
            value={task_.title}
            onChange={(e) => mutate((t) => { t.title = e.target.value; })}
            className={`${inputCls} flex-1 font-semibold`}
          />
          <Btn variant={task_.pinned ? 'primary' : 'ghost'} size="sm" className="h-9.5!" icon={task_.pinned ? PinOff : Pin}
            onClick={() => { mutate((t) => { t.pinned = !t.pinned; }); toast(task_.pinned ? 'Unpinned' : 'Pinned to project', 'flag'); }}>
            {task_.pinned ? 'Pinned' : 'Pin'}
          </Btn>
          <Btn variant="danger" size="sm" className="h-9.5!" icon={Trash2}
            onClick={() => { update((d) => { d.tasks = d.tasks.filter((x) => x.id !== task_.id); }, { action: 'deleted task', target: task_.title }); onClose(); }}>
            Delete
          </Btn>
        </div>

        {/* Tags */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1.5 flex items-center gap-1"><TagIcon size={11} /> Tags</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {task_.tags.map((tg) => (
              <Chip key={tg} className="text-[11px]!">
                #{tg}
                <button className="cursor-pointer hover:text-rose-500" onClick={() => mutate((t) => { t.tags = t.tags.filter((x) => x !== tg); })}><X size={10} /></button>
              </Chip>
            ))}
            <input
              value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim()) { mutate((t) => { t.tags.push(newTag.trim().toLowerCase().replace(/\s+/g, '-')); }); setNewTag(''); } }}
              placeholder="+ add tag"
              className="h-6.5 w-24 rounded-md bg-elev px-2 text-[11px] outline-none placeholder:text-mut/60"
            />
          </div>
        </div>

        {/* Checklist */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1.5 flex items-center gap-1.5">
            <ListChecks size={12} /> Checklist
            {task_.subs.length > 0 && <span className="text-accent">{subsDone}/{task_.subs.length}</span>}
          </p>
          {task_.subs.length > 0 && <Progress value={(subsDone / task_.subs.length) * 100} h={4} className="mb-2.5" />}
          <div className="space-y-1">
            {task_.subs.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-lg hover:bg-elev/60 px-1.5 py-1 group">
                <input type="checkbox" checked={s.done} onChange={() => mutate((t) => { const x = t.subs.find((y) => y.id === s.id); if (x) x.done = !x.done; })} className="chk cursor-pointer" />
                <span className={`text-[13px] flex-1 ${s.done ? 'line-through opacity-50' : ''}`}>{s.title}</span>
                <button className="opacity-0 group-hover:opacity-100 text-mut hover:text-rose-500 cursor-pointer transition" onClick={() => mutate((t) => { t.subs = t.subs.filter((y) => y.id !== s.id); })}><X size={13} /></button>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Add a subtask…" className={`${inputCls} h-8.5! text-[12px]! flex-1`}
              onKeyDown={(e) => { if (e.key === 'Enter' && newSub.trim()) { mutate((t) => { t.subs.push({ id: `s${uid()}`, title: newSub.trim(), done: false }); }); setNewSub(''); } }} />
            <Btn size="sm" variant="soft" className="h-8.5!" onClick={() => { if (newSub.trim()) { mutate((t) => { t.subs.push({ id: `s${uid()}`, title: newSub.trim(), done: false }); }); setNewSub(''); } }}>Add</Btn>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1.5 flex items-center gap-1"><Paperclip size={11} /> Attachments</p>
          <div className="flex flex-wrap gap-1.5">
            {task_.attachments.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elev/60 px-2.5 py-1.5 text-[11.5px] font-medium group">
                <Paperclip size={11} className="text-mut" /> {a.name} <span className="text-mut">· {a.size}</span>
                <button className="text-mut hover:text-rose-500 cursor-pointer" onClick={() => mutate((t) => { t.attachments = t.attachments.filter((x) => x.id !== a.id); })}><X size={11} /></button>
              </span>
            ))}
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-line px-2.5 py-1.5 text-[11.5px] text-mut hover:text-ink hover:border-accent/50 cursor-pointer transition">
              <Plus size={11} /> Attach file
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { mutate((t) => { t.attachments.push({ id: `a${uid()}`, name: f.name, size: fmtSize(f.size) }); }); toast(`Attached ${f.name}`, 'flag'); }
              e.target.value = '';
            }} />
          </div>
        </div>

        {/* Reactions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-1.5">Reactions</p>
          <div className="flex gap-1.5 flex-wrap">
            {REACTIONS.map(({ k, icon: I }) => {
              const list = task_.reactions[k] ?? [];
              const mine = me ? list.includes(me) : false;
              return (
                <button key={k}
                  onClick={() => mutate((t) => {
                    const cur = new Set(t.reactions[k] ?? []);
                    if (me && cur.has(me)) cur.delete(me); else if (me) cur.add(me);
                    t.reactions[k] = [...cur];
                  })}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[11.5px] font-semibold transition-all cursor-pointer active:scale-95 ${mine ? 'border-accent bg-accent/10 text-accent' : 'border-line text-mut hover:text-ink hover:border-accent/40'}`}>
                  <I size={13} /> {list.length > 0 && list.length}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-mut mb-2 flex items-center gap-1"><MessageSquare size={11} /> Comments · {task_.comments.length}</p>
          <div className="space-y-3">
            {task_.comments.length === 0 && <p className="text-[12px] text-mut">No comments yet — start the conversation. Use @ to mention your partner.</p>}
            {task_.comments.map((c) => {
              const u = data.users[c.author];
              return (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar user={u} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="rounded-xl rounded-ss-sm border border-line bg-elev/60 px-3 py-2">
                      <p className="text-[11px] font-bold">{u?.name} <span className="font-medium text-mut ms-1.5">{relTime(c.at)}</span></p>
                      <Md text={c.text} className="text-[13px] mt-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 relative">
            <AnimatePresence>
              {mentionOpen && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full mb-1.5 left-0 rounded-xl border border-line bg-surface shadow-xl p-1.5 z-10">
                  {users.map((u) => (
                    <button key={u.id} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-elev cursor-pointer text-[12.5px] font-medium"
                      onClick={() => { setComment((c) => c.replace(/@$/, `@${u.name.split(' ')[0]} `)); setMentionOpen(false); }}>
                      <Avatar user={u} size={20} /> {u.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
                <input
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setMentionOpen(e.target.value.endsWith('@')); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }}
                  placeholder="Write a comment… @ to mention"
                  className={`${inputCls} pl-8.5!`}
                />
              </div>
              <Btn size="sm" className="h-9.5! px-3!" icon={Send} onClick={sendComment} disabled={!comment.trim()} />
            </div>
          </div>
        </div>

        <p className="text-[10.5px] text-mut flex items-center gap-1.5 pt-1">
          <CheckCircle2 size={11} className="text-emerald-500" /> Autosaved to the shared workspace · created {relTime(task_.createdAt)}
          {task_.doneAt && <span>· done {pretty(task_.doneAt)}</span>}
        </p>
      </div>
    </Modal>
  );
}
