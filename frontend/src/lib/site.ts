export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** `/bn/news/x` -> absolute URL, for canonical links and sharing. */
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;
