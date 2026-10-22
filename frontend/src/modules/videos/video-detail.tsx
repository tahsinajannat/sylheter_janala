'use client';

import { ExternalLink } from 'lucide-react';
import type { Lang, VideoDetail as VideoDetailType } from '@/lib/api/types';
import { api } from '@/lib/api';
import { YouTubePlayer } from '@/components/common';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/i18n/format';
import { useI18n } from '@/lib/i18n/provider';
import { VideoCard } from './video-card';

/** Single video: player + description on the left, related videos on the right. */
export function VideoDetail({ video, lang }: { video: VideoDetailType; lang: Lang }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <article className="space-y-4 lg:col-span-2">
        <YouTubePlayer
          embedUrl={video.embedUrl}
          thumbnail={video.thumbnail}
          title={video.title}
          playLabel={t.videos.watch}
          onPlay={() => void api.videos.view(video.id).catch(() => {})}
        />
        <h1 className="text-2xl font-bold sm:text-3xl">{video.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(video.publishedAt, lang)}
          {video.category ? ` · ${video.category.name}` : ''}
        </p>
        {video.description && <p className="whitespace-pre-line text-lg">{video.description}</p>}
        <Button asChild variant="outline" size="sm">
          <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink /> {t.videos.openOnYoutube}
          </a>
        </Button>
      </article>

      {video.related.length > 0 && (
        <aside className="space-y-4">
          <h2 className="text-lg font-bold">{t.videos.related}</h2>
          {video.related.map((v) => (
            <VideoCard key={v.id} video={v} lang={lang} compact />
          ))}
        </aside>
      )}
    </div>
  );
}
