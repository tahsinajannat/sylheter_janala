import { Container } from '@/components/common';
import { EmptyState } from '@/components/common';
import { api } from '@/lib/api';
import type { Lang } from '@/lib/api/types';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { VideoSection } from '@/modules/videos';
import { EditorialSection } from './editorial-section';
import { FeaturedSection } from './featured-section';
import { HeroSection } from './hero-section';
import { LatestSection } from './latest-section';
import { OtherLanguageSection } from './other-language-section';
import { PhotoSection } from './photo-section';
import { SpotlightSection } from './spotlight-section';
import { SubscribeBand } from './subscribe-band';

/** Composes the home page from the single `/home` payload. A story is shown once: later sections skip ids already used above. */
export async function HomePage({ lang, t }: { lang: Lang; t: Dictionary }) {
  const d = await api.home.get(lang);

  const used = new Set<string>();
  const take = <T extends { id: string }>(items: T[], max: number) => {
    const out = items.filter((i) => !used.has(i.id)).slice(0, max);
    out.forEach((i) => used.add(i.id));
    return out;
  };

  // Claim order = priority: hero, spotlight, featured first; the rail and latest list get what is left.
  const hero = d.hero ?? null;
  if (hero) used.add(hero.id);
  const spotlight = d.spotlight.filter((p) => !used.has(p.id));
  spotlight.forEach((p) => used.add(p.id));
  const featured = take(d.featured, 3);
  const rail = take(d.latest, 4);
  const latest = take(d.latest, 6);

  const nothing = !hero && d.spotlight.length === 0 && d.latest.length === 0;
  if (nothing) return <Container className="py-16"><EmptyState title={t.home.emptyTitle} text={t.home.emptyText} /></Container>;

  return (
    <Container className="space-y-14 py-8">
      {hero && <HeroSection lang={lang} hero={hero} rail={rail} minRead={t.article.minRead} />}
      <SpotlightSection lang={lang} title={t.home.spotlight} posts={spotlight} />
      <FeaturedSection lang={lang} title={t.home.featured} posts={featured} minRead={t.article.minRead} />

      <div className="grid gap-10 lg:grid-cols-3">
        {latest.length > 0 && (
          <div className="lg:col-span-2">
            <LatestSection lang={lang} title={t.home.latest} viewAll={t.home.viewAll} posts={latest} />
          </div>
        )}
        <div className={latest.length > 0 ? '' : 'lg:col-span-3'}>
          <OtherLanguageSection lang={lang} t={t} data={d.otherLanguage} />
        </div>
      </div>

      <PhotoSection lang={lang} title={t.home.photoCards} viewAll={t.home.viewAll} cards={d.photoCards} />
      <EditorialSection lang={lang} title={t.home.editorials} viewAll={t.home.viewAll} posts={d.editorials} />
      <VideoSection lang={lang} title={t.home.videoNews} viewAll={t.home.viewAll} videos={d.videos} />
      <SubscribeBand t={t} />
    </Container>
  );
}
