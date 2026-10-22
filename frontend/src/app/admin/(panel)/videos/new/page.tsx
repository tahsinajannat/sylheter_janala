import type { Metadata } from 'next';
import { adminGet, getStaff } from '@/lib/admin/server';
import type { Category } from '@/lib/admin/types';
import { VideoEditor } from '@/modules/admin/video-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'New video' };

export default async function NewVideoPage() {
  const me = await getStaff();
  const categories = await adminGet<Category[]>('/admin/categories');
  return (
    <>
      <PageHeader title="New video" />
      <VideoEditor video={null} role={me.role} categories={categories.data} />
    </>
  );
}
