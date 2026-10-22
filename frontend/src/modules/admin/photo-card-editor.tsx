'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { admin, errorText } from '@/lib/admin/client';
import type { Category, Lang, PhotoCard, Role, Tag } from '@/lib/admin/types';
import { CategoryField, ImageField, LANGS, PublishBox, TagPicker, initialPublishedAt, nul, publishedAtValue, type PublishState } from './content-parts';
import { Field, NativeSelect, Panel, Toggle } from './ui';

export function PhotoCardEditor({ card, role, categories, tags }: { card: PhotoCard | null; role: Role; categories: Category[]; tags: Tag[] }) {
  const router = useRouter();
  const editor = role !== 'author';
  const [lang, setLang] = useState<Lang>(card?.lang ?? 'bn');
  const [title, setTitle] = useState(card?.title ?? '');
  const [slug, setSlug] = useState(card?.slug ?? '');
  const [caption, setCaption] = useState(card?.caption ?? '');
  const [photographer, setPhotographer] = useState(card?.photographer ?? '');
  const [image, setImage] = useState<{ id: string; url: string } | null>(card ? { id: card.imageId, url: card.imageUrl } : null);
  const [categoryId, setCategoryId] = useState(card?.categoryId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(card?.tagIds ?? []);
  const [isSlider, setIsSlider] = useState(card?.isSlider ?? true);
  const [sliderOrder, setSliderOrder] = useState(card?.sliderOrder ?? 0);
  const [publish, setPublish] = useState<PublishState>({ status: card?.status ?? 'draft', publishedAt: initialPublishedAt(card?.publishedAt) });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (title.trim().length < 2) return toast.error('Add a title.');
    if (!image) return toast.error('Choose a photo.');
    if (publish.status === 'scheduled' && !publish.publishedAt) return toast.error('Pick the date and time to publish.');
    const body = {
      title: title.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      caption: nul(caption),
      photographer: nul(photographer),
      imageId: image.id,
      categoryId: categoryId || null,
      tagIds,
      status: publish.status,
      publishedAt: publishedAtValue(publish),
      ...(editor ? { isSlider, sliderOrder } : {}),
    };
    setSaving(true);
    try {
      if (card) {
        await admin.patch(`/photo-cards/${card.id}`, body);
        toast.success('Saved');
        router.refresh();
      } else {
        const created = await admin.post<PhotoCard>('/photo-cards', { ...body, lang });
        toast.success('Photo card created');
        router.replace(`/admin/photo-cards/${created.id}`);
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
            <ImageField label="Photo" required url={image?.url ?? null} onPick={(id, url) => setImage({ id, url })} />
            <Field label="Title *">
              <Input lang={lang} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Caption">
              <Textarea lang={lang} rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={1000} />
            </Field>
            <Field label="Photographer">
              <Input value={photographer} onChange={(e) => setPhotographer(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Web address (slug)" hint={card ? undefined : 'Generated from the title when empty.'}>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </Field>
          </div>
        </Panel>
      </div>
      <aside className="space-y-4">
        <PublishBox role={role} value={publish} onChange={setPublish} onSave={save} saving={saving} isNew={!card} deletePath={card ? `/photo-cards/${card.id}` : undefined} viewUrl={card ? `/${card.lang}/photo-cards/${card.slug}` : undefined} />
        <Panel title="Details">
          <div className="grid gap-3">
            <Field label="Language" hint={card ? 'The language cannot change after creation.' : undefined}>
              <NativeSelect
                value={lang}
                disabled={!!card}
                onChange={(e) => {
                  setLang(e.target.value as Lang);
                  setCategoryId('');
                  setTagIds([]);
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
            <TagPicker lang={lang} tags={tags} value={tagIds} onChange={setTagIds} />
          </div>
        </Panel>
        {editor && (
          <Panel title="Home page slider">
            <div className="grid gap-3">
              <Toggle checked={isSlider} onChange={setIsSlider} label="Show in the home slider" />
              {isSlider && (
                <Field label="Slider order" hint="Lower numbers come first.">
                  <Input type="number" min={0} max={1000} value={sliderOrder} onChange={(e) => setSliderOrder(Number(e.target.value) || 0)} />
                </Field>
              )}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
}
