import { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseD, shiftDays } from '../lib/utils';

export function Ring({ value, size = 72, stroke = 7, color = 'var(--accent)', track = 'var(--line)', children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" opacity={0.5} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1, ease: [0.2, 0.7, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function AreaChart({ values, height = 140, color = '#2f6bff', labels }: {
  values: number[]; height?: number; color?: string; labels?: string[];
}) {
  const gid = useId().replace(/:/g, '');
  const w = 560;
  const pad = 6;
  const max = Math.max(...values, 1);
  const { line, area, last } = useMemo(() => {
    const pts: [number, number][] = values.map((v, i) => [
      pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1),
      height - pad - (v / max) * (height - pad * 2 - 10),
    ]);
    const line = smoothPath(pts);
    const area = `${line} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
    return { line, area, last: pts[pts.length - 1] };
  }, [values, height, max, pad]);

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((f) => (
          <line key={f} x1={0} x2={w} y1={height * f} y2={height * f} stroke="var(--line)" strokeDasharray="3 5" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#g${gid})`} />
        <motion.path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} />
        <circle cx={last[0]} cy={last[1]} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />
      </svg>
      {labels && (
        <div className="flex justify-between text-[10px] font-medium text-mut mt-1 px-0.5">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

export function Bars({ data, height = 120 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0">
          <span className="text-[10px] font-semibold text-mut">{d.value > 0 ? d.value : ''}</span>
          <motion.div
            className="w-full max-w-8 rounded-md"
            style={{ background: d.color ?? 'var(--accent)', height: `${(d.value / max) * 100}%` }}
            initial={{ height: 0 }} animate={{ height: `${(d.value / max) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.04, ease: [0.2, 0.7, 0.3, 1] }}
          />
          <span className="text-[10px] font-medium text-mut truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ slices, size = 150, stroke = 18 }: { slices: { value: number; color: string; label: string }[]; size?: number; stroke?: number }) {
  const total = Math.max(1, slices.reduce((n, s) => n + s.value, 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" opacity="0.4" />
      {slices.filter((s) => s.value > 0).map((s, i) => {
        const frac = s.value / total;
        const dash = `${frac * c - 3} ${c}`;
        const off = -acc * c;
        acc += frac;
        return (
          <motion.circle
            key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke} strokeDasharray={dash} strokeDashoffset={off}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 + 0.2 }}
          />
        );
      })}
    </svg>
  );
}

export function Heatmap({ days, weeks = 18, color = '#0da678', className = '' }: {
  days: Record<string, 1>; weeks?: number; color?: string; className?: string;
}) {
  const cols = useMemo(() => {
    const out: string[][] = [];
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (weeks * 7 - 1) - (today.getDay() + 6) % 7 + 1);
    for (let w = 0; w < weeks; w++) {
      const col: string[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        col.push(dt > today ? '' : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`);
      }
      out.push(col);
    }
    return out;
  }, [days, weeks]);

  return (
    <div className={`flex gap-[3px] ${className}`}>
      {cols.map((col, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {col.map((day, j) => (
            <div
              key={j}
              title={day ? parseD(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              className="h-[11px] w-[11px] rounded-[3px]"
              style={{
                background: !day ? 'transparent' : days[day] ? color : 'var(--line)',
                opacity: days[day] ? 0.55 + (i / cols.length) * 0.45 : 0.55,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function WeekStrip({ days, color, onToggle, count = 14 }: {
  days: Record<string, 1>; color: string; onToggle?: (date: string) => void; count?: number;
}) {
  const dates = useMemo(() => Array.from({ length: count }, (_, i) => shiftDays(i - (count - 1))), [count]);
  return (
    <div className="flex gap-1">
      {dates.map((d) => {
        const on = !!days[d];
        return (
          <button
            key={d}
            onClick={() => onToggle?.(d)}
            title={parseD(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            className={`flex-1 h-7 rounded-md transition-all ${onToggle ? 'cursor-pointer hover:scale-110' : ''}`}
            style={{ background: on ? color : 'var(--line)', opacity: on ? 1 : 0.5 }}
          />
        );
      })}
    </div>
  );
}
