import { useMemo, useState } from 'react';
import { Bell, CheckCheck, AtSign, MessageSquare, Settings2, Trophy, MailOpen } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, FadeIn, Btn, Empty } from '../components/ui';
import { IconTile } from '../components/Icon';
import { relTime } from '../lib/utils';
import type { Notif } from '../lib/types';

const FILTERS: { k: 'all' | 'unread' | Notif['type']; label: string }[] = [
  { k: 'all', label: 'All' },
  { k: 'unread', label: 'Unread' },
  { k: 'mention', label: 'Mentions' },
  { k: 'comment', label: 'Comments' },
  { k: 'achievement', label: 'Achievements' },
  { k: 'system', label: 'System' },
];

const TYPE_COLOR: Record<Notif['type'], string> = { mention: 'blue', comment: 'emerald', achievement: 'gold', system: 'violet' };
const TYPE_ICON: Record<Notif['type'], typeof AtSign> = { mention: AtSign, comment: MessageSquare, achievement: Trophy, system: Settings2 };

export default function Notifications() {
  const { data, update, toast } = useStore();
  const [filter, setFilter] = useState<'all' | 'unread' | Notif['type']>('all');

  const filtered = useMemo(() => data.notifs.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  }), [data.notifs, filter]);

  const groups = useMemo(() => {
    const today = new Date();
    const isToday = (iso: string) => new Date(iso).toDateString() === today.toDateString();
    return [
      { label: 'Today', items: filtered.filter((n) => isToday(n.at)) },
      { label: 'Earlier', items: filtered.filter((n) => !isToday(n.at)) },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const unread = data.notifs.filter((n) => !n.read).length;

  return (
    <div className="space-y-5 max-w-3xl">
      <FadeIn className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Notifications</h1>
          <p className="text-[12.5px] text-mut mt-0.5">{unread} unread — mentions, comments and milestones from your partner.</p>
        </div>
        <Btn variant="ghost" icon={CheckCheck} className="ms-auto" onClick={() => {
          update((d) => { d.notifs.forEach((n) => { n.read = true; }); });
          toast('All caught up', 'star');
        }}>
          Mark all read
        </Btn>
      </FadeIn>

      <FadeIn delay={0.04} className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`h-8 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${filter === f.k ? 'bg-ink text-bg' : 'bg-surface border border-line text-mut hover:text-ink'}`}>
            {f.label}
            {f.k === 'unread' && unread > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
          </button>
        ))}
      </FadeIn>

      {groups.length === 0 ? (
        <Card>
          <Empty icon={MailOpen} title="Inbox zero" body="Nothing matches this filter. Enjoy the quiet." />
        </Card>
      ) : (
        groups.map((g) => (
          <FadeIn key={g.label} delay={0.06}>
            <p className="text-[10.5px] font-bold uppercase tracking-widest text-mut mb-2">{g.label}</p>
            <Card className="divide-y divide-line overflow-hidden">
              {g.items.map((n) => {
                const TI = TYPE_ICON[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => update((d) => { const x = d.notifs.find((v) => v.id === n.id); if (x) x.read = true; })}
                    className={`w-full flex items-start gap-3.5 px-4.5 py-3.5 text-left transition-colors cursor-pointer hover:bg-elev/50 ${n.read ? '' : 'bg-accent/[.03]'}`}
                  >
                    <IconTile icon={n.icon} color={TYPE_COLOR[n.type]} size={36} radius={10} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13.5px] leading-snug ${n.read ? 'text-mut' : 'font-semibold'}`}>{n.text}</span>
                      <span className="mt-1 flex items-center gap-2 text-[10.5px] text-mut">
                        <TI size={10} className="capitalize" />
                        <span className="capitalize">{n.type}</span> · {relTime(n.at)}
                      </span>
                    </span>
                    {!n.read ? <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" /> : <Bell size={12} className="mt-2 text-mut/40 shrink-0" />}
                  </button>
                );
              })}
            </Card>
          </FadeIn>
        ))
      )}
    </div>
  );
}
