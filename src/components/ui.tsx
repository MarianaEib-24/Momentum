import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, type LucideIcon } from 'lucide-react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import type { User } from '../lib/types';
import { initials } from '../lib/utils';

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(12,20,36,.05),0_12px_32px_-16px_rgba(12,20,36,.14)] dark:shadow-[0_1px_2px_rgba(0,0,0,.4),0_16px_40px_-20px_rgba(0,0,0,.55)] ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {sub && <p className="text-xs text-mut mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md';
  icon?: LucideIcon;
}

export function Btn({ variant = 'primary', size = 'md', icon: I, children, className = '', ...rest }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-all active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';
  const sizes = size === 'sm' ? 'px-2.5 h-8 text-xs' : 'px-3.5 h-9.5 text-[13px]';
  const variants = {
    primary: 'bg-accent text-white shadow-[0_4px_14px_-4px_var(--accent)] hover:brightness-110',
    ghost: 'border border-line bg-transparent hover:bg-elev text-ink',
    soft: 'bg-elev hover:bg-line/70 text-ink',
    danger: 'bg-rose-500/10 text-rose-500 border border-rose-500/25 hover:bg-rose-500/20',
  } as const;
  return (
    <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...rest}>
      {I && <I size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}

export function Chip({ children, hex, soft, className = '' }: { children: ReactNode; hex?: string; soft?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide ${hex ? '' : 'bg-elev text-mut'} ${className}`}
      style={hex ? { color: hex, background: soft ?? hex + '1f' } : undefined}
    >
      {children}
    </span>
  );
}

export function Progress({ value, color = 'var(--accent)', className = '', h = 6 }: { value: number; color?: string; className?: string; h?: number }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-line/60 ${className}`} style={{ height: h }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.3, 1] }}
      />
    </div>
  );
}

export function Avatar({ user, size = 32, ring = false, className = '' }: { user: User; size?: number; ring?: boolean; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${ring ? 'ring-2 ring-surface' : ''} ${className}`}
      style={{
        width: size, height: size, fontSize: size * 0.34,
        background: `linear-gradient(135deg, ${user.grad[0]}, ${user.grad[1]})`,
      }}
      title={user.name}
    >
      {initials(user.name)}
    </div>
  );
}

export function DuoAvatars({ users, size = 24 }: { users: User[]; size?: number }) {
  return (
    <div className="flex -space-x-2">
      {users.map((u) => <Avatar key={u.id} user={u} size={size} ring />)}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label ?? 'toggle'}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${on ? 'bg-accent' : 'bg-line'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? 'right-0.5' : 'left-0.5'}`}
      />
    </button>
  );
}

export function Empty({ icon: I = Sparkles, title, body, action }: { icon?: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-14 w-14 rounded-2xl bg-elev flex items-center justify-center text-mut mb-4">
        <I size={26} strokeWidth={1.6} />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {body && <p className="text-xs text-mut mt-1.5 max-w-60 leading-relaxed">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[#060a14]/60 glass" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[92vh] sm:max-h-[86vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-line bg-surface shadow-2xl`}
          >
            {title && (
              <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-line shrink-0">
                <div className="text-[15px] font-semibold tracking-tight min-w-0">{title}</div>
                <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-elev flex items-center justify-center text-mut hover:text-ink transition-colors cursor-pointer shrink-0">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto scroll-thin">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const inputCls = 'w-full h-9.5 rounded-xl border border-line bg-elev/60 px-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition placeholder:text-mut/70';
export const selectCls = inputCls + ' cursor-pointer appearance-none';

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-mut mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.7, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
