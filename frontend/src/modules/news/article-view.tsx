import Link from 'next/link';
import { Eye, Languages } from 'lucide-react';
import type { Lang, PostDetail } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SectionHeading, SmartImage, StoryCard } from '@/components/common';
import type { Dictionary } from '@/lib/i18n/dictionaries/en';
import { OTHER_LANG } from '@/lib/i18n/config';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import { routes } from '@/lib/routes';
import { absoluteUrl } from '@/lib/site';
import { SetAlternates } from '@/modules/layout';
import { BookmarkButton } from './bookmark-button';
import { CommentsSection } from './comments-section';
import { ShareButtons } from './share-buttons';
import { ViewTracker } from './view-tracker';

/**
 * Single news page, one column:
 * date · category · title · author · featured image · body · tags · share · related · most popular · comments.
 */
export function ArticleView({ post, lang, t }: { post: PostDetail; lang: Lang; t: Dictionary }) {
  const other = OTHER_LANG[lang];
  const translation = post.translations.find((x) => x.lang === other);
  const url = absoluteUrl(routes.post(lang, post.slug));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.author.name },
    image: post.image?.url,
    inLanguage: lang,
    mainEntityOfPage: url,
  };

  return (
    <article className="mx-auto max-w-3xl">
      <ViewTracker postId={post.id} />
      {translation && <SetAlternates paths={{ [other]: `/news/${encodeURIComponent(translation.slug)}` }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, lang)}</time>
          <Link href={routes.category(lang, post.category.slug)}>
            <Badge className="rounded-none uppercase tracking-wide">{post.category.name}</Badge>
          </Link>
        </div>
        <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3 text-sm">
          <p>
            <span className="text-muted-foreground">{t.article.by} </span>
            <strong>{post.author.name}</strong>
            {post.readMinutes ? <span className="text-muted-foreground"> · {formatNumber(post.readMinutes, lang)} {t.article.minRead}</span> : null}
          </p>
          <p className="inline-flex items-center gap-1 text-muted-foreground">
            <Eye className="size-4" /> {formatNumber(post.viewCount, lang)} {t.article.views}
          </p>
        </div>
        {translation && (
          <Link href={routes.post(other, translation.slug)} hrefLang={other} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <Languages className="size-4" /> {t.article.readInOtherLanguage}
          </Link>
        )}
      </header>

      {post.image && (
        <figure className="my-6">
          <SmartImage image={post.image} alt={post.title} ratio="aspect-[16/9]" sizes="(min-width:768px) 768px, 100vw" priority className="rounded-xl" />
          {post.imageCaption && <figcaption className="mt-2 text-sm text-muted-foreground">{post.imageCaption}</figcaption>}
        </figure>
      )}

      {/* HTML is sanitised by the API on save (sanitize-html allow-list) */}
      <div className="prose-article mt-6" dangerouslySetInnerHTML={{ __html: post.content }} />

      {post.tags.length > 0 && (
        <section className="mt-8" aria-label={t.article.tags}>
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag.slug}>
                <Link href={routes.tag(lang, tag.slug)}>
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    #{tag.name}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
        <ShareButtons postId={post.id} url={url} title={post.title} initialCount={post.shareCount} />
        <BookmarkButton postId={post.id} />
      </div>

      {post.related.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={t.article.related} />
          <div className="grid gap-6 sm:grid-cols-2">
            {post.related.slice(0, 4).map((p) => (
              <StoryCard key={p.id} post={p} lang={lang} variant="medium" />
            ))}
          </div>
        </section>
      )}

      {post.popular.length > 0 && (
        <section className="mt-12">
          <SectionHeading title={t.article.popular} />
          <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {post.popular.slice(0, 6).map((p, i) => (
              <li key={p.id}>
                <StoryCard post={p} lang={lang} variant="numbered" rank={i + 1} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <Separator className="my-12" />
      <CommentsSection postId={post.id} />
    </article>
  );
}
