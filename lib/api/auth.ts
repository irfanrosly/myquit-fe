import { apiPost } from './client';
import { User } from '@/types';

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiPost<User>('/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    apiPost<User>('/auth/login', { email, password }),

  logout: () => apiPost<null>('/auth/logout'),

  refresh: () => apiPost<User>('/auth/refresh'),
};
