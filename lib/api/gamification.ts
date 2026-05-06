import { apiGet } from './client';
import { GamificationStats, BadgesResponse } from '@/types';

export const gamificationApi = {
  getStats: () => apiGet<GamificationStats>('/gamification/stats'),
  getBadges: () => apiGet<BadgesResponse>('/gamification/badges'),
};
