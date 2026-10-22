import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';
import { notFound } from '../../utils/errors.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams } from '../../utils/schemas.js';

const router = Router();
const STATUS = z.enum(['pending', 'approved', 'rejected', 'spam']);

// moderation queue (default: pending)
router.get('/', validate({ query: z.object({ status: STATUS.default('pending'), ...paginationShape }) }), async (req, res) => {
  const { status, page, limit } = req.valid.query;
  const [rows, total] = await Promise.all([
    query(
      `SELECT c.id, c.body, c.status, c.created_at, c.parent_id,
              p.id AS post_id, p.title AS post_title, p.lang AS post_lang,
              r.id AS reader_id, r.name AS reader_name, r.email AS reader_email
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       JOIN readers r ON r.id = c.reader_id
       WHERE c.status = $1::comment_status
       ORDER BY c.created_at ASC LIMIT $2 OFFSET $3`,
      [status, limit, offsetOf({ page, limit })],
    ),
    query('SELECT count(*)::int AS n FROM comments WHERE status = $1::comment_status', [status]),
  ]);
  res.json({
    data: rows.rows.map((r) => ({
      id: r.id,
      body: r.body,
      status: r.status,
      parentId: r.parent_id,
      createdAt: r.created_at,
      post: { id: r.post_id, title: r.post_title, lang: r.post_lang },
      reader: { id: r.reader_id, name: r.reader_name, email: r.reader_email },
    })),
    meta: pageMeta(total.rows[0].n, { page, limit }),
  });
});

router.patch('/:id', validate({ params: idParams, body: z.object({ status: STATUS }) }), async (req, res) => {
  const { rows } = await query('UPDATE comments SET status = $2::comment_status WHERE id = $1 RETURNING id, status', [
    req.valid.params.id,
    req.valid.body.status,
  ]);
  if (!rows[0]) throw notFound('Comment');
  res.json({ data: rows[0] });
});

router.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query('DELETE FROM comments WHERE id = $1', [req.valid.params.id]); // replies cascade
  if (!rowCount) throw notFound('Comment');
  res.status(204).end();
});

export default router;
