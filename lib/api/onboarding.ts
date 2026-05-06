import { apiGet, apiPost } from './client';
import { OnboardingPayload, QuitPlan } from '@/types';

export const onboardingApi = {
  save: (payload: OnboardingPayload) => apiPost<{ success: boolean }>('/onboarding', payload),
  get: () => apiGet<QuitPlan | null>('/onboarding'),
};
