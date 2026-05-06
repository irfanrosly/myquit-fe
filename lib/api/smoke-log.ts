import { apiGet, apiPost } from './client';
import { SmokeLogCreateResponse, SmokeLogHistory, SmokeHeatmap } from '@/types';

export const smokeLogApi = {
  create: () => apiPost<SmokeLogCreateResponse>('/smoke-log'),
  history: (days = 14) => apiGet<SmokeLogHistory>(`/smoke-log/history?days=${days}`),
  heatmap: (from: string, to: string) =>
    apiGet<SmokeHeatmap>(`/smoke-log/heatmap?from=${from}&to=${to}`),
};
