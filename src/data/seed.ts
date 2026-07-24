import type { AppData, Task, TaskStatus, Priority, Assignee, Sub, Comment, ReactionKey } from '../lib/types';
import { shiftDays, todayStr, recentWeekday, nowIso } from '../lib/utils';

let tn = 0, cn = 0, sn = 0;
const T = (t: {
  projectId: string; title: string; status?: TaskStatus; priority?: Priority;
  tags?: string[]; assignee?: Assignee; due?: number | null; doneAgo?: number;
  subs?: [string, boolean][]; comments?: [string, string, number][];
  reactions?: [ReactionKey, string[]][]; attachments?: [string, string][]; pinned?: boolean;
}): Task => {
  const done = t.status === 'done';
  return {
    id: `tk${++tn}`, projectId: t.projectId, title: t.title,
    status: t.status ?? 'todo', priority: t.priority ?? 'medium',
    tags: t.tags ?? [], assignee: t.assignee ?? 'both',
    due: t.due === null || t.due === undefined ? null : shiftDays(t.due),
    doneAt: done ? shiftDays(-(t.doneAgo ?? 1)) : null,
    subs: (t.subs ?? []).map(([title, d]): Sub => ({ id: `s${++sn}`, title, done: d })),
    comments: (t.comments ?? []).map(([author, text, hrs]): Comment => ({
      id: `c${++cn}`, author, text,
      at: new Date(Date.now() - hrs * 3600000).toISOString(),
    })),
    reactions: Object.fromEntries((t.reactions ?? []).map(([k, u]) => [k, u])),
    attachments: (t.attachments ?? []).map(([name, size]) => ({ id: `a${++sn}`, name, size })),
    pinned: t.pinned, createdAt: nowIso(),
  };
};

const habitDays = (skip: number[], miss: number[] = []): Record<string, 1> => {
  const out: Record<string, 1> = {};
  for (let i = 0; i < 35; i++) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    if (skip.includes(dt.getDay())) continue;
    if (miss.includes(i)) continue;
    out[shiftDays(-i)] = 1;
  }
  return out;
};

