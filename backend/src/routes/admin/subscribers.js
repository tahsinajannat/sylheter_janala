import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../../db/pool.js';
import { validate } from '../../middleware/validate.js';
import { newsletterEmail } from '../../services/emailTemplates.js';
import { sendMail } from '../../services/mailer.js';
import { HttpError, conflict, notFound } from '../../utils/errors.js';
import { sanitizeNewsletter } from '../../utils/html.js';
import { offsetOf, pageMeta, paginationShape } from '../../utils/pagination.js';
import { idParams, lang, likePattern } from '../../utils/schemas.js';
import { buildUpdate } from '../../utils/sql.js';

// ───────────────────────── subscribers ─────────────────────────

export const subscribers = Router();
const STATUS = z.enum(['pending', 'active', 'unsubscribed', 'bounced']);

subscribers.get(
  '/',
  validate({ query: z.object({ status: STATUS.optional(), lang: lang.optional(), q: z.string().trim().min(1).max(100).optional(), ...paginationShape }) }),
  async (req, res) => {
    const { status, lang: l, q, page, limit } = req.valid.query;
    const params = [];
    const conds = [];
    if (status) { params.push(status); conds.push(`status = $${params.length}::subscriber_status`); }
    if (l) { params.push(l); conds.push(`lang = $${params.length}`); }
    if (q) { params.push(likePattern(q)); conds.push(`email ILIKE $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [rows, total, summary] = await Promise.all([
      query(
        `SELECT id, email, lang, status, source, confirmed_at, unsubscribed_at, created_at
         FROM subscribers ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offsetOf({ page, limit })],
      ),
      query(`SELECT count(*)::int AS n FROM subscribers ${where}`, params),
      query('SELECT status, count(*)::int AS n FROM subscribers GROUP BY status'),
    ]);
    res.json({
      data: rows.rows.map((r) => ({
        id: r.id,
        email: r.email,
        lang: r.lang,
        status: r.status,
        source: r.source,
        confirmedAt: r.confirmed_at,
        unsubscribedAt: r.unsubscribed_at,
        createdAt: r.created_at,
      })),
      meta: { ...pageMeta(total.rows[0].n, { page, limit }), summary: Object.fromEntries(summary.rows.map((r) => [r.status, r.n])) },
    });
  },
);

// permanent removal (right to be forgotten)
subscribers.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query('DELETE FROM subscribers WHERE id = $1', [req.valid.params.id]);
  if (!rowCount) throw notFound('Subscriber');
  res.status(204).end();
});

// ───────────────────────── newsletters ─────────────────────────

export const newsletters = Router();

const campaignFields = {
  lang,
  subject: z.string().trim().min(3).max(200),
  bodyHtml: z.string().min(1).max(200_000),
};
const shape = (r) => ({
  id: r.id,
  lang: r.lang,
  subject: r.subject,
  bodyHtml: r.body_html,
  status: r.status,
  sentAt: r.sent_at,
  createdAt: r.created_at,
  ...(r.stats ? { stats: r.stats } : {}),
});

