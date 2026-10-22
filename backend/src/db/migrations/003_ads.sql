-- 003_ads.sql
-- Advertising: direct banner ads (image + link) and Google AdSense units, placed in named slots.
-- The AdSense publisher id lives in site_settings (site_adsense_client).

CREATE TYPE ad_kind      AS ENUM ('banner', 'adsense');
CREATE TYPE ad_placement AS ENUM ('home_mid', 'home_sidebar', 'article_inline', 'article_bottom', 'listing_top');

CREATE TABLE ads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text         NOT NULL,                       -- internal label (advertiser / campaign)
  kind          ad_kind      NOT NULL DEFAULT 'banner',
  placement     ad_placement NOT NULL,
  lang          lang_code,                                   -- NULL = shown on both portals
  image_id      uuid REFERENCES media(id) ON DELETE SET NULL, -- banner
  link_url      text,                                        -- banner click-through
  alt_text      text,
  adsense_slot  text,                                        -- adsense ad unit id
  is_active     boolean      NOT NULL DEFAULT true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  impressions   bigint       NOT NULL DEFAULT 0,
  clicks        bigint       NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);
CREATE TRIGGER trg_ads_updated BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_ads_serve ON ads (placement, is_active);
