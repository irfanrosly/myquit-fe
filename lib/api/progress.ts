import { apiGet } from './client';
import { Progress } from '@/types';

export const progressApi = {
  get: () => apiGet<Progress>('/progress'),
};
