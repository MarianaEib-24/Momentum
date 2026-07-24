export { Card, SectionTitle, FadeIn } from '../components/ui';

export function IconStat({ label, value, sub, hex }: { label: string; value: string; sub: string; hex: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(12,20,36,.05)]">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-mut">{label}</p>
      <p className="mt-1.5 text-[24px] font-bold tracking-tight leading-none" style={{ color: hex }}>{value}</p>
      <p className="mt-1.5 text-[11px] text-mut">{sub}</p>
    </div>
  );
}
