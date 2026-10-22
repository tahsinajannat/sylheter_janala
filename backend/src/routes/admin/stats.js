import { Router } from 'express';
import { query } from '../../db/pool.js';

// Dashboard numbers. Authors only see their own content; editors/admins see everything.
const router = Router();

const countByStatus = async (table, authorId) => {
  const { rows } = await query(
    `SELECT status, count(*)::int AS n FROM ${table} WHERE ($1::uuid IS NULL OR author_id = $1) GROUP BY status`,
    [authorId],
  );
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
};

router.get('/', async (req, res) => {
  const mine = req.auth.role === 'author' ? req.auth.id : null;
  const staff = !mine;

  const [posts, photoCards, videos, topPosts, series, totals, pendingComments, subscribers, recent] = await Promise.all([
    countByStatus('posts', mine),
    countByStatus('photo_cards', mine),
    countByStatus('videos', mine),
    query(
      `SELECT p.id, p.title, p.lang, sum(v.views)::int AS views
       FROM post_views_daily v JOIN posts p ON p.id = v.post_id
       WHERE v.day >= current_date - 6 AND ($1::uuid IS NULL OR p.author_id = $1)
       GROUP BY p.id ORDER BY views DESC LIMIT 5`,
      [mine],
    ),
    query(
      `SELECT d::date AS day, COALESCE(sum(v.views), 0)::int AS views
       FROM generate_series(current_date - 13, current_date, interval '1 day') d
       LEFT JOIN post_views_daily v ON v.day = d::date
       LEFT JOIN posts p ON p.id = v.post_id AND ($1::uuid IS NULL OR p.author_id = $1)
       WHERE v.post_id IS NULL OR p.id IS NOT NULL
       GROUP BY d ORDER BY d`,
      [mine],
    ),
    query(
      `SELECT COALESCE(sum(views) FILTER (WHERE v.day = current_date), 0)::int AS today,
              COALESCE(sum(views) FILTER (WHERE v.day >= current_date - 6), 0)::int AS week,
              COALESCE(sum(views), 0)::int AS month
       FROM post_views_daily v JOIN posts p ON p.id = v.post_id
       WHERE v.day >= current_date - 29 AND ($1::uuid IS NULL OR p.author_id = $1)`,
      [mine],
    ),
    staff ? query(`SELECT count(*)::int AS n FROM comments WHERE status = 'pending'`) : { rows: [{ n: 0 }] },
    staff ? query('SELECT status, count(*)::int AS n FROM subscribers GROUP BY status') : { rows: [] },
    query(
      `SELECT p.id, p.title, p.lang, p.status, p.updated_at, u.name AS author_name
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE ($1::uuid IS NULL OR p.author_id = $1) ORDER BY p.updated_at DESC LIMIT 6`,
      [mine],
    ),
  ]);

  res.json({
    data: {
      posts,
      photoCards,
      videos,
      views: totals.rows[0],
      viewsByDay: series.rows.map((r) => ({ day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : r.day, views: r.views })),
      topPosts: topPosts.rows,
      pendingComments: pendingComments.rows[0].n,
      subscribers: Object.fromEntries(subscribers.rows.map((r) => [r.status, r.n])),
      recentPosts: recent.rows.map((r) => ({ id: r.id, title: r.title, lang: r.lang, status: r.status, updatedAt: r.updated_at, authorName: r.author_name })),
    },
  });
});

export default router;
