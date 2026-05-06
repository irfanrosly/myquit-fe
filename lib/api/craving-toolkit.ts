import { apiGet, apiPost } from './client';
import { MoodLog } from '@/types';

interface ActivityResult {
  pointsEarned: number;
  newBadges: string[];
}

interface MoodLogResult {
  log: MoodLog;
  pointsEarned: number;
  newBadges: string[];
}

export const cravingToolkitApi = {
  completeBreathing: () => apiPost<ActivityResult>('/craving-toolkit/breathing/complete'),
  completeDistraction: () => apiPost<ActivityResult>('/craving-toolkit/distraction/complete'),
  logMood: (mood: number, craving: number, note?: string) =>
    apiPost<MoodLogResult>('/craving-toolkit/mood-log', { mood, craving, note }),
  getTodayLog: () => apiGet<MoodLog | null>('/craving-toolkit/mood-log'),
  getHistory: () => apiGet<MoodLog[]>('/craving-toolkit/mood-log/history'),
};
