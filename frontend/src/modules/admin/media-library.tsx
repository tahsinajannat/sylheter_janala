'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin, errorText } from '@/lib/admin/client';
import type { Media, Paged } from '@/lib/admin/types';
import { cn } from '@/lib/utils';
import { DeleteButton, Field, Modal, useAction } from './ui';

/**
 * Image library.
 *  - mode "manage" (Media page): click a photo to edit its alt text / caption or delete it.
 *  - mode "select" (inside editors): click a photo to choose it.
 */
export function MediaLibrary({
  mode = 'manage',
  canEdit = true,
  onSelect,
  selectedIds = [],
}: {
  mode?: 'manage' | 'select';
  canEdit?: boolean;
  onSelect?: (m: Media) => void;
  selectedIds?: string[];
}) {
  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/admin-api/media?page=${p}&limit=24`, { cache: 'no-store' });
      if (res.status === 401) return window.location.assign('/admin/login?expired=1');
      const json = (await res.json()) as Paged<Media>;
      if (!res.ok) throw new Error((json as unknown as { error?: { message?: string } }).error?.message ?? 'Could not load images');
      setItems(json.data);
      setPage(json.meta.page);
      setPages(json.meta.totalPages);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void load(1);
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        await admin.post('/media', fd);
      }
      toast.success(files.length > 1 ? `${files.length} images uploaded` : 'Image uploaded');
      await load(1);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">JPG, PNG, WebP, GIF or AVIF, under 10 MB each.</p>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload images
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {loading && items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No images yet. Upload the first one.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => (mode === 'select' ? onSelect?.(m) : setEditing(m))}
                className={cn(
                  'group block w-full overflow-hidden rounded-lg border bg-card text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  selectedIds.includes(m.id) && 'ring-2 ring-primary',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt ?? ''} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                <p className="truncate px-2 py-1 text-xs text-muted-foreground">{m.alt || `${m.width ?? '?'}×${m.height ?? '?'} ${m.format ?? ''}`}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages || loading} onClick={() => load(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {editing && (
        <EditDialog
          media={editing}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load(page);
          }}
        />
      )}
    </div>
  );
}

function EditDialog({ media, canEdit, onClose, onSaved }: { media: Media; canEdit: boolean; onClose: () => void; onSaved: () => void }) {
  const [alt, setAlt] = useState(media.alt ?? '');
  const [caption, setCaption] = useState(media.caption ?? '');
  const { busy, run } = useAction();
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Image details" description={`${media.width ?? '?'}×${media.height ?? '?'} · ${media.format ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt="" className="max-h-56 w-full rounded-md bg-muted object-contain" />
      <Input readOnly value={media.url} onFocus={(e) => e.target.select()} className="mt-3" />
      <div className="mt-3 grid gap-3">
        <Field label="Alt text (describes the picture for screen readers)">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} disabled={!canEdit} />
        </Field>
        <Field label="Caption">
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} disabled={!canEdit} />
        </Field>
      </div>
      {canEdit && (
        <div className="mt-4 flex items-center justify-between">
          <DeleteButton path={`/media/${media.id}`} title="Delete this image?" description="It is also removed from Cloudinary. Images used by a photo card cannot be deleted." onDone={onSaved} />
          <Button
            disabled={busy}
            onClick={async () => {
              const ok = await run(() => admin.patch(`/media/${media.id}`, { alt, caption }), { success: 'Saved', refresh: false });
              if (ok) onSaved();
            }}
          >
            Save
          </Button>
        </div>
      )}
    </Modal>
  );
}

/** Pop-up wrapper: pick one image from the library. */
export function MediaPicker({ open, onOpenChange, onSelect, selectedIds, title = 'Choose an image' }: { open: boolean; onOpenChange: (o: boolean) => void; onSelect: (m: Media) => void; selectedIds?: string[]; title?: string }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description="Upload a new photo or pick one from the library." wide>
      <MediaLibrary mode="select" onSelect={onSelect} selectedIds={selectedIds} />
    </Modal>
  );
}
