'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { api } from '@/lib/api';
import { useReader } from '@/hooks/use-reader';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';

export function BookmarkButton({ postId }: { postId: string }) {
  const { lang, t } = useI18n();
  const { token } = useReader();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // the API has no "is bookmarked" lookup; read the first pages of the list once
  useEffect(() => {
    if (!token) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    (async () => {
      for (let page = 1; page <= 5; page++) {
        const r = await api.bookmarks.list(token, page).catch(() => null);
        if (!r || cancelled) return;
        if (r.data.some((p) => p.id === postId)) return void setSaved(true);
        if (page >= r.meta.totalPages) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, postId]);

  async function toggle() {
    if (!token) return router.push(`${routes.login(lang)}?next=${encodeURIComponent(location.pathname)}`);
    setBusy(true);
    try {
      if (saved) await api.bookmarks.remove(token, postId);
      else await api.bookmarks.add(token, postId);
      setSaved(!saved);
    } catch {
      /* leave state unchanged */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={saved ? 'default' : 'outline'} size="sm" onClick={toggle} disabled={busy} title={token ? undefined : t.article.saveNeedsLogin}>
      <Bookmark className={saved ? 'fill-current' : ''} /> {saved ? t.article.saved : t.article.save}
    </Button>
  );
}
