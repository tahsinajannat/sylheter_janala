import Link from 'next/link';
import type { Lang, PostCard } from '@/lib/api/types';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SmartImage } from './smart-image';
import { StoryMeta } from './story-meta';

export type StoryVariant = 'hero' | 'large' | 'medium' | 'compact' | 'overlay' | 'text' | 'numbered';

interface Props {
  post: PostCard;
  lang: Lang;
  variant?: StoryVariant;
  /** 1-based rank for the `numbered` variant. */
  rank?: number;
  priority?: boolean;
  minReadLabel?: string;
  className?: string;
}

/**
 * One story, several layouts - the home page's spotlight mixes them on purpose so no two slots look alike.
 *   hero     big image above a large headline + excerpt
 *   large    image above headline + excerpt
 *   medium   image above headline
 *   compact  small thumbnail beside headline
 *   overlay  headline over a full-bleed image
 *   text     category + headline + excerpt only
 *   numbered big rank number beside headline (popular lists)
 */
export function StoryCard({ post, lang, variant = 'medium', rank, priority, minReadLabel, className }: Props) {
  const href = routes.post(lang, post.slug);
  const cat = <Badge variant="default" className="rounded-none uppercase tracking-wide">{post.category.name}</Badge>;
  const title = (cls: string) => (
    <h3 className={cn('transition-colors group-hover:text-primary', cls)}>
      <Link href={href} className="after:absolute after:inset-0">
        {post.title}
      </Link>
    </h3>
  );
  const root = 'group relative';

  if (variant === 'overlay') {
    return (
      <article className={cn(root, 'overflow-hidden rounded-xl', className)}>
        <SmartImage image={post.image} alt={post.title} ratio="aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-72" priority={priority} className="lg:absolute lg:inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white sm:p-5">
          {cat}
          {title('text-lg leading-snug font-bold sm:text-xl')}
          <StoryMeta lang={lang} publishedAt={post.publishedAt} className="text-white/75" />
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={cn(root, 'flex gap-3', className)}>
        <div className="w-28 shrink-0 sm:w-32">
          <SmartImage image={post.image} alt={post.title} ratio="aspect-[4/3]" sizes="128px" className="rounded-md" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold text-primary">{post.category.name}</p>
          {title('line-clamp-3 text-sm leading-snug font-semibold sm:text-base')}
          <StoryMeta lang={lang} publishedAt={post.publishedAt} />
        </div>
      </article>
    );
  }

  if (variant === 'numbered') {
    return (
      <article className={cn(root, 'flex items-start gap-3', className)}>
        <span aria-hidden className="w-9 shrink-0 text-4xl leading-none font-bold text-primary/25">
          {rank}
        </span>
        <div className="min-w-0 space-y-1">
          {title('line-clamp-3 leading-snug font-semibold')}
          <StoryMeta lang={lang} publishedAt={post.publishedAt} />
        </div>
      </article>
    );
  }

  if (variant === 'text') {
    return (
      <article className={cn(root, 'space-y-2 border-l-4 border-primary pl-4', className)}>
        <p className="text-xs font-semibold text-primary">{post.category.name}</p>
        {title('text-lg leading-snug font-bold')}
        {post.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
        <StoryMeta lang={lang} publishedAt={post.publishedAt} author={post.author.name} />
      </article>
    );
  }

  const big = variant === 'hero' || variant === 'large';
  return (
    <article className={cn(root, 'space-y-3', className)}>
      <div className="relative overflow-hidden rounded-xl">
        <SmartImage image={post.image} alt={post.title} ratio={variant === 'hero' ? 'aspect-[16/9]' : 'aspect-[3/2]'} sizes={variant === 'hero' ? '(min-width:1024px) 60vw, 100vw' : '(min-width:1024px) 33vw, 100vw'} priority={priority} />
        <span className="absolute top-3 left-3">{cat}</span>
      </div>
      <div className="space-y-2">
        {title(cn('leading-snug font-bold', variant === 'hero' ? 'text-2xl sm:text-3xl' : big ? 'text-xl' : 'text-lg'))}
        {big && post.excerpt && <p className={cn('text-muted-foreground', variant === 'hero' ? 'line-clamp-3 sm:text-lg' : 'line-clamp-2')}>{post.excerpt}</p>}
        <StoryMeta lang={lang} publishedAt={post.publishedAt} author={big ? post.author.name : undefined} readMinutes={post.readMinutes} minReadLabel={minReadLabel} />
      </div>
    </article>
  );
}
