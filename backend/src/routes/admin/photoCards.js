import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';
import { assertCategoryLang, syncTags } from '../../services/adminHelpers.js';
import { assertCanWrite, resolvePublishedAt } from '../../services/publication.js';
import { badRequest, notFound } from '../../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams, lang, optionalText, uuid } from '../../utils/schemas.js';
import { slugify, uniqueSlug } from '../../utils/slug.js';
import { buildUpdate } from '../../utils/sql.js';

const router = Router();
const STATUS = z.enum(['draft', 'scheduled', 'published', 'archived']);

const fields = {
  lang,
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(1).max(120).optional(),
  caption: optionalText(1000),
  photographer: optionalText(120),
  status: STATUS.optional(),
  imageId: uuid,
  categoryId: uuid.nullish(),
  isSlider: z.boolean().optional(),
  sliderOrder: z.number().int().min(0).max(1000).optional(),
  publishedAt: z.coerce.date().nullish(),
  tagIds: z.array(uuid).max(20).optional(),
};
const createSchema = z.object(fields);
const updateSchema = z.object(fields).omit({ lang: true }).partial();

const COLUMNS = {
  title: 'title',
  slug: 'slug',
  caption: 'caption',
  photographer: 'photographer',
  status: 'status',
  imageId: 'image_id',
  categoryId: 'category_id',
  isSlider: 'is_slider',
  sliderOrder: 'slider_order',
  publishedAt: 'published_at',
};

const shape = (r) => ({
  id: r.id,
  lang: r.lang,
  slug: r.slug,
  title: r.title,
  caption: r.caption,
  photographer: r.photographer,
  status: r.status,
  imageId: r.image_id,
  imageUrl: r.image_url,
  categoryId: r.category_id,
  isSlider: r.is_slider,
  sliderOrder: r.slider_order,
  viewCount: r.view_count,
  publishedAt: r.published_at,
  updatedAt: r.updated_at,
  tagIds: r.tag_ids,
});

async function getCard(id) {
  const { rows } = await query(
    `SELECT pc.*, m.url AS image_url, ARRAY(SELECT tag_id FROM photo_card_tags WHERE photo_card_id = pc.id) AS tag_ids
     FROM photo_cards pc JOIN media m ON m.id = pc.image_id WHERE pc.id = $1`,
    [id],
  );
  if (!rows[0]) throw notFound('Photo card');
  return shape(rows[0]);
}

router.get('/', validate({ query: z.object({ lang: lang.optional(), status: STATUS.optional(), ...paginationShape }) }), async (req, res) => {
  const { lang: l, status, page, limit } = req.valid.query;
  const params = [];
  const conds = [];
  if (l) { params.push(l); conds.push(`pc.lang = $${params.length}`); }
  if (status) { params.push(status); conds.push(`pc.status = $${params.length}::content_status`); }
  if (req.auth.role === 'author') { params.push(req.auth.id); conds.push(`pc.author_id = $${params.length}`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows, total] = await Promise.all([
    query(
      `SELECT pc.*, m.url AS image_url, ARRAY[]::uuid[] AS tag_ids
       FROM photo_cards pc JOIN media m ON m.id = pc.image_id ${where}
       ORDER BY pc.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offsetOf({ page, limit })],
    ),
    query(`SELECT count(*)::int AS n FROM photo_cards pc ${where}`, params),
  ]);
  res.json({ data: rows.rows.map(shape), meta: pageMeta(total.rows[0].n, { page, limit }) });
});

router.get('/:id', validate({ params: idParams }), async (req, res) => {
  res.json({ data: await getCard(req.valid.params.id) });
});

router.post('/', validate({ body: createSchema }), async (req, res) => {
  const b = req.valid.body;
  const status = b.status ?? 'draft';
  assertCanWrite(req.auth, { newStatus: status });
  const publishedAt = resolvePublishedAt(status, b.publishedAt);

  const id = await tx(async (db) => {
    await assertCategoryLang(db, b.categoryId, b.lang);
    const slug = b.slug ? slugify(b.slug) : await uniqueSlug(db, 'photo_cards', b.lang, slugify(b.title));
    if (!slug) throw badRequest('Slug is empty after cleanup');
    const { rows } = await db.query(
      `INSERT INTO photo_cards (lang, slug, title, caption, photographer, status, image_id, category_id, author_id, is_slider, slider_order, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [b.lang, slug, b.title, b.caption ?? null, b.photographer ?? null, status, b.imageId, b.categoryId ?? null, req.auth.id, b.isSlider ?? true, b.sliderOrder ?? 0, publishedAt],
    );
    await syncTags(db, 'photo_card_tags', rows[0].id, b.lang, b.tagIds ?? []);
    return rows[0].id;
  });
  res.status(201).json({ data: await getCard(id) });
});

router.patch('/:id', validate({ params: idParams, body: updateSchema }), async (req, res) => {
  const { id } = req.valid.params;
  const b = req.valid.body;
  const {
    rows: [row],
  } = await query('SELECT id, lang, status, author_id, published_at FROM photo_cards WHERE id = $1', [id]);
  if (!row) throw notFound('Photo card');
  assertCanWrite(req.auth, { existing: row, newStatus: b.status });

  const data = { ...b };
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
      await db.query(`UPDATE photo_cards SET ${sets.join(', ')} WHERE id = $1`, [id, ...values]);
    }
    if (b.tagIds !== undefined) await syncTags(db, 'photo_card_tags', id, row.lang, b.tagIds);
  });
  res.json({ data: await getCard(id) });
});

router.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { id } = req.valid.params;
  const {
    rows: [row],
  } = await query('SELECT id, status, author_id FROM photo_cards WHERE id = $1', [id]);
  if (!row) throw notFound('Photo card');
  assertCanWrite(req.auth, { existing: row });
  await query('DELETE FROM photo_cards WHERE id = $1', [id]);
  res.status(204).end();
});

export default router;
