import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { adminGet, getStaff } from '@/lib/admin/server';
import type { Category, Video } from '@/lib/admin/types';
import { VideoEditor } from '@/modules/admin/video-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Edit video' };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getStaff();
  const [video, categories] = await Promise.all([
    adminGet<Video>(`/admin/videos/${id}`).catch((e) => {
      if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
      throw e;
    }),
    adminGet<Category[]>('/admin/categories'),
  ]);
  return (
    <>
      <PageHeader title="Edit video" description={`${video.data.viewCount.toLocaleString('en-US')} views`} />
      <VideoEditor key={`${video.data.id}-${video.data.status}`} video={video.data} role={me.role} categories={categories.data} />
    </>
  );
}
