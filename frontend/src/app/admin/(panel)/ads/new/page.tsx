import type { Metadata } from 'next';
import { requireRole } from '@/lib/admin/server';
import { AdEditor } from '@/modules/admin/ad-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'New ad' };

export default async function NewAdPage() {
  await requireRole('admin', 'editor');
  return (
    <>
      <PageHeader title="New ad" />
      <AdEditor ad={null} />
    </>
  );
}
