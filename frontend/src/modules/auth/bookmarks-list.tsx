'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { PageMeta, PostCard } from '@/lib/api/types';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useReader } from '@/hooks/use-reader';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { PostGrid } from '@/modules/news';

/** The reader's saved stories. Client-side because the data is per user (needs their token). */
export function BookmarksList() {
  const { lang, t } = useI18n();
  const { token } = useReader();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ posts: PostCard[]; meta: PageMeta } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let off = false;
    api.bookmarks
      .list(token, page)
      .then((r) => !off && setData({ posts: r.data, meta: r.meta }))
      .catch(() => !off && setFailed(true));
    return () => {
      off = true;
    };
  }, [token, page]);

  if (!token)
    return (
      <EmptyState title={t.auth.bookmarksLogin}>
        <Button asChild>
          <Link href={`${routes.login(lang)}?next=${encodeURIComponent(routes.bookmarks(lang))}`}>{t.auth.loginButton}</Link>
        </Button>
      </EmptyState>
    );
  if (failed) return <EmptyState title={t.common.errorTitle} text={t.common.errorText} />;
  if (!data) return <p className="text-muted-foreground">{t.common.loading}</p>;
  if (data.posts.length === 0) return <EmptyState title={t.auth.bookmarksEmpty} />;

  return (
    <>
      <PostGrid posts={data.posts} lang={lang} minRead={t.article.minRead} />
      {/* client-side paging: buttons instead of links */}
      <div className="mt-8 flex justify-center gap-3">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          {t.listing.prev}
        </Button>
        <Button variant="outline" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
          {t.listing.next}
        </Button>
      </div>
    </>
  );
}
