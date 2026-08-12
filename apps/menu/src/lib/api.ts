const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001';

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }

export async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({})) as { message?: string | string[] };
  if (!response.ok) throw new ApiError(Array.isArray(body.message) ? body.message.join(' ') : body.message || 'Une erreur est survenue.', response.status);
  return body as T;
}

export { apiUrl };
