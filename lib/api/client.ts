const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let isRefreshing = false;

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`;
  const init: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const res = await fetch(url, init);

  if (res.status === 401 && !isRefreshing) {
    isRefreshing = true;
    const refreshed = await refreshTokens();
    isRefreshing = false;

    if (refreshed) {
      const retryRes = await fetch(url, init);
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({}));
        throw err;
      }
      const retryData = await retryRes.json();
      return retryData.data as T;
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw err;
  }

  const json = await res.json();
  return json.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiClient<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiClient<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiClient<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
