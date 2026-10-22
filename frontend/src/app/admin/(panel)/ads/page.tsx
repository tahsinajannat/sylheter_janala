import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, one, pageOf, requireRole } from '@/lib/admin/server';
import type { AdRow } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { PLACEMENTS, dateTime, placementLabel, selectClass } from '@/modules/admin/helpers';
import { Button } from '@/components/ui/button';
import { DataTable, EmptyRow, LangBadge, PageHeader, Pager } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Ads' };

/** What the visitor would get right now: live, paused, scheduled or finished. */
function runState(a: AdRow, now: number) {
  if (!a.isActive) return { label: 'Paused', style: 'bg-zinc-100 text-zinc-700' };
  if (a.startsAt && new Date(a.startsAt).getTime() > now) return { label: 'Scheduled', style: 'bg-amber-100 text-amber-900' };
  if (a.endsAt && new Date(a.endsAt).getTime() <= now) return { label: 'Ended', style: 'bg-zinc-100 text-zinc-700' };
  return { label: 'Live', style: 'bg-emerald-100 text-emerald-900' };
}

export default async function AdsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole('admin', 'editor');
  const sp = await searchParams;
  const lang = one(sp.lang);
  const placement = one(sp.placement);
  const kind = one(sp.kind);
  const list = await adminGet<AdRow[]>('/admin/ads', { lang, placement, kind, page: pageOf(sp.page), limit: 20 });
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Ads"
        description="Banner and Google AdSense ads shown on the public site."
        actions={
          <Link href="/admin/ads/new" className={buttonVariants()}>
            <Plus /> New ad
          </Link>
        }
      />
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="lang" defaultValue={lang ?? ''} className={cn(selectClass, 'w-auto')}>
          <option value="">All languages</option>
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
        <select name="placement" defaultValue={placement ?? ''} className={cn(selectClass, 'w-auto')}>
          <option value="">All placements</option>
          {PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select name="kind" defaultValue={kind ?? ''} className={cn(selectClass, 'w-auto')}>
          <option value="">Banner + AdSense</option>
          <option value="banner">Banner</option>
          <option value="adsense">AdSense</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <DataTable head={['Ad', 'Placement', 'Language', 'Status', 'Runs', 'Impressions', 'Clicks', 'CTR']}>
        {list.data.map((a) => {
          const state = runState(a, now);
          const tracked = a.kind === 'banner';
          return (
            <tr key={a.id}>
              <td className="max-w-xs">
                <div className="flex items-center gap-3">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.imageUrl} alt="" className="h-10 w-16 rounded border object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-10 w-16 place-items-center rounded border text-[10px] font-semibold text-muted-foreground">ADSENSE</span>
                  )}
                  <Link href={`/admin/ads/${a.id}`} className="line-clamp-2 font-medium hover:text-primary">
                    {a.name}
                  </Link>
                </div>
              </td>
              <td className="text-sm">{placementLabel(a.placement)}</td>
              <td>{a.lang ? <LangBadge lang={a.lang} /> : <span className="text-muted-foreground">Both</span>}</td>
              <td>
                <Badge variant="outline" className={cn('border-transparent', state.style)}>
                  {state.label}
                </Badge>
              </td>
              <td className="text-xs whitespace-nowrap text-muted-foreground">
                {a.startsAt || a.endsAt ? `${a.startsAt ? dateTime(a.startsAt) : 'now'} → ${a.endsAt ? dateTime(a.endsAt) : 'open'}` : 'Always'}
              </td>
              <td className="tabular-nums">{tracked ? a.impressions.toLocaleString('en-US') : '-'}</td>
              <td className="tabular-nums">{tracked ? a.clicks.toLocaleString('en-US') : '-'}</td>
              <td className="tabular-nums">{tracked && a.impressions > 0 ? `${((a.clicks / a.impressions) * 100).toFixed(2)}%` : '-'}</td>
            </tr>
          );
        })}
        {list.data.length === 0 && <EmptyRow cols={8} text="No ads yet." />}
      </DataTable>
      <p className="mt-3 text-xs text-muted-foreground">AdSense impressions and clicks are reported in your Google AdSense account, not here.</p>
      <Pager page={list.meta.page} totalPages={list.meta.totalPages} total={list.meta.total} pathname="/admin/ads" query={{ lang, placement, kind }} />
    </>
  );
}
