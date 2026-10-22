import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireReader } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { POST_CARD_COLS, POST_CARD_FROM, PUBLISHED, shapePostCard } from '../services/content.js';
import { notFound } from '../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../utils/pagination.js';
import { uuid } from '../utils/schemas.js';

const router = Router();
router.use(requireReader);

router.get('/', validate({ query: z.object(paginationShape) }), async (req, res) => {
  const { page, limit } = req.valid.query;
  const [rows, total] = await Promise.all([
    query(
      `SELECT ${POST_CARD_COLS} ${POST_CARD_FROM}
       JOIN bookmarks b ON b.post_id = p.id
       WHERE b.reader_id = $1 AND ${PUBLISHED('p')}
       ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
      [req.auth.id, limit, offsetOf({ page, limit })],
    ),
    query('SELECT count(*)::int AS n FROM bookmarks WHERE reader_id = $1', [req.auth.id]),
  ]);
  res.json({ data: rows.rows.map(shapePostCard), meta: pageMeta(total.rows[0].n, { page, limit }) });
});

router.put('/:postId', validate({ params: z.object({ postId: uuid }) }), async (req, res) => {
  const { postId } = req.valid.params;
  const post = await query(`SELECT 1 FROM posts p WHERE p.id = $1 AND ${PUBLISHED('p')}`, [postId]);
  if (post.rowCount === 0) throw notFound('Post');
  await query('INSERT INTO bookmarks (reader_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.auth.id, postId]);
  res.status(204).end();
});

router.delete('/:postId', validate({ params: z.object({ postId: uuid }) }), async (req, res) => {
  await query('DELETE FROM bookmarks WHERE reader_id = $1 AND post_id = $2', [req.auth.id, req.valid.params.postId]);
  res.status(204).end();
});

export default router;
