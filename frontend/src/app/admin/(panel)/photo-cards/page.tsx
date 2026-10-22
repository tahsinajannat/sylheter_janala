import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, one, pageOf } from '@/lib/admin/server';
import type { PhotoCard } from '@/lib/admin/types';
import { FilterBar } from '@/modules/admin/filters';
import { DataTable, EmptyRow, LangBadge, PageHeader, Pager, StatusBadge } from '@/modules/admin/ui';
import { dateTime } from '@/modules/admin/helpers';

export const metadata: Metadata = { title: 'Photo cards' };

export default async function PhotoCardsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const lang = one(sp.lang);
  const status = one(sp.status);
  const list = await adminGet<PhotoCard[]>('/admin/photo-cards', { lang, status, page: pageOf(sp.page), limit: 20 });
  return (
    <>
      <PageHeader title="Photo cards" description="Single photos with a caption. The slider on the home page is made from these." actions={<Link href="/admin/photo-cards/new" className={buttonVariants()}><Plus /> New photo card</Link>} />
      <FilterBar searchable={false} lang={lang} status={status} />
      <DataTable head={['Photo', 'Title', 'Status', 'Slider', 'Updated', 'Views']}>
        {list.data.map((c) => (
          <tr key={c.id}>
            <td className="w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageUrl} alt="" className="h-12 w-16 rounded object-cover" />
            </td>
            <td className="max-w-sm">
              <div className="flex items-start gap-2">
                <LangBadge lang={c.lang} />
                <Link href={`/admin/photo-cards/${c.id}`} className="line-clamp-2 font-medium hover:text-primary">{c.title}</Link>
              </div>
            </td>
            <td><StatusBadge status={c.status} /></td>
            <td>{c.isSlider ? `Yes (#${c.sliderOrder})` : 'No'}</td>
            <td className="whitespace-nowrap text-muted-foreground">{dateTime(c.updatedAt)}</td>
            <td className="tabular-nums">{c.viewCount.toLocaleString('en-US')}</td>
          </tr>
        ))}
        {list.data.length === 0 && <EmptyRow cols={6} text="No photo cards found." />}
      </DataTable>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/photo-cards" query={{ lang, status }} />
    </>
  );
}
