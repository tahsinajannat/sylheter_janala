import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { counterLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { PHOTO_COLS, PHOTO_FROM, PUBLISHED, shapePhotoCard } from '../services/content.js';
import { notFound } from '../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../utils/pagination.js';
import { idParams, lang, slugParam } from '../utils/schemas.js';

const router = Router();

router.get(
  '/',
  validate({ query: z.object({ lang, slider: z.enum(['true']).optional(), ...paginationShape }) }),
  async (req, res) => {
    const { lang: l, slider, page, limit } = req.valid.query;
    const filter = slider ? 'AND pc.is_slider' : '';
    const order = slider ? 'pc.slider_order ASC, pc.published_at DESC' : 'pc.published_at DESC';
    const [rows, total] = await Promise.all([
      query(
        `SELECT ${PHOTO_COLS} ${PHOTO_FROM}
         WHERE pc.lang = $1 AND ${PUBLISHED('pc')} ${filter}
         ORDER BY ${order} LIMIT $2 OFFSET $3`,
        [l, limit, offsetOf({ page, limit })],
      ),
      query(`SELECT count(*)::int AS n FROM photo_cards pc WHERE pc.lang = $1 AND ${PUBLISHED('pc')} ${filter}`, [l]),
    ]);
    res.json({ data: rows.rows.map(shapePhotoCard), meta: pageMeta(total.rows[0].n, { page, limit }) });
  },
);

// Photo card page: the card + related cards (same category / shared tags, then newest)
router.get('/:slug', validate({ params: z.object({ slug: slugParam }), query: z.object({ lang }) }), async (req, res) => {
  const { slug } = req.valid.params;
  const { lang: l } = req.valid.query;

  const { rows } = await query(`SELECT ${PHOTO_COLS} ${PHOTO_FROM} WHERE pc.lang = $1 AND pc.slug = $2 AND ${PUBLISHED('pc')}`, [l, slug]);
  const card = rows[0];
  if (!card) throw notFound('Photo card');

  const tags = await query(
    `SELECT t.id, t.slug, t.name FROM photo_card_tags x JOIN tags t ON t.id = x.tag_id WHERE x.photo_card_id = $1 ORDER BY t.name`,
    [card.id],
  );
  const related = await query(
    `SELECT ${PHOTO_COLS} ${PHOTO_FROM}
     WHERE pc.lang = $1 AND pc.id <> $2 AND ${PUBLISHED('pc')}
     ORDER BY (pc.category_id IS NOT DISTINCT FROM $3::uuid) DESC,
              (SELECT count(*) FROM photo_card_tags x WHERE x.photo_card_id = pc.id AND x.tag_id = ANY($4::uuid[])) DESC,
              pc.published_at DESC
     LIMIT 8`,
    [l, card.id, card.category_id, tags.rows.map((t) => t.id)],
  );

  res.json({
    data: {
      ...shapePhotoCard(card),
      tags: tags.rows.map(({ slug: s, name }) => ({ slug: s, name })),
      related: related.rows.map(shapePhotoCard),
    },
  });
});

router.post('/:id/view', counterLimiter, validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query(`UPDATE photo_cards pc SET view_count = view_count + 1 WHERE pc.id = $1 AND ${PUBLISHED('pc')}`, [req.valid.params.id]);
  if (!rowCount) throw notFound('Photo card');
  res.status(204).end();
});

export default router;
