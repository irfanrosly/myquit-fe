import { User } from '@/types';

async function authFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw err;
  }
  const json = await res.json();
  return json.data as T;
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    authFetch<User>('/register', { email, password, name }),

  login: (email: string, password: string) =>
    authFetch<User>('/login', { email, password }),

  logout: () => authFetch<null>('/logout'),

  refresh: () => authFetch<User>('/refresh'),
};
