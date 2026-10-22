import type { Lang, PhotoCard } from '@/lib/api/types';
import { SectionHeading } from '@/components/common';
import { routes } from '@/lib/routes';
import { PhotoSlider } from './photo-slider';

export function PhotoSection({ lang, title, viewAll, cards }: { lang: Lang; title: string; viewAll: string; cards: PhotoCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} href={routes.photos(lang)} linkLabel={viewAll} />
      <PhotoSlider cards={cards} />
    </section>
  );
}
