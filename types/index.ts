export type Gender = 'male' | 'female' | 'other' | 'prefer_not';
export type Education = 'secondary' | 'diploma' | 'bachelor' | 'master' | 'phd';
export type TobaccoType = 'cigarette' | 'hand_rolled' | 'vape' | 'cigar' | 'shisha' | 'other';
export type TTFC = 'within_5' | 'm6_30' | 'm31_60' | 'over_60';
export type SmokeFreeRecord = 'lt1day' | 'd1_3' | 'd4_7' | 'w1_4' | 'over_1m';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  age?: number;
  gender?: Gender;
  race?: string;
  education?: Education;
  occupation?: string;
  onboardingDone: boolean;
  createdAt?: string;
}

export interface QuitPlan {
  id: string;
  userId: string;
  quitDate: string;
  yearsSmoked?: number;
  tobaccoTypes: TobaccoType[];
  cigarettesPd?: number;
  vapeSessionsPd?: number;
  ttfc?: TTFC;
  pricePerPack?: number;
  cigsPerPack: number;
  pastAttempts: number;
  longestSmokeFree?: SmokeFreeRecord;
  readiness: number;
  confidence: number;
  motivations: string[];
  triggers: string[];
  supports: string[];
}

export interface Progress {
  currentStreak: number;
  totalSmokeFreeDays: number;
  lastSlipAt: string | null;
  moneySavedActual: number | null;
  quitDate: string;
  cigarettesPd: number | null;
  dailyCost: number | null;
}

export interface Badge {
  key: string;
  label: string;
  earnedAt?: string;
}

export interface GamificationStats {
  totalPoints: number;
  cravingsManaged: number;
}

export interface BadgesResponse {
  earned: Badge[];
  locked: Badge[];
}

export interface MoodLog {
  id: string;
  userId: string;
  mood: number;
  craving: number;
  note?: string;
  loggedDate: string;
  createdAt: string;
}

export interface OnboardingPayload {
  tobaccoTypes: TobaccoType[];
  quitDate: string;
  readiness: number;
  confidence: number;
  motivations: string[];
  triggers: string[];
  supports: string[];
  yearsSmoked?: number;
  cigarettesPd?: number;
  vapeSessionsPd?: number;
  ttfc?: TTFC;
  pricePerPack?: number;
  cigsPerPack?: number;
  pastAttempts?: number;
  longestSmokeFree?: SmokeFreeRecord;
}

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
}

export interface SmokeLogCreateResponse {
  id: string;
  loggedAt: string;
  loggedDate: string;
  count: number;
  currentStreak: number;
  totalSmokeFreeDays: number;
  totalPoints: number;
}

export interface SmokeLogHistoryItem {
  id: string;
  loggedAt: string;
  count: number;
}

export interface SmokeLogHistory {
  items: SmokeLogHistoryItem[];
}

export interface SmokeHeatmapDay {
  date: string;
  count: number;
}

export interface SmokeHeatmap {
  days: SmokeHeatmapDay[];
}
