import type { Lang, PostCard } from '@/lib/api/types';
import { SectionHeading, StoryCard } from '@/components/common';

export function FeaturedSection({ lang, title, posts, minRead }: { lang: Lang; title: string; posts: PostCard[]; minRead: string }) {
  if (posts.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <StoryCard key={p.id} post={p} lang={lang} variant="large" minReadLabel={minRead} />
        ))}
      </div>
    </section>
  );
}
