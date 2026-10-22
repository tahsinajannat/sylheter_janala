'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Lang } from '@/lib/api/types';
import type { Dictionary } from './dictionaries/en';

interface I18n {
  lang: Lang;
  t: Dictionary;
}
const Ctx = createContext<I18n | null>(null);

/** Hands the (already loaded) dictionary to client components. Mounted once in the [lang] layout. */
export function I18nProvider({ lang, dictionary, children }: { lang: Lang; dictionary: Dictionary; children: ReactNode }) {
  return <Ctx.Provider value={{ lang, t: dictionary }}>{children}</Ctx.Provider>;
}

/** Client components: `const { t, lang } = useI18n()`. */
export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}
