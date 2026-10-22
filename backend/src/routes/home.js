import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import {
  PHOTO_COLS,
  PHOTO_FROM,
  PUBLISHED,
  VIDEO_COLS,
  VIDEO_FROM,
  listPosts,
  otherLang,
  shapePhotoCard,
  shapeVideo,
} from '../services/content.js';
import { lang } from '../utils/schemas.js';

const router = Router();

/**
 * One call for the whole home page.
 *
 * Sections: hero, spotlight (3-4 posts, `position` lets the frontend vary card layouts),
 * featured, latest, otherLanguage (latest from the other portal + its URL),
 * photoCards (slider), editorials, videos.
 */
router.get('/', validate({ query: z.object({ lang }) }), async (req, res) => {
  const { lang: l } = req.valid.query;
  const other = otherLang(l);

  const [heroRows, spotlight, featured, latest, otherNews, photos, editorials, videos, portal] = await Promise.all([
    listPosts({ lang: l, where: 'AND p.is_hero', limit: 1 }),
    listPosts({ lang: l, where: 'AND p.is_spotlight', orderBy: 'p.spotlight_order ASC, p.published_at DESC', limit: 4 }),
    listPosts({ lang: l, where: 'AND p.is_featured', orderBy: 'p.featured_order ASC, p.published_at DESC', limit: 6 }),
    listPosts({ lang: l, limit: 8 }),
    listPosts({ lang: other, limit: 5 }),
    query(
      `SELECT ${PHOTO_COLS} ${PHOTO_FROM}
       WHERE pc.lang = $1 AND ${PUBLISHED('pc')} AND pc.is_slider
       ORDER BY pc.slider_order ASC, pc.published_at DESC LIMIT 10`,
      [l],
    ),
    listPosts({ lang: l, type: 'editorial', limit: 4 }),
    query(
      `SELECT ${VIDEO_COLS} ${VIDEO_FROM}
       WHERE v.lang = $1 AND ${PUBLISHED('v')}
       ORDER BY v.is_featured DESC, v.published_at DESC LIMIT 4`,
      [l],
    ),
    query('SELECT value FROM site_settings WHERE key = $1', [`${other}_portal_url`]),
  ]);

  res.json({
    data: {
      lang: l,
      hero: heroRows[0] ?? latest[0] ?? null,
      spotlight: spotlight.map((p, i) => ({ ...p, position: i + 1 })),
      featured,
      latest,
      otherLanguage: { lang: other, portalUrl: portal.rows[0]?.value ?? null, posts: otherNews },
      photoCards: photos.rows.map(shapePhotoCard),
      editorials,
      videos: videos.rows.map(shapeVideo),
    },
  });
});

export default router;
