import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { adminGet, getStaff } from '@/lib/admin/server';
import type { Category, PhotoCard, Tag } from '@/lib/admin/types';
import { PhotoCardEditor } from '@/modules/admin/photo-card-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Edit photo card' };

export default async function EditPhotoCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getStaff();
  const [card, categories, tags] = await Promise.all([
    adminGet<PhotoCard>(`/admin/photo-cards/${id}`).catch((e) => {
      if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
      throw e;
    }),
    adminGet<Category[]>('/admin/categories'),
    adminGet<Tag[]>('/admin/tags'),
  ]);
  return (
    <>
      <PageHeader title="Edit photo card" description={`${card.data.viewCount.toLocaleString('en-US')} views`} />
      <PhotoCardEditor key={`${card.data.id}-${card.data.status}`} card={card.data} role={me.role} categories={categories.data} tags={tags.data} />
    </>
  );
}
