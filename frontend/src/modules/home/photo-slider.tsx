'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PhotoCard } from '@/lib/api/types';
import { SmartImage } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { routes } from '@/lib/routes';

/** Horizontal scroll-snap slider (touch swipe + arrow buttons). Each slide opens the photo-card page. */
export function PhotoSlider({ cards }: { cards: PhotoCard[] }) {
  const { lang, t } = useI18n();
  const track = useRef<HTMLUListElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <ul ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2">
        {cards.map((c) => (
          <li key={c.id} className="group relative w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[24%]">
            <div className="relative overflow-hidden rounded-xl">
              <SmartImage image={c.image} alt={c.title} ratio="aspect-[4/5]" sizes="(min-width:1024px) 24vw, 80vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white">
                <h3 className="line-clamp-2 leading-snug font-semibold">
                  <Link href={routes.photo(lang, c.slug)} className="after:absolute after:inset-0">
                    {c.title}
                  </Link>
                </h3>
                {c.photographer && (
                  <p className="text-xs text-white/70">
                    {t.photos.photographer}: {c.photographer}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label={t.photos.prev}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label={t.photos.next}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
