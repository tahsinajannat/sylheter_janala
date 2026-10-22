import type { Lang } from '@/lib/api/types';
import { api } from '@/lib/api';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { buildNavItems } from './nav-items';
import { Navbar } from './navbar';

/** Server component: loads the categories (cached 5 min) and hands plain data to the client navbar. */
export async function SiteHeader({ lang, t }: { lang: Lang; t: Dictionary }) {
  const categories = await api.taxonomy.categories(lang).catch(() => []);
  return <Navbar items={buildNavItems(lang, t, categories)} />;
}
