import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, one, pageOf, requireRole } from '@/lib/admin/server';
import type { AdminComment, CommentStatus } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { CommentActions } from '@/modules/admin/comment-actions';
import { LangBadge, PageHeader, Pager } from '@/modules/admin/ui';
import { dateTime } from '@/modules/admin/helpers';

export const metadata: Metadata = { title: 'Comments' };
const STATUSES: CommentStatus[] = ['pending', 'approved', 'rejected', 'spam'];

export default async function CommentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole('admin', 'editor');
  const sp = await searchParams;
  const status = (STATUSES as string[]).includes(one(sp.status) ?? '') ? (one(sp.status) as CommentStatus) : 'pending';
  const list = await adminGet<AdminComment[]>('/admin/comments', { status, page: pageOf(sp.page), limit: 20 });
  return (
    <>
      <PageHeader title="Comments" description="Reader comments appear on the site only after you approve them." />
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/comments?status=${s}`} className={cn(buttonVariants({ variant: s === status ? 'default' : 'outline', size: 'sm' }), 'capitalize')}>
            {s}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {list.data.map((c) => (
          <div key={c.id} className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span>
                <b>{c.reader.name}</b> <span className="text-muted-foreground">· {c.reader.email}</span>
                {c.parentId && <span className="ml-2 text-xs text-muted-foreground">(reply)</span>}
              </span>
              <time className="text-muted-foreground">{dateTime(c.createdAt)}</time>
            </div>
            <p className="whitespace-pre-wrap">{c.body}</p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              On <LangBadge lang={c.post.lang} />
              <Link href={`/admin/posts/${c.post.id}`} className="hover:text-primary">
                {c.post.title}
              </Link>
            </p>
            <CommentActions id={c.id} current={c.status} />
          </div>
        ))}
        {list.data.length === 0 && <p className="py-12 text-center text-muted-foreground">Nothing here.</p>}
      </div>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/comments" query={{ status }} />
    </>
  );
}
