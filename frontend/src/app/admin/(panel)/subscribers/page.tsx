import type { Metadata } from 'next';
import { adminGet, one, pageOf, requireRole } from '@/lib/admin/server';
import type { Subscriber } from '@/lib/admin/types';
import { DataTable, DeleteButton, EmptyRow, LangBadge, PageHeader, Pager, StatusBadge } from '@/modules/admin/ui';
import { cn } from '@/lib/utils';
import { selectClass, dateTime } from '@/modules/admin/helpers';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export const metadata: Metadata = { title: 'Subscribers' };

type Summary = { summary: Record<string, number> };

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole('admin', 'editor');
  const sp = await searchParams;
  const q = one(sp.q)?.trim();
  const status = one(sp.status);
  const lang = one(sp.lang);
  const list = await adminGet<Subscriber[]>('/admin/subscribers', { q, status, lang, page: pageOf(sp.page), limit: 30 });
  const summary = (list.meta as unknown as Summary).summary ?? {};

  return (
    <>
      <PageHeader title="Subscribers" description="People who signed up for the newsletter. Only confirmed (active) subscribers receive emails." />
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {['active', 'pending', 'unsubscribed', 'bounced'].map((s) => (
          <span key={s} className="text-muted-foreground">
            <span className="capitalize">{s}</span>: <b className="text-foreground">{summary[s] ?? 0}</b>
          </span>
        ))}
      </div>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input name="q" defaultValue={q} placeholder="Search email…" className="h-9 w-56 rounded-md border bg-background pr-3 pl-8 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
        </div>
        <select name="status" defaultValue={status ?? ''} className={cn(selectClass, 'w-auto')}>
          <option value="">All statuses</option>
          {['active', 'pending', 'unsubscribed', 'bounced'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="lang" defaultValue={lang ?? ''} className={cn(selectClass, 'w-auto')}>
          <option value="">All languages</option>
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <DataTable head={['Email', 'Language', 'Status', 'Signed up', '']}>
        {list.data.map((s) => (
          <tr key={s.id}>
            <td>{s.email}</td>
            <td><LangBadge lang={s.lang} /></td>
            <td><StatusBadge status={s.status} /></td>
            <td className="whitespace-nowrap text-muted-foreground">{dateTime(s.createdAt)}</td>
            <td className="text-right">
              <DeleteButton path={`/subscribers/${s.id}`} title="Remove this subscriber?" description="The address is erased permanently (right to be forgotten)." />
            </td>
          </tr>
        ))}
        {list.data.length === 0 && <EmptyRow cols={5} text="No subscribers found." />}
      </DataTable>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/subscribers" query={{ q, status, lang }} />
    </>
  );
}
