import type { Lang, Video } from '@/lib/api/types';
import { SectionHeading } from '@/components/common';
import { routes } from '@/lib/routes';
import { VideoCard } from './video-card';

export function VideoSection({ lang, title, viewAll, videos }: { lang: Lang; title: string; viewAll: string; videos: Video[] }) {
  if (videos.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} href={routes.videos(lang)} linkLabel={viewAll} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {videos.slice(0, 4).map((v) => (
          <VideoCard key={v.id} video={v} lang={lang} />
        ))}
      </div>
    </section>
  );
}
