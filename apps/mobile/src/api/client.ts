const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
let accessToken: string | undefined;
let refreshHandler: (() => Promise<string | undefined>) | undefined;
export function configureApiAuth(token?: string, refresh?: () => Promise<string | undefined>) { accessToken = token; if (refresh) refreshHandler = refresh; }
export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!baseUrl) throw new ApiError('EXPO_PUBLIC_API_URL n’est pas configurée.', 0);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers } });
  if (response.status === 401 && retry && refreshHandler && path !== '/auth/refresh') { const token = await refreshHandler(); if (token) { accessToken = token; return request<T>(path, init, false); } }
  const body = await response.json().catch(() => ({})) as { message?: string | string[] };
  if (!response.ok) throw new ApiError(Array.isArray(body.message) ? body.message.join('\n') : body.message ?? 'Une erreur est survenue.', response.status);
  return body as T;
}
export const api = { get: <T>(path: string) => request<T>(path), post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) }) };
