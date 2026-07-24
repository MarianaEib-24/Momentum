import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#2f6bff', '#0da678', '#d99a17', '#7c5cff', '#f07030', '#e24a6d', '#4a6cf7'];

interface Piece { x: number; y: number; r: number; delay: number; dur: number; color: string; w: number; h: number; circle: boolean; }

function Burst({ burstKey }: { burstKey: number }) {
  const pieces = useMemo<Piece[]>(() => Array.from({ length: 90 }, () => ({
    x: (Math.random() - 0.5) * Math.min(window.innerWidth * 0.85, 720),
    y: window.innerHeight * (0.45 + Math.random() * 0.55),
    r: Math.random() * 720 - 360,
    delay: Math.random() * 0.15,
    dur: 1.6 + Math.random() * 1.1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: 5 + Math.random() * 6,
    h: 7 + Math.random() * 8,
    circle: Math.random() > 0.6,
  })), [burstKey]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={`${burstKey}-${i}`}
          className="absolute left-1/2 top-16 block"
          style={{ width: p.w, height: p.circle ? p.w : p.h, background: p.color, borderRadius: p.circle ? 99 : 2 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.r, opacity: [1, 1, 1, 0.2, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.15, 0.6, 0.45, 1] }}
        />
      ))}
    </div>
  );
}

export function Confetti({ fireKey }: { fireKey: number }) {
  const [bursts, setBursts] = useState<number[]>([]);
  useEffect(() => {
    if (!fireKey) return;
    setBursts((b) => [...b, fireKey]);
    const t = window.setTimeout(() => setBursts((b) => b.filter((x) => x !== fireKey)), 3200);
    return () => window.clearTimeout(t);
  }, [fireKey]);
  return <AnimatePresence>{bursts.map((b) => <Burst key={b} burstKey={b} />)}</AnimatePresence>;
}
