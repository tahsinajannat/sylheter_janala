import { NextResponse, type NextRequest } from 'next/server';
import { API_ORIGIN, STAFF_COOKIE, cookieOptions, tokenTtl } from '@/lib/admin/config';

/** Sign a staff member in: exchange the password for a token and keep it in an httpOnly cookie. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  let res: Response;
  try {
    res = await fetch(`${API_ORIGIN}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': req.headers.get('x-forwarded-for') ?? '' },
      body: JSON.stringify(body ?? {}),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: { message: 'Could not reach the API' } }, { status: 502 });
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data?.token) {
    return NextResponse.json(json ?? { error: { message: 'Login failed' } }, { status: res.status || 500 });
  }
  const out = NextResponse.json({ data: { user: json.data.user } });
  out.cookies.set(STAFF_COOKIE, json.data.token, cookieOptions(tokenTtl(json.data.token)));
  return out;
}
