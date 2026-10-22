'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { admin, errorText } from '@/lib/admin/client';
import type { Setting } from '@/lib/admin/types';
import { Field, Panel, useAction } from './ui';

/** Known keys get a friendly label; anything else the database holds is still editable below. */
const KNOWN: { key: string; label: string; hint?: string }[] = [
  { key: 'site_name_bn', label: 'Site name (বাংলা)' },
  { key: 'site_name_en', label: 'Site name (English)' },
  { key: 'bn_portal_url', label: 'Bangla portal address', hint: 'Used by the “other portal” section.' },
  { key: 'en_portal_url', label: 'English portal address' },
  { key: 'site_adsense_client', label: 'Google AdSense publisher id', hint: 'Looks like ca-pub-1234567890123456. AdSense ads only show when this is set.' },
  { key: 'social_facebook', label: 'Facebook page link', hint: 'Keys starting with social_ appear in the footer when the value is a full https:// link.' },
  { key: 'social_youtube', label: 'YouTube channel link' },
  { key: 'social_x', label: 'X (Twitter) link' },
  { key: 'social_instagram', label: 'Instagram link' },
];

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const stored = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const keys = [...new Set([...KNOWN.map((k) => k.key), ...settings.map((s) => s.key)])];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(keys.map((k) => [k, stored[k] ?? ''])));
  const [extraKey, setExtraKey] = useState('');
  const [extraKeys, setExtraKeys] = useState<string[]>([]);
  const { busy, run } = useAction();
  const label = (k: string) => KNOWN.find((x) => x.key === k);

  async function save() {
    // only send values that changed (an empty value for an unset key is skipped)
    const changed = Object.keys(values).filter((k) => (values[k] ?? '') !== (stored[k] ?? '') && !(values[k] === '' && !(k in stored)));
    if (changed.length === 0) return toast.info('Nothing changed.');
    await run(async () => {
      for (const k of changed) await admin.put(`/settings/${k}`, { value: values[k] });
    }, { success: 'Settings saved' });
  }

  function addKey() {
    const k = extraKey.trim();
    if (!/^[a-z0-9_]{2,64}$/.test(k)) return toast.error('Use lowercase letters, digits and underscores (2 to 64 characters).');
    if (k in values) return toast.error('That key already exists.');
    setValues((v) => ({ ...v, [k]: '' }));
    setExtraKeys((e) => [...e, k]);
    setExtraKey('');
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Panel>
        <div className="grid gap-4">
          {[...keys, ...extraKeys].map((k) => (
            <Field key={k} label={label(k)?.label ?? k} hint={label(k)?.hint ?? (label(k) ? undefined : `Key: ${k}`)}>
              <Input value={values[k] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} maxLength={2000} />
            </Field>
          ))}
        </div>
      </Panel>
      <Panel title="Add another setting">
        <div className="flex gap-2">
          <Input value={extraKey} onChange={(e) => setExtraKey(e.target.value)} placeholder="social_telegram" />
          <Button type="button" variant="outline" onClick={addKey}>
            <Plus /> Add
          </Button>
        </div>
      </Panel>
      <Button onClick={save} disabled={busy}>
        Save settings
      </Button>
      <p className="text-xs text-muted-foreground">Public pages refresh within a minute of saving.</p>
    </div>
  );
}
