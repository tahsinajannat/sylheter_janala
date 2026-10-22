import type { Metadata } from 'next';
import { adminGet, getStaff } from '@/lib/admin/server';
import type { Category, Tag } from '@/lib/admin/types';
import { PhotoCardEditor } from '@/modules/admin/photo-card-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'New photo card' };

export default async function NewPhotoCardPage() {
  const me = await getStaff();
  const [categories, tags] = await Promise.all([adminGet<Category[]>('/admin/categories'), adminGet<Tag[]>('/admin/tags')]);
  return (
    <>
      <PageHeader title="New photo card" />
      <PhotoCardEditor card={null} role={me.role} categories={categories.data} tags={tags.data} />
    </>
  );
}
