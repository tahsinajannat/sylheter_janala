import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { API_ORIGIN, STAFF_COOKIE } from '@/lib/admin/config';

/**
 * Private API proxy. The browser calls /admin-api/<path>; this adds the httpOnly session token and forwards the
 * request to <API>/admin/<path>. Only the API's /admin routes are reachable through it.
 */
type Ctx = { params: Promise<{ path: string[] }> };

const fail = (status: number, message: string) => NextResponse.json({ error: { message } }, { status });

async function forward(req: NextRequest, ctx: Ctx) {
  const token = req.cookies.get(STAFF_COOKIE)?.value;
  if (!token) return fail(401, 'Not signed in');

  // CSRF guard on top of SameSite=Lax: a state-changing call must come from this site.
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if (origin && new URL(origin).host !== req.headers.get('host')) return fail(403, 'Cross-site request blocked');
  }

  const { path } = await ctx.params;
  const url = new URL(`${API_ORIGIN}/admin/${path.map(encodeURIComponent).join('/')}`);
  url.search = req.nextUrl.search;

  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: 'application/json' });
  const type = req.headers.get('content-type');
  if (type) headers.set('Content-Type', type); // keeps the multipart boundary for uploads

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' ? undefined : req.body,
      // @ts-expect-error `duplex` is required to stream a request body but is missing from the DOM typings
      duplex: 'half',
      cache: 'no-store',
    });
  } catch {
    return fail(502, 'Could not reach the API');
  }

  // A successful change must show up on the public site now, not when the 60-second page cache runs out.
  if (req.method !== 'GET' && upstream.ok) revalidatePath('/', 'layout');

  const out = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status });
  const ct = upstream.headers.get('content-type');
  if (ct) out.headers.set('Content-Type', ct);
  return out;
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
