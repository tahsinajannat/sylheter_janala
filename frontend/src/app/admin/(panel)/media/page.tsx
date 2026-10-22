import type { Metadata } from 'next';
import { getStaff, isEditor } from '@/lib/admin/server';
import { MediaLibrary } from '@/modules/admin/media-library';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Media library' };

export default async function MediaPage() {
  const me = await getStaff();
  return (
    <>
      <PageHeader title="Media library" description="Photos used in posts, photo cards and videos. Click a photo to see its details." />
      <MediaLibrary mode="manage" canEdit={isEditor(me.role)} />
    </>
  );
}
