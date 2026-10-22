import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { counterLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { PUBLISHED, VIDEO_COLS, VIDEO_FROM, shapeVideo } from '../services/content.js';
import { notFound } from '../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../utils/pagination.js';
import { idParams, lang, slugParam } from '../utils/schemas.js';

const router = Router();

router.get('/', validate({ query: z.object({ lang, ...paginationShape }) }), async (req, res) => {
  const { lang: l, page, limit } = req.valid.query;
  const [rows, total] = await Promise.all([
    query(
      `SELECT ${VIDEO_COLS} ${VIDEO_FROM}
       WHERE v.lang = $1 AND ${PUBLISHED('v')}
       ORDER BY v.published_at DESC LIMIT $2 OFFSET $3`,
      [l, limit, offsetOf({ page, limit })],
    ),
    query(`SELECT count(*)::int AS n FROM videos v WHERE v.lang = $1 AND ${PUBLISHED('v')}`, [l]),
  ]);
  res.json({ data: rows.rows.map(shapeVideo), meta: pageMeta(total.rows[0].n, { page, limit }) });
});

// Video page: the video + related videos (same category first, then newest)
router.get('/:slug', validate({ params: z.object({ slug: slugParam }), query: z.object({ lang }) }), async (req, res) => {
  const { slug } = req.valid.params;
  const { lang: l } = req.valid.query;

  const { rows } = await query(`SELECT ${VIDEO_COLS} ${VIDEO_FROM} WHERE v.lang = $1 AND v.slug = $2 AND ${PUBLISHED('v')}`, [l, slug]);
  const video = rows[0];
  if (!video) throw notFound('Video');

  const related = await query(
    `SELECT ${VIDEO_COLS} ${VIDEO_FROM}
     WHERE v.lang = $1 AND v.id <> $2 AND ${PUBLISHED('v')}
     ORDER BY (v.category_id IS NOT DISTINCT FROM $3::uuid) DESC, v.published_at DESC
     LIMIT 8`,
    [l, video.id, video.category_id],
  );

  res.json({ data: { ...shapeVideo(video), related: related.rows.map(shapeVideo) } });
});

router.post('/:id/view', counterLimiter, validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query(`UPDATE videos v SET view_count = view_count + 1 WHERE v.id = $1 AND ${PUBLISHED('v')}`, [req.valid.params.id]);
  if (!rowCount) throw notFound('Video');
  res.status(204).end();
});

export default router;
