import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { subscribeLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { confirmEmail } from '../services/emailTemplates.js';
import { sendMail } from '../services/mailer.js';
import { HttpError, notFound } from '../utils/errors.js';
import { lang } from '../utils/schemas.js';

/**
 * Newsletter subscription with double opt-in.
 *
 *   POST /api/subscribers              email -> status 'pending', confirmation email sent
 *   POST /api/subscribers/confirm      { token } from the email link (frontend page calls this)
 *   POST /api/subscribers/unsubscribe  { token } or ?token=  (also the RFC 8058 one-click endpoint)
 *
 * Confirm/unsubscribe are POSTs on purpose: mail scanners "click" GET links, which would
 * silently confirm or unsubscribe people.
 */
const router = Router();

const CONFIRM_TTL_HOURS = 48;
const RESEND_COOLDOWN_SECONDS = 60;
const newToken = () => randomBytes(32).toString('hex');
const token = z.string().trim().min(16).max(128);

router.post(
  '/',
  subscribeLimiter,
  validate({ body: z.object({ email: z.string().trim().toLowerCase().email().max(254), lang: lang.default('bn'), source: z.string().trim().max(40).optional() }) }),
  async (req, res) => {
    const { email, lang: l, source } = req.valid.body;

    // Same answer whether or not the address is already subscribed (no account enumeration).
    const accepted = () => res.status(202).json({ data: { status: 'pending', message: 'Check your inbox to confirm your subscription' } });

    const {
      rows: [existing],
    } = await query(
      `SELECT id, status, (confirm_sent_at > now() - make_interval(secs => $2)) AS recently_sent
       FROM subscribers WHERE email = $1`,
      [email, RESEND_COOLDOWN_SECONDS],
    );

    if (existing?.status === 'active') return accepted();
    if (existing?.status === 'pending' && existing.recently_sent) return accepted();

    const confirmToken = newToken();
    if (existing) {
      // pending (stale), unsubscribed or bounced -> start a fresh opt-in
      await query(
        `UPDATE subscribers SET status = 'pending', lang = $2, confirm_token = $3, confirm_sent_at = now(), unsubscribed_at = NULL WHERE id = $1`,
        [existing.id, l, confirmToken],
      );
    } else {
      await query(
        `INSERT INTO subscribers (email, lang, status, confirm_token, confirm_sent_at, source) VALUES ($1, $2, 'pending', $3, now(), $4)`,
        [email, l, confirmToken, source ?? null],
      );
    }

    try {
      await sendMail({ to: email, ...confirmEmail(l, confirmToken) });
    } catch (err) {
      console.error('[subscribers] confirmation email failed:', err.message);
      // Let the user retry immediately instead of waiting out the cooldown.
      await query('UPDATE subscribers SET confirm_sent_at = NULL WHERE email = $1', [email]);
      throw new HttpError(503, 'We could not send the confirmation email. Please try again shortly.');
    }
    return accepted();
  },
);

router.post('/confirm', subscribeLimiter, validate({ body: z.object({ token }) }), async (req, res) => {
  const {
    rows: [sub],
  } = await query(
    `SELECT id, status, lang, (confirm_sent_at > now() - make_interval(hours => $2)) AS fresh
     FROM subscribers WHERE confirm_token = $1`,
    [req.valid.body.token, CONFIRM_TTL_HOURS],
  );
  if (!sub) throw new HttpError(410, 'This confirmation link is invalid or has expired');

  if (sub.status === 'pending') {
    if (!sub.fresh) throw new HttpError(410, 'This confirmation link has expired. Please subscribe again.');
    await query(`UPDATE subscribers SET status = 'active', confirmed_at = now() WHERE id = $1`, [sub.id]);
  } else if (sub.status !== 'active') {
    throw new HttpError(410, 'This confirmation link is no longer valid. Please subscribe again.');
  }
  // already active -> idempotent success (double click, refresh)
  res.json({ data: { status: 'active', lang: sub.lang } });
});

router.post('/unsubscribe', validate({ query: z.object({ token: token.optional() }), body: z.object({ token: token.optional() }).passthrough() }), async (req, res) => {
  const t = req.valid.body.token ?? req.valid.query.token;
  if (!t) throw new HttpError(400, 'Missing unsubscribe token');

  const { rows } = await query(
    `UPDATE subscribers
     SET status = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, now())
     WHERE unsubscribe_token = $1 RETURNING lang`,
    [t],
  );
  if (!rows[0]) throw notFound('Subscription');
  res.json({ data: { status: 'unsubscribed', lang: rows[0].lang } });
});

export default router;
