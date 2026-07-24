import type { AppData } from './types';
import { habitStreak } from './utils';

export interface AchDef {
  id: string; title: string; desc: string; icon: string; color: string;
  check: (d: AppData) => boolean;
}

export const ACHIEVEMENTS: AchDef[] = [
  { id: 'first-task', title: 'First Steps', desc: 'Complete a task together', icon: 'footprints', color: 'blue', check: (d) => d.tasks.some((t) => t.status === 'done') },
  { id: 'on-fire', title: 'On Fire', desc: 'Hold a 7-day habit streak', icon: 'flame', color: 'orange', check: (d) => d.habits.some((h) => habitStreak(h.days) >= 7) },
  { id: 'team-player', title: 'Team Player', desc: 'Post 10 comments across projects', icon: 'users', color: 'navy', check: (d) => d.tasks.reduce((n, t) => n + t.comments.length, 0) >= 10 },
  { id: 'wordsmith', title: 'Wordsmith', desc: 'Write 5 journal entries', icon: 'pen', color: 'violet', check: (d) => d.journal.length >= 5 },
  { id: 'visionary', title: 'Visionary', desc: 'Post 8 ideas on the board', icon: 'bulb', color: 'gold', check: (d) => d.ideas.length >= 8 },
  { id: 'goal-getter', title: 'Goal Getter', desc: 'Reach 100% on any goal', icon: 'target', color: 'rose', check: (d) => d.goals.some((g) => g.current >= g.target) },
  { id: 'ship-it', title: 'Ship It', desc: 'Complete 15 tasks', icon: 'rocket', color: 'emerald', check: (d) => d.tasks.filter((t) => t.status === 'done').length >= 15 },
  { id: 'momentum', title: 'Full Momentum', desc: 'Complete 25 tasks', icon: 'zap', color: 'gold', check: (d) => d.tasks.filter((t) => t.status === 'done').length >= 25 },
];
