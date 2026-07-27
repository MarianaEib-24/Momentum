import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap, Globe2, Loader2, UserPlus } from 'lucide-react';
import { useStore } from '../lib/store';
import { Avatar, Btn } from '../components/ui';

export default function Login() {
  const { data, login, register } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex@momentum.app');
  const [pass, setPass] = useState('momentum');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const users = Object.values(data.users || []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('Enter a valid email address.'); return; }
    if (pass.length < 4) { setErr('Password must be at least 4 characters.'); return; }
    if (mode === 'register' && !name.trim()) { setErr('Enter a display name to register.'); return; }
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), pass);
      } else {
        await login(email.trim(), pass);
      }
      nav('/dashboard');
    } catch (error: any) {
      setErr(error?.message ?? 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex">
      {/* Left — form */}
      <div className="w-full lg:w-[46%] flex flex-col px-6 sm:px-14 xl:px-20 py-8 relative">
        <div className="absolute inset-0 mesh opacity-60 pointer-events-none" />
        <div className="relative flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#0d1b3e,#4d84ff)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight">Momentum</span>
        </div>

        <div className="relative flex-1 flex items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md mx-auto">
            <h1 className="text-[30px] sm:text-[34px] font-bold tracking-tight leading-[1.12]">Two partners.<br />One operating system.</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[#8d99b5]">Sign in to your shared workspace — projects, habits, goals and dreams, kept perfectly in sync.</p>

            <div className="mt-7 grid grid-cols-2 gap-2.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setEmail(u.email)}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all cursor-pointer ${email === u.email ? 'border-[#4d84ff] bg-[#4d84ff]/12 shadow-[0_0_0_3px_rgba(77,132,255,.15)]' : 'border-white/10 bg-white/[.04] hover:bg-white/[.07]'}`}
                >
                  <Avatar user={u} size={34} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{u.name.split(' ')[0]}</span>
                    <span className="block text-[10.5px] text-[#8d99b5] truncate">{u.role.split('·')[1]}</span>
                  </span>
                  {email === u.email && <span className="ml-auto h-2 w-2 rounded-full bg-[#4d84ff] shrink-0" />}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              {mode === 'register' && (
                <div className="relative">
                  <UserPlus size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#67718c]" />
                  <input
                    value={name} onChange={(e) => setName(e.target.value)} type="text" autoComplete="name"
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/[.05] pl-10 pr-3 text-[14px] outline-none focus:border-[#4d84ff] focus:ring-2 focus:ring-[#4d84ff]/25 transition placeholder:text-[#5d6880]"
                    placeholder="Full name"
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#67718c]" />
                <input
                  value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email"
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/[.05] pl-10 pr-3 text-[14px] outline-none focus:border-[#4d84ff] focus:ring-2 focus:ring-[#4d84ff]/25 transition placeholder:text-[#5d6880]"
                  placeholder="you@momentum.app"
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#67718c]" />
                <input
                  value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/[.05] pl-10 pr-3 text-[14px] outline-none focus:border-[#4d84ff] focus:ring-2 focus:ring-[#4d84ff]/25 transition placeholder:text-[#5d6880]"
                  placeholder="Password"
                />
              </div>
              {err && <p className="text-[12px] text-rose-400 font-medium px-1">{err}</p>}
              <Btn type="submit" disabled={busy} className="h-12! w-full text-[14px]! rounded-xl!" icon={busy ? Loader2 : ArrowRight}>
                {busy ? (mode === 'register' ? 'Creating account…' : 'Signing in…') : (mode === 'register' ? 'Create account' : 'Sign in')}
              </Btn>
              <p className="text-[11px] text-center text-[#5d6880]">
                {mode === 'register'
                  ? 'Create an account to store your workspace on the server.'
                  : 'Sign in to your account. Data is stored securely on the server.'}
              </p>
            </form>
            <button type="button" onClick={() => { setMode((m) => (m === 'login' ? 'register' : 'login')); setErr(''); }}
              className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-[#4d84ff] hover:text-white">
              <span>{mode === 'login' ? 'Create a new account' : 'Back to sign in'}</span>
            </button>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11.5px] text-[#8d99b5]">
              {[{ i: ShieldCheck, t: 'Private by default' }, { i: Zap, t: 'Instantly synced' }, { i: Globe2, t: 'Offline friendly' }].map((f) => (
                <span key={f.t} className="inline-flex items-center gap-1.5"><f.i size={13} className="text-[#4d84ff]" /> {f.t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — visual */}
      <div className="hidden lg:block relative flex-1 overflow-hidden">
        <img src="/img/skyline.jpg" alt="City skyline at dusk" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/40 to-[#0a1830]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
          className="absolute bottom-14 left-14 right-14 max-w-lg rounded-3xl border border-white/12 bg-white/[.06] glass p-7"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4d84ff]">The Momentum ethos</p>
          <p className="mt-3 text-[22px] font-semibold leading-snug tracking-tight">
            “Discipline compounds. Two people in sync can outbuild ten who are not.”
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex -space-x-2.5">{users.map((u) => <Avatar key={u.id} user={u} size={30} ring />)}</div>
            <p className="text-[12px] text-[#aeb8d0]">Alex &amp; Jordan — building since day one</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
