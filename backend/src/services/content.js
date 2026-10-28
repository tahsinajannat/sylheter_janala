/**
 * Shared read queries + response shapes for public content.
 * Everything here only returns PUBLISHED content (status = published and
 * published_at already in the past).
 */
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { youtubeEmbed, youtubeThumbnail } from '../utils/youtube.js';

export const PUBLISHED = (alias) => `${alias}.status = 'published' AND ${alias}.published_at <= now()`;

// ───────────────────────── posts ─────────────────────────

export const POST_CARD_COLS = `
  p.id, p.lang, p.type, p.slug, p.title, p.excerpt, p.published_at, p.view_count, p.read_minutes,
  c.slug AS category_slug, c.name AS category_name,
  u.name AS author_name,
  m.url AS image_url, m.alt AS image_alt, m.width AS image_width, m.height AS image_height`;

export const POST_CARD_FROM = `
  FROM posts p
  JOIN categories c ON c.id = p.category_id
  JOIN users u ON u.id = p.author_id
  LEFT JOIN media m ON m.id = p.featured_image_id`;

const image = (r) => (r.image_url ? { url: r.image_url, alt: r.image_alt, width: r.image_width, height: r.image_height } : null);

export const shapePostCard = (r) => ({
  id: r.id,
  lang: r.lang,
  type: r.type,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  publishedAt: r.published_at,
  viewCount: r.view_count,
  readMinutes: r.read_minutes,
  category: { slug: r.category_slug, name: r.category_name },
  author: { name: r.author_name },
  image: image(r),
});

/** Latest published posts with optional extra WHERE (must use $-params after $1=lang). */
/** `type: null` lists news and editorials together. */
export async function listPosts({ lang, type = 'news', where = '', params = [], orderBy = 'p.published_at DESC', limit, offset = 0 }) {
  const base = params.length + 1;
  const { rows } = await query(
    `SELECT ${POST_CARD_COLS} ${POST_CARD_FROM}
     WHERE p.lang = $1 AND ($${base + 1}::post_type IS NULL OR p.type = $${base + 1}::post_type) AND ${PUBLISHED('p')} ${where}
     ORDER BY ${orderBy}
     LIMIT $${base + 2} OFFSET $${base + 3}`,
    [lang, ...params, type, limit, offset],
  );
  return rows.map(shapePostCard);
}

// "most popular" windows, counted in whole days including today
export const POPULAR_RANGES = { day: 0, week: 6, month: 29 };

export async function getPopularPosts({ lang, range = 'week', limit = 5, excludeId = null }) {
  const days = POPULAR_RANGES[range] ?? POPULAR_RANGES.week;
  const { rows } = await query(
    `WITH scores AS (
       SELECT post_id, SUM(views)::int AS score
       FROM post_views_daily
       WHERE day >= (now() AT TIME ZONE $4::text)::date - $2::int
       GROUP BY post_id
     )
     SELECT ${POST_CARD_COLS} ${POST_CARD_FROM}
     JOIN scores s ON s.post_id = p.id
     WHERE p.lang = $1 AND p.type = 'news' AND ${PUBLISHED('p')} AND ($3::uuid IS NULL OR p.id <> $3)
     ORDER BY s.score DESC, p.published_at DESC
     LIMIT $5`,
    [lang, days, excludeId, env.SITE_TIMEZONE, limit],
  );

  // Quiet period (new site / few views): top up with all-time most viewed.
  if (rows.length < limit) {
    const { rows: more } = await query(
      `SELECT ${POST_CARD_COLS} ${POST_CARD_FROM}
       WHERE p.lang = $1 AND p.type = 'news' AND ${PUBLISHED('p')}
         AND ($2::uuid IS NULL OR p.id <> $2) AND NOT (p.id = ANY($3::uuid[]))
       ORDER BY p.view_count DESC, p.published_at DESC
       LIMIT $4`,
      [lang, excludeId, rows.map((r) => r.id), limit - rows.length],
    );
    rows.push(...more);
  }
  return rows.map(shapePostCard);
}

/** Same category first, then shared tags, newest first. */
export async function getRelatedPosts({ lang, postId, categoryId, tagIds, limit = 4 }) {
  const { rows } = await query(
    `SELECT ${POST_CARD_COLS} ${POST_CARD_FROM}
     WHERE p.lang = $1 AND p.type = 'news' AND ${PUBLISHED('p')} AND p.id <> $2
       AND (p.category_id = $3 OR EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ANY($4::uuid[])))
     ORDER BY (p.category_id = $3) DESC,
              (SELECT count(*) FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ANY($4::uuid[])) DESC,
              p.published_at DESC
     LIMIT $5`,
    [lang, postId, categoryId, tagIds, limit],
  );
  return rows.map(shapePostCard);
}

// ───────────────────────── photo cards ─────────────────────────

export const PHOTO_COLS = `
  pc.id, pc.lang, pc.slug, pc.title, pc.caption, pc.photographer, pc.published_at, pc.view_count, pc.category_id,
  c.slug AS category_slug, c.name AS category_name,
  m.url AS image_url, m.alt AS image_alt, m.width AS image_width, m.height AS image_height`;

export const PHOTO_FROM = `
  FROM photo_cards pc
  JOIN media m ON m.id = pc.image_id
  LEFT JOIN categories c ON c.id = pc.category_id`;

export const shapePhotoCard = (r) => ({
  id: r.id,
  lang: r.lang,
  slug: r.slug,
  title: r.title,
  caption: r.caption,
  photographer: r.photographer,
  publishedAt: r.published_at,
  viewCount: r.view_count,
  category: r.category_slug ? { slug: r.category_slug, name: r.category_name } : null,
  image: image(r),
});

// ───────────────────────── videos ─────────────────────────

export const VIDEO_COLS = `
  v.id, v.lang, v.slug, v.title, v.description, v.youtube_id, v.youtube_url, v.published_at, v.view_count, v.is_featured,
  v.category_id, c.slug AS category_slug, c.name AS category_name,
  m.url AS image_url, m.alt AS image_alt, m.width AS image_width, m.height AS image_height`;

export const VIDEO_FROM = `
  FROM videos v
  LEFT JOIN categories c ON c.id = v.category_id
  LEFT JOIN media m ON m.id = v.thumbnail_id`;

export const shapeVideo = (r) => ({
  id: r.id,
  lang: r.lang,
  slug: r.slug,
  title: r.title,
  description: r.description,
  youtubeId: r.youtube_id,
  youtubeUrl: r.youtube_url,
  embedUrl: youtubeEmbed(r.youtube_id),
  thumbnail: r.image_url ?? youtubeThumbnail(r.youtube_id),
  isFeatured: r.is_featured,
  publishedAt: r.published_at,
  viewCount: r.view_count,
  category: r.category_slug ? { slug: r.category_slug, name: r.category_name } : null,
});

export const otherLang = (lang) => (lang === 'bn' ? 'en' : 'bn');
