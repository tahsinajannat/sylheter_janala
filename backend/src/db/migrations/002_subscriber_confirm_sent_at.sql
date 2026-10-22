-- 002_subscriber_confirm_sent_at.sql
-- Track when the confirmation email was sent so we can
--   * expire confirmation links (48h)
--   * throttle re-sends (1/minute per address)

ALTER TABLE subscribers ADD COLUMN confirm_sent_at timestamptz;
