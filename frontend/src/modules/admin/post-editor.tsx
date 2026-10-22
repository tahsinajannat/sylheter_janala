'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { admin, errorText } from '@/lib/admin/client';
import type { Category, Lang, Post, PostRow, Role, Tag } from '@/lib/admin/types';
import { CategoryField, ImageField, LANGS, PublishBox, TagPicker, initialPublishedAt, nul, publishedAtValue, type PublishState } from './content-parts';
import { RichEditor } from './rich-editor';
import { Field, LangBadge, Modal, NativeSelect, Panel, Toggle } from './ui';

export function PostEditor({ post, role, categories, tags }: { post: Post | null; role: Role; categories: Category[]; tags: Tag[] }) {
  const router = useRouter();
  const editor = role !== 'author';
  const isNew = !post;

  const [lang, setLang] = useState<Lang>(post?.lang ?? 'bn');
  const [type, setType] = useState<'news' | 'editorial'>(post?.type ?? 'news');
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(post?.tagIds ?? []);
  const [image, setImage] = useState<{ id: string; url: string } | null>(post?.featuredImageId && post.featuredImageUrl ? { id: post.featuredImageId, url: post.featuredImageUrl } : null);
  const [flags, setFlags] = useState({ isHero: post?.isHero ?? false, isSpotlight: post?.isSpotlight ?? false, isFeatured: post?.isFeatured ?? false, spotlightOrder: post?.spotlightOrder ?? 0, featuredOrder: post?.featuredOrder ?? 0 });
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? '');
  const [publish, setPublish] = useState<PublishState>({ status: post?.status ?? 'draft', publishedAt: initialPublishedAt(post?.publishedAt) });
  const [saving, setSaving] = useState(false);

  function changeLang(next: Lang) {
    setLang(next);
    setCategoryId('');
    setTagIds([]);
  }

  async function save() {
    if (title.trim().length < 3) return toast.error('The headline needs at least 3 characters.');
    if (!categoryId) return toast.error('Choose a category.');
    if (!content.trim()) return toast.error('The story text is empty.');
    if (publish.status === 'scheduled' && !publish.publishedAt) return toast.error('Pick the date and time to publish.');

    const body = {
      type,
      title: title.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      excerpt: nul(excerpt),
      content,
      status: publish.status,
      publishedAt: publishedAtValue(publish),
      featuredImageId: image?.id ?? null,
      categoryId,
      tagIds,
      metaTitle: nul(metaTitle),
      metaDescription: nul(metaDescription),
      ...(editor ? { isHero: flags.isHero, isSpotlight: flags.isSpotlight, spotlightOrder: flags.spotlightOrder, isFeatured: flags.isFeatured, featuredOrder: flags.featuredOrder } : {}),
    };
    setSaving(true);
    try {
      if (post) {
        await admin.patch(`/posts/${post.id}`, body);
        toast.success('Saved');
        router.refresh();
      } else {
        const created = await admin.post<Post>('/posts', { ...body, lang });
        toast.success('Post created');
        router.replace(`/admin/posts/${created.id}`);
      }
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <div className="grid gap-4">
            <Field label="Headline *">
              <Input lang={lang} value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 text-lg font-semibold" />
            </Field>
            <Field label="Summary" hint="Shown on cards and in search results (up to 600 characters).">
              <Textarea lang={lang} rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={600} />
            </Field>
            <Field label="Story *">
              <RichEditor key={post?.id ?? 'new'} lang={lang} value={content} onChange={setContent} />
            </Field>
          </div>
        </Panel>

        <Panel title="Search engines (optional)">
          <div className="grid gap-3">
            <Field label="Web address (slug)" hint={isNew ? 'Generated from the headline when empty.' : 'Changing it breaks old links to this story.'}>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
            <Field label="Meta title">
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={200} />
            </Field>
            <Field label="Meta description">
              <Textarea rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={400} />
            </Field>
          </div>
        </Panel>
      </div>

      <aside className="space-y-4">
        <PublishBox
          role={role}
          value={publish}
          onChange={setPublish}
          onSave={save}
          saving={saving}
          isNew={isNew}
          deletePath={post ? `/posts/${post.id}` : undefined}
          viewUrl={post ? `/${post.lang}/news/${post.slug}` : undefined}
        />

        <Panel title="Details">
          <div className="grid gap-3">
            <Field label="Language" hint={isNew ? undefined : 'The language cannot change after creation.'}>
              <NativeSelect value={lang} onChange={(e) => changeLang(e.target.value as Lang)} disabled={!isNew}>
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Type">
              <NativeSelect value={type} onChange={(e) => setType(e.target.value as 'news' | 'editorial')}>
                <option value="news">News</option>
                <option value="editorial">Editorial / opinion</option>
              </NativeSelect>
            </Field>
            <CategoryField lang={lang} value={categoryId} onChange={setCategoryId} categories={categories} required />
            <TagPicker lang={lang} tags={tags} value={tagIds} onChange={setTagIds} />
          </div>
        </Panel>

        <Panel title="Featured image">
          <ImageField label="Cover photo" url={image?.url ?? null} onPick={(id, url) => setImage({ id, url })} onClear={() => setImage(null)} />
        </Panel>

        {editor && (
          <Panel title="Home page placement">
            <div className="grid gap-3">
              <Toggle checked={flags.isHero} onChange={(v) => setFlags({ ...flags, isHero: v })} label="Hero story" hint="The big story at the top of the home page." />
              <Toggle checked={flags.isSpotlight} onChange={(v) => setFlags({ ...flags, isSpotlight: v })} label="Spotlight" />
              {flags.isSpotlight && (
                <Field label="Spotlight order" hint="Lower numbers come first.">
                  <Input type="number" min={0} max={1000} value={flags.spotlightOrder} onChange={(e) => setFlags({ ...flags, spotlightOrder: Number(e.target.value) || 0 })} />
                </Field>
              )}
              <Toggle checked={flags.isFeatured} onChange={(v) => setFlags({ ...flags, isFeatured: v })} label="Featured" />
              {flags.isFeatured && (
                <Field label="Featured order">
                  <Input type="number" min={0} max={1000} value={flags.featuredOrder} onChange={(e) => setFlags({ ...flags, featuredOrder: Number(e.target.value) || 0 })} />
                </Field>
              )}
            </div>
          </Panel>
        )}

        {post && editor && <TranslationLink post={post} />}
      </aside>
    </div>
  );
}

