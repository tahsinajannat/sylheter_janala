import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { adminGet, activeByLang, requireRole } from '@/lib/admin/server';
import type { Campaign } from '@/lib/admin/types';
import { NewsletterEditor } from '@/modules/admin/newsletter-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Newsletter' };

export default async function NewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin', 'editor');
  const { id } = await params;
  const campaign = (
    await adminGet<Campaign>(`/admin/newsletters/${id}`).catch((e) => {
      if (e instanceof ApiError && [400, 404].includes(e.status)) notFound();
      throw e;
    })
  ).data;
  return (
    <>
      <PageHeader title="Newsletter" />
      <NewsletterEditor key={`${campaign.id}-${campaign.status}`} campaign={campaign} recipients={await activeByLang()} />
    </>
  );
}
