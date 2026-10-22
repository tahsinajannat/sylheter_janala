'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  const { lang, t } = useI18n();
  const router = useRouter();
  return (
    <form
      role="search"
      className="mt-4 flex max-w-xl gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
        if (q) router.push(routes.search(lang, q));
      }}
    >
      <Input name="q" defaultValue={defaultValue} placeholder={t.listing.searchPlaceholder} aria-label={t.nav.search} minLength={2} maxLength={100} autoFocus={!defaultValue} />
      <Button type="submit">
        <Search /> {t.nav.search}
      </Button>
    </form>
  );
}
