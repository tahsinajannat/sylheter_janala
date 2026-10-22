import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { API_ORIGIN, STAFF_COOKIE } from './config';
import type { Lang, Paged, Role, Staff, Subscriber } from './types';

type Query = Record<string, string | number | boolean | undefined | null>;

/** GET from the staff API with the session cookie. A missing / expired session sends the user to the login page. */
export async function adminGet<T>(path: string, query?: Query): Promise<{ data: T; meta: Paged<unknown>['meta'] }> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) redirect('/admin/login');

  const url = new URL(`${API_ORIGIN}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' });
  } catch (cause) {
    throw new ApiError('Could not reach the API', 0, cause);
  }
  if (res.status === 401) redirect('/admin/login?expired=1');
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.error?.message ?? `Request failed (${res.status})`, res.status, json?.error?.details);
  return json;
}

/** The signed-in staff member (one call per request). */
export const getStaff = cache(async () => (await adminGet<Staff>('/auth/me')).data);

/** Page guard: only these roles may open the page; anyone else goes back to the dashboard. */
export async function requireRole(...roles: Role[]) {
  const me = await getStaff();
  if (!roles.includes(me.role)) redirect('/admin');
  return me;
}

export const isEditor = (role: Role) => role === 'admin' || role === 'editor';

/** Page number from `?page=`. */
export function pageOf(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Active newsletter subscribers per language (the people a campaign would reach). */
export async function activeByLang(): Promise<Record<Lang, number>> {
  const [bn, en] = await Promise.all((['bn', 'en'] as const).map((lang) => adminGet<Subscriber[]>('/admin/subscribers', { status: 'active', lang, limit: 1 })));
  return { bn: bn.meta.total, en: en.meta.total };
}