newsletters.get('/', validate({ query: z.object(paginationShape) }), async (req, res) => {
  const { page, limit } = req.valid.query;
  const [rows, total] = await Promise.all([
    query(
      `SELECT c.*,
              COALESCE((SELECT jsonb_object_agg(status, n) FROM (
                 SELECT status, count(*)::int AS n FROM newsletter_deliveries WHERE campaign_id = c.id GROUP BY status) s), '{}'::jsonb) AS stats
       FROM newsletter_campaigns c ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offsetOf({ page, limit })],
    ),
    query('SELECT count(*)::int AS n FROM newsletter_campaigns'),
  ]);
  res.json({ data: rows.rows.map(shape), meta: pageMeta(total.rows[0].n, { page, limit }) });
});

newsletters.get('/:id', validate({ params: idParams }), async (req, res) => {
  const { rows } = await query(
    `SELECT c.*,
            COALESCE((SELECT jsonb_object_agg(status, n) FROM (
               SELECT status, count(*)::int AS n FROM newsletter_deliveries WHERE campaign_id = c.id GROUP BY status) s), '{}'::jsonb) AS stats
     FROM newsletter_campaigns c WHERE c.id = $1`,
    [req.valid.params.id],
  );
  if (!rows[0]) throw notFound('Campaign');
  res.json({ data: shape(rows[0]) });
});

newsletters.post('/', validate({ body: z.object(campaignFields) }), async (req, res) => {
  const b = req.valid.body;
  const { rows } = await query(
    'INSERT INTO newsletter_campaigns (lang, subject, body_html, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
    [b.lang, b.subject, sanitizeNewsletter(b.bodyHtml), req.auth.id],
  );
  res.status(201).json({ data: shape(rows[0]) });
});

newsletters.patch('/:id', validate({ params: idParams, body: z.object(campaignFields).omit({ lang: true }).partial() }), async (req, res) => {
  const data = { ...req.valid.body };
  if (data.bodyHtml !== undefined) data.bodyHtml = sanitizeNewsletter(data.bodyHtml);
  const { sets, values } = buildUpdate(data, { subject: 'subject', bodyHtml: 'body_html' }, 2);
  const { rows } = await query(
    `UPDATE newsletter_campaigns SET ${sets.join(', ')} WHERE id = $1 AND status = 'draft' RETURNING *`,
    [req.valid.params.id, ...values],
  );
  if (!rows[0]) throw conflict('Campaign not found or no longer a draft');
  res.json({ data: shape(rows[0]) });
});

newsletters.delete('/:id', validate({ params: idParams }), async (req, res) => {
  const { rowCount } = await query(`DELETE FROM newsletter_campaigns WHERE id = $1 AND status = 'draft'`, [req.valid.params.id]);
  if (!rowCount) throw conflict('Only draft campaigns can be deleted');
  res.status(204).end();
});

// Send one test email to yourself (uses a throwaway unsubscribe token, so the link is not live)
newsletters.post('/:id/test', validate({ params: idParams, body: z.object({ email: z.string().trim().toLowerCase().email() }) }), async (req, res) => {
  const { rows } = await query('SELECT lang, subject, body_html FROM newsletter_campaigns WHERE id = $1', [req.valid.params.id]);
  if (!rows[0]) throw notFound('Campaign');
  const mail = newsletterEmail({ lang: rows[0].lang, subject: `[TEST] ${rows[0].subject}`, bodyHtml: rows[0].body_html }, 'test-token-not-valid');
  await sendMail({ to: req.valid.body.email, ...mail });
  res.status(202).json({ data: { sent: true } });
});

// Queue the campaign for every ACTIVE subscriber in its language; the background worker sends it.
newsletters.post('/:id/send', validate({ params: idParams }), async (req, res) => {
  const result = await tx(async (db) => {
    const { rows } = await db.query('SELECT id, lang, status FROM newsletter_campaigns WHERE id = $1 FOR UPDATE', [req.valid.params.id]);
    const campaign = rows[0];
    if (!campaign) throw notFound('Campaign');
    if (campaign.status !== 'draft') throw conflict(`Campaign is already ${campaign.status}`);

    const queued = await db.query(
      `INSERT INTO newsletter_deliveries (campaign_id, subscriber_id)
       SELECT $1, id FROM subscribers WHERE status = 'active' AND lang = $2
       ON CONFLICT (campaign_id, subscriber_id) DO NOTHING`,
      [campaign.id, campaign.lang],
    );
    if (queued.rowCount === 0) throw new HttpError(400, 'There are no active subscribers in this language');

    await db.query(`UPDATE newsletter_campaigns SET status = 'sending' WHERE id = $1`, [campaign.id]);
    return { id: campaign.id, status: 'sending', recipients: queued.rowCount };
  });
  res.status(202).json({ data: result });
});
