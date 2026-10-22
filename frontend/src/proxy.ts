import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LANG, LANG_COOKIE, isLang } from '@/lib/i18n/config';

/**
 * Language negotiation (Next.js 16 `proxy`, formerly "middleware").
 * `/anything` -> `/{lang}/anything`, where lang = cookie -> Accept-Language -> default (Bangla).
 * URLs that already start with /bn or /en pass straight through.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const first = pathname.split('/')[1];
  if (isLang(first)) return NextResponse.next();

  const cookie = req.cookies.get(LANG_COOKIE)?.value;
  let lang = isLang(cookie) ? cookie : undefined;
  if (!lang) {
    const accept = (req.headers.get('accept-language') ?? '').toLowerCase();
    const best = accept.split(',').map((p) => p.trim().slice(0, 2)).find((p) => isLang(p));
    lang = isLang(best) ? best : DEFAULT_LANG;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // skip Next internals and any file with an extension (images, favicon, robots...)
  matcher: ['/((?!_next|api|admin|.*\\..*).*)'],
};
