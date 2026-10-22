'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin, errorText } from '@/lib/admin/client';
import type { Campaign, Lang } from '@/lib/admin/types';
import { LANGS } from './content-parts';
import { RichEditor } from './rich-editor';
import { DeleteButton, Field, Modal, NativeSelect, Panel, StatusBadge, useAction } from './ui';

export function NewsletterEditor({ campaign, recipients }: { campaign: Campaign | null; recipients: Record<Lang, number> }) {
  const router = useRouter();
  const locked = !!campaign && campaign.status !== 'draft';
  const [lang, setLang] = useState<Lang>(campaign?.lang ?? 'bn');
  const [subject, setSubject] = useState(campaign?.subject ?? '');
  const [body, setBody] = useState(campaign?.bodyHtml ?? '');
  const [testTo, setTestTo] = useState('');
  const [confirm, setConfirm] = useState(false);
  const { busy, run } = useAction();
  const [saving, setSaving] = useState(false);

  async function save(): Promise<string | null> {
    if (subject.trim().length < 3) {
      toast.error('The subject needs at least 3 characters.');
      return null;
    }
    if (!body.trim()) {
      toast.error('The message is empty.');
      return null;
    }
    setSaving(true);
    try {
      if (campaign) {
        await admin.patch(`/newsletters/${campaign.id}`, { subject: subject.trim(), bodyHtml: body });
        return campaign.id;
      }
      const created = await admin.post<Campaign>('/newsletters', { lang, subject: subject.trim(), bodyHtml: body });
      return created.id;
    } catch (err) {
      toast.error(errorText(err));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveClick() {
    const id = await save();
    if (!id) return;
    toast.success('Saved');
    if (!campaign) router.replace(`/admin/newsletters/${id}`);
    else router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Panel>
        <div className="grid gap-4">
          <Field label="Subject *">
            <Input lang={lang} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={locked} maxLength={200} />
          </Field>
          <Field label="Message *">
            {locked ? <div className="prose-article rounded-md border p-4" dangerouslySetInnerHTML={{ __html: campaign!.bodyHtml }} /> : <RichEditor key={campaign?.id ?? 'new'} lang={lang} value={body} onChange={setBody} placeholder="Write the newsletter…" />}
          </Field>
        </div>
      </Panel>

      <aside className="space-y-4">
        <Panel title="Campaign">
          <div className="grid gap-3">
            {campaign && (
              <p className="flex items-center gap-2 text-sm">
                Status <StatusBadge status={campaign.status} />
              </p>
            )}
            <Field label="Language" hint={campaign ? 'Cannot change after creation.' : 'Sent to active subscribers who chose this language.'}>
              <NativeSelect value={lang} onChange={(e) => setLang(e.target.value as Lang)} disabled={!!campaign}>
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({recipients[l.code]} active)
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {campaign?.stats && Object.keys(campaign.stats).length > 0 && (
              <p className="text-sm text-muted-foreground">
                {Object.entries(campaign.stats)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ')}
              </p>
            )}
            {!locked && (
              <Button onClick={saveClick} disabled={saving}>
                {saving && <Loader2 className="animate-spin" />} {campaign ? 'Save draft' : 'Create draft'}
              </Button>
            )}
          </div>
        </Panel>

        {campaign && !locked && (
          <>
            <Panel title="Send a test">
              <div className="grid gap-2">
                <Input type="email" placeholder="you@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
                <Button
                  variant="outline"
                  disabled={busy || !testTo}
                  onClick={async () => {
                    const id = await save();
                    if (id) await run(() => admin.post(`/newsletters/${id}/test`, { email: testTo }), { success: 'Test email sent', refresh: false });
                  }}
                >
                  Send test email
                </Button>
              </div>
            </Panel>
            <Panel title="Send to subscribers">
              <p className="mb-3 text-sm text-muted-foreground">
                {recipients[campaign.lang]} active {campaign.lang === 'bn' ? 'Bangla' : 'English'} subscribers will receive this. It cannot be undone.
              </p>
              <Button className="w-full" onClick={() => setConfirm(true)} disabled={recipients[campaign.lang] === 0}>
                <Send /> Send now
              </Button>
              <Modal open={confirm} onOpenChange={setConfirm} title="Send this newsletter?" description={`It goes to ${recipients[campaign.lang]} subscribers. Saved changes are included.`}>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={async () => {
                      const id = await save();
                      if (!id) return;
                      const ok = await run(() => admin.post(`/newsletters/${id}/send`), { success: 'Queued: emails are being sent' });
                      if (ok) setConfirm(false);
                    }}
                  >
                    {busy && <Loader2 className="animate-spin" />} Send
                  </Button>
                </div>
              </Modal>
            </Panel>
            <div className="flex justify-end">
              <DeleteButton label="Delete draft" path={`/newsletters/${campaign.id}`} title="Delete this draft?" onDone={() => router.replace('/admin/newsletters')} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
