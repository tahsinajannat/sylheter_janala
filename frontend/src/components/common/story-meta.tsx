import type { Lang } from '@/lib/api/types';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

interface Props {
  lang: Lang;
  publishedAt: string;
  author?: string;
  readMinutes?: number | null;
  minReadLabel?: string;
  className?: string;
}

/** "12 June 2026 · Author · 3 min read" - the small grey line under story titles. */
export function StoryMeta({ lang, publishedAt, author, readMinutes, minReadLabel, className }: Props) {
  const parts = [
    <time key="d" dateTime={publishedAt}>
      {formatDate(publishedAt, lang, 'short')}
    </time>,
    author && <span key="a">{author}</span>,
    readMinutes && minReadLabel ? <span key="r">{`${formatNumber(readMinutes, lang)} ${minReadLabel}`}</span> : null,
  ].filter(Boolean);
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground', className)}>
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden>·</span>}
          {p}
        </span>
      ))}
    </p>
  );
}
