import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { query, tx } from '../db/pool.js';
import { requireReader } from '../middleware/auth.js';
import { counterLimiter, writeLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  POPULAR_RANGES,
  POST_CARD_COLS,
  POST_CARD_FROM,
  PUBLISHED,
  getPopularPosts,
  getRelatedPosts,
  listPosts,
  shapePostCard,
} from '../services/content.js';
import { badRequest, notFound } from '../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../utils/pagination.js';
import { idParams, lang, likePattern, slugParam, uuid } from '../utils/schemas.js';

const router = Router();

// ───────────────────────── list ─────────────────────────

const listQuery = z.object({
  lang,
  type: z.enum(['news', 'editorial']).default('news'),
  category: z.string().trim().min(1).max(120).optional(),
  tag: z.string().trim().min(1).max(120).optional(),
  q: z.string().trim().min(2).max(100).optional(),
  exclude: uuid.optional(),
  ...paginationShape,
});

router.get('/', validate({ query: listQuery }), async (req, res) => {
  const { lang: l, type, category, tag, q, exclude, page, limit } = req.valid.query;

  // $1 = lang, extra filters start at $2
  const params = [];
  let where = '';
  const add = (value) => {
    params.push(value);
    return `$${params.length + 1}`;
  };
  if (category) where += ` AND c.slug = ${add(category.normalize('NFC'))}`;
  if (tag) {
    where += ` AND EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                           WHERE pt.post_id = p.id AND t.lang = p.lang AND t.slug = ${add(tag.normalize('NFC'))})`;
  }
  if (q) {
    const p = add(likePattern(q));
    where += ` AND (p.title ILIKE ${p} OR p.excerpt ILIKE ${p})`;
  }
  if (exclude) where += ` AND p.id <> ${add(exclude)}`;

  const typeParam = `$${params.length + 2}`;
  const [data, total] = await Promise.all([
    listPosts({ lang: l, type, where, params, limit, offset: offsetOf({ page, limit }) }),
    query(
      `SELECT count(*)::int AS n FROM posts p JOIN categories c ON c.id = p.category_id
       WHERE p.lang = $1 AND p.type = ${typeParam}::post_type AND ${PUBLISHED('p')} ${where}`,
      [l, ...params, type],
    ),
  ]);
  res.json({ data, meta: pageMeta(total.rows[0].n, { page, limit }) });
});

// ───────────────────────── popular (must be before /:slug) ─────────────────────────

router.get(
  '/popular',
  validate({
    query: z.object({
      lang,
      range: z.enum(Object.keys(POPULAR_RANGES)).default('week'),
      limit: z.coerce.number().int().min(1).max(20).default(5),
    }),
  }),
  async (req, res) => {
    const { lang: l, range, limit } = req.valid.query;
    res.json({ data: await getPopularPosts({ lang: l, range, limit }) });
  },
);

// ───────────────────────── single post ─────────────────────────

router.get('/:slug', validate({ params: z.object({ slug: slugParam }), query: z.object({ lang }) }), async (req, res) => {
  const { slug } = req.valid.params;
  const { lang: l } = req.valid.query;

  const { rows } = await query(
    `SELECT ${POST_CARD_COLS}, p.content, p.meta_title, p.meta_description, p.share_count, p.category_id,
            p.translation_key, m.caption AS image_caption
     ${POST_CARD_FROM}
     WHERE p.lang = $1 AND p.slug = $2 AND ${PUBLISHED('p')}`,
    [l, slug],
  );
  const post = rows[0];
  if (!post) throw notFound('Post');

  const [tags, translations] = await Promise.all([
    query(`SELECT t.id, t.slug, t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = $1 ORDER BY t.name`, [post.id]),
    post.translation_key
      ? query(
          `SELECT p.lang, p.slug FROM posts p WHERE p.translation_key = $1 AND p.id <> $2 AND ${PUBLISHED('p')}`,
          [post.translation_key, post.id],
        )
      : { rows: [] },
  ]);

  const [related, popular] = await Promise.all([
    getRelatedPosts({ lang: l, postId: post.id, categoryId: post.category_id, tagIds: tags.rows.map((t) => t.id) }),
    getPopularPosts({ lang: l, range: 'week', limit: 5, excludeId: post.id }),
  ]);

  res.json({
    data: {
      ...shapePostCard(post),
      content: post.content,
      imageCaption: post.image_caption,
      shareCount: post.share_count,
      seo: { title: post.meta_title ?? post.title, description: post.meta_description ?? post.excerpt },
      tags: tags.rows.map(({ slug: s, name }) => ({ slug: s, name })),
      translations: translations.rows, // [{ lang, slug }] - for the language switcher
      related,
      popular,
    },
  });
});

