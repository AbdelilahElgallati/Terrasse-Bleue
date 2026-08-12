import type { AuthResponse } from './types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
const REFRESH_KEY = 'terrasse_bleue_admin_refresh';
let accessToken: string | undefined;
let refreshPromise: Promise<string | undefined> | undefined;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export function storeSession(response: AuthResponse) {
  accessToken = response.accessToken;
  localStorage.setItem(REFRESH_KEY, response.refreshToken);
}

export function clearSession() {
  accessToken = undefined;
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return undefined;
  if (!refreshPromise) {
    refreshPromise = rawRequest<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false)
      .then((response) => { storeSession(response); return response.accessToken; })
      .catch(() => { clearSession(); return undefined; })
      .finally(() => { refreshPromise = undefined; });
  }
  return refreshPromise;
}

async function rawRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers } });
  if (response.status === 401 && retry && path !== '/auth/refresh') {
    const token = await refreshSession();
    if (token) return rawRequest<T>(path, init, false);
  }
  const body = await response.json().catch(() => ({})) as { message?: string | string[] };
  if (!response.ok) throw new ApiError(Array.isArray(body.message) ? body.message.join('\n') : body.message ?? 'Une erreur est survenue.', response.status);
  return body as T;
}

export const api = {
  get: <T>(path: string) => rawRequest<T>(path),
  post: <T>(path: string, body?: unknown) => rawRequest<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => rawRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

export async function restoreSession() {
  const token = await refreshSession();
  return token ? api.get<AuthResponse['user']>('/auth/me') : undefined;
}
