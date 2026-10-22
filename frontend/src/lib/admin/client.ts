'use client';

import { ApiError } from '@/lib/api/errors';

/**
 * Browser-side staff API client. It calls THIS site (`/admin-api/...`); a route handler adds the
 * httpOnly session cookie as a bearer token and forwards to the API's /admin routes.
 */
async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/admin-api${path}`, {
      method,
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ApiError('Could not reach the server', 0, cause);
  }
  if (res.status === 401 && !path.startsWith('/login')) {
    window.location.assign('/admin/login?expired=1');
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.error?.message ?? `Request failed (${res.status})`, res.status, json?.error?.details);
  return (json?.data ?? json) as T;
}

export const admin = {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== '') qs.set(k, String(v));
    return send<T>('GET', qs.size ? `${path}?${qs}` : path);
  },
  post: <T>(path: string, body?: unknown) => send<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => send<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => send<T>('PUT', path, body),
  delete: <T>(path: string) => send<T>('DELETE', path),
};

/** Human-readable message for a thrown error (shows the API's field errors when it sent them). */
export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.details;
    if (Array.isArray(d) && d.length) {
      const first = d[0] as { path?: string; message?: string };
      if (first?.message) return `${err.message}: ${first.path ? first.path + ' ' : ''}${first.message}`;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}
