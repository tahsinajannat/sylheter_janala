'use client';

import Link from 'next/link';
import { Bookmark, LogOut, User } from 'lucide-react';
import { useReader } from '@/hooks/use-reader';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { lang, t } = useI18n();
  const { reader, signOut } = useReader();

  if (!reader) {
    return (
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={routes.login(lang)}>
            <User /> {t.nav.login}
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm">
        <Link href={routes.bookmarks(lang)}>
          <Bookmark /> <span className="hidden sm:inline">{t.nav.bookmarks}</span>
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={signOut} title={reader.name}>
        <LogOut /> <span className="hidden sm:inline">{t.nav.logout}</span>
      </Button>
    </div>
  );
}