/** Link this post with its twin in the other language (powers the language switcher). */
function TranslationLink({ post }: { post: Post }) {
  const router = useRouter();
  const other: Lang = post.lang === 'bn' ? 'en' : 'bn';
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<PostRow[] | null>(null);
  const [q, setQ] = useState('');

  async function load(query = '') {
    try {
      const res = await admin.get<PostRow[]>('/posts', { lang: other, q: query || undefined, limit: 30 });
      setRows(res);
    } catch (err) {
      toast.error(errorText(err));
    }
  }
  // the `/posts` list returns { data, meta }; admin.get unwraps `data`
  return (
    <Panel title="Other-language version">
      <p className="mb-3 text-sm text-muted-foreground">
        {post.translationKey ? 'Linked to a post in the other language. Readers can switch between them.' : `Not linked yet. Link the ${other === 'bn' ? 'Bangla' : 'English'} version so the language switcher works.`}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen(true);
          void load();
        }}
      >
        {post.translationKey ? 'Change link' : 'Link a post'}
      </Button>
      <Modal open={open} onOpenChange={setOpen} title={`Choose the ${other === 'bn' ? 'Bangla' : 'English'} post`}>
        <Input
          placeholder="Search by title"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            void load(e.target.value);
          }}
          className="mb-3"
        />
        <ul className="max-h-80 divide-y overflow-y-auto">
          {rows?.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-1 py-2 text-left text-sm hover:bg-accent"
                onClick={async () => {
                  try {
                    await admin.post(`/posts/${post.id}/translation`, { postId: r.id });
                    toast.success('Linked');
                    setOpen(false);
                    router.refresh();
                  } catch (err) {
                    toast.error(errorText(err));
                  }
                }}
              >
                <LangBadge lang={r.lang} />
                <span className="line-clamp-2">{r.title}</span>
              </button>
            </li>
          ))}
          {rows && rows.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No posts found.</li>}
        </ul>
      </Modal>
    </Panel>
  );
}
