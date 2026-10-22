'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { SmartImage } from './smart-image';

interface Props {
  embedUrl: string;
  thumbnail: string;
  title: string;
  playLabel: string;
  onPlay?: () => void;
}

/**
 * "Lite" embed: shows the thumbnail and loads the YouTube iframe only after a click,
 * so a page with many videos doesn't pull megabytes of third-party JS up front.
 */
export function YouTubePlayer({ embedUrl, thumbnail, title, playLabel, onPlay }: Props) {
  const [active, setActive] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {active ? (
        <iframe
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0`}
          title={title}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setActive(true);
            onPlay?.();
          }}
          className="group absolute inset-0 size-full"
          aria-label={`${playLabel}: ${title}`}
        >
          <SmartImage image={{ url: thumbnail }} alt={title} ratio="aspect-video" sizes="(min-width:1024px) 66vw, 100vw" className="absolute inset-0 size-full" />
          <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/40" />
          <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
            <Play className="size-7 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
