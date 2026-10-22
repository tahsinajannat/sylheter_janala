import type { Lang, SpotlightPost } from '@/lib/api/types';
import { SectionHeading, StoryCard, type StoryVariant } from '@/components/common';

/** Each slot has its own card structure on purpose, so the section never reads as a uniform grid. */
const SLOT_LAYOUT: Record<number, { variant: StoryVariant; className: string }> = {
  1: { variant: 'overlay', className: 'lg:col-span-6 lg:row-span-2' },
  2: { variant: 'large', className: 'lg:col-span-3 lg:row-span-2' },
  3: { variant: 'compact', className: 'lg:col-span-3' },
  4: { variant: 'text', className: 'lg:col-span-3' },
};

export function SpotlightSection({ lang, title, posts }: { lang: Lang; title: string; posts: SpotlightPost[] }) {
  if (posts.length === 0) return null;
  const sorted = [...posts].sort((a, b) => a.position - b.position);
  return (
    <section>
      <SectionHeading title={title} />
      <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
        {sorted.map((p, i) => {
          // slots are assigned by order, so a story that was removed (already shown as the hero) never leaves a hole
          const slot = i + 1;
          const l = SLOT_LAYOUT[slot] ?? SLOT_LAYOUT[4];
          return <StoryCard key={p.id} post={p} lang={lang} variant={l.variant} className={l.className} />;
        })}
      </div>
    </section>
  );
}
