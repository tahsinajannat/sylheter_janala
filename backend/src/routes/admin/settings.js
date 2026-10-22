import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';

// Site settings key/value store - admin only (enforced in admin/index.js).
const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await query('SELECT key, value, updated_at FROM site_settings ORDER BY key');
  res.json({ data: rows.map((r) => ({ key: r.key, value: r.value, updatedAt: r.updated_at })) });
});

router.put(
  '/:key',
  validate({
    params: z.object({ key: z.string().regex(/^[a-z0-9_]{2,64}$/, 'Use lowercase letters, digits and underscores') }),
    body: z.object({ value: z.string().max(2000) }),
  }),
  async (req, res) => {
    const { rows } = await query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING key, value, updated_at`,
      [req.valid.params.key, req.valid.body.value],
    );
    res.json({ data: { key: rows[0].key, value: rows[0].value, updatedAt: rows[0].updated_at } });
  },
);

export default router;
