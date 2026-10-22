/**
 * THE single point of API integration.
 *
 * Every request in the app - server components, client components, server actions - goes through
 * `apiRequest`. It is a thin wrapper over the platform `fetch` (no axios): it builds the URL, sends JSON,
 * attaches the bearer token, maps failures to `ApiError`, and exposes Next.js caching options.
 */
import { ApiError } from './errors';

const isServer = typeof window === 'undefined';

/** Server-side code talks to the API over the internal network (e.g. http://api:4000/api in Docker);
 *  the browser uses the public URL. */
export const API_BASE_URL = (
  isServer ? (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL) : process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

type Primitive = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Query-string values; `undefined` / `null` / '' are dropped. */
  query?: Record<string, Primitive>;
  /** JSON body. */
  body?: unknown;
  /** Bearer token (reader). */
  token?: string | null;
  /** Next.js ISR: seconds to cache a GET (server only). `false` = never cache. Default 60. */
  revalidate?: number | false;
  /** Next.js cache tags, for on-demand revalidation. */
  tags?: string[];
  signal?: AbortSignal;
}

export interface ApiResponse<T, M = undefined> {
  data: T;
  meta: M;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(API_BASE_URL + (path.startsWith('/') ? path : `/${path}`));
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function apiRequest<T, M = undefined>(path: string, opts: RequestOptions = {}): Promise<ApiResponse<T, M>> {
  const { method = 'GET', query, body, token, revalidate = 60, tags, signal } = opts;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  };
  if (isServer) {
    // Only public GETs are cached. Anything with a token or a body is per-user / a mutation.
    if (method === 'GET' && !token) init.next = { revalidate, tags };
    else init.cache = 'no-store';
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), init);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError('Could not reach the server', 0, cause);
  }

  if (res.status === 204) return { data: undefined as T, meta: undefined as M };

  let json: { data?: T; meta?: M; error?: { message?: string; details?: unknown } } | null = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    throw new ApiError(json?.error?.message ?? res.statusText ?? 'Request failed', res.status, json?.error?.details);
  }
  return { data: json?.data as T, meta: json?.meta as M };
}
