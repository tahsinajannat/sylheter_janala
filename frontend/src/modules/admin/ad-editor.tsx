'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin, errorText } from '@/lib/admin/client';
import type { AdKind, AdPlacement, AdRow, Lang } from '@/lib/admin/types';
import { ImageField, LANGS, nul } from './content-parts';
import { PLACEMENTS, fromDhakaInput, toDhakaInput } from './helpers';
import { DeleteButton, Field, NativeSelect, Panel, Toggle } from './ui';

export function AdEditor({ ad }: { ad: AdRow | null }) {
  const router = useRouter();
  const [name, setName] = useState(ad?.name ?? '');
  const [kind, setKind] = useState<AdKind>(ad?.kind ?? 'banner');
  const [placement, setPlacement] = useState<AdPlacement>(ad?.placement ?? 'home_mid');
  const [lang, setLang] = useState<'' | Lang>(ad?.lang ?? '');
  const [image, setImage] = useState<{ id: string; url: string } | null>(ad?.imageId && ad.imageUrl ? { id: ad.imageId, url: ad.imageUrl } : null);
  const [linkUrl, setLinkUrl] = useState(ad?.linkUrl ?? '');
  const [altText, setAltText] = useState(ad?.altText ?? '');
  const [slot, setSlot] = useState(ad?.adsenseSlot ?? '');
  const [isActive, setIsActive] = useState(ad?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(toDhakaInput(ad?.startsAt));
  const [endsAt, setEndsAt] = useState(toDhakaInput(ad?.endsAt));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (name.trim().length < 2) return toast.error('Give the ad a name.');
    if (kind === 'banner') {
      if (!image) return toast.error('Choose the banner image.');
      if (!/^https?:\/\//i.test(linkUrl.trim())) return toast.error('The link must start with http:// or https://');
    } else if (!/^\d{4,20}$/.test(slot.trim())) {
      return toast.error('Enter the AdSense ad unit id (a number).');
    }
    const start = fromDhakaInput(startsAt);
    const end = fromDhakaInput(endsAt);
    if (start && end && end <= start) return toast.error('The end date must be after the start date.');

    const body = {
      name: name.trim(),
      kind,
      placement,
      lang: lang || null,
      imageId: kind === 'banner' ? image!.id : null,
      linkUrl: kind === 'banner' ? linkUrl.trim() : null,
      altText: nul(altText),
      adsenseSlot: kind === 'adsense' ? slot.trim() : null,
      isActive,
      startsAt: start,
      endsAt: end,
    };
    setSaving(true);
    try {
      if (ad) {
        await admin.patch(`/ads/${ad.id}`, body);
        toast.success('Saved');
        router.refresh();
      } else {
        const created = await admin.post<AdRow>('/ads', body);
        toast.success('Ad created');
        router.replace(`/admin/ads/${created.id}`);
      }
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  const hint = PLACEMENTS.find((p) => p.value === placement)?.hint;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <div className="grid gap-4">
            <Field label="Name *" hint="Only you see this: the advertiser or campaign.">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Type">
              <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as AdKind)}>
                <option value="banner">Banner (image + link)</option>
                <option value="adsense">Google AdSense unit</option>
              </NativeSelect>
            </Field>

            {kind === 'banner' ? (
              <>
                <ImageField label="Banner image" required url={image?.url ?? null} onPick={(id, url) => setImage({ id, url })} onClear={() => setImage(null)} />
                <Field label="Link *" hint="Where a click goes. Opens in a new tab.">
                  <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://advertiser.example/offer" />
                </Field>
                <Field label="Alt text" hint="Describes the banner for screen readers. Defaults to the name.">
                  <Input value={altText} onChange={(e) => setAltText(e.target.value)} maxLength={250} />
                </Field>
              </>
            ) : (
              <Field label="AdSense ad unit id *" hint="The number from AdSense > Ads > By ad unit (data-ad-slot). Set the publisher id under Site settings first.">
                <Input value={slot} onChange={(e) => setSlot(e.target.value)} inputMode="numeric" placeholder="1234567890" />
              </Field>
            )}
          </div>
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel title="Publish">
          <div className="grid gap-3">
            <Toggle checked={isActive} onChange={setIsActive} label="Active" hint="Switch off to pause without deleting." />
            <Field label="Start (Dhaka time)" hint="Empty = starts now.">
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </Field>
            <Field label="End (Dhaka time)" hint="Empty = runs until you stop it.">
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </Field>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {ad ? 'Save changes' : 'Create'}
            </Button>
            {ad && <DeleteButton path={`/ads/${ad.id}`} label="Delete ad" title="Delete this ad?" description="Its impression and click counts are deleted too." onDone={() => router.replace('/admin/ads')} />}
          </div>
        </Panel>
        <Panel title="Where it shows">
          <div className="grid gap-3">
            <Field label="Placement" hint={hint}>
              <NativeSelect value={placement} onChange={(e) => setPlacement(e.target.value as AdPlacement)}>
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Language" hint="Which portal shows it.">
              <NativeSelect value={lang} onChange={(e) => setLang(e.target.value as '' | Lang)}>
                <option value="">Both languages</option>
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <p className="text-xs text-muted-foreground">If several banners share a placement, one is picked at random. AdSense fills the slot only when no banner is live.</p>
          </div>
        </Panel>
      </aside>
    </div>
  );
}
