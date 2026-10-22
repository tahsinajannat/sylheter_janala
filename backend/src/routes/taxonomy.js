import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { PUBLISHED } from '../services/content.js';
import { lang } from '../utils/schemas.js';

// Public read-only taxonomy + settings. (Admin CRUD lives in routes/admin.)

export const categoriesRouter = Router();
export const tagsRouter = Router();
export const settingsRouter = Router();

categoriesRouter.get('/', validate({ query: z.object({ lang }) }), async (req, res) => {
  const { rows } = await query(
    `SELECT id, slug, name, sort_order, show_in_nav, translation_key
     FROM categories WHERE lang = $1 ORDER BY sort_order, name`,
    [req.valid.query.lang],
  );
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      sortOrder: r.sort_order,
      showInNav: r.show_in_nav,
      translationKey: r.translation_key,
    })),
  });
});

// Tags with how many published posts use them (for a tag cloud / filter)
tagsRouter.get('/', validate({ query: z.object({ lang }) }), async (req, res) => {
  const { rows } = await query(
    `SELECT t.slug, t.name, count(p.id)::int AS posts
     FROM tags t
     LEFT JOIN post_tags pt ON pt.tag_id = t.id
     LEFT JOIN posts p ON p.id = pt.post_id AND ${PUBLISHED('p')}
     WHERE t.lang = $1
     GROUP BY t.id
     ORDER BY posts DESC, t.name
     LIMIT 60`,
    [req.valid.query.lang],
  );
  res.json({ data: rows });
});

// Only keys meant for the public site (portal links, names, social links).
const PUBLIC_KEY = /^(bn_portal_url|en_portal_url|site_.+|social_.+)$/;

settingsRouter.get('/', async (_req, res) => {
  const { rows } = await query('SELECT key, value FROM site_settings ORDER BY key');
  res.json({ data: Object.fromEntries(rows.filter((r) => PUBLIC_KEY.test(r.key)).map((r) => [r.key, r.value])) });
});
