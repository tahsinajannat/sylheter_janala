import type { Lang, PostCard } from '@/lib/api/types';
import { StoryCard } from '@/components/common';

/** Plain listing grid used by category / tag / search / editorial / bookmarks pages. */
export function PostGrid({ posts, lang, minRead }: { posts: PostCard[]; lang: Lang; minRead: string }) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => (
        <StoryCard key={p.id} post={p} lang={lang} variant="large" priority={i < 3} minReadLabel={minRead} />
      ))}
    </div>
  );
}
