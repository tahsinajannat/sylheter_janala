'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { admin, errorText } from '@/lib/admin/client';
import type { Category, Lang, Role, Video } from '@/lib/admin/types';
import { CategoryField, ImageField, LANGS, PublishBox, initialPublishedAt, nul, publishedAtValue, type PublishState } from './content-parts';
import { Field, NativeSelect, Panel, Toggle } from './ui';

/** Pull the YouTube id out of a link for the live preview (the API validates the link too). */
function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

export function VideoEditor({ video, role, categories }: { video: Video | null; role: Role; categories: Category[] }) {
  const router = useRouter();
  const editor = role !== 'author';
  const [lang, setLang] = useState<Lang>(video?.lang ?? 'bn');
  const [title, setTitle] = useState(video?.title ?? '');
  const [slug, setSlug] = useState(video?.slug ?? '');
  const [description, setDescription] = useState(video?.description ?? '');
  const [url, setUrl] = useState(video?.youtubeUrl ?? '');
  const [thumb, setThumb] = useState<{ id: string; url: string } | null>(video?.thumbnailId && video.thumbnailUrl ? { id: video.thumbnailId, url: video.thumbnailUrl } : null);
  const [categoryId, setCategoryId] = useState(video?.categoryId ?? '');
  const [isFeatured, setIsFeatured] = useState(video?.isFeatured ?? false);
  const [publish, setPublish] = useState<PublishState>({ status: video?.status ?? 'draft', publishedAt: initialPublishedAt(video?.publishedAt) });
  const [saving, setSaving] = useState(false);
  const yt = youtubeId(url);

  async function save() {
    if (title.trim().length < 2) return toast.error('Add a title.');
    if (!yt) return toast.error('Paste a valid YouTube link.');
    if (publish.status === 'scheduled' && !publish.publishedAt) return toast.error('Pick the date and time to publish.');
    const body = {
      title: title.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      description: nul(description),
      youtubeUrl: url.trim(),
      thumbnailId: thumb?.id ?? null,
      categoryId: categoryId || null,
      status: publish.status,
      publishedAt: publishedAtValue(publish),
      ...(editor ? { isFeatured } : {}),
    };
    setSaving(true);
    try {
      if (video) {
        await admin.patch(`/videos/${video.id}`, body);
        toast.success('Saved');
        router.refresh();
      } else {
        const created = await admin.post<Video>('/videos', { ...body, lang });
        toast.success('Video created');
        router.replace(`/admin/videos/${created.id}`);
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
            <Field label="YouTube link *">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            </Field>
            {yt && (
              <div className="aspect-video overflow-hidden rounded-md border bg-black">
                <iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title="Preview" className="size-full" allowFullScreen loading="lazy" />
              </div>
            )}
            <Field label="Title *">
              <Input lang={lang} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea lang={lang} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
            </Field>
            <Field label="Web address (slug)" hint={video ? undefined : 'Generated from the title when empty.'}>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
          </div>
        </Panel>
      </div>
      <aside className="space-y-4">
        <PublishBox role={role} value={publish} onChange={setPublish} onSave={save} saving={saving} isNew={!video} deletePath={video ? `/videos/${video.id}` : undefined} viewUrl={video ? `/${video.lang}/videos/${video.slug}` : undefined} />
        <Panel title="Details">
          <div className="grid gap-3">
            <Field label="Language" hint={video ? 'The language cannot change after creation.' : undefined}>
              <NativeSelect
                value={lang}
                disabled={!!video}
                onChange={(e) => {
                  setLang(e.target.value as Lang);
                  setCategoryId('');
                }}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <CategoryField lang={lang} value={categoryId} onChange={setCategoryId} categories={categories} />
            <ImageField label="Custom thumbnail (optional)" url={thumb?.url ?? null} onPick={(id, u) => setThumb({ id, url: u })} onClear={() => setThumb(null)} />
            {editor && <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured video" />}
          </div>
        </Panel>
      </aside>
    </div>
  );
}
