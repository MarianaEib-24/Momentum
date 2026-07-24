import {
  Rocket, Briefcase, Trophy, Car, Plane, Building2, Flame, BookOpen, Zap,
  Footprints, PenLine, Target, Dumbbell, Wallet, Heart, Lightbulb, Compass,
  Star, Coffee, Globe, Code2, PiggyBank, Users, Sparkles, Mountain, Flag,
  Landmark, Camera, Music, Sunrise, type LucideIcon,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, briefcase: Briefcase, trophy: Trophy, car: Car, plane: Plane,
  building: Building2, flame: Flame, book: BookOpen, zap: Zap, footprints: Footprints,
  pen: PenLine, target: Target, dumbbell: Dumbbell, wallet: Wallet, heart: Heart,
  bulb: Lightbulb, compass: Compass, star: Star, coffee: Coffee, globe: Globe,
  code: Code2, piggy: PiggyBank, users: Users, sparkles: Sparkles, mountain: Mountain,
  flag: Flag, landmark: Landmark, camera: Camera, music: Music, sunrise: Sunrise,
};

export const PALETTE: Record<string, { hex: string; soft: string; soft2: string }> = {
  blue:    { hex: '#2f6bff', soft: 'rgba(47,107,255,.12)',  soft2: 'rgba(47,107,255,.22)' },
  navy:    { hex: '#4a6cf7', soft: 'rgba(74,108,247,.13)',  soft2: 'rgba(74,108,247,.24)' },
  emerald: { hex: '#0da678', soft: 'rgba(13,166,120,.13)',  soft2: 'rgba(13,166,120,.25)' },
  gold:    { hex: '#d99a17', soft: 'rgba(217,154,23,.15)',  soft2: 'rgba(217,154,23,.28)' },
  violet:  { hex: '#7c5cff', soft: 'rgba(124,92,255,.13)',  soft2: 'rgba(124,92,255,.25)' },
  orange:  { hex: '#f07030', soft: 'rgba(240,112,48,.13)',  soft2: 'rgba(240,112,48,.26)' },
  rose:    { hex: '#e24a6d', soft: 'rgba(226,74,109,.12)',  soft2: 'rgba(226,74,109,.24)' },
};

export const pal = (c: string) => PALETTE[c] ?? PALETTE.blue;

export function Ico({ name, size = 18, className, strokeWidth = 2 }: {
  name: string; size?: number; className?: string; strokeWidth?: number;
}) {
  const C = ICONS[name] ?? Sparkles;
  return <C size={size} className={className} strokeWidth={strokeWidth} />;
}

export function IconTile({ icon, color, size = 40, radius = 12 }: {
  icon: string; color: string; size?: number; radius?: number;
}) {
  const p = pal(color);
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: size, height: size, borderRadius: radius, background: p.soft, color: p.hex }}
    >
      <Ico name={icon} size={size * 0.48} />
    </div>
  );
}
