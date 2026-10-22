import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, pageOf, requireRole } from '@/lib/admin/server';
import type { Campaign } from '@/lib/admin/types';
import { dateTime } from '@/modules/admin/helpers';
import { DataTable, EmptyRow, LangBadge, PageHeader, Pager, StatusBadge } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Newsletters' };

export default async function NewslettersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole('admin', 'editor');
  const list = await adminGet<Campaign[]>('/admin/newsletters', { page: pageOf((await searchParams).page), limit: 20 });
  return (
    <>
      <PageHeader title="Newsletters" description="Write an email, test it, then send it to your confirmed subscribers." actions={<Link href="/admin/newsletters/new" className={buttonVariants()}><Plus /> New newsletter</Link>} />
      <DataTable head={['Subject', 'Status', 'Delivery', 'Created', 'Sent']}>
        {list.data.map((c) => (
          <tr key={c.id}>
            <td className="max-w-sm">
              <div className="flex items-start gap-2">
                <LangBadge lang={c.lang} />
                <Link href={`/admin/newsletters/${c.id}`} className="line-clamp-2 font-medium hover:text-primary">{c.subject}</Link>
              </div>
            </td>
            <td><StatusBadge status={c.status} /></td>
            <td className="text-xs text-muted-foreground">{c.stats ? Object.entries(c.stats).map(([k, v]) => `${k}: ${v}`).join(' · ') : ''}</td>
            <td className="whitespace-nowrap text-muted-foreground">{dateTime(c.createdAt)}</td>
            <td className="whitespace-nowrap text-muted-foreground">{dateTime(c.sentAt)}</td>
          </tr>
        ))}
        {list.data.length === 0 && <EmptyRow cols={5} text="No newsletters yet." />}
      </DataTable>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/newsletters" />
    </>
  );
}
