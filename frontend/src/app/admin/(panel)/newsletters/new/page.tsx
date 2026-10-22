import type { Metadata } from 'next';
import { activeByLang, requireRole } from '@/lib/admin/server';
import { NewsletterEditor } from '@/modules/admin/newsletter-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'New newsletter' };

export default async function NewNewsletterPage() {
  await requireRole('admin', 'editor');
  return (
    <>
      <PageHeader title="New newsletter" />
      <NewsletterEditor campaign={null} recipients={await activeByLang()} />
    </>
  );
}
