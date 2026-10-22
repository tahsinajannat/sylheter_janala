import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';
import { assertCategoryLang } from '../../services/adminHelpers.js';
import { assertCanWrite, resolvePublishedAt } from '../../services/publication.js';
import { badRequest, notFound } from '../../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams, lang, optionalText, uuid } from '../../utils/schemas.js';
import { slugify, uniqueSlug } from '../../utils/slug.js';
import { buildUpdate } from '../../utils/sql.js';
import { parseYoutubeId } from '../../utils/youtube.js';

const router = Router();
const STATUS = z.enum(['draft', 'scheduled', 'published', 'archived']);

const youtubeUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => parseYoutubeId(u) !== null, 'Not a valid YouTube video link');

const fields = {
  lang,
  title: z.string().trim().min(2).max(250),
  slug: z.string().trim().min(1).max(120).optional(),
  description: optionalText(5000),
  youtubeUrl,
  status: STATUS.optional(),
  thumbnailId: uuid.nullish(),
  categoryId: uuid.nullish(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.coerce.date().nullish(),
};
const createSchema = z.object(fields);
const updateSchema = z.object(fields).omit({ lang: true }).partial();

const COLUMNS = {
  title: 'title',
  slug: 'slug',
  description: 'description',
  youtubeUrl: 'youtube_url',
  youtubeId: 'youtube_id',
  status: 'status',
  thumbnailId: 'thumbnail_id',
  categoryId: 'category_id',
  isFeatured: 'is_featured',
  publishedAt: 'published_at',
};

const shape = (r) => ({
  id: r.id,
  lang: r.lang,
  slug: r.slug,
  title: r.title,
  description: r.description,
  youtubeUrl: r.youtube_url,
  youtubeId: r.youtube_id,
  status: r.status,
  thumbnailId: r.thumbnail_id,
  thumbnailUrl: r.thumbnail_url,
  categoryId: r.category_id,
  isFeatured: r.is_featured,
  viewCount: r.view_count,
  publishedAt: r.published_at,
  updatedAt: r.updated_at,
});

async function getVideo(id) {
  const { rows } = await query('SELECT v.*, m.url AS thumbnail_url FROM videos v LEFT JOIN media m ON m.id = v.thumbnail_id WHERE v.id = $1', [id]);
  if (!rows[0]) throw notFound('Video');
  return shape(rows[0]);
}

router.get('/', validate({ query: z.object({ lang: lang.optional(), status: STATUS.optional(), ...paginationShape }) }), async (req, res) => {
  const { lang: l, status, page, limit } = req.valid.query;
  const params = [];
  const conds = [];
  if (l) { params.push(l); conds.push(`lang = $${params.length}`); }
  if (status) { params.push(status); conds.push(`status = $${params.length}::content_status`); }
  if (req.auth.role === 'author') { params.push(req.auth.id); conds.push(`author_id = $${params.length}`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows, total] = await Promise.all([
    query(`SELECT * FROM videos ${where} ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [
      ...params,
      limit,
      offsetOf({ page, limit }),
    ]),
    query(`SELECT count(*)::int AS n FROM videos ${where}`, params),
  ]);
  res.json({ data: rows.rows.map(shape), meta: pageMeta(total.rows[0].n, { page, limit }) });
});

router.get('/:id', validate({ params: idParams }), async (req, res) => {
  res.json({ data: await getVideo(req.valid.params.id) });
});

router.post('/', validate({ body: createSchema }), async (req, res) => {
  const b = req.valid.body;
  const status = b.status ?? 'draft';
  assertCanWrite(req.auth, { newStatus: status });
  const publishedAt = resolvePublishedAt(status, b.publishedAt);

  const id = await tx(async (db) => {
    await assertCategoryLang(db, b.categoryId, b.lang);
    const slug = b.slug ? slugify(b.slug) : await uniqueSlug(db, 'videos', b.lang, slugify(b.title));
    if (!slug) throw badRequest('Slug is empty after cleanup');
    const { rows } = await db.query(
      `INSERT INTO videos (lang, slug, title, description, youtube_url, youtube_id, status, thumbnail_id, category_id, author_id, is_featured, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [b.lang, slug, b.title, b.description ?? null, b.youtubeUrl, parseYoutubeId(b.youtubeUrl), status, b.thumbnailId ?? null, b.categoryId ?? null, req.auth.id, b.isFeatured ?? false, publishedAt],
    );
    return rows[0].id;
  });
  res.status(201).json({ data: await getVideo(id) });
});

router.patch('/:id', validate({ params: idParams, body: updateSchema }), async (req, res) => {
  const { id } = req.valid.params;
  const b = req.valid.body;
  const {
    rows: [row],
  } = await query('SELECT id, lang, status, author_id, published_at FROM videos WHERE id = $1', [id]);
  if (!row) throw notFound('Video');
  assertCanWrite(req.auth, { existing: row, newStatus: b.status });

  const data = { ...b };
  if (b.youtubeUrl !== undefined) data.youtubeId = parseYoutubeId(b.youtubeUrl);
  if (b.slug !== undefined) {
    data.slug = slugify(b.slug);
    if (!data.slug) throw badRequest('Slug is empty after cleanup');
  }
  if (b.status !== undefined || b.publishedAt !== undefined) {
    data.publishedAt = resolvePublishedAt(b.status ?? row.status, b.publishedAt, row.published_at);
  }

  await tx(async (db) => {
    if (b.categoryId) await assertCategoryLang(db, b.categoryId, row.lang);
    const { sets, values } = buildUpdate(data, COLUMNS, 2);
    await db.query(`UPDATE videos SET ${sets.join(', ')} WHERE id = $1`, [id, ...values]);
  });
  res.json({ data: await getVideo(id) });
});

router.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { id } = req.valid.params;
  const {
    rows: [row],
  } = await query('SELECT id, status, author_id FROM videos WHERE id = $1', [id]);
  if (!row) throw notFound('Video');
  assertCanWrite(req.auth, { existing: row });
  await query('DELETE FROM videos WHERE id = $1', [id]);
  res.status(204).end();
});

export default router;
