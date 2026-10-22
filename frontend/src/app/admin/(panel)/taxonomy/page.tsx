import type { Metadata } from 'next';
import { adminGet } from '@/lib/admin/server';
import type { Category, Tag } from '@/lib/admin/types';
import { SimpleTabs } from '@/modules/admin/tabs';
import { TaxonomyManager } from '@/modules/admin/taxonomy-manager';
import { PageHeader } from '@/modules/admin/ui';
import { getStaff, isEditor } from '@/lib/admin/server';

export const metadata: Metadata = { title: 'Categories & tags' };

export default async function TaxonomyPage() {
  const me = await getStaff();
  const [categories, tags] = await Promise.all([adminGet<Category[]>('/admin/categories'), adminGet<Tag[]>('/admin/tags')]);
  if (!isEditor(me.role)) {
    return (
      <>
        <PageHeader title="Categories & tags" description="Only editors can change these. Authors can add tags while writing." />
        <p className="text-sm text-muted-foreground">
          {categories.data.length} categories and {tags.data.length} tags available.
        </p>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Categories & tags" description="Categories are the site sections. Each language has its own set." />
      <SimpleTabs
        tabs={[
          { id: 'categories', label: `Categories (${categories.data.length})`, content: <TaxonomyManager kind="categories" rows={categories.data} /> },
          { id: 'tags', label: `Tags (${tags.data.length})`, content: <TaxonomyManager kind="tags" rows={tags.data} /> },
        ]}
      />
    </>
  );
}