export function seedData(): AppData {
  const t0 = new Date();
  const iso = (hrsAgo: number) => new Date(t0.getTime() - hrsAgo * 3600000).toISOString();

  return {
    v: 3,
    users: {
      alex: {
        id: 'alex', name: 'Alex Rivera', role: 'Co-founder · Product & Design',
        email: 'alex@momentum.app', grad: ['#2f6bff', '#7c5cff'],
        focus: 'Protect the mornings. Ship every day.',
      },
      jordan: {
        id: 'jordan', name: 'Jordan Lee', role: 'Co-founder · Ops & Growth',
        email: 'jordan@momentum.app', grad: ['#0da678', '#d99a17'],
        focus: 'Discipline compounds. So does capital.',
      },
    },
    workspace: { name: 'Momentum HQ', since: shiftDays(-214) },

    projects: [
      {
        id: 'pj1', name: 'Forge OS — MVP Build', tag: 'PRODUCT', color: 'blue', icon: 'rocket',
        desc: 'Our flagship SaaS. Private beta to 50 design partners, then public launch.',
        status: 'on-track',
        milestones: [
          { id: 'ms1', title: 'Alpha demo', date: shiftDays(-21), done: true },
          { id: 'ms2', title: 'Private beta — 50 partners', date: shiftDays(9), done: false },
          { id: 'ms3', title: 'Billing + onboarding', date: shiftDays(24), done: false },
          { id: 'ms4', title: 'Public launch', date: shiftDays(52), done: false },
        ],
      },
      {
        id: 'pj2', name: 'Seed Fundraise', tag: 'FINANCE', color: 'gold', icon: 'wallet',
        desc: 'Raise $1.8M seed. Target close before the public launch window.',
        status: 'on-track',
        milestones: [
          { id: 'ms5', title: 'Deck v3 final', date: shiftDays(-8), done: true },
          { id: 'ms6', title: 'First 10 partner meetings', date: shiftDays(4), done: false },
          { id: 'ms7', title: 'Term sheet', date: shiftDays(30), done: false },
        ],
      },
      {
        id: 'pj3', name: 'Sunset Hoops League', tag: 'BASKETBALL', color: 'orange', icon: 'trophy',
        desc: 'Tuesday night run. Win the summer 5v5 league — conditioning + film.',
        status: 'on-track',
        milestones: [
          { id: 'ms8', title: 'Roster locked (7)', date: shiftDays(-12), done: true },
          { id: 'ms9', title: 'Midseason — top 4 seed', date: shiftDays(11), done: false },
          { id: 'ms10', title: 'Championship game', date: shiftDays(38), done: false },
        ],
      },
      {
        id: 'pj4', name: 'GT3 Touring Fund', tag: 'CARS', color: 'rose', icon: 'car',
        desc: 'Structured fund toward the 992 GT3 Touring. Invest monthly, no impulse.',
        status: 'paused',
        milestones: [
          { id: 'ms11', title: '$40k parked', date: shiftDays(-30), done: true },
          { id: 'ms12', title: '$120k — 50% mark', date: shiftDays(64), done: false },
          { id: 'ms13', title: 'Allocation + build slot', date: shiftDays(220), done: false },
        ],
      },
      {
        id: 'pj5', name: 'Kyoto & Amalfi Escape', tag: 'TRAVEL', color: 'emerald', icon: 'plane',
        desc: 'Three weeks off-grid after launch: one week Kyoto, two on the coast.',
        status: 'on-track',
        milestones: [
          { id: 'ms14', title: 'Flights booked', date: shiftDays(-4), done: true },
          { id: 'ms15', title: 'Ryokan + cliff hotel', date: shiftDays(16), done: false },
          { id: 'ms16', title: 'Wheels up', date: shiftDays(96), done: false },
        ],
      },
      {
        id: 'pj6', name: 'Skyline Residence Search', tag: 'HOMEBASE', color: 'navy', icon: 'building',
        desc: 'Find the corner unit with the skyline view. Pre-approval first, then tour.',
        status: 'at-risk',
        milestones: [
          { id: 'ms17', title: 'Mortgage pre-approval', date: shiftDays(-15), done: true },
          { id: 'ms18', title: 'Shortlist 5 buildings', date: shiftDays(2), done: false },
          { id: 'ms19', title: 'Offer accepted', date: shiftDays(75), done: false },
        ],
      },
    ],

    tasks: [
      // Forge OS
      T({ projectId: 'pj1', title: 'Onboarding flow v2 — 3 steps, skippable', status: 'active', priority: 'urgent', tags: ['ux', 'growth'], assignee: 'alex', due: 2, pinned: true,
        subs: [['Empty-state illustrations', true], ['Progress stepper', true], ['Invite-partner step', false], ['A/B headline copy', false]],
        comments: [['jordan', 'New stepper feels Linear-grade. @Alex Ship it behind the flag.', 5], ['alex', 'Agreed — flag is live for beta cohort B.', 3]],
        reactions: [['flame', ['jordan']], ['target', ['jordan', 'alex']]],
        attachments: [['onboarding-v2.fig', '2.4 MB']],
      }),
      T({ projectId: 'pj1', title: 'Realtime sync engine — CRDT layer', status: 'active', priority: 'high', tags: ['infra'], assignee: 'jordan', due: 4,
        subs: [['Presence cursors', true], ['Conflict resolution', true], ['Reconnect queue', false]],
        comments: [['jordan', 'CRDT merge is finally deterministic. Latency p95 at 41ms.', 9]],
        reactions: [['thumbs', ['alex']]],
      }),
      T({ projectId: 'pj1', title: 'Pricing page + Stripe checkout', status: 'todo', priority: 'high', tags: ['billing', 'web'], assignee: 'both', due: 8,
        subs: [['Annual toggle', false], ['Founding-partner plan', false], ['Tax config', false]],
      }),
      T({ projectId: 'pj1', title: 'Beta interview notes → insight doc', status: 'review', priority: 'medium', tags: ['research'], assignee: 'jordan', due: 1,
        comments: [['alex', 'Tag the churn-risk quotes separately, they feed the deck.', 26]],
        attachments: [['beta-insights.md', '38 KB']],
      }),
      T({ projectId: 'pj1', title: 'Design system tokens — dark mode pass', status: 'done', priority: 'medium', tags: ['design'], assignee: 'alex', doneAgo: 1, reactions: [['heart', ['jordan']]] }),
      T({ projectId: 'pj1', title: 'Status page + uptime alerts', status: 'done', priority: 'low', tags: ['infra'], assignee: 'jordan', doneAgo: 4 }),
      // Fundraise
      T({ projectId: 'pj2', title: 'Warm intro map — 40 angels / 12 funds', status: 'done', priority: 'high', tags: ['outreach'], assignee: 'jordan', doneAgo: 2 }),
      T({ projectId: 'pj2', title: 'Data room: metrics, cap table, M-1 P&L', status: 'active', priority: 'urgent', tags: ['diligence'], assignee: 'jordan', due: 3, pinned: true,
        subs: [['Metrics dashboard export', true], ['Cap table v-final', true], ['M-1 P&L review', false], ['Founder refs', false]],
        comments: [['alex', 'Asked our accountant for the reviewed P&L — ETA Thursday.', 7]],
        reactions: [['target', ['alex']]],
        attachments: [['dataroom-index.pdf', '112 KB']],
      }),
      T({ projectId: 'pj2', title: 'Financial model — 24-month runway plan', status: 'active', priority: 'high', tags: ['model'], assignee: 'both', due: 5,
        comments: [['jordan', 'Base case now shows default-alive at 55k MRR. @Alex check hiring rows.', 14]],
        reactions: [['bulb', ['alex']]],
      }),
      T({ projectId: 'pj2', title: 'Partner pitch rehearsal ×5', status: 'todo', priority: 'medium', tags: ['pitch'], assignee: 'both', due: 6 }),
      T({ projectId: 'pj2', title: 'Update deck: add cohort retention slide', status: 'review', priority: 'medium', tags: ['deck'], assignee: 'alex', due: 2 }),
      // Hoops
      T({ projectId: 'pj3', title: 'Film session — pick-and-roll coverage', status: 'todo', priority: 'medium', tags: ['film'], assignee: 'both', due: 3,
        comments: [['jordan', 'Their 4 can’t switch. Force the short roll every time.', 18]],
        reactions: [['flame', ['alex']]],
      }),
      T({ projectId: 'pj3', title: 'Conditioning block — 6am track ×3/wk', status: 'active', priority: 'high', tags: ['fitness'], assignee: 'both', due: 1,
        subs: [['400m repeats', true], ['Lateral slides', true], ['Free throws ×50', false]],
      }),
      T({ projectId: 'pj3', title: 'New uniforms — navy/gold mockups', status: 'done', priority: 'low', tags: ['gear'], assignee: 'alex', doneAgo: 3, reactions: [['heart', ['jordan']]] }),
      T({ projectId: 'pj3', title: 'Playbook: horns + elbow actions', status: 'todo', priority: 'low', tags: ['strategy'], assignee: 'jordan', due: 10 }),
      // GT3
      T({ projectId: 'pj4', title: 'Auto-invest $6,500/mo into index sleeve', status: 'active', priority: 'high', tags: ['investing'], assignee: 'jordan', due: 12,
        comments: [['jordan', 'Set the recurring transfer — boring is the strategy.', 30]],
      }),
      T({ projectId: 'pj4', title: 'Compare allocations: Touring vs Spyder RS', status: 'todo', priority: 'low', tags: ['research'], assignee: 'alex', due: 40 }),
      T({ projectId: 'pj4', title: 'Track day: Laguna Seca waitlist', status: 'done', priority: 'medium', tags: ['experience'], assignee: 'both', doneAgo: 6, reactions: [['flame', ['alex', 'jordan']]] }),
      // Travel
      T({ projectId: 'pj5', title: 'Kyoto: 4-day temple + food crawl route', status: 'active', priority: 'medium', tags: ['itinerary'], assignee: 'alex', due: 14,
        subs: [['Fushimi Inari at dawn', true], ['Nishiki market lunch', false], ['Arashiyama bikes', false]],
        reactions: [['bulb', ['jordan']]],
      }),
      T({ projectId: 'pj5', title: 'Book cliffside hotel — Positano 7 nights', status: 'todo', priority: 'high', tags: ['booking'], assignee: 'jordan', due: 9,
        comments: [['alex', 'The one with the infinity pool. Non-negotiable.', 22]],
      }),
      T({ projectId: 'pj5', title: 'Offline handoff doc for the beta cohort', status: 'todo', priority: 'medium', tags: ['ops'], assignee: 'both', due: 80 }),
      T({ projectId: 'pj5', title: 'JRE rail passes + pocket wifi', status: 'done', priority: 'low', tags: ['logistics'], assignee: 'jordan', doneAgo: 2 }),
      // Residence
      T({ projectId: 'pj6', title: 'Tour: Meridian Tower unit 34B — skyline corner', status: 'active', priority: 'urgent', tags: ['tour'], assignee: 'both', due: 2, pinned: true,
        comments: [['alex', 'Agent sent the floor plan. Corner glazing faces east — sunrise desk spot.', 8]],
        reactions: [['target', ['alex', 'jordan']], ['flame', ['jordan']]],
        attachments: [['34B-floorplan.pdf', '860 KB']],
      }),
      T({ projectId: 'pj6', title: 'HOA + property-tax model for shortlist', status: 'todo', priority: 'high', tags: ['analysis'], assignee: 'jordan', due: 5 }),
      T({ projectId: 'pj6', title: 'Negotiation strategy: anchor 6% under ask', status: 'todo', priority: 'medium', tags: ['strategy'], assignee: 'both', due: 20 }),
    ],

    habits: [
      { id: 'h1', name: 'Morning workout', icon: 'dumbbell', color: 'orange', days: habitDays([], [9, 13, 21]) },
      { id: 'h2', name: 'Deep work · 2h block', icon: 'zap', color: 'blue', days: habitDays([0, 6], [5, 18]) },
      { id: 'h3', name: 'Read 20 pages', icon: 'book', color: 'violet', days: habitDays([], [3, 7, 15, 27]) },
      { id: 'h4', name: 'Ship something', icon: 'rocket', color: 'emerald', days: habitDays([0], [6, 9, 23]) },
      { id: 'h5', name: '10k steps', icon: 'footprints', color: 'gold', days: habitDays([], [2, 11, 19, 30]) },
    ],

    goals: [
      { id: 'g1', title: 'Close the $1.8M seed round', cat: 'Finance', color: 'gold', target: 1800, current: 640, unit: '$K', deadline: shiftDays(45) },
      { id: 'g2', title: 'Ship Forge OS public launch', cat: 'Product', color: 'blue', target: 100, current: 68, unit: '%', deadline: shiftDays(52) },
      { id: 'g3', title: 'GT3 fund — reach 50% mark', cat: 'Cars', color: 'rose', target: 120, current: 41, unit: '$K', deadline: shiftDays(64) },
      { id: 'g4', title: 'Win the summer league', cat: 'Basketball', color: 'orange', target: 12, current: 7, unit: 'wins', deadline: shiftDays(38) },
      { id: 'g5', title: 'Run 10K under 48:00', cat: 'Fitness', color: 'emerald', target: 100, current: 84, unit: '%', deadline: shiftDays(28) },
    ],

    journal: [
      {
        id: 'j1', title: 'Momentum is a system, not a mood', date: shiftDays(-1), mood: 'great', tags: ['building', 'focus'],
        body: '# Weekly reflection\nBest week of output since we started. The 6am workouts are carrying the whole system — when the body moves first, the mind follows.\n\n**What worked:**\n- Two-hour deep work blocks before any messages\n- Killing meetings on Tuesdays (game night is sacred)\n- Reviewing the dashboard together on Sundays\n\n*Next:* keep the beta interviews under 20 minutes. Energy > breadth.',
      },
      {
        id: 'j2', title: 'Notes from partner meeting #3', date: shiftDays(-3), mood: 'good', tags: ['fundraise'],
        body: 'They leaned in at the retention slide. The question that mattered: *"why do two founders need their own OS for life?"* — our answer is the whole thesis.\n\n**Follow-ups:**\n- Send the cohort table\n- Intro to their portfolio CTO\n- Tighten the GT3-fund story as proof of discipline (funny, but it lands)',
      },
      {
        id: 'j3', title: 'After the comeback win', date: shiftDays(-5), mood: 'great', tags: ['basketball', 'team'],
        body: 'Down 14 in the third, won by 4. The league is not ready for our pick-and-roll.\n\nJordan’s fourth-quarter defense was *different*. Building companies and closing out on shooters — same skill. Stay down, stay patient, strike late.',
      },
      {
        id: 'j4', title: 'Quiet Sunday', date: shiftDays(-8), mood: 'ok', tags: ['life'],
        body: 'Drove up the coast at golden hour, no destination. Reminder that the skyline we’re chasing is already out the window.\n\nSketching the home office: two desks facing the glass, court-side print above the shelf, one absurd espresso machine.',
      },
    ],

    ideas: [
      { id: 'i1', text: 'Widget marketplace — let users publish dashboard modules', color: 'gold', x: 4, y: 6, votes: ['alex', 'jordan'] },
      { id: 'i2', text: 'Courtside analytics: track our own +/- during league games', color: 'orange', x: 34, y: 3, votes: ['alex'] },
      { id: 'i3', text: 'Founder-fit content series — "two partners, one OS"', color: 'blue', x: 62, y: 8, votes: ['jordan'] },
      { id: 'i4', text: 'Auto-invest roundup engine for the GT3 fund', color: 'emerald', x: 12, y: 40, votes: ['jordan', 'alex'] },
      { id: 'i5', text: 'Amalfi co-working week — bring laptops, test "work from anywhere"', color: 'violet', x: 44, y: 36, votes: [] },
      { id: 'i6', text: 'Skyline penthouse demo day — investors on the 40th floor', color: 'rose', x: 70, y: 42, votes: ['alex'] },
      { id: 'i7', text: 'Streak insurance: freeze one missed habit day per month', color: 'navy', x: 30, y: 68, votes: ['jordan'] },
    ],

    plans: [
      { id: 'pl1', title: 'Courtside seats for the Finals', cat: 'Basketball', when: 'yr1', img: '/img/court_photo.jpg', note: 'Row 2 baseline. The annual celebration once the seed closes.' },
      { id: 'pl2', title: 'Kyoto mornings, Amalfi sunsets', cat: 'Travel', when: 'soon', img: '/img/japan_photo.jpg', note: 'Three weeks fully offline. The company runs on systems, not on us.' },
      { id: 'pl3', title: 'Beach week after launch', cat: 'Travel', when: 'yr1', img: '/img/beach.jpg', note: 'Seven days, turquoise water, zero notifications.' },
      { id: 'pl4', title: 'The GT3 Touring', cat: 'Cars', when: 'yr3', img: '/img/car.jpg', note: 'Manual. Gentian blue. Earned in monthly deposits, not luck.' },
      { id: 'pl5', title: 'Skyline corner residence', cat: 'Home', when: 'yr3', img: '/img/skyline.jpg', note: 'Corner glazing, sunrise desk, view over the whole city grid.' },
      { id: 'pl6', title: 'The twin-desk studio', cat: 'Workspace', when: 'yr5', img: '/img/desk_photo.jpg', note: 'Two desks facing glass. Where Momentum becomes a fund.' },
    ],

    resources: [
      { id: 'r1', title: 'The Stripe Atlas guide to SaaS metrics', domain: 'stripe.com', kind: 'doc', tags: ['saas', 'metrics'], by: 'jordan' },
      { id: 'r2', title: 'Do things that don’t scale', domain: 'paulgraham.com', kind: 'article', tags: ['startups', 'classic'], by: 'alex' },
      { id: 'r3', title: 'YC seed deck template', domain: 'ycombinator.com', kind: 'doc', tags: ['fundraise', 'deck'], by: 'jordan' },
      { id: 'r4', title: 'Pick-and-roll defensive coverages, explained', domain: 'nba.com', kind: 'video', tags: ['basketball', 'film'], by: 'jordan' },
      { id: 'r5', title: 'Index investing deep-dive', domain: 'bogleheads.org', kind: 'article', tags: ['finance', 'gt3-fund'], by: 'alex' },
      { id: 'r6', title: 'Figma — design system workspace', domain: 'figma.com', kind: 'tool', tags: ['design'], by: 'alex' },
      { id: 'r7', title: 'Ryokan etiquette, a short guide', domain: 'japan.travel', kind: 'article', tags: ['travel', 'kyoto'], by: 'jordan' },
      { id: 'r8', title: 'How I Built This — founder interviews', domain: 'npr.org', kind: 'podcast', tags: ['mindset'], by: 'alex' },
    ],

    events: [
      { id: 'e1', title: 'Partner sync — week review', date: recentWeekday(1), time: '09:00', kind: 'meeting', recur: 'weekly', color: 'blue' },
      { id: 'e2', title: 'League game — vs Northside', date: recentWeekday(2), time: '19:30', kind: 'personal', recur: 'weekly', color: 'orange' },
      { id: 'e3', title: 'Meridian 34B tour', date: shiftDays(2), time: '17:00', kind: 'personal', recur: null, color: 'navy' },
      { id: 'e4', title: 'Partner meeting — Meridian VC', date: shiftDays(4), time: '14:00', kind: 'meeting', recur: null, color: 'gold' },
      { id: 'e5', title: 'Beta cohort B onboard', date: shiftDays(9), time: '10:00', kind: 'deadline', recur: null, color: 'blue' },
      { id: 'e6', title: 'Ryokan booking closes', date: shiftDays(16), time: '12:00', kind: 'deadline', recur: null, color: 'emerald' },
      { id: 'e7', title: 'Track day — Laguna Seca', date: shiftDays(47), time: '07:00', kind: 'travel', recur: null, color: 'rose' },
      { id: 'e8', title: 'Flight LAX → KIX', date: shiftDays(96), time: '11:25', kind: 'travel', recur: null, color: 'emerald' },
    ],

    notifs: [
      { id: 'n1', icon: 'target', text: 'Jordan mentioned you in “Data room: metrics, cap table, M-1 P&L”', at: iso(1), read: false, type: 'mention' },
      { id: 'n2', icon: 'pen', text: 'Jordan commented on “Onboarding flow v2”', at: iso(3), read: false, type: 'comment' },
      { id: 'n3', icon: 'flame', text: 'Morning workout streak hit 9 days — keep it alive', at: iso(7), read: false, type: 'system' },
      { id: 'n4', icon: 'wallet', text: 'Goal update: seed round passed $640K committed', at: iso(20), read: true, type: 'system' },
      { id: 'n5', icon: 'trophy', text: 'Achievement unlocked — Ship It', at: iso(26), read: true, type: 'achievement' },
      { id: 'n6', icon: 'plane', text: 'Ryokan booking closes in 16 days', at: iso(30), read: true, type: 'system' },
    ],

    activity: [
      { id: 'ac1', actor: 'jordan', action: 'completed', target: 'Cap table v-final', at: iso(1) },
      { id: 'ac2', actor: 'alex', action: 'pinned an update on', target: 'Onboarding flow v2', at: iso(3) },
      { id: 'ac3', actor: 'jordan', action: 'commented on', target: 'Financial model — 24-month runway', at: iso(6) },
      { id: 'ac4', actor: 'alex', action: 'moved to review', target: 'Cohort retention slide', at: iso(9) },
      { id: 'ac5', actor: 'jordan', action: 'checked off habit', target: 'Deep work · 2h block', at: iso(12) },
      { id: 'ac6', actor: 'alex', action: 'added milestone', target: 'Shortlist 5 buildings', at: iso(22) },
      { id: 'ac7', actor: 'jordan', action: 'logged a win in', target: 'Sunset Hoops League', at: iso(28) },
      { id: 'ac8', actor: 'alex', action: 'wrote in the journal', target: 'Momentum is a system, not a mood', at: iso(31) },
    ],

    unlocked: [],
    widgetPrefs: { quote: true, kpis: true, chart: true, habits: true, deadlines: true, activity: true, achieve: true, notif: true },
    settings: { notif_mentions: true, notif_comments: true, notif_deadlines: true, notif_habits: false, sounds: false, weekly_digest: true },
  };
}
