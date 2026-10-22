import { query, tx } from '../db/pool.js';
import { sendMail } from '../services/mailer.js';
import { newsletterEmail } from '../services/emailTemplates.js';

const BATCH = 20;

/**
 * Sends queued newsletter deliveries for the oldest campaign in `sending` state.
 *
 * - Resumable: queued rows survive restarts; the next tick continues where it stopped.
 * - Multi-instance safe: FOR UPDATE SKIP LOCKED means two workers never take the same row.
 * - Subscribers who unsubscribed after the campaign was queued are skipped.
 */
export async function processNewsletterBatch() {
  const {
    rows: [campaign],
  } = await query(`SELECT id, lang, subject, body_html FROM newsletter_campaigns WHERE status = 'sending' ORDER BY created_at LIMIT 1`);
  if (!campaign) return;

  const handled = await tx(async (db) => {
    const { rows } = await db.query(
      `SELECT d.id AS delivery_id, s.email, s.status, s.unsubscribe_token
       FROM newsletter_deliveries d
       JOIN subscribers s ON s.id = d.subscriber_id
       WHERE d.campaign_id = $1 AND d.status = 'queued'
       ORDER BY d.id
       LIMIT $2
       FOR UPDATE OF d SKIP LOCKED`,
      [campaign.id, BATCH],
    );

    for (const r of rows) {
      if (r.status !== 'active') {
        await db.query(`UPDATE newsletter_deliveries SET status = 'skipped' WHERE id = $1`, [r.delivery_id]);
        continue;
      }
      try {
        const mail = newsletterEmail({ lang: campaign.lang, subject: campaign.subject, bodyHtml: campaign.body_html }, r.unsubscribe_token);
        const providerId = await sendMail({ to: r.email, ...mail });
        await db.query(`UPDATE newsletter_deliveries SET status = 'sent', provider_id = $2, sent_at = now() WHERE id = $1`, [r.delivery_id, providerId]);
      } catch (err) {
        await db.query(`UPDATE newsletter_deliveries SET status = 'failed', error = $2 WHERE id = $1`, [r.delivery_id, String(err.message).slice(0, 500)]);
      }
    }
    return rows.length;
  });

  if (handled === 0) {
    // Nothing we could lock. Finished only if nothing is still queued (another worker may hold rows).
    const {
      rows: [{ queued }],
    } = await query(`SELECT count(*)::int AS queued FROM newsletter_deliveries WHERE campaign_id = $1 AND status = 'queued'`, [campaign.id]);
    if (queued === 0) {
      await query(`UPDATE newsletter_campaigns SET status = 'sent', sent_at = now() WHERE id = $1 AND status = 'sending'`, [campaign.id]);
      console.log(`[newsletter] campaign ${campaign.id} finished`);
    }
  }
}
