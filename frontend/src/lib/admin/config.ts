/** Staff session settings. The token lives in an httpOnly cookie, so page scripts can never read it. */
export const STAFF_COOKIE = 'sj_staff';

/** Where the server talks to the API (internal URL in Docker). */
export const API_ORIGIN = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

/** Seconds until a JWT expires (reads `exp`, no signature check: the API does that). */
export function tokenTtl(token: string, fallback = 7 * 24 * 3600): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    const left = Number(payload.exp) - Math.floor(Date.now() / 1000);
    return left > 0 ? left : fallback;
  } catch {
    return fallback;
  }
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});
