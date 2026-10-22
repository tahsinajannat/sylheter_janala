import Image from 'next/image';
import type { Image as ApiImage } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const OPTIMIZED_HOSTS = ['res.cloudinary.com', 'picsum.photos', 'img.youtube.com', 'i.ytimg.com'];

function canOptimize(url: string) {
  try {
    return OPTIMIZED_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

interface Props {
  image?: Pick<ApiImage, 'url' | 'alt'> | null;
  /** Fallback alt text (usually the story title). */
  alt: string;
  /** Tailwind aspect class, e.g. `aspect-[16/9]`. */
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/** Responsive image in a fixed-ratio box. Missing image -> neutral placeholder; unknown hosts are served as-is. */
export function SmartImage({ image, alt, ratio = 'aspect-[16/9]', sizes = '(min-width:1024px) 33vw, 100vw', priority, className, imgClassName }: Props) {
  return (
    <div className={cn('relative w-full overflow-hidden bg-muted', ratio, className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt || alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!canOptimize(image.url)}
          className={cn('object-cover transition-transform duration-500 group-hover:scale-105', imgClassName)}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-navy/90 to-navy/60" />
      )}
    </div>
  );
}
