import { apiGet, apiPatch } from './client';
import { User } from '@/types';

export const usersApi = {
  getMe: () => apiGet<User>('/users/me'),
  updateMe: (data: Partial<User>) => apiPatch<User>('/users/me', data),
};
