'use client';

import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin } from '@/lib/admin/client';
import type { Category, Lang, Tag } from '@/lib/admin/types';
import { DataTable, DeleteButton, EmptyRow, Field, LangBadge, Modal, NativeSelect, Toggle, useAction } from './ui';

type Row = (Category | Tag) & { kind: 'categories' | 'tags' };

function EditDialog({ kind, row, onClose }: { kind: 'categories' | 'tags'; row: Row | null; onClose: () => void }) {
  const { busy, run } = useAction();
  const cat = row && 'sortOrder' in row ? row : null;
  const [lang, setLang] = useState<Lang>(row?.lang ?? 'bn');
  const [name, setName] = useState(row?.name ?? '');
  const [slug, setSlug] = useState(row?.slug ?? '');
  const [sortOrder, setSortOrder] = useState(cat?.sortOrder ?? 0);
  const [showInNav, setShowInNav] = useState(cat?.showInNav ?? true);
  const [translationKey, setTranslationKey] = useState(cat?.translationKey ?? '');

  async function submit() {
    const body: Record<string, unknown> = { name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}) };
    if (kind === 'categories') Object.assign(body, { sortOrder, showInNav, translationKey: translationKey.trim() || null });
    const ok = await run(() => (row ? admin.patch(`/${kind}/${row.id}`, body) : admin.post(`/${kind}`, { ...body, lang })), { success: 'Saved' });
    if (ok) onClose();
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title={`${row ? 'Edit' : 'New'} ${kind === 'categories' ? 'category' : 'tag'}`}>
      <div className="grid gap-3">
        <Field label="Language" hint={row ? 'Cannot change after creation.' : undefined}>
          <NativeSelect value={lang} onChange={(e) => setLang(e.target.value as Lang)} disabled={!!row}>
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </NativeSelect>
        </Field>
        <Field label="Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Slug" hint="Generated from the name when empty.">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </Field>
        {kind === 'categories' && (
          <>
            <Field label="Menu order">
              <Input type="number" min={0} max={1000} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
            </Field>
            <Toggle checked={showInNav} onChange={setShowInNav} label="Show in the main menu" />
            <Field label="Translation key" hint="Give the Bangla and English version of a category the same key (a UUID) to link them.">
              <Input value={translationKey} onChange={(e) => setTranslationKey(e.target.value)} placeholder="optional" />
            </Field>
          </>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={busy || name.trim().length < 2} onClick={submit}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

export function TaxonomyManager({ kind, rows }: { kind: 'categories' | 'tags'; rows: (Category | Tag)[] }) {
  const [editing, setEditing] = useState<{ row: Row | null } | null>(null);
  const isCat = kind === 'categories';
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing({ row: null })}>
          <Plus /> New {isCat ? 'category' : 'tag'}
        </Button>
      </div>
      <DataTable head={['Name', 'Slug', isCat ? 'Menu' : '', isCat ? 'Posts' : '', '']}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <span className="mr-2">
                <LangBadge lang={r.lang} />
              </span>
              {r.name}
            </td>
            <td className="text-muted-foreground">{r.slug}</td>
            <td>{'showInNav' in r ? (r.showInNav ? `Yes (#${r.sortOrder})` : 'No') : ''}</td>
            <td className="tabular-nums">{'posts' in r ? r.posts : ''}</td>
            <td>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ row: { ...r, kind } })}>
                  <Pencil />
                </Button>
                <DeleteButton path={`/${kind}/${r.id}`} title={`Delete “${r.name}”?`} description={isCat ? 'A category that still has posts cannot be deleted.' : 'The tag is removed from every post that uses it.'} />
              </div>
            </td>
          </tr>
        ))}
        {rows.length === 0 && <EmptyRow cols={5} />}
      </DataTable>
      {editing && <EditDialog kind={kind} row={editing.row} onClose={() => setEditing(null)} />}
    </div>
  );
}
