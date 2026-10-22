import type { Lang, PostCard } from '@/lib/api/types';
import { StoryCard } from '@/components/common';

/** Lead story (big) with a short "latest" rail beside it. */
export function HeroSection({ lang, hero, rail, minRead }: { lang: Lang; hero: PostCard; rail: PostCard[]; minRead: string }) {
  return (
    <section className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <StoryCard post={hero} lang={lang} variant="hero" priority minReadLabel={minRead} />
      </div>
      {rail.length > 0 && (
        <div className="space-y-5 lg:border-l lg:pl-8">
          {rail.map((p) => (
            <StoryCard key={p.id} post={p} lang={lang} variant="compact" />
          ))}
        </div>
      )}
    </section>
  );
}
