import { useState } from 'react';
import { LogOut, Mail, CalendarHeart, CheckCircle2, MessageSquare, Flame, Pencil, Check as CheckIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Avatar, Btn, Card, FadeIn, SectionTitle, Chip } from '../components/ui';
import { AchievementGrid } from './Dashboard';
import { habitStreak, pretty, todayStr } from '../lib/utils';

export default function Profile() {
  const { data, meUser, partner, update, logout } = useStore();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [focus, setFocus] = useState('');

  if (!meUser) return null;

  const daysTogether = Math.max(1, Math.round((new Date().getTime() - new Date(data.workspace.since + 'T12:00:00').getTime()) / 86400000));
  const done = data.tasks.filter((t) => t.status === 'done').length;
  const comments = data.tasks.reduce((n, t) => n + t.comments.length, 0);
  const bestStreak = data.habits.reduce((m, h) => Math.max(m, habitStreak(h.days)), 0);
  const doneToday = data.habits.filter((h) => h.days[todayStr()]).length;

  const startEdit = () => { setName(meUser.name); setRole(meUser.role); setFocus(meUser.focus); setEditing(true); };
  const saveEdit = () => {
    update((d) => {
      const u = d.users[meUser.id];
      if (u) { u.name = name.trim() || u.name; u.role = role.trim() || u.role; u.focus = focus.trim(); }
    }, { action: 'updated their profile', target: name.trim() || meUser.name });
    setEditing(false);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <FadeIn>
        <Card className="overflow-hidden">
          <div className="h-28 sm:h-32 mesh relative" style={{ background: `linear-gradient(120deg, ${meUser.grad[0]}22, ${meUser.grad[1]}18)` }}>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(400px 120px at 20% 0%, rgba(47,107,255,.14), transparent)' }} />
          </div>
          <div className="px-6 pb-6 -mt-10 flex flex-wrap items-end gap-4">
            <div className="ring-4 ring-surface rounded-full">
              <Avatar user={meUser} size={80} />
            </div>
            <div className="flex-1 min-w-56 pb-1">
              {editing ? (
                <div className="space-y-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9 rounded-xl border border-line bg-elev/60 px-3 text-[15px] font-bold outline-none focus:border-accent" />
                  <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-8 rounded-xl border border-line bg-elev/60 px-3 text-[12px] outline-none focus:border-accent" />
                  <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Personal focus line" className="w-full h-8 rounded-xl border border-line bg-elev/60 px-3 text-[12px] outline-none focus:border-accent" />
                </div>
              ) : (
                <>
                  <h1 className="text-[22px] font-bold tracking-tight">{meUser.name}</h1>
                  <p className="text-[12.5px] text-mut">{meUser.role}</p>
                  <p className="text-[12px] mt-1 italic text-mut">“{meUser.focus}”</p>
                </>
              )}
            </div>
            <div className="flex gap-2 pb-1">
              {editing ? (
                <Btn icon={CheckIcon} onClick={saveEdit}>Save</Btn>
              ) : (
                <Btn variant="ghost" icon={Pencil} onClick={startEdit}>Edit profile</Btn>
              )}
              <Btn variant="danger" icon={LogOut} onClick={() => { void logout(); nav('/login'); }}>Sign out</Btn>
            </div>
          </div>
          <div className="px-6 pb-5 flex items-center gap-4 text-[12px] text-mut">
            <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {meUser.email}</span>
            <Chip>Workspace owner</Chip>
            <span className="inline-flex items-center gap-1.5"><Flame size={13} className="text-orange-400" /> {doneToday}/{data.habits.length} habits today</span>
          </div>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FadeIn delay={0.06}>
          <Card className="p-5 h-full">
            <SectionTitle title="Your partner" sub="The other half of Momentum" />
            {partner && (
              <div className="flex items-center gap-4">
                <Avatar user={partner} size={52} />
                <div className="min-w-0">
                  <p className="text-[16px] font-bold tracking-tight">{partner.name}</p>
                  <p className="text-[12px] text-mut">{partner.role}</p>
                  <p className="text-[11.5px] italic text-mut mt-0.5">“{partner.focus}”</p>
                </div>
                <span className="ms-auto flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" /> ONLINE
                </span>
              </div>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { icon: CalendarHeart, label: 'Days building', value: String(daysTogether), hex: '#e24a6d' },
                { icon: CheckCircle2, label: 'Tasks done', value: String(done), hex: '#0da678' },
                { icon: MessageSquare, label: 'Comments', value: String(comments), hex: '#7c5cff' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-line p-3 text-center">
                  <s.icon size={16} className="mx-auto" style={{ color: s.hex }} />
                  <p className="mt-1.5 text-[17px] font-bold leading-none">{s.value}</p>
                  <p className="text-[9.5px] text-mut mt-1 uppercase tracking-wider font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-mut leading-relaxed">
              Building together since {pretty(data.workspace.since)} — longest shared streak: {bestStreak} days.
            </p>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-5 h-full">
            <SectionTitle title="Achievement showcase" sub={`${data.unlocked.length} of 8 unlocked — keep going`} />
            <AchievementGrid />
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
