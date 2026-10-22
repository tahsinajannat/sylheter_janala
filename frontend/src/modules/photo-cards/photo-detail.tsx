import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import type { Lang, PhotoCardDetail } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { SectionHeading, SmartImage } from '@/components/common';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { formatDate } from '@/lib/i18n/format';
import { routes } from '@/lib/routes';
import { PhotoGrid } from './photo-grid';
import { ViewCounter } from './view-counter';

/** Photo-card page: the photo large, caption + credit, then related photo cards. */
export function PhotoDetail({ card, lang, t }: { card: PhotoCardDetail; lang: Lang; t: Dictionary }) {
  return (
    <div className="space-y-12">
      <ViewCounter id={card.id} />
      <article className="mx-auto max-w-4xl space-y-5">
        <Link href={routes.photos(lang)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> {t.photos.back}
        </Link>
        <figure className="space-y-3">
          <SmartImage image={card.image} alt={card.title} ratio="aspect-[4/3]" sizes="(min-width:1024px) 896px, 100vw" priority className="rounded-xl" />
        </figure>
        <h1 className="text-2xl font-bold sm:text-4xl">{card.title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <time dateTime={card.publishedAt}>{formatDate(card.publishedAt, lang)}</time>
          {card.category && <Badge variant="muted">{card.category.name}</Badge>}
          {card.photographer && (
            <span className="inline-flex items-center gap-1">
              <Camera className="size-4" /> {t.photos.photographer}: {card.photographer}
            </span>
          )}
        </p>
        {card.caption && <p className="text-lg leading-relaxed">{card.caption}</p>}
        {card.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <li key={tag.slug}>
                <Link href={routes.tag(lang, tag.slug)}>
                  <Badge variant="outline">#{tag.name}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      {card.related.length > 0 && (
        <section>
          <SectionHeading title={t.photos.related} />
          <PhotoGrid cards={card.related} lang={lang} photoLabel={t.photos.photographer} />
        </section>
      )}
    </div>
  );
}
