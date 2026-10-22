import Link from 'next/link';
import type { Lang } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const WORDS: Record<Lang, [string, string]> = {
  bn: ['সিলেটের', 'জানালা'],
  en: ['Sylheter', 'Janala'],
};

/**
 * The wordmark from the brand logo: navy word over a red block with white lettering.
 * Built from text (not an image) so it stays sharp, translates, and can shrink on scroll.
 */
export function Logo({ lang, compact = false, className }: { lang: Lang; compact?: boolean; className?: string }) {
  const [top, bottom] = WORDS[lang];
  return (
    <Link href={`/${lang}`} aria-label={`${top} ${bottom}`} className={cn('inline-flex flex-col items-start leading-none select-none', className)}>
      <span className={cn('font-bold text-navy transition-all duration-300', compact ? 'text-base' : 'text-2xl sm:text-3xl')}>{top}</span>
      <span
        className={cn(
          'bg-primary font-bold tracking-wide text-primary-foreground transition-all duration-300',
          compact ? 'mt-0.5 px-2 py-0.5 text-sm' : 'mt-1 px-3 py-0.5 text-xl sm:text-2xl',
        )}
      >
        {bottom}
      </span>
    </Link>
  );
}
