import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { pool, query, tx } from '../../db/pool.js';
import { allow } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { assertCategoryLang, syncTags } from '../../services/adminHelpers.js';
import { assertCanWrite, resolvePublishedAt } from '../../services/publication.js';
import { badRequest, forbidden, notFound } from '../../utils/errors.js';
import { readMinutes, sanitizeArticle } from '../../utils/html.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams, lang, likePattern, optionalText, uuid } from '../../utils/schemas.js';
import { slugify, uniqueSlug } from '../../utils/slug.js';
import { buildUpdate } from '../../utils/sql.js';

const router = Router();

const STATUS = z.enum(['draft', 'scheduled', 'published', 'archived']);
/** The home page has one hero per language: making a story the hero takes the place from the previous one. */
const clearOtherHeroes = (db, lang, keepId) => db.query('UPDATE posts SET is_hero = false WHERE lang = $1 AND is_hero AND id <> $2', [lang, keepId]);

const order = z.number().int().min(0).max(1000);

const fields = {
  lang,
  type: z.enum(['news', 'editorial']).optional(),
  title: z.string().trim().min(3).max(300),
  slug: z.string().trim().min(1).max(120).optional(),
  excerpt: optionalText(600),
  content: z.string().min(1).max(200_000),
  status: STATUS.optional(),
  featuredImageId: uuid.nullish(),
  categoryId: uuid,
  isHero: z.boolean().optional(),
  isSpotlight: z.boolean().optional(),
  spotlightOrder: order.optional(),
  isFeatured: z.boolean().optional(),
  featuredOrder: order.optional(),
  translationKey: uuid.nullish(),
  metaTitle: optionalText(200),
  metaDescription: optionalText(400),
  publishedAt: z.coerce.date().nullish(),
  tagIds: z.array(uuid).max(20).optional(),
};
const createSchema = z.object(fields);
const updateSchema = z.object(fields).omit({ lang: true }).partial(); // language can't change after creation

// request field -> column (whitelist; column names never come from the client)
const COLUMNS = {
  type: 'type',
  title: 'title',
  slug: 'slug',
  excerpt: 'excerpt',
  content: 'content',
  readMinutes: 'read_minutes',
  status: 'status',
  featuredImageId: 'featured_image_id',
  categoryId: 'category_id',
  isHero: 'is_hero',
  isSpotlight: 'is_spotlight',
  spotlightOrder: 'spotlight_order',
  isFeatured: 'is_featured',
  featuredOrder: 'featured_order',
  translationKey: 'translation_key',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
  publishedAt: 'published_at',
};

const shape = (r) => ({
  id: r.id,
  lang: r.lang,
  type: r.type,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  content: r.content,
  status: r.status,
  featuredImageId: r.featured_image_id,
  featuredImageUrl: r.featured_image_url,
  categoryId: r.category_id,
  authorId: r.author_id,
  authorName: r.author_name,
  isHero: r.is_hero,
  isSpotlight: r.is_spotlight,
  spotlightOrder: r.spotlight_order,
  isFeatured: r.is_featured,
  featuredOrder: r.featured_order,
  translationKey: r.translation_key,
  viewCount: r.view_count,
  shareCount: r.share_count,
  readMinutes: r.read_minutes,
  metaTitle: r.meta_title,
  metaDescription: r.meta_description,
  publishedAt: r.published_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  tagIds: r.tag_ids,
});

async function getPost(id) {
  const { rows } = await query(
    `SELECT p.*, u.name AS author_name, m.url AS featured_image_url,
            ARRAY(SELECT tag_id FROM post_tags WHERE post_id = p.id) AS tag_ids
     FROM posts p JOIN users u ON u.id = p.author_id LEFT JOIN media m ON m.id = p.featured_image_id WHERE p.id = $1`,
    [id],
  );
  if (!rows[0]) throw notFound('Post');
  return shape(rows[0]);
}

const assertPlacementAllowed = (auth, b) => {
  if (auth.role === 'author' && (b.isHero || b.isSpotlight || b.isFeatured)) {
    throw forbidden('Only editors can place stories in hero / spotlight / featured');
  }
};

// ───────────────────────── list ─────────────────────────

