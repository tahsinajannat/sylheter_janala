import type { Lang, PostCard } from '@/lib/api/types';
import { SectionHeading, StoryCard } from '@/components/common';
import { routes } from '@/lib/routes';

export function LatestSection({ lang, title, viewAll, posts }: { lang: Lang; title: string; viewAll: string; posts: PostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} href={routes.news(lang)} linkLabel={viewAll} />
      <div className="divide-y">
        {posts.map((p) => (
          <StoryCard key={p.id} post={p} lang={lang} variant="compact" className="py-4 first:pt-0" />
        ))}
      </div>
    </section>
  );
}
