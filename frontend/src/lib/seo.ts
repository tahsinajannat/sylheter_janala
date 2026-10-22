import type { Metadata } from 'next';
import type { Lang } from '@/lib/api/types';
import { LANG_META, LANGS } from '@/lib/i18n/config';
import { absoluteUrl } from '@/lib/site';

interface MetaInput {
  lang: Lang;
  title: string;
  description?: string | null;
  /** Path without the language prefix, e.g. `/news/abc`. */
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string;
  /** Languages that have this exact page (defaults to all). */
  alternates?: Partial<Record<Lang, string>>;
}

export function buildMetadata({ lang, title, description, path = '', image, type = 'website', publishedTime, alternates }: MetaInput): Metadata {
  const url = absoluteUrl(`/${lang}${path}`);
  const languages = alternates
    ? Object.fromEntries(Object.entries(alternates).map(([l, p]) => [l, absoluteUrl(`/${l}${p}`)]))
    : Object.fromEntries(LANGS.map((l) => [l, absoluteUrl(`/${l}${path}`)]));
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description: description ?? undefined,
      url,
      type,
      locale: LANG_META[lang].locale.replace('-', '_'),
      publishedTime,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description: description ?? undefined },
  };
}
