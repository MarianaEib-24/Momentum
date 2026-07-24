import { useMemo, useRef, useState } from 'react';
import { Plus, Heart, X, Shuffle, Lightbulb } from 'lucide-react';
import { useStore } from '../lib/store';
import { Btn, Card, Empty, FadeIn } from '../components/ui';
import { uid } from '../lib/utils';

const STICKY = [
  { bg: '#fde68a', ink: '#713f12', edge: '#f59e0b' },
  { bg: '#bfdbfe', ink: '#1e3a8a', edge: '#3b82f6' },
  { bg: '#bbf7d0', ink: '#14532d', edge: '#22c55e' },
  { bg: '#fbcfe8', ink: '#831843', edge: '#ec4899' },
  { bg: '#ddd6fe', ink: '#4c1d95', edge: '#8b5cf6' },
  { bg: '#fed7aa', ink: '#7c2d12', edge: '#f97316' },
  { bg: '#a5f3fc', ink: '#164e63', edge: '#06b6d4' },
];

const KEY_TO_IDX: Record<string, number> = { gold: 0, blue: 1, emerald: 2, rose: 3, violet: 4, orange: 5, navy: 6 };

export default function Brainstorm() {
  const { data, update, me } = useStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const ideas = useMemo(() => data.ideas, [data.ideas]);

  const addNote = () => {
    const id = `i${uid()}`;
    update((d) => {
      d.ideas.push({ id, text: 'New idea — double-click to edit', color: 'gold', x: 8 + Math.random() * 55, y: 8 + Math.random() * 55, votes: [] });
    }, { action: 'posted an idea', target: 'Brainstorm board' });
    setEditing(id);
  };

  const scatter = () => {
    update((d) => { d.ideas.forEach((i) => { i.x = 4 + Math.random() * 70; i.y = 5 + Math.random() * 65; }); });
  };

  const onDown = (e: React.PointerEvent, id: string) => {
    if (editing === id) return;
    const board = boardRef.current;
    const idea = ideas.find((i) => i.id === id);
    if (!board || !idea) return;
    const rect = board.getBoundingClientRect();
    drag.current = { id, dx: e.clientX - (rect.left + (idea.x / 100) * rect.width), dy: e.clientY - (rect.top + (idea.y / 100) * rect.height) };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const board = boardRef.current;
    if (!d || !board) return;
    const rect = board.getBoundingClientRect();
    const x = Math.min(88, Math.max(0, ((e.clientX - rect.left - d.dx) / rect.width) * 100));
    const y = Math.min(86, Math.max(0, ((e.clientY - rect.top - d.dy) / rect.height) * 100));
    update((dd) => { const i = dd.ideas.find((v) => v.id === d.id); if (i) { i.x = x; i.y = y; } });
  };

  const onUp = () => { drag.current = null; };

  return (
    <div className="space-y-5">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Brainstorm</h1>
          <p className="text-[12.5px] text-mut mt-0.5">Drag notes anywhere. Double-click to edit. Heart the ones worth building.</p>
        </div>
        <div className="ms-auto flex gap-2">
          <Btn variant="ghost" icon={Shuffle} onClick={scatter}>Scatter</Btn>
          <Btn icon={Plus} onClick={addNote}>Add note</Btn>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        {ideas.length === 0 ? (
          <Card><Empty icon={Lightbulb} title="Empty board" body="Pin your first wild idea." action={<Btn icon={Plus} onClick={addNote}>Add note</Btn>} /></Card>
        ) : (
          <div
            ref={boardRef}
            onPointerMove={onMove}
            onPointerUp={onUp}
            className="dotgrid relative h-[68vh] min-h-[440px] rounded-3xl border border-line bg-surface overflow-hidden touch-none select-none"
          >
            {ideas.map((idea, i) => {
              const s = STICKY[KEY_TO_IDX[idea.color] ?? i % STICKY.length];
              const mine = me ? idea.votes.includes(me) : false;
              return (
                <div
                  key={idea.id}
                  onPointerDown={(e) => onDown(e, idea.id)}
                  className="absolute w-48 sm:w-56 rounded-xl p-3 shadow-lg cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl"
                  style={{
                    left: `${idea.x}%`, top: `${idea.y}%`,
                    background: s.bg, color: s.ink,
                    transform: `rotate(${(i % 2 ? 1 : -1) * 1.1}deg)`,
                    borderTop: `3px solid ${s.edge}`,
                    zIndex: editing === idea.id ? 20 : 10,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Idea</span>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => update((d) => { d.ideas = d.ideas.filter((x) => x.id !== idea.id); })}
                      className="opacity-40 hover:opacity-100 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  {editing === idea.id ? (
                    <textarea
                      autoFocus
                      defaultValue={idea.text}
                      rows={3}
                      onBlur={(e) => { update((d) => { const x = d.ideas.find((v) => v.id === idea.id); if (x) x.text = e.target.value; }); setEditing(null); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur(); }}
                      className="mt-1 w-full bg-transparent outline-none resize-none text-[13px] font-semibold leading-snug"
                    />
                  ) : (
                    <p
                      onDoubleClick={() => setEditing(idea.id)}
                      className="mt-1 text-[13px] font-semibold leading-snug min-h-[40px]"
                    >
                      {idea.text}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => update((d) => { const x = d.ideas.find((v) => v.id === idea.id); if (x) { const keys = Object.keys(KEY_TO_IDX); x.color = keys[(keys.indexOf(x.color) + 1) % keys.length]; } })}
                      className="text-[9.5px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100 cursor-pointer"
                      title="Cycle color"
                    >
                      Color
                    </button>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => update((d) => {
                        const x = d.ideas.find((v) => v.id === idea.id);
                        if (!x || !me) return;
                        const set = new Set(x.votes);
                        if (set.has(me)) set.delete(me); else set.add(me);
                        x.votes = [...set];
                      }, mine ? undefined : { action: 'backed an idea', target: idea.text.slice(0, 40) })}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-transform active:scale-75 ${mine ? '' : 'opacity-50 hover:opacity-100'}`}
                    >
                      <Heart size={13} fill={mine ? s.edge : 'none'} /> {idea.votes.length > 0 && idea.votes.length}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FadeIn>
    </div>
  );
}
