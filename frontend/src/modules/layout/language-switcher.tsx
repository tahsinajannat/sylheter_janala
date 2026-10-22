'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n/provider';
import { LANG_COOKIE, OTHER_LANG } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { useAlternates } from './alternates';

/** Links to the same page in the other language and remembers the choice in a cookie. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const alternates = useAlternates();
  const target = OTHER_LANG[lang];

  const rest = pathname.replace(/^\/(bn|en)/, '');
  const href = `/${target}${alternates?.[target] ?? rest}${alternates?.[target] || !search ? '' : `?${search}`}`;

  return (
    <Link
      href={href}
      hrefLang={target}
      aria-label={t.nav.switchLanguageLabel}
      onClick={() => {
        document.cookie = `${LANG_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium hover:bg-accent', className)}
    >
      <Languages className="size-4" />
      {t.nav.switchLanguage}
    </Link>
  );
}
