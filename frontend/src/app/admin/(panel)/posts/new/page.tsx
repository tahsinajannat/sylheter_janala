import type { Metadata } from 'next';
import { adminGet, getStaff } from '@/lib/admin/server';
import type { Category, Tag } from '@/lib/admin/types';
import { PostEditor } from '@/modules/admin/post-editor';
import { PageHeader } from '@/modules/admin/ui';

export const metadata: Metadata = { title: 'New post' };

export default async function NewPostPage() {
  const me = await getStaff();
  const [categories, tags] = await Promise.all([adminGet<Category[]>('/admin/categories'), adminGet<Tag[]>('/admin/tags')]);
  return (
    <>
      <PageHeader title="New post" />
      <PostEditor post={null} role={me.role} categories={categories.data} tags={tags.data} />
    </>
  );
}
