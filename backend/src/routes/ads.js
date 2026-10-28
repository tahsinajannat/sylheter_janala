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
  const [{ rows }, setting] = await Promise.all([
    query(
      `SELECT a.*, m.url AS image_url, m.width AS image_width, m.height AS image_height
       FROM ads a LEFT JOIN media m ON m.id = a.image_id
       WHERE (a.lang IS NULL OR a.lang = $1) AND ${LIVE('a')} AND ${SERVABLE('a')}
       ORDER BY a.created_at`,
      [req.valid.query.lang],
    ),
    query("SELECT value FROM site_settings WHERE key = 'site_adsense_client'"),
  ]);
  // AdSense ads are only served when the site has a well-formed publisher id.
  const client = /^ca-pub-\d+$/.test(setting.rows[0]?.value ?? '') ? setting.rows[0].value : null;
  // Schedules are decided by the database clock at this moment, so the answer must never come from a cache.
  res.set('Cache-Control', 'no-store');
  res.json({ data: rows.filter((r) => r.kind !== 'adsense' || client).map((r) => shapePublicAd(r, client)) });
});

const counter = (column) => async (req, res) => {
  const { rowCount } = await query(`UPDATE ads a SET ${column} = ${column} + 1 WHERE a.id = $1 AND ${LIVE('a')}`, [req.valid.params.id]);
  if (!rowCount) throw notFound('Ad');
  res.status(204).end();
};

router.post('/:id/impression', counterLimiter, validate({ params: idParams }), counter('impressions'));
router.post('/:id/click', counterLimiter, validate({ params: idParams }), counter('clicks'));

export default router;
