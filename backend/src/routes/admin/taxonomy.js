import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { allow } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { conflict, notFound } from '../../utils/errors.js';
import { idParams, lang, likePattern, uuid } from '../../utils/schemas.js';
import { slugify, uniqueSlug } from '../../utils/slug.js';
import { buildUpdate } from '../../utils/sql.js';

const editors = allow('admin', 'editor');

// ───────────────────────── categories ─────────────────────────

export const categories = Router();

const categoryFields = {
  lang,
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(1).max(80).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  showInNav: z.boolean().optional(),
  translationKey: uuid.nullish(),
};
const CATEGORY_COLUMNS = { name: 'name', slug: 'slug', sortOrder: 'sort_order', showInNav: 'show_in_nav', translationKey: 'translation_key' };
const categoryShape = (r) => ({
  id: r.id,
  lang: r.lang,
  slug: r.slug,
  name: r.name,
  sortOrder: r.sort_order,
  showInNav: r.show_in_nav,
  translationKey: r.translation_key,
  posts: r.posts,
});

categories.get('/', validate({ query: z.object({ lang: lang.optional() }) }), async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, (SELECT count(*)::int FROM posts p WHERE p.category_id = c.id) AS posts
     FROM categories c WHERE ($1::lang_code IS NULL OR c.lang = $1) ORDER BY c.lang, c.sort_order, c.name`,
    [req.valid.query.lang ?? null],
  );
  res.json({ data: rows.map(categoryShape) });
});

categories.post('/', editors, validate({ body: z.object(categoryFields) }), async (req, res) => {
  const b = req.valid.body;
  const slug = b.slug ? slugify(b.slug) : await uniqueSlug({ query }, 'categories', b.lang, slugify(b.name));
  const { rows } = await query(
    `INSERT INTO categories (lang, slug, name, sort_order, show_in_nav, translation_key)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [b.lang, slug, b.name, b.sortOrder ?? 0, b.showInNav ?? true, b.translationKey ?? null],
  );
  res.status(201).json({ data: categoryShape(rows[0]) });
});

categories.patch('/:id', editors, validate({ params: idParams, body: z.object(categoryFields).omit({ lang: true }).partial() }), async (req, res) => {
  const data = { ...req.valid.body };
  if (data.slug !== undefined) data.slug = slugify(data.slug);
  const { sets, values } = buildUpdate(data, CATEGORY_COLUMNS, 2);
  const { rows } = await query(`UPDATE categories SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, [req.valid.params.id, ...values]);
  if (!rows[0]) throw notFound('Category');
  res.json({ data: categoryShape(rows[0]) });
});

categories.delete('/:id', editors, validate({ params: idParams }), async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [req.valid.params.id]);
    if (!rowCount) throw notFound('Category');
  } catch (err) {
    if (err.code === '23503') throw conflict('This category still has posts. Move or delete them first.');
    throw err;
  }
  res.status(204).end();
});

// ───────────────────────── tags ─────────────────────────

export const tags = Router();

const tagFields = { lang, name: z.string().trim().min(2).max(60), slug: z.string().trim().min(1).max(60).optional() };
const tagShape = (r) => ({ id: r.id, lang: r.lang, slug: r.slug, name: r.name });

tags.get('/', validate({ query: z.object({ lang: lang.optional(), q: z.string().trim().min(1).max(60).optional() }) }), async (req, res) => {
  const { lang: l, q } = req.valid.query;
  const { rows } = await query(
    `SELECT * FROM tags WHERE ($1::lang_code IS NULL OR lang = $1) AND ($2::text IS NULL OR name ILIKE $2)
     ORDER BY name LIMIT 200`,
    [l ?? null, q ? likePattern(q) : null],
  );
  res.json({ data: rows.map(tagShape) });
});

// any staff member can create a tag while writing
tags.post('/', validate({ body: z.object(tagFields) }), async (req, res) => {
  const b = req.valid.body;
  const slug = b.slug ? slugify(b.slug) : await uniqueSlug({ query }, 'tags', b.lang, slugify(b.name));
  const { rows } = await query('INSERT INTO tags (lang, slug, name) VALUES ($1,$2,$3) RETURNING *', [b.lang, slug, b.name]);
  res.status(201).json({ data: tagShape(rows[0]) });
});

tags.patch('/:id', editors, validate({ params: idParams, body: z.object(tagFields).omit({ lang: true }).partial() }), async (req, res) => {
  const data = { ...req.valid.body };
  if (data.slug !== undefined) data.slug = slugify(data.slug);
  const { sets, values } = buildUpdate(data, { name: 'name', slug: 'slug' }, 2);
  const { rows } = await query(`UPDATE tags SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, [req.valid.params.id, ...values]);
  if (!rows[0]) throw notFound('Tag');
  res.json({ data: tagShape(rows[0]) });
});

tags.delete('/:id', editors, validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query('DELETE FROM tags WHERE id = $1', [req.valid.params.id]); // links cascade
  if (!rowCount) throw notFound('Tag');
  res.status(204).end();
});
