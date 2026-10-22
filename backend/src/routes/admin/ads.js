import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';
import { badRequest, notFound } from '../../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams, lang, optionalText, uuid } from '../../utils/schemas.js';
import { buildUpdate } from '../../utils/sql.js';

// Editors and admins (enforced in admin/index.js).
const router = Router();

const KIND = z.enum(['banner', 'adsense']);
const PLACEMENT = z.enum(['home_mid', 'home_sidebar', 'article_inline', 'article_bottom', 'listing_top']);

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'Use an http(s) link');

const fields = {
  name: z.string().trim().min(2).max(120),
  kind: KIND,
  placement: PLACEMENT,
  lang: lang.nullish(), // null / missing = both portals
  imageId: uuid.nullish(),
  linkUrl: httpUrl.nullish(),
  altText: optionalText(250),
  adsenseSlot: z
    .string()
    .trim()
    .regex(/^\d{4,20}$/, 'The AdSense ad unit id is a number')
    .nullish(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
};
const createSchema = z.object(fields);
const updateSchema = z.object(fields).partial();

const COLUMNS = {
  name: 'name',
  kind: 'kind',
  placement: 'placement',
  lang: 'lang',
  imageId: 'image_id',
  linkUrl: 'link_url',
  altText: 'alt_text',
  adsenseSlot: 'adsense_slot',
  isActive: 'is_active',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
};

const shape = (r) => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  placement: r.placement,
  lang: r.lang,
  imageId: r.image_id,
  imageUrl: r.image_url ?? null,
  linkUrl: r.link_url,
  altText: r.alt_text,
  adsenseSlot: r.adsense_slot,
  isActive: r.is_active,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  impressions: Number(r.impressions),
  clicks: Number(r.clicks),
  updatedAt: r.updated_at,
});

const SELECT = 'SELECT a.*, m.url AS image_url FROM ads a LEFT JOIN media m ON m.id = a.image_id';

async function getAd(id) {
  const { rows } = await query(`${SELECT} WHERE a.id = $1`, [id]);
  if (!rows[0]) throw notFound('Ad');
  return shape(rows[0]);
}

/** A banner needs an image and a link; an AdSense unit needs its slot id. Checked on the final merged values. */
function assertComplete(a) {
  if (a.kind === 'banner' && (!a.imageId || !a.linkUrl)) throw badRequest('A banner ad needs an image and a link');
  if (a.kind === 'adsense' && !a.adsenseSlot) throw badRequest('An AdSense ad needs the ad unit id');
  if (a.startsAt && a.endsAt && a.endsAt <= a.startsAt) throw badRequest('The end date must be after the start date');
}

router.get(
  '/',
  validate({ query: z.object({ lang: lang.optional(), placement: PLACEMENT.optional(), kind: KIND.optional(), ...paginationShape }) }),
  async (req, res) => {
    const { lang: l, placement, kind, page, limit } = req.valid.query;
    const params = [];
    const conds = [];
    if (l) { params.push(l); conds.push(`(a.lang = $${params.length} OR a.lang IS NULL)`); }
    if (placement) { params.push(placement); conds.push(`a.placement = $${params.length}::ad_placement`); }
    if (kind) { params.push(kind); conds.push(`a.kind = $${params.length}::ad_kind`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [rows, total] = await Promise.all([
      query(`${SELECT} ${where} ORDER BY a.is_active DESC, a.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [
        ...params,
        limit,
        offsetOf({ page, limit }),
      ]),
      query(`SELECT count(*)::int AS n FROM ads a ${where}`, params),
    ]);
    res.json({ data: rows.rows.map(shape), meta: pageMeta(total.rows[0].n, { page, limit }) });
  },
);

router.get('/:id', validate({ params: idParams }), async (req, res) => {
  res.json({ data: await getAd(req.valid.params.id) });
});

router.post('/', validate({ body: createSchema }), async (req, res) => {
  const b = req.valid.body;
  assertComplete(b);
  const { rows } = await query(
    `INSERT INTO ads (name, kind, placement, lang, image_id, link_url, alt_text, adsense_slot, is_active, starts_at, ends_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [
      b.name,
      b.kind,
      b.placement,
      b.lang ?? null,
      b.kind === 'banner' ? (b.imageId ?? null) : null,
      b.kind === 'banner' ? (b.linkUrl ?? null) : null,
      b.altText ?? null,
      b.kind === 'adsense' ? (b.adsenseSlot ?? null) : null,
      b.isActive ?? true,
      b.startsAt ?? null,
      b.endsAt ?? null,
      req.auth.id,
    ],
  );
  res.status(201).json({ data: await getAd(rows[0].id) });
});

router.patch('/:id', validate({ params: idParams, body: updateSchema }), async (req, res) => {
  const { id } = req.valid.params;
  const current = await getAd(id);
  const merged = { ...current, ...req.valid.body };
  merged.startsAt = merged.startsAt ? new Date(merged.startsAt) : null;
  merged.endsAt = merged.endsAt ? new Date(merged.endsAt) : null;
  assertComplete(merged);

  const { sets, values } = buildUpdate(req.valid.body, COLUMNS, 2);
  await query(`UPDATE ads SET ${sets.join(', ')} WHERE id = $1`, [id, ...values]);
  res.json({ data: await getAd(id) });
});

router.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query('DELETE FROM ads WHERE id = $1', [req.valid.params.id]);
  if (!rowCount) throw notFound('Ad');
  res.status(204).end();
});

export default router;