// ───────────────────────── counters ─────────────────────────
// The frontend calls these once per visit/click (it dedupes per session).

router.post('/:id/view', counterLimiter, validate({ params: idParams }), async (req, res) => {
  const { id } = req.valid.params;
  await tx(async (db) => {
    const { rowCount } = await db.query(`UPDATE posts p SET view_count = view_count + 1 WHERE p.id = $1 AND ${PUBLISHED('p')}`, [id]);
    if (!rowCount) throw notFound('Post');
    await db.query(
      `INSERT INTO post_views_daily (post_id, day, views)
       VALUES ($1, (now() AT TIME ZONE $2::text)::date, 1)
       ON CONFLICT (post_id, day) DO UPDATE SET views = post_views_daily.views + 1`,
      [id, env.SITE_TIMEZONE],
    );
  });
  res.status(204).end();
});

router.post('/:id/share', counterLimiter, validate({ params: idParams }), async (req, res) => {
  const { rows } = await query(
    `UPDATE posts p SET share_count = share_count + 1 WHERE p.id = $1 AND ${PUBLISHED('p')} RETURNING share_count`,
    [req.valid.params.id],
  );
  if (!rows[0]) throw notFound('Post');
  res.json({ data: { shareCount: rows[0].share_count } });
});

// ───────────────────────── comments ─────────────────────────

router.get('/:id/comments', validate({ params: idParams }), async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.parent_id, c.body, c.created_at, r.name AS reader_name, r.avatar_url
     FROM comments c JOIN readers r ON r.id = c.reader_id
     WHERE c.post_id = $1 AND c.status = 'approved'
     ORDER BY c.created_at ASC LIMIT 300`,
    [req.valid.params.id],
  );
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      parentId: r.parent_id,
      body: r.body,
      createdAt: r.created_at,
      author: { name: r.reader_name, avatarUrl: r.avatar_url },
    })),
  });
});

const commentBody = z.object({ body: z.string().trim().min(1).max(2000), parentId: uuid.optional() });

router.post('/:id/comments', requireReader, writeLimiter, validate({ params: idParams, body: commentBody }), async (req, res) => {
  const { id: postId } = req.valid.params;
  const { body, parentId } = req.valid.body;

  const post = await query(`SELECT 1 FROM posts p WHERE p.id = $1 AND ${PUBLISHED('p')}`, [postId]);
  if (post.rowCount === 0) throw notFound('Post');

  if (parentId) {
    const parent = await query(`SELECT 1 FROM comments WHERE id = $1 AND post_id = $2 AND status = 'approved'`, [parentId, postId]);
    if (parent.rowCount === 0) throw badRequest('The comment you are replying to does not exist');
  }

  const { rows } = await query(
    `INSERT INTO comments (post_id, reader_id, parent_id, body) VALUES ($1, $2, $3, $4) RETURNING id, status`,
    [postId, req.auth.id, parentId ?? null, body],
  );
  res.status(201).json({ data: { id: rows[0].id, status: rows[0].status, message: 'Your comment is awaiting moderation' } });
});

export default router;
