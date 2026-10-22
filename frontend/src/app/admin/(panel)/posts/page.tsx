import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, getStaff, one, pageOf } from '@/lib/admin/server';
import type { PostRow } from '@/lib/admin/types';
import { FilterBar } from '@/modules/admin/filters';
import { DataTable, EmptyRow, LangBadge, PageHeader, Pager, StatusBadge } from '@/modules/admin/ui';
import { dateTime } from '@/modules/admin/helpers';

export const metadata: Metadata = { title: 'Posts' };

export default async function PostsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getStaff();
  const sp = await searchParams;
  const q = one(sp.q)?.trim();
  const lang = one(sp.lang);
  const status = one(sp.status);
  const type = one(sp.type);
  const list = await adminGet<PostRow[]>('/admin/posts', { q, lang, status, type, page: pageOf(sp.page), limit: 20 });

  return (
    <>
      <PageHeader
        title="Posts"
        description={me.role === 'author' ? 'Your posts.' : 'All news and editorials.'}
        actions={
          <Link href="/admin/posts/new" className={buttonVariants()}>
            <Plus /> New post
          </Link>
        }
      />
      <FilterBar q={q} lang={lang} status={status} type={type ?? ''} />
      <DataTable head={['Title', 'Status', 'Category', 'Author', 'Updated', 'Views']}>
        {list.data.map((p) => (
          <tr key={p.id}>
            <td className="max-w-md">
              <div className="flex items-start gap-2">
                <LangBadge lang={p.lang} />
                <div className="min-w-0">
                  <Link href={`/admin/posts/${p.id}`} className="line-clamp-2 font-medium hover:text-primary">
                    {p.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.type === 'editorial' && <Badge variant="secondary" className="h-4 px-1 text-[10px]">Editorial</Badge>}
                    {p.isHero && <Badge className="h-4 px-1 text-[10px]">Hero</Badge>}
                    {p.isSpotlight && <Badge variant="outline" className="h-4 px-1 text-[10px]">Spotlight</Badge>}
                    {p.isFeatured && <Badge variant="outline" className="h-4 px-1 text-[10px]">Featured</Badge>}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <StatusBadge status={p.status} />
              {p.status === 'scheduled' && <p className="mt-1 text-xs text-muted-foreground">{dateTime(p.publishedAt)}</p>}
            </td>
            <td>{p.categoryName}</td>
            <td>{p.authorName}</td>
            <td className="whitespace-nowrap text-muted-foreground">{dateTime(p.updatedAt)}</td>
            <td className="tabular-nums">{p.viewCount.toLocaleString('en-US')}</td>
          </tr>
        ))}
        {list.data.length === 0 && <EmptyRow cols={6} text="No posts found." />}
      </DataTable>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/posts" query={{ q, lang, status, type }} />
    </>
  );
}
