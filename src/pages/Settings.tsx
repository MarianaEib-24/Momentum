import { useRef, useState } from 'react';
import { Sun, Moon, Download, Upload, RotateCcw, Database, BellRing, Palette, Building2, ShieldCheck, Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { Btn, Card, FadeIn, SectionTitle, Toggle, Field, Modal, inputCls } from '../components/ui';

const NOTIF_PREFS: { k: string; label: string; sub: string }[] = [
  { k: 'notif_mentions', label: 'Mentions', sub: 'When your partner @-mentions you in a task' },
  { k: 'notif_comments', label: 'Comments', sub: 'New comments on tasks you own' },
  { k: 'notif_deadlines', label: 'Deadline reminders', sub: 'Tasks and milestones within 48 hours' },
  { k: 'notif_habits', label: 'Habit nudges', sub: 'Evening reminder for unchecked habits' },
  { k: 'sounds', label: 'Interface sounds', sub: 'Soft ticks when you complete tasks' },
  { k: 'weekly_digest', label: 'Sunday digest', sub: 'A recap card prepared for the weekly review' },
];

export default function Settings() {
  const { data, theme, setTheme, update, toast, resetWorkspace, importData } = useStore();
  const [wsName, setWsName] = useState(data.workspace.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded', 'star');
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await importData(String(reader.result ?? ''));
      toast(ok ? 'Workspace restored from backup' : 'That file is not a valid Momentum backup', ok ? 'star' : 'flag');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <FadeIn>
        <h1 className="text-[22px] font-bold tracking-tight">Settings</h1>
        <p className="text-[12.5px] text-mut mt-0.5">Tune the workspace. Everything persists locally and travels with backups.</p>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Card className="p-5">
          <SectionTitle title="Appearance" sub="Light, dark — Momentum adapts instantly" right={<Palette size={16} className="text-accent" />} />
          <div className="grid grid-cols-2 gap-3">
            {([{ k: 'light', label: 'Light', icon: Sun, desc: 'Crisp white, navy ink' }, { k: 'dark', label: 'Dark', icon: Moon, desc: 'Deep navy, reduced glare' }] as const).map((t) => (
              <button key={t.k} onClick={() => setTheme(t.k)}
                className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${theme === t.k ? 'border-accent ring-2 ring-accent/20 bg-accent/[.04]' : 'border-line hover:bg-elev/50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${t.k === 'dark' ? 'bg-[#0d1526] text-amber-300' : 'bg-amber-100 text-amber-500'}`}>
                    <t.icon size={16} />
                  </span>
                  {theme === t.k && <span className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center"><Check size={11} /></span>}
                </div>
                <p className="mt-2.5 text-[13.5px] font-bold">{t.label}</p>
                <p className="text-[11px] text-mut">{t.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={0.06}>
        <Card className="p-5">
          <SectionTitle title="Workspace" sub="What you see across the top of the app" right={<Building2 size={16} className="text-accent" />} />
          <div className="flex gap-2 items-end">
            <Field label="Workspace name" className="flex-1">
              <input value={wsName} onChange={(e) => setWsName(e.target.value)} className={inputCls} />
            </Field>
            <Btn variant="soft" className="mb-0.5" onClick={() => {
              update((d) => { d.workspace.name = wsName.trim() || d.workspace.name; });
              toast('Workspace renamed', 'building');
            }}>Save</Btn>
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={0.08}>
        <Card className="p-5">
          <SectionTitle title="Notifications" sub="Choose what earns your attention" right={<BellRing size={16} className="text-accent" />} />
          <div className="divide-y divide-line">
            {NOTIF_PREFS.map((p) => (
              <div key={p.k} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-[13.5px] font-semibold">{p.label}</p>
                  <p className="text-[11.5px] text-mut">{p.sub}</p>
                </div>
                <Toggle on={!!data.settings[p.k]} onChange={(v) => update((d) => { d.settings[p.k] = v; })} />
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="p-5">
          <SectionTitle title="Data & backup" sub="Your workspace is a portable JSON — own it" right={<Database size={16} className="text-accent" />} />
          <div className="flex flex-wrap gap-2">
            <Btn icon={Download} onClick={exportJson}>Export backup</Btn>
            <Btn variant="ghost" icon={Upload} onClick={() => fileRef.current?.click()}>Import backup</Btn>
            <Btn variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>Reset workspace</Btn>
            <input ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
          </div>
          <p className="mt-3 text-[11.5px] text-mut leading-relaxed flex items-start gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            Your workspace is stored on the server and backed up there. Import/Export is still available for portability.
          </p>
        </Card>
      </FadeIn>

      <p className="text-center text-[11px] text-mut/60 pb-4">Momentum v1.0 — crafted for two partners who ship.</p>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset workspace?">
        <div className="p-5">
          <p className="text-[13px] text-mut leading-relaxed">This will clear your current workspace and reset it on the server. Export a backup first if unsure.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setConfirmReset(false)}>Keep my data</Btn>
            <Btn variant="danger" onClick={async () => { setConfirmReset(false); await resetWorkspace(); }}>Reset workspace</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
