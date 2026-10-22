-- 001_init.sql
-- Initial schema for সিলেটের জানালা (Sylheter Janala).
-- The migration runner wraps each file in a transaction, so no BEGIN/COMMIT here.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive emails

-- ───────────────────────── Enums ─────────────────────────

CREATE TYPE lang_code          AS ENUM ('bn', 'en');
CREATE TYPE user_role          AS ENUM ('admin', 'editor', 'author');
CREATE TYPE content_status     AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE post_type          AS ENUM ('news', 'editorial');
-- subscriber_status:
--   pending      = signed up, has not clicked the confirmation link yet
--   active       = confirmed, receives emails
--   unsubscribed = clicked unsubscribe
--   bounced      = the email provider reported the address permanently undeliverable
--                  (mailbox does not exist, domain invalid). We stop sending to protect
--                  sender reputation. Set from the Resend/SES webhook.
CREATE TYPE subscriber_status  AS ENUM ('pending', 'active', 'unsubscribed', 'bounced');
CREATE TYPE campaign_status    AS ENUM ('draft', 'sending', 'sent', 'failed');
CREATE TYPE comment_status     AS ENUM ('pending', 'approved', 'rejected', 'spam');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────── Users ─────────────────────────

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  email         citext      NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'author',
  bio           text,
  avatar_id     uuid,                       -- FK added after media table
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────── Readers (public site visitors) ─────────────────────────
-- Separate from `users`, which is staff only (admin / editor / author).
-- password_hash is NULL when the reader signs in with Google.

CREATE TABLE readers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  email             citext      NOT NULL UNIQUE,
  password_hash     text,
  auth_provider     text        NOT NULL DEFAULT 'email',   -- email | google
  provider_user_id  text,
  avatar_url        text,
  preferred_lang    lang_code   NOT NULL DEFAULT 'bn',
  email_verified_at timestamptz,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_provider, provider_user_id)
);
CREATE TRIGGER trg_readers_updated BEFORE UPDATE ON readers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ───────────────────────── Media (Cloudinary) ─────────────────────────

CREATE TABLE media (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudinary_id  text        NOT NULL UNIQUE,      -- public_id
  url            text        NOT NULL,             -- secure_url
  width          int         NOT NULL,
  height         int         NOT NULL,
  bytes          int         NOT NULL CHECK (bytes > 0 AND bytes < 10485760),  -- < 10 MB
  format         text        NOT NULL,
  alt            text,
  caption        text,
  uploaded_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_created ON media (created_at DESC);

ALTER TABLE users
  ADD CONSTRAINT fk_users_avatar FOREIGN KEY (avatar_id) REFERENCES media(id) ON DELETE SET NULL;

-- ───────────────────────── Taxonomy ─────────────────────────

CREATE TABLE categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang            lang_code   NOT NULL,
  slug            text        NOT NULL,
  name            text        NOT NULL,
  sort_order      int         NOT NULL DEFAULT 0,      -- navbar order
  show_in_nav     boolean     NOT NULL DEFAULT true,
  translation_key uuid,                                -- links bn/en versions
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lang, slug)
);
CREATE INDEX idx_categories_nav ON categories (lang, show_in_nav, sort_order);

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang       lang_code   NOT NULL,
  slug       text        NOT NULL,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lang, slug)
);

-- ───────────────────────── Posts (news + editorial) ─────────────────────────

CREATE TABLE posts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang               lang_code        NOT NULL,
  type               post_type        NOT NULL DEFAULT 'news',
  slug               text             NOT NULL,
  title              text             NOT NULL,
  excerpt            text,
  content            text             NOT NULL,          -- HTML / markdown from editor
  status             content_status   NOT NULL DEFAULT 'draft',

  featured_image_id  uuid REFERENCES media(id) ON DELETE SET NULL,
  category_id        uuid NOT NULL REFERENCES categories(id),
  author_id          uuid NOT NULL REFERENCES users(id),

  -- home page placement
  is_hero            boolean          NOT NULL DEFAULT false,
  is_spotlight       boolean          NOT NULL DEFAULT false,
  spotlight_order    int              NOT NULL DEFAULT 0,   -- frontend picks the card layout from this position (1st = large, etc.)
  is_featured        boolean          NOT NULL DEFAULT false,    -- featured / highlighted news
  featured_order     int              NOT NULL DEFAULT 0,

  -- same story in bn and en shares one key (for the "other language" section)
  translation_key    uuid,

  view_count         int              NOT NULL DEFAULT 0,
  share_count        int              NOT NULL DEFAULT 0,
  read_minutes       smallint,

  meta_title         text,
  meta_description   text,

  published_at       timestamptz,
  created_at         timestamptz      NOT NULL DEFAULT now(),
  updated_at         timestamptz      NOT NULL DEFAULT now(),

  UNIQUE (lang, slug),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_posts_list        ON posts (lang, type, status, published_at DESC);
CREATE INDEX idx_posts_category    ON posts (category_id, published_at DESC);
CREATE INDEX idx_posts_author      ON posts (author_id);
CREATE INDEX idx_posts_spotlight   ON posts (lang, spotlight_order) WHERE is_spotlight;
CREATE INDEX idx_posts_featured    ON posts (lang, featured_order)  WHERE is_featured;
CREATE INDEX idx_posts_hero        ON posts (lang)                  WHERE is_hero;
CREATE INDEX idx_posts_translation ON posts (translation_key)       WHERE translation_key IS NOT NULL;
CREATE INDEX idx_posts_popular     ON posts (lang, view_count DESC) WHERE status = 'published';
-- search (simple config works for Bangla tokens too)
CREATE INDEX idx_posts_search ON posts
  USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(excerpt,'')));

