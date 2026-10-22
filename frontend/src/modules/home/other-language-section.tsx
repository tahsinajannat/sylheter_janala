import { ArrowUpRight } from 'lucide-react';
import type { HomePayload, Lang } from '@/lib/api/types';
import { StoryCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { OTHER_LANG } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { routes } from '@/lib/routes';

/**
 * Latest stories of the OTHER language + a link to that language's portal.
 * Story links stay on this site (`/{otherLang}/news/slug`) so the reader lands in the right edition.
 */
export function OtherLanguageSection({ lang, t, data }: { lang: Lang; t: Dictionary; data: HomePayload['otherLanguage'] }) {
  if (data.posts.length === 0) return null;
  const other = OTHER_LANG[lang];
  const portal = data.portalUrl || routes.home(other);
  return (
    <aside className="rounded-xl bg-navy p-5 text-white">
      <h2 className="text-xl font-bold">{t.home.otherLanguageTitle}</h2>
      <p className="mt-1 mb-4 text-sm text-white/70">{t.home.otherLanguageText}</p>
      <div className="space-y-4">
        {data.posts.slice(0, 5).map((p) => (
          <StoryCard key={p.id} post={p} lang={other} variant="compact" className="[&_h3_a]:text-white [&_h3]:group-hover:text-white/80 [&_p]:text-white/60" />
        ))}
      </div>
      <Button asChild variant="default" className="mt-5 w-full">
        <a href={portal}>
          {t.home.visitPortal} <ArrowUpRight />
        </a>
      </Button>
    </aside>
  );
}
