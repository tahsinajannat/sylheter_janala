import type { Metadata } from 'next';
import { adminGet, requireRole } from '@/lib/admin/server';
import type { Setting } from '@/lib/admin/types';
import { SettingsForm } from '@/modules/admin/settings-form';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Site settings' };

export default async function SettingsPage() {
  await requireRole('admin');
  const settings = await adminGet<Setting[]>('/admin/settings');
  return (
    <>
      <PageHeader title="Site settings" description="Names, links and social pages shown on the public site." />
      <SettingsForm settings={settings.data} />
    </>
  );
}
