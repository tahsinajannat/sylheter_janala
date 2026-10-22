import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { counterLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { LIVE, SERVABLE, shapePublicAd } from '../services/ads.js';
import { notFound } from '../utils/errors.js';
import { idParams, lang } from '../utils/schemas.js';

const router = Router();

// Every ad that may be shown to this language right now. The site picks one per slot.
router.get('/', validate({ query: z.object({ lang }) }), async (req, res) => {
  const { rows } = await query(
    `SELECT a.*, m.url AS image_url, m.width AS image_width, m.height AS image_height
     FROM ads a LEFT JOIN media m ON m.id = a.image_id
     WHERE (a.lang IS NULL OR a.lang = $1) AND ${LIVE('a')} AND ${SERVABLE('a')}
     ORDER BY a.created_at`,
    [req.valid.query.lang],
  );
  res.json({ data: rows.map(shapePublicAd) });
});

const counter = (column) => async (req, res) => {
  const { rowCount } = await query(`UPDATE ads a SET ${column} = ${column} + 1 WHERE a.id = $1 AND ${LIVE('a')}`, [req.valid.params.id]);
  if (!rowCount) throw notFound('Ad');
  res.status(204).end();
};

router.post('/:id/impression', counterLimiter, validate({ params: idParams }), counter('impressions'));
router.post('/:id/click', counterLimiter, validate({ params: idParams }), counter('clicks'));

export default router;
