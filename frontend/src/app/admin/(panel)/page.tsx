import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { adminGet, getStaff, isEditor } from '@/lib/admin/server';
import type { Stats, Status } from '@/lib/admin/types';
import { LangBadge, PageHeader, Panel, StatusBadge } from '@/modules/admin/ui';
import { dateTime } from '@/modules/admin/helpers';
import { ViewsChart } from '@/modules/admin/views-chart';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

const num = (n: number | undefined) => (n ?? 0).toLocaleString('en-US');

function Stat({ label, value, href, accent }: { label: string; value: number | undefined; href?: string; accent?: boolean }) {
  const body = (
    <div className={cn('rounded-xl border bg-card p-4 transition-colors', href && 'hover:border-primary/40', accent && 'border-primary/40 bg-accent/50')}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{num(value)}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const STATUSES: Status[] = ['published', 'scheduled', 'draft', 'archived'];

export default async function Dashboard() {
  const me = await getStaff();
  const { data: s } = await adminGet<Stats>('/admin/stats');
  const editor = isEditor(me.role);
  const subs = s.subscribers;

  return (
    <>
      <PageHeader
        title={editor ? 'Dashboard' : 'My desk'}
        description={`Welcome back, ${me.name}.`}
        actions={
          <Link href="/admin/posts/new" className={buttonVariants()}>
            <Plus /> New post
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published posts" value={s.posts.published} href="/admin/posts?status=published" />
        <Stat label="Drafts" value={s.posts.draft} href="/admin/posts?status=draft" />
        <Stat label="Scheduled" value={s.posts.scheduled} href="/admin/posts?status=scheduled" />
        <Stat label="Archived" value={s.posts.archived} href="/admin/posts?status=archived" />
        <Stat label="Views today" value={s.views.today} />
        <Stat label="Views, 7 days" value={s.views.week} />
        <Stat label="Views, 30 days" value={s.views.month} />
        {editor ? <Stat label="Comments to review" value={s.pendingComments} href="/admin/comments" accent={s.pendingComments > 0} /> : <Stat label="Photo cards" value={s.photoCards.published} href="/admin/photo-cards" />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Views, last 14 days" className="lg:col-span-2">
          <ViewsChart data={s.viewsByDay} />
        </Panel>
        <Panel title="Top stories (7 days)">
          {s.topPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No views yet.</p>
          ) : (
            <ol className="space-y-3">
              {s.topPosts.map((p, i) => (
                <li key={p.id} className="flex items-start gap-3 text-sm">
                  <span className="w-4 shrink-0 font-bold text-primary">{i + 1}</span>
                  <Link href={`/admin/posts/${p.id}`} className="line-clamp-2 flex-1 hover:text-primary">
                    {p.title}
                  </Link>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{num(p.views)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Recently edited" className="lg:col-span-2">
          <ul className="divide-y">
            {s.recentPosts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <LangBadge lang={p.lang} />
                <Link href={`/admin/posts/${p.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary">
                  {p.title}
                </Link>
                <StatusBadge status={p.status} />
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {p.authorName} · {dateTime(p.updatedAt)}
                </span>
              </li>
            ))}
            {s.recentPosts.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing written yet.</li>}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Other content">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="mb-1 font-medium">Photo cards</dt>
                <dd className="flex flex-wrap gap-x-3 text-muted-foreground">
                  {STATUSES.map((st) => (
                    <span key={st}>
                      {st}: <b className="text-foreground">{s.photoCards[st] ?? 0}</b>
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-medium">Videos</dt>
                <dd className="flex flex-wrap gap-x-3 text-muted-foreground">
                  {STATUSES.map((st) => (
                    <span key={st}>
                      {st}: <b className="text-foreground">{s.videos[st] ?? 0}</b>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </Panel>
          {editor && (
            <Panel title="Newsletter subscribers">
              <p className="text-3xl font-bold tabular-nums">{num(subs.active)}</p>
              <p className="text-sm text-muted-foreground">
                active · {num(subs.pending)} waiting to confirm · {num(subs.unsubscribed)} left
              </p>
              <Link href="/admin/newsletters" className="mt-3 inline-block text-sm text-primary hover:underline">
                Write a newsletter
              </Link>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
