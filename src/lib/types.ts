export type UID = string;
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'active' | 'review' | 'done';
export type ReactionKey = 'flame' | 'thumbs' | 'bulb' | 'target' | 'heart';
export type Mood = 'great' | 'good' | 'ok' | 'low';
export type Assignee = 'alex' | 'jordan' | 'both';

export interface User {
  id: UID;
  name: string;
  role: string;
  email: string;
  grad: [string, string];
  focus: string;
}

export interface Sub { id: UID; title: string; done: boolean; }
export interface Attachment { id: UID; name: string; size: string; }
export interface Comment { id: UID; author: UID; text: string; at: string; }

export interface Task {
  id: UID; projectId: UID; title: string;
  status: TaskStatus; priority: Priority;
  tags: string[]; assignee: Assignee;
  due: string | null; doneAt: string | null;
  subs: Sub[]; comments: Comment[];
  reactions: Partial<Record<ReactionKey, UID[]>>;
  attachments: Attachment[];
  pinned?: boolean; createdAt: string;
}

export interface Milestone { id: UID; title: string; date: string; done: boolean; }

export interface Project {
  id: UID; name: string; tag: string;
  color: string; icon: string; desc: string;
  status: 'on-track' | 'at-risk' | 'paused' | 'done';
  visibility: 'personal' | 'team';
  ownerId: UID;
  members: UID[];
  milestones: Milestone[];
}

export interface Habit { id: UID; name: string; icon: string; color: string; days: Record<string, 1>; }

export interface Goal {
  id: UID; title: string; cat: string; color: string;
  target: number; current: number; unit: string; deadline: string;
}

export interface JEntry { id: UID; title: string; body: string; date: string; mood: Mood; tags: string[]; }

export interface Idea { id: UID; text: string; color: string; x: number; y: number; votes: UID[]; }

export interface Plan {
  id: UID; title: string; cat: string;
  when: 'soon' | 'yr1' | 'yr3' | 'yr5';
  note: string; img: string; done?: boolean;
}

export interface Res {
  id: UID; title: string; domain: string;
  kind: 'article' | 'video' | 'doc' | 'tool' | 'podcast';
  tags: string[]; by: UID;
}

export interface CalEvent {
  id: UID; title: string; date: string; time: string;
  kind: 'meeting' | 'deadline' | 'personal' | 'travel';
  recur?: 'weekly' | null; color: string;
}

export interface Notif {
  id: UID; icon: string; text: string; at: string;
  read: boolean; type: 'mention' | 'comment' | 'system' | 'achievement';
}

export interface ActItem { id: UID; actor: UID; action: string; target: string; at: string; }

export interface WidgetPrefs {
  quote: boolean; kpis: boolean; chart: boolean; habits: boolean;
  deadlines: boolean; activity: boolean; achieve: boolean; notif: boolean;
}

export interface AppData {
  v: number;
  users: Record<UID, User>;
  workspace: { name: string; since: string };
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  journal: JEntry[];
  ideas: Idea[];
  plans: Plan[];
  resources: Res[];
  events: CalEvent[];
  notifs: Notif[];
  activity: ActItem[];
  unlocked: string[];
  widgetPrefs: WidgetPrefs;
  settings: Record<string, boolean>;
}
