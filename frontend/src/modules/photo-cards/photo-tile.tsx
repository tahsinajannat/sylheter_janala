import Link from 'next/link';
import type { Lang, PhotoCard } from '@/lib/api/types';
import { SmartImage } from '@/components/common';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function PhotoTile({ card, lang, photoLabel, className }: { card: PhotoCard; lang: Lang; photoLabel: string; className?: string }) {
  return (
    <article className={cn('group relative overflow-hidden rounded-xl', className)}>
      <SmartImage image={card.image} alt={card.title} ratio="aspect-[4/5]" sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 space-y-1 p-3 text-white">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold sm:text-base">
          <Link href={routes.photo(lang, card.slug)} className="after:absolute after:inset-0">
            {card.title}
          </Link>
        </h3>
        {card.photographer && (
          <p className="text-xs text-white/70">
            {photoLabel}: {card.photographer}
          </p>
        )}
      </div>
    </article>
  );
}
