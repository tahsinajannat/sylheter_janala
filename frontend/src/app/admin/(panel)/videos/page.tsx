import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, one, pageOf } from '@/lib/admin/server';
import type { Video } from '@/lib/admin/types';
import { FilterBar } from '@/modules/admin/filters';
import { DataTable, EmptyRow, LangBadge, PageHeader, Pager, StatusBadge } from '@/modules/admin/ui';
import { dateTime } from '@/modules/admin/helpers';

export const metadata: Metadata = { title: 'Videos' };

export default async function VideosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const lang = one(sp.lang);
  const status = one(sp.status);
  const list = await adminGet<Video[]>('/admin/videos', { lang, status, page: pageOf(sp.page), limit: 20 });
  return (
    <>
      <PageHeader title="Videos" description="YouTube videos shown on the site." actions={<Link href="/admin/videos/new" className={buttonVariants()}><Plus /> New video</Link>} />
      <FilterBar searchable={false} lang={lang} status={status} />
      <DataTable head={['Video', 'Title', 'Status', 'Featured', 'Updated', 'Views']}>
        {list.data.map((v) => (
          <tr key={v.id}>
            <td className="w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded object-cover" loading="lazy" />
            </td>
            <td className="max-w-sm">
              <div className="flex items-start gap-2">
                <LangBadge lang={v.lang} />
                <Link href={`/admin/videos/${v.id}`} className="line-clamp-2 font-medium hover:text-primary">{v.title}</Link>
              </div>
            </td>
            <td><StatusBadge status={v.status} /></td>
            <td>{v.isFeatured ? 'Yes' : 'No'}</td>
            <td className="whitespace-nowrap text-muted-foreground">{dateTime(v.updatedAt)}</td>
            <td className="tabular-nums">{v.viewCount.toLocaleString('en-US')}</td>
          </tr>
        ))}
        {list.data.length === 0 && <EmptyRow cols={6} text="No videos found." />}
      </DataTable>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/videos" query={{ lang, status }} />
    </>
  );
}
