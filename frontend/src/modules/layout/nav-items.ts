import type { Category, Lang } from '@/lib/api/types';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { routes } from '@/lib/routes';

export interface NavItem {
  label: string;
  href: string;
}

/** Navbar entries: editor-managed categories first, then the fixed content sections. */
export function buildNavItems(lang: Lang, t: Dictionary, categories: Category[]): NavItem[] {
  return [
    { label: t.nav.home, href: routes.home(lang) },
    ...categories.filter((c) => c.showInNav).map((c) => ({ label: c.name, href: routes.category(lang, c.slug) })),
    { label: t.nav.editorials, href: routes.editorials(lang) },
    { label: t.nav.photos, href: routes.photos(lang) },
    { label: t.nav.videos, href: routes.videos(lang) },
  ];
}
