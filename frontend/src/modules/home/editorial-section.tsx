import type { Lang, PostCard } from '@/lib/api/types';
import { SectionHeading, StoryCard } from '@/components/common';
import { routes } from '@/lib/routes';

export function EditorialSection({ lang, title, viewAll, posts }: { lang: Lang; title: string; viewAll: string; posts: PostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="rounded-xl bg-muted p-6">
      <SectionHeading title={title} href={routes.editorials(lang)} linkLabel={viewAll} />
      <div className="grid gap-8 md:grid-cols-3">
        {posts.slice(0, 3).map((p) => (
          <StoryCard key={p.id} post={p} lang={lang} variant="text" />
        ))}
      </div>
    </section>
  );
}
