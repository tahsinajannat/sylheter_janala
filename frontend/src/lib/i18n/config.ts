import type { Lang } from '@/lib/api/types';

export const LANGS = ['bn', 'en'] as const satisfies readonly Lang[];
export const DEFAULT_LANG: Lang = 'bn';
export const OTHER_LANG: Record<Lang, Lang> = { bn: 'en', en: 'bn' };

export const LANG_META: Record<Lang, { label: string; nativeLabel: string; locale: string; dir: 'ltr' }> = {
  bn: { label: 'Bangla', nativeLabel: 'বাংলা', locale: 'bn-BD', dir: 'ltr' },
  en: { label: 'English', nativeLabel: 'English', locale: 'en-GB', dir: 'ltr' },
};

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);

/** Cookie remembering the reader's language choice (read by the proxy on `/`). */
export const LANG_COOKIE = 'sj_lang';