router.get(
  '/',
  validate({
    query: z.object({
      lang: lang.optional(),
      status: STATUS.optional(),
      type: z.enum(['news', 'editorial']).optional(),
      q: z.string().trim().min(1).max(100).optional(),
      ...paginationShape,
    }),
  }),
  async (req, res) => {
    const { lang: l, status, type, q, page, limit } = req.valid.query;
    const params = [];
    const conds = [];
    const add = (cond, value) => {
      params.push(value);
      conds.push(cond.replace('?', `$${params.length}`));
    };
    if (l) add('p.lang = ?', l);
    if (status) add('p.status = ?::content_status', status);
    if (type) add('p.type = ?::post_type', type);
    if (q) add('p.title ILIKE ?', likePattern(q));
    if (req.auth.role === 'author') add('p.author_id = ?', req.auth.id); // authors only see their own
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [rows, total] = await Promise.all([
      query(
        `SELECT p.id, p.lang, p.type, p.slug, p.title, p.status, p.published_at, p.updated_at, p.view_count,
                p.is_hero, p.is_spotlight, p.is_featured, c.name AS category_name, u.name AS author_name
         FROM posts p JOIN categories c ON c.id = p.category_id JOIN users u ON u.id = p.author_id
         ${where} ORDER BY p.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offsetOf({ page, limit })],
      ),
      query(`SELECT count(*)::int AS n FROM posts p ${where}`, params),
    ]);

    res.json({
      data: rows.rows.map((r) => ({
        id: r.id,
        lang: r.lang,
        type: r.type,
        slug: r.slug,
        title: r.title,
        status: r.status,
        publishedAt: r.published_at,
        updatedAt: r.updated_at,
        viewCount: r.view_count,
        isHero: r.is_hero,
        isSpotlight: r.is_spotlight,
        isFeatured: r.is_featured,
        categoryName: r.category_name,
        authorName: r.author_name,
      })),
      meta: pageMeta(total.rows[0].n, { page, limit }),
    });
  },
);

router.get('/:id', validate({ params: idParams }), async (req, res) => {
  const post = await getPost(req.valid.params.id);
  if (req.auth.role === 'author' && post.authorId !== req.auth.id) throw forbidden();
  res.json({ data: post });
});

// ───────────────────────── create ─────────────────────────

router.post('/', validate({ body: createSchema }), async (req, res) => {
  const b = req.valid.body;
  const me = req.auth;
  const status = b.status ?? 'draft';

  assertCanWrite(me, { newStatus: status });
  assertPlacementAllowed(me, b);
  const publishedAt = resolvePublishedAt(status, b.publishedAt);
  const content = sanitizeArticle(b.content);

  const id = await tx(async (db) => {
    await assertCategoryLang(db, b.categoryId, b.lang);
    // An explicit slug that already exists is a 409; an auto slug just gets a suffix.
    const slug = b.slug ? slugify(b.slug) : await uniqueSlug(db, 'posts', b.lang, slugify(b.title));
    if (!slug) throw badRequest('Slug is empty after cleanup');

    const { rows } = await db.query(
      `INSERT INTO posts (lang, type, slug, title, excerpt, content, status, featured_image_id, category_id, author_id,
                          is_hero, is_spotlight, spotlight_order, is_featured, featured_order, translation_key,
                          read_minutes, meta_title, meta_description, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
      [
        b.lang, b.type ?? 'news', slug, b.title, b.excerpt ?? null, content, status, b.featuredImageId ?? null, b.categoryId, me.id,
        b.isHero ?? false, b.isSpotlight ?? false, b.spotlightOrder ?? 0, b.isFeatured ?? false, b.featuredOrder ?? 0,
        b.translationKey ?? null, readMinutes(content), b.metaTitle ?? null, b.metaDescription ?? null, publishedAt,
      ],
    );
    await syncTags(db, 'post_tags', rows[0].id, b.lang, b.tagIds ?? []);
    if (b.isHero) await clearOtherHeroes(db, b.lang, rows[0].id);
    return rows[0].id;
  });

  res.status(201).json({ data: await getPost(id) });
});

// ───────────────────────── update ─────────────────────────

router.patch('/:id', validate({ params: idParams, body: updateSchema }), async (req, res) => {
  const { id } = req.valid.params;
  const b = req.valid.body;
  const me = req.auth;

  const {
    rows: [row],
  } = await query('SELECT id, lang, status, author_id, published_at FROM posts WHERE id = $1', [id]);
  if (!row) throw notFound('Post');

  assertCanWrite(me, { existing: row, newStatus: b.status });
  assertPlacementAllowed(me, b);

  const data = { ...b };
  if (b.content !== undefined) {
    data.content = sanitizeArticle(b.content);
    data.readMinutes = readMinutes(data.content);
  }
  if (b.slug !== undefined) {
    data.slug = slugify(b.slug);
    if (!data.slug) throw badRequest('Slug is empty after cleanup');
  }
  if (b.status !== undefined || b.publishedAt !== undefined) {
    data.publishedAt = resolvePublishedAt(b.status ?? row.status, b.publishedAt, row.published_at);
  }

  const hasColumns = Object.keys(COLUMNS).some((k) => data[k] !== undefined);
  if (!hasColumns && b.tagIds === undefined) throw badRequest('No fields to update');

  await tx(async (db) => {
    if (b.categoryId) await assertCategoryLang(db, b.categoryId, row.lang);
    if (hasColumns) {
      const { sets, values } = buildUpdate(data, COLUMNS, 2);
      await db.query(`UPDATE posts SET ${sets.join(', ')} WHERE id = $1`, [id, ...values]);
    }
    if (b.tagIds !== undefined) await syncTags(db, 'post_tags', id, row.lang, b.tagIds);
    if (b.isHero) await clearOtherHeroes(db, row.lang, id);
  });

  res.json({ data: await getPost(id) });
});

// ───────────────────────── delete ─────────────────────────

router.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { id } = req.valid.params;
  const {
    rows: [row],
  } = await query('SELECT id, status, author_id FROM posts WHERE id = $1', [id]);
  if (!row) throw notFound('Post');
  assertCanWrite(req.auth, { existing: row });
  await query('DELETE FROM posts WHERE id = $1', [id]); // tags, views, comments, bookmarks cascade
  res.status(204).end();
});

// ───────────────────────── link a bn post with its en version ─────────────────────────
// Powers the language switcher and the "other portal" section.

router.post('/:id/translation', allow('admin', 'editor'), validate({ params: idParams, body: z.object({ postId: uuid }) }), async (req, res) => {
  const { id } = req.valid.params;
  const { postId } = req.valid.body;
  if (id === postId) throw badRequest('A post cannot be a translation of itself');

  const { rows } = await pool.query('SELECT id, lang, translation_key FROM posts WHERE id = ANY($1::uuid[])', [[id, postId]]);
  if (rows.length !== 2) throw notFound('Post');
  if (rows[0].lang === rows[1].lang) throw badRequest('Translations must be in different languages');

  const key = rows[0].translation_key ?? rows[1].translation_key ?? randomUUID();
  await pool.query('UPDATE posts SET translation_key = $1 WHERE id = ANY($2::uuid[])', [key, [id, postId]]);
  res.json({ data: { translationKey: key } });
});

export default router;
