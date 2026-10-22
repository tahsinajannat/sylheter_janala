'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin, errorText } from '@/lib/admin/client';
import type { Category, Lang, Role, Status, Tag } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { MediaPicker } from './media-library';
import { DeleteButton, Field, NativeSelect, Panel } from './ui';
import { fromDhakaInput, toDhakaInput } from './helpers';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'bn', label: 'বাংলা' },
  { code: 'en', label: 'English' },
];

/** Empty string -> null (what the API expects for "no value"). */
export const nul = (v: string) => (v.trim() === '' ? null : v.trim());

// ───────── image chooser ─────────

export function ImageField({ label, url, onPick, onClear, required }: { label: string; url: string | null; onPick: (id: string, url: string) => void; onClear?: () => void; required?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={required ? `${label} *` : label}>
      {url ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-video w-full rounded-md border object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Change
            </Button>
            {onClear && (
              <Button type="button" size="icon" variant="secondary" className="size-8" aria-label="Remove image" onClick={onClear}>
                <X />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="h-24 w-full border-dashed" onClick={() => setOpen(true)}>
          <ImageIcon /> Choose image
        </Button>
      )}
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        title={label}
        onSelect={(m) => {
          onPick(m.id, m.url);
          setOpen(false);
        }}
      />
    </Field>
  );
}

// ───────── category + tags (filtered to the content language) ─────────

export function CategoryField({ lang, value, onChange, categories, required }: { lang: Lang; value: string; onChange: (v: string) => void; categories: Category[]; required?: boolean }) {
  const list = categories.filter((c) => c.lang === lang);
  return (
    <Field label={required ? 'Category *' : 'Category'}>
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{required ? 'Choose…' : '- none -'}</option>
        {list.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

export function TagPicker({ lang, tags, value, onChange }: { lang: Lang; tags: Tag[]; value: string[]; onChange: (v: string[]) => void }) {
  const router = useRouter();
  const [extra, setExtra] = useState<Tag[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const list = [...tags, ...extra].filter((t) => t.lang === lang);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  async function create() {
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      const t = await admin.post<Tag>('/tags', { lang, name: name.trim() });
      setExtra((e) => [...e, t]);
      onChange([...value, t.id]);
      setName('');
      router.refresh();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label="Tags" hint="Only tags in the story's language are listed.">
      <ul className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {list.map((t) => {
          const on = value.includes(t.id);
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.id)}
                className={cn('rounded-full border px-2.5 py-0.5 text-xs transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent')}
              >
                {t.name}
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li className="text-xs text-muted-foreground">No tags yet.</li>}
      </ul>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void create();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Add tag" disabled={busy} onClick={create}>
          {busy ? <Loader2 className="animate-spin" /> : <Plus />}
        </Button>
      </div>
    </Field>
  );
}

// ───────── publishing box ─────────

export interface PublishState {
  status: Status;
  publishedAt: string; // datetime-local text
}

export function PublishBox({
  role,
  value,
  onChange,
  onSave,
  saving,
  deletePath,
  viewUrl,
  isNew,
}: {
  role: Role;
  value: PublishState;
  onChange: (v: PublishState) => void;
  onSave: () => void;
  saving: boolean;
  deletePath?: string;
  viewUrl?: string;
  isNew: boolean;
}) {
  const router = useRouter();
  const author = role === 'author';
  const options: Status[] = author ? ['draft'] : ['draft', 'scheduled', 'published', 'archived'];
  const needsDate = value.status === 'scheduled' || value.status === 'published';
  return (
    <Panel title="Publish">
      <div className="grid gap-3">
        <Field label="Status" hint={author ? 'Authors save drafts; an editor publishes.' : undefined}>
          <NativeSelect value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value as Status })} disabled={author}>
            {options.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {needsDate && (
          <Field label={value.status === 'scheduled' ? 'Publish at (Dhaka time) *' : 'Published at (Dhaka time)'} hint={value.status === 'scheduled' ? 'Must be in the future.' : 'Leave empty to use now.'}>
            <Input type="datetime-local" value={value.publishedAt} onChange={(e) => onChange({ ...value, publishedAt: e.target.value })} />
          </Field>
        )}
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />} {isNew ? 'Create' : 'Save changes'}
        </Button>
        {viewUrl && value.status === 'published' && (
          <a href={viewUrl} target="_blank" rel="noreferrer" className="text-center text-sm text-primary hover:underline">
            View on site
          </a>
        )}
        {deletePath && !isNew && (
          <div className="flex justify-end border-t pt-3">
            <DeleteButton label="Delete" path={deletePath} title="Delete this item?" description="It is removed from the site for good." onDone={() => router.back()} />
          </div>
        )}
      </div>
    </Panel>
  );
}

/** datetime-local text for the API (null when empty). */
export const publishedAtValue = (s: PublishState) => fromDhakaInput(s.publishedAt);
export const initialPublishedAt = (iso: string | null | undefined) => toDhakaInput(iso);
