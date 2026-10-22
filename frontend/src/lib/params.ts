import { notFound } from 'next/navigation';
import type { Lang } from '@/lib/api/types';
import { isLang } from '@/lib/i18n/config';

export type LangParams = Promise<{ lang: string }>;

/** Validates the `[lang]` segment. Anything but bn / en is a 404. */
export async function getLang(params: LangParams): Promise<Lang> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return lang;
}

/** Route params may arrive percent-encoded (Bangla slugs). */
export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** `?page=` -> positive integer (default 1). */
export function parsePage(v: string | string[] | undefined) {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
