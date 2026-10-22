import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import { adminGet, getStaff } from '@/lib/admin/server';
import type { Category, Post, Tag } from '@/lib/admin/types';
import { PostEditor } from '@/modules/admin/post-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'Edit post' };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getStaff();
  const [post, categories, tags] = await Promise.all([
    adminGet<Post>(`/admin/posts/${id}`).catch((e) => {
      if (e instanceof ApiError && [400, 403, 404].includes(e.status)) notFound();
      throw e;
    }),
    adminGet<Category[]>('/admin/categories'),
    adminGet<Tag[]>('/admin/tags'),
  ]);
  return (
    <>
      <PageHeader title="Edit post" description={`By ${post.data.authorName} · ${post.data.viewCount.toLocaleString('en-US')} views · ${post.data.readMinutes} min read`} />
      {/* key: fresh editor state after each server refresh */}
      <PostEditor key={`${post.data.id}-${post.data.status}`} post={post.data} role={me.role} categories={categories.data} tags={tags.data} />
    </>
  );
}
