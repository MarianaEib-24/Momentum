import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader as Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Btn } from '../components/ui';
import { updatePasswordApi } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const nav = useNavigate();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr('');
    if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pass !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await updatePasswordApi(pass);
      setDone(true);
      window.setTimeout(() => nav('/login'), 2500);
    } catch (error: any) {
      setErr(error?.message ?? 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-6">
      <div className="absolute inset-0 mesh opacity-40 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg,#0d1b3e,#4d84ff)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight">Momentum</span>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[.08] p-8 text-center">
            <ShieldCheck size={40} className="mx-auto text-emerald-400 mb-4" />
            <h2 className="text-[22px] font-bold tracking-tight">Password updated</h2>
            <p className="mt-2 text-[14px] text-[#8d99b5]">Your new password is set. Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight">Set a new password</h1>
            <p className="mt-2 text-[14px] text-[#8d99b5]">Choose a new password for your Momentum account.</p>

            <form onSubmit={submit} className="mt-7 space-y-3">
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#67718c]" />
                <input
                  value={pass} onChange={(e) => setPass(e.target.value)} type={show ? 'text' : 'password'} autoComplete="new-password"
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/[.05] pl-10 pr-11 text-[14px] outline-none focus:border-[#4d84ff] focus:ring-2 focus:ring-[#4d84ff]/25 transition placeholder:text-[#5d6880]"
                  placeholder="New password"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#67718c] hover:text-white transition">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#67718c]" />
                <input
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? 'text' : 'password'} autoComplete="new-password"
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/[.05] pl-10 pr-3 text-[14px] outline-none focus:border-[#4d84ff] focus:ring-2 focus:ring-[#4d84ff]/25 transition placeholder:text-[#5d6880]"
                  placeholder="Confirm new password"
                />
              </div>
              {err && <p className="text-[12px] text-rose-400 font-medium px-1">{err}</p>}
              <Btn type="submit" disabled={busy} className="h-12! w-full text-[14px]! rounded-xl!" icon={busy ? Loader2 : ArrowRight}>
                {busy ? 'Updating password…' : 'Update password'}
              </Btn>
            </form>

            <p className="mt-5 text-[11.5px] text-[#8d99b5] flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} className="text-[#4d84ff]" /> Your password is encrypted and never shared.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