CREATE TABLE post_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX idx_post_tags_tag ON post_tags (tag_id);

-- Daily views -> "most popular" (today / week / month)
CREATE TABLE post_views_daily (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  day     date NOT NULL,
  views   int  NOT NULL DEFAULT 1,
  PRIMARY KEY (post_id, day)
);
CREATE INDEX idx_post_views_day ON post_views_daily (day);

-- ───────────────────────── Photo cards ─────────────────────────
-- Home slider -> /photo-card/[slug]/page.tsx (card + related cards)

CREATE TABLE photo_cards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang          lang_code      NOT NULL,
  slug          text           NOT NULL,
  title         text           NOT NULL,
  caption       text,
  photographer  text,
  status        content_status NOT NULL DEFAULT 'draft',
  image_id      uuid NOT NULL REFERENCES media(id),
  category_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id     uuid NOT NULL REFERENCES users(id),
  is_slider     boolean        NOT NULL DEFAULT true,
  slider_order  int            NOT NULL DEFAULT 0,
  view_count    int            NOT NULL DEFAULT 0,
  published_at  timestamptz,
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (lang, slug)
);
CREATE TRIGGER trg_photo_cards_updated BEFORE UPDATE ON photo_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_photo_cards_list   ON photo_cards (lang, status, published_at DESC);
CREATE INDEX idx_photo_cards_slider ON photo_cards (lang, slider_order) WHERE is_slider;
CREATE INDEX idx_photo_cards_cat    ON photo_cards (category_id);

CREATE TABLE photo_card_tags (
  photo_card_id uuid NOT NULL REFERENCES photo_cards(id) ON DELETE CASCADE,
  tag_id        uuid NOT NULL REFERENCES tags(id)        ON DELETE CASCADE,
  PRIMARY KEY (photo_card_id, tag_id)
);
CREATE INDEX idx_photo_card_tags_tag ON photo_card_tags (tag_id);

-- ───────────────────────── Video news (YouTube) ─────────────────────────

CREATE TABLE videos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang          lang_code      NOT NULL,
  slug          text           NOT NULL,
  title         text           NOT NULL,
  description   text,
  youtube_url   text           NOT NULL,
  youtube_id    text           NOT NULL,        -- parsed from URL; embed + img.youtube.com thumbnail
  status        content_status NOT NULL DEFAULT 'draft',
  thumbnail_id  uuid REFERENCES media(id) ON DELETE SET NULL,   -- optional custom thumbnail
  category_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id     uuid NOT NULL REFERENCES users(id),
  is_featured   boolean        NOT NULL DEFAULT false,
  view_count    int            NOT NULL DEFAULT 0,
  published_at  timestamptz,
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (lang, slug)
);
CREATE TRIGGER trg_videos_updated BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_videos_list ON videos (lang, status, published_at DESC);
CREATE INDEX idx_videos_cat  ON videos (category_id);

-- ───────────────────────── Email subscription ─────────────────────────
-- Double opt-in: pending -> confirmation email (confirm_token) -> active.
-- Every email includes unsubscribe_token for one-click unsubscribe.

CREATE TABLE subscribers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext            NOT NULL UNIQUE,
  reader_id         uuid REFERENCES readers(id) ON DELETE SET NULL,  -- optional: subscribers need not have an account
  lang              lang_code         NOT NULL DEFAULT 'bn',
  status            subscriber_status NOT NULL DEFAULT 'pending',
  confirm_token     text UNIQUE,
  unsubscribe_token text              NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  source            text,                                -- footer, popup...
  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz,
  created_at        timestamptz       NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscribers_status ON subscribers (status, lang);

CREATE TABLE newsletter_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang          lang_code       NOT NULL,
  subject       text            NOT NULL,
  body_html     text            NOT NULL,
  status        campaign_status NOT NULL DEFAULT 'draft',
  created_by    uuid NOT NULL REFERENCES users(id),
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz     NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_deliveries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id)          ON DELETE CASCADE,
  provider_id   text,                          -- message id from Resend / SES
  status        text NOT NULL DEFAULT 'queued',  -- queued | sent | failed | opened
  error         text,
  sent_at       timestamptz,
  UNIQUE (campaign_id, subscriber_id)
);

-- ───────────────────────── Reader bookmarks ─────────────────────────

CREATE TABLE bookmarks (
  reader_id  uuid NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
  post_id    uuid NOT NULL REFERENCES posts(id)   ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reader_id, post_id)
);

-- ───────────────────────── Comments (readers, moderated) ─────────────────────────
-- New comments start as 'pending'; an editor approves them. parent_id allows replies.

CREATE TABLE comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
  reader_id  uuid NOT NULL REFERENCES readers(id)  ON DELETE CASCADE,
  parent_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status     comment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_comments_post   ON comments (post_id, created_at) WHERE status = 'approved';
CREATE INDEX idx_comments_queue  ON comments (created_at)          WHERE status = 'pending';
CREATE INDEX idx_comments_reader ON comments (reader_id);

-- ───────────────────────── Site settings ─────────────────────────
-- e.g. bn_portal_url, en_portal_url, social links

CREATE TABLE site_settings (
  key        text PRIMARY KEY,
  value      text        NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
