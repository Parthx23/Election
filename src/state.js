// ============================================================
// Election Quest – Shared State & Backend Logic (localStorage)
// ============================================================

const DEFAULTS = {
  playerName: 'Civic Leader',
  xp: 0,
  level: 1,
  score: 0,
  streak: 0,
  streakDays: 0,
  stagesUnlocked: [0],   // indices 0-6 for 7 stages
  stagesDone: [],
  badges: [],
  quizAnswers: [],       // {q, chosen, correct}[]
  gameScore: 0,          // ballot sorting score
  leaderboard: [
    { name: 'Alexander H.', score: 14250, level: 42, initials: 'AH' },
    { name: 'Thomas J.',    score: 13800, level: 40, initials: 'TJ' },
    { name: 'Eleanor R.',   score: 12950, level: 38, initials: 'ER' },
    { name: 'James M.',     score: 11400, level: 35, initials: 'JM' },
  ],
};

const KEY = 'electionQuestState';

export function getState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

export function setState(patch) {
  const s = { ...getState(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function resetState() {
  localStorage.removeItem(KEY);
  return { ...DEFAULTS };
}

// ─── XP & Levelling ───────────────────────────────────────
export function addXP(amount) {
  const s = getState();
  const newXP = s.xp + amount;
  const newLevel = Math.floor(newXP / 300) + 1;
  return setState({ xp: newXP, level: newLevel });
}

export function addScore(amount) {
  const s = getState();
  return setState({ score: s.score + amount });
}

// ─── Stages ────────────────────────────────────────────────
export function unlockNextStage() {
  const s = getState();
  const max = s.stagesUnlocked.length;
  if (max < 7) {
    const next = [...s.stagesUnlocked, max];
    return setState({ stagesUnlocked: next });
  }
  return s;
}

export function markStageDone(idx) {
  const s = getState();
  const done = [...new Set([...s.stagesDone, idx])];
  return setState({ stagesDone: done });
}

// ─── Badges ────────────────────────────────────────────────
const BADGE_DEFS = [
  { id: 'first_step',   label: 'First Step',    icon: 'directions_walk',      xpRequired: 0   },
  { id: 'on_fire',      label: 'On Fire',        icon: 'local_fire_department',streakDays: 3   },
  { id: 'halfway',      label: 'Halfway Hero',   icon: 'military_tech',        level: 10       },
  { id: 'speed_demon',  label: 'Speed Demon',    icon: 'bolt',                 gameScore: 15   },
  { id: 'perfect_run',  label: 'Perfect Run',    icon: 'task_alt',             quizPerfect: true},
  { id: 'lifeline_free',label: 'Lifeline-Free',  icon: 'health_and_safety',    noHints: true   },
  { id: 'graduate',     label: 'Election Graduate',icon:'school',              stagesDone: 7   },
  { id: 'champion',     label: 'Democracy Champion',icon:'public',             level: 20       },
];

export function evaluateBadges() {
  const s = getState();
  const earned = [...s.badges];
  BADGE_DEFS.forEach(b => {
    if (earned.includes(b.id)) return;
    if (b.xpRequired !== undefined && s.xp >= b.xpRequired) earned.push(b.id);
    if (b.level && s.level >= b.level) earned.push(b.id);
    if (b.streakDays && s.streakDays >= b.streakDays) earned.push(b.id);
    if (b.gameScore && s.gameScore >= b.gameScore) earned.push(b.id);
    if (b.stagesDone && s.stagesDone.length >= b.stagesDone) earned.push(b.id);
  });
  setState({ badges: earned });
  return earned;
}

export { BADGE_DEFS };

// ─── Leaderboard helpers ────────────────────────────────────
export function getLeaderboard() {
  const s = getState();
  const board = [...s.leaderboard];
  const playerEntry = { name: s.playerName + ' (You)', score: s.score, level: s.level, initials: s.playerName.slice(0,2).toUpperCase(), isPlayer: true };
  board.push(playerEntry);
  return board.sort((a, b) => b.score - a.score);
}

// ─── Quiz data ─────────────────────────────────────────────
export const QUIZ_QUESTIONS = [
  {
    q: 'What is the minimum voting age in India?',
    opts: ['16','18','21','25'],
    correct: 1,
    explanation: 'The 61st Amendment (1988) lowered the voting age from 21 to 18 years.'
  },
  {
    q: 'Which body conducts Lok Sabha elections in India?',
    opts: ['President of India','Election Commission of India','Supreme Court','Rajya Sabha'],
    correct: 1,
    explanation: 'The Election Commission of India (ECI) is the constitutional body responsible for administering all elections.'
  },
  {
    q: 'How many seats are in the Lok Sabha?',
    opts: ['245','543','552','790'],
    correct: 1,
    explanation: 'The Lok Sabha has 543 elected seats and 2 nominated Anglo-Indian seats (before the 104th amendment removed them).'
  },
  {
    q: 'What is the term of a Member of Parliament in the Lok Sabha?',
    opts: ['2 years','4 years','5 years','6 years'],
    correct: 2,
    explanation: 'Each Lok Sabha has a maximum term of 5 years unless dissolved earlier by the President.'
  },
  {
    q: 'Which article of the Indian Constitution establishes the Election Commission?',
    opts: ['Art. 312','Art. 324','Art. 356','Art. 370'],
    correct: 1,
    explanation: 'Article 324 vests the superintendence, direction and control of elections in the Election Commission.'
  },
  {
    q: 'NOTA stands for:',
    opts: ['None of the Above','No Official Ticket Available','National Order to Abstain','Not on the Agenda'],
    correct: 0,
    explanation: 'NOTA (None of the Above) was introduced in India in 2013 following a Supreme Court directive.'
  },
  {
    q: 'The model code of conduct comes into force when:',
    opts: ['Parliament is dissolved','Election schedule is announced','Voting begins','Results are declared'],
    correct: 1,
    explanation: 'The Model Code of Conduct applies immediately upon the announcement of the election schedule by the ECI.'
  },
];

// ─── Ballot sorting data ───────────────────────────────────
export const BALLOTS = [
  { id: 'B-001', candidate: 'Priya Menon',    district: 'North Mumbai',   valid: true,  issue: null },
  { id: 'B-002', candidate: 'Raj Kumar',      district: 'South Delhi',    valid: false, issue: 'Missing signature' },
  { id: 'B-003', candidate: 'Anita Sharma',   district: 'East Pune',      valid: true,  issue: null },
  { id: 'B-004', candidate: 'Vikram Nair',    district: 'West Chennai',   valid: false, issue: 'Illegible mark' },
  { id: 'B-005', candidate: 'Lakshmi Devi',   district: 'Central Kolkata',valid: true,  issue: null },
  { id: 'B-006', candidate: 'Arun Joshi',     district: 'North Bengaluru',valid: false, issue: 'Two candidates marked' },
  { id: 'B-007', candidate: 'Meena Iyer',     district: 'South Hyderabad',valid: true,  issue: null },
  { id: 'B-008', candidate: 'Suresh Patel',   district: 'East Ahmedabad', valid: false, issue: 'Damaged ballot' },
  { id: 'B-009', candidate: 'Deepa Rao',      district: 'West Jaipur',    valid: true,  issue: null },
  { id: 'B-010', candidate: 'Kiran Singh',    district: 'Central Bhopal', valid: true,  issue: null },
  { id: 'B-011', candidate: 'Farhan Ali',     district: 'North Lucknow',  valid: false, issue: 'Missing signature' },
  { id: 'B-012', candidate: 'Pooja Gupta',    district: 'South Surat',    valid: true,  issue: null },
  { id: 'B-013', candidate: 'Naveen Reddy',   district: 'East Vizag',     valid: false, issue: 'Torn ballot' },
  { id: 'B-014', candidate: 'Sunita Yadav',   district: 'West Nagpur',    valid: true,  issue: null },
  { id: 'B-015', candidate: 'Mohan Das',      district: 'Central Patna',  valid: true,  issue: null },
  { id: 'B-016', candidate: 'Rekha Kumari',   district: 'North Kanpur',   valid: false, issue: 'Illegible mark' },
  { id: 'B-017', candidate: 'Ajay Mehta',     district: 'South Madurai',  valid: true,  issue: null },
  { id: 'B-018', candidate: 'Priti Shah',     district: 'East Varanasi',  valid: false, issue: 'Two candidates marked' },
  { id: 'B-019', candidate: 'Ravi Shankar',   district: 'West Indore',    valid: true,  issue: null },
  { id: 'B-020', candidate: 'Geeta Pillai',   district: 'Central Nashik', valid: true,  issue: null },
];
