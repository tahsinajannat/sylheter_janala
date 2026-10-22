import 'server-only';
import type { Lang } from '@/lib/api/types';
import type { Dictionary } from './dictionaries/en';

const loaders: Record<Lang, () => Promise<Dictionary>> = {
  bn: () => import('./dictionaries/bn').then((m) => m.default),
  en: () => import('./dictionaries/en').then((m) => m.default),
};

/** Server components: `const t = await getDictionary(lang)`. */
export const getDictionary = (lang: Lang) => loaders[lang]();
