import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { validate } from '../middleware/validate.js';
import { HttpError, unauthorized } from '../utils/errors.js';

const router = Router();

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * Email provider events (bounce / spam complaint).
 *
 *   POST /api/webhooks/email        header: x-webhook-secret: <EMAIL_WEBHOOK_SECRET>
 *   body: { "event": "bounce" | "complaint", "email": "someone@example.com" }
 *
 * Providers (Resend, SES via SNS, Brevo...) each send their own payload shape. Point them at a
 * tiny adapter (or a Zapier/Make step) that maps to the body above - keeping this endpoint
 * provider-neutral. `bounce` should be sent for HARD bounces only.
 */
router.post(
  '/email',
  validate({ body: z.object({ event: z.enum(['bounce', 'complaint']), email: z.string().trim().toLowerCase().email() }) }),
  async (req, res) => {
    if (!env.EMAIL_WEBHOOK_SECRET) throw new HttpError(404, 'Webhook is not enabled');
    const given = req.get('x-webhook-secret') ?? '';
    if (!safeEqual(given, env.EMAIL_WEBHOOK_SECRET)) throw unauthorized('Bad webhook secret');

    const { event, email } = req.valid.body;
    // bounce -> 'bounced' (address is dead); complaint -> 'unsubscribed' (they marked us as spam)
    const status = event === 'bounce' ? 'bounced' : 'unsubscribed';
    await query(
      `UPDATE subscribers SET status = $2::subscriber_status,
              unsubscribed_at = CASE WHEN $2 = 'unsubscribed' THEN now() ELSE unsubscribed_at END
       WHERE email = $1`,
      [email, status],
    );
    res.status(204).end();
  },
);

export default router;
