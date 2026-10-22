import type { Lang, PhotoCard } from '@/lib/api/types';
import { PhotoTile } from './photo-tile';

export function PhotoGrid({ cards, lang, photoLabel }: { cards: PhotoCard[]; lang: Lang; photoLabel: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <PhotoTile key={c.id} card={c} lang={lang} photoLabel={photoLabel} />
      ))}
    </div>
  );
}
