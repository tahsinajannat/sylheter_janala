import type { Lang } from '@/lib/api/types';
import { LANG_META } from './config';

const TZ = 'Asia/Dhaka';

export function formatDate(iso: string, lang: Lang, style: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(LANG_META[lang].locale, {
    timeZone: TZ,
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(LANG_META[lang].locale, {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Bangla digits on Bangla pages. */
export const formatNumber = (n: number, lang: Lang) => new Intl.NumberFormat(LANG_META[lang].locale).format(n);

export const todayLabel = (lang: Lang) =>
  new Intl.DateTimeFormat(LANG_META[lang].locale, { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
