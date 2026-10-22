import type { Lang, PageMeta, PostCard } from '@/lib/api/types';
import { Container, EmptyState, Pagination } from '@/components/common';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { AdSlot } from '@/modules/ads';
import { PostGrid } from './post-grid';

interface Props {
  lang: Lang;
  t: Dictionary;
  eyebrow?: string;
  title: string;
  posts: PostCard[];
  meta: PageMeta;
  hrefFor: (page: number) => string;
  /** Extra content between the title and the grid (e.g. the search box). */
  children?: React.ReactNode;
  emptyText?: string;
}

/** Shared shell of every paged story list: category, tag, search, editorials, all news. */
export function ListingPage({ lang, t, eyebrow, title, posts, meta, hrefFor, children, emptyText }: Props) {
  return (
    <Container className="py-8">
      <header className="mb-8 border-b pb-4">
        {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {children}
      </header>
      <AdSlot lang={lang} placement="listing_top" className="mb-8" />
      {posts.length === 0 ? (
        <EmptyState title={emptyText ?? t.listing.noResults} />
      ) : (
        <>
          <PostGrid posts={posts} lang={lang} minRead={t.article.minRead} />
          <Pagination meta={meta} lang={lang} hrefFor={hrefFor} labels={t.listing} />
        </>
      )}
    </Container>
  );
}
