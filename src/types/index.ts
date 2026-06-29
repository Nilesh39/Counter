export interface ChantLog {
  date: string; // YYYY-MM-DD
  count: number; // total chants completed
  malas: number; // total malas completed
  hourlyCounts?: Record<number, number>; // key: hour (0-23), value: count of chants in that hour
  isShielded?: boolean; // if true, this day is protected by a streak shield
}

export interface BigGoal {
  id: string;
  name: string;
  target: number; // target chants
  current: number; // current chants
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
  type?: 'one-time' | 'daily';
  history?: Record<string, { target: number; current: number; completed: boolean }>;
  lastResetDate?: string; // YYYY-MM-DD
}

export type CounterStyle = 
  | 'classic-3d'
  | 'minimal-ring'
  | 'radha-rani'
  | 'lotus-bloom'
  | 'rudraksha-ring'
  | 'sudarshan-chakra'
  | 'neon-glow'
  | 'dotted-108'
  | 'mantra-orbit'
  | 'retro-flip';

export interface AppSettings {
  hapticEnabled: boolean;
  soundEnabled: boolean;
  bounceEnabled: boolean;
  parikramaEnabled: boolean;
  blessingsEnabled: boolean;
  sakhisEnabled: boolean;
  satsangEnabled: boolean;
  celebrationEnabled: boolean;
  glowEffectsEnabled: boolean;
  progressRingEnabled: boolean;
  streakStatsEnabled: boolean;
  dragPhysicsEnabled: boolean;
  remindersEnabled: boolean;
  reminderTime: string; // '04:30', '06:00', '18:30', '21:00'
  customMantras: string[];
  themeId: string;
  selectedMantra: string;
  beadDesign: 'saffron-sphere' | 'rudraksha' | 'lotus' | 'sphatik' | 'gold-chakra' | 'tulsi';
  particleEffect: 'none' | 'float' | 'drop' | 'expand' | 'spin';
  counterStyle: CounterStyle;
  activeDashboardGoalId?: string;
  customNavTabs?: string[];
  marqueeEnabled: boolean;
  marqueeText: string;
  marqueeDirection: 'ltr' | 'rtl';
}

export interface AppState {
  currentChantsInMala: number; // 0 to 107
  completedMalasToday: number;
  totalChantsToday: number;
  dailyGoalChants: number; // default: 1080 (10 Malas)
  lifetimeTotalChants: number;
  streakDays: number;
  streakShields: number; // count of owned streak shields (Dharma Suraksha)
  bhaktiStage: number; // 1 to 9 (Navadha Bhakti level)
  unlockedSamagri: string[]; // list of unlocked altar items, e.g. ['brass-diya', 'chandan-bowl']
  selectedDiya: 'brass-diya' | 'silver-diya' | 'gold-diya';
  selectedBell: 'none' | 'silver-bell' | 'gold-bell';
  chandanApplied: boolean; // whether devotee applied Chandan tilak today
  offeredFlowersCount: number; // count of offered flowers at Altar
  lastActiveDate: string | null;
  historyLogs: Record<string, ChantLog>;
  bigGoals: BigGoal[];
  settings: AppSettings;
  sadhanaPatrikaLogs?: Record<string, SadhanaPatrika>; // key: YYYY-MM-DD
  sukritiBalance?: number;
  sukritiTransactions?: SukritiTransaction[];
}

export interface SukritiTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
}

export interface SadhanaPatrika {
  date: string; // YYYY-MM-DD
  wokeUpBrahmaMuhurta: boolean;
  readScriptures: boolean;
  scriptureDuration: number; // in minutes
  naamLekhanCount: number; // count of written chants
  diaryNote: string; // personal prayer/note
}

