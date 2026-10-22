import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lang, PageMeta } from '@/lib/api/types';
import { formatNumber } from '@/lib/i18n/format';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  meta: PageMeta;
  lang: Lang;
  /** Build the URL of a page (1-based). */
  hrefFor: (page: number) => string;
  labels: { prev: string; next: string; page: string; of: string };
}

export function Pagination({ meta, lang, hrefFor, labels }: Props) {
  if (meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(buttonVariants({ variant: 'outline' }))}>
          <ChevronLeft /> {labels.prev}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        {labels.page} {formatNumber(page, lang)} {labels.of} {formatNumber(totalPages, lang)}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(buttonVariants({ variant: 'outline' }))}>
          {labels.next} <ChevronRight />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
