import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { adminGet, requireRole } from '@/lib/admin/server';
import type { AdRow } from '@/lib/admin/types';
import { AdEditor } from '@/modules/admin/ad-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Edit ad' };

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin', 'editor');
  const { id } = await params;
  const ad = await adminGet<AdRow>(`/admin/ads/${id}`).catch((e) => {
    if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
    throw e;
  });
  const a = ad.data;
  return (
    <>
      <PageHeader
        title="Edit ad"
        description={a.kind === 'banner' ? `${a.impressions.toLocaleString('en-US')} impressions · ${a.clicks.toLocaleString('en-US')} clicks` : 'AdSense statistics are in your Google AdSense account.'}
      />
      <AdEditor key={`${a.id}-${a.updatedAt}`} ad={a} />
    </>
  );
}
