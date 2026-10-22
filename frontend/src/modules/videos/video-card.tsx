import Link from 'next/link';
import { Play } from 'lucide-react';
import type { Lang, Video } from '@/lib/api/types';
import { SmartImage } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/i18n/format';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

export function VideoCard({ video, lang, className, compact }: { video: Video; lang: Lang; className?: string; compact?: boolean }) {
  return (
    <article className={cn('group relative', compact ? 'flex gap-3' : 'space-y-3', className)}>
      <div className={cn('relative overflow-hidden rounded-xl', compact && 'w-36 shrink-0')}>
        <SmartImage image={{ url: video.thumbnail }} alt={video.title} ratio="aspect-video" sizes={compact ? '144px' : '(min-width:1024px) 25vw, 100vw'} />
        <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/35" />
        <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Play className="size-5 fill-current" />
        </span>
      </div>
      <div className="min-w-0 space-y-1">
        {video.category && !compact && <Badge variant="muted">{video.category.name}</Badge>}
        <h3 className={cn('leading-snug font-semibold transition-colors group-hover:text-primary', compact ? 'line-clamp-3 text-sm' : 'line-clamp-2')}>
          <Link href={routes.video(lang, video.slug)} className="after:absolute after:inset-0">
            {video.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">{formatDate(video.publishedAt, lang, 'short')}</p>
      </div>
    </article>
  );
}
