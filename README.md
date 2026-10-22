# সিলেটের জানালা (Sylheter Janala)

Bilingual (Bangla / English) news portal.

* **Backend** — Express 5 + PostgreSQL (`pg`, no ORM), SQL migrations, seeds, OpenAPI docs → this file + [docs/API.md](docs/API.md)
* **Frontend** — Next.js 16, Tailwind v4, shadcn/ui, single `fetch` API client → [frontend/README.md](frontend/README.md)
  * public site at `/bn` and `/en`, **newsroom admin at `/admin`** (see below)

```
sylheter-janala/
├─ docker-compose.yml        dev: Postgres + API with hot reload
├─ docker-compose.prod.yml   production-style stack
├─ .env.example              env for docker compose
├─ docs/API.md               API guide (Swagger UI lives at /api/docs)
├─ frontend/                 Next.js app (Dockerfile: dev, prod)
└─ backend/
   ├─ Dockerfile             targets: dev, prod
   ├─ src/
   │  ├─ server.js · app.js
   │  ├─ config/env.js       validated env (fails fast)
   │  ├─ db/                 pool.js · migrate.js · seed.js · migrations/*.sql · seeds/
   │  ├─ middleware/         auth (JWT) · validate (zod) · error · rateLimit
   │  ├─ routes/             public + auth + reader + admin/
   │  ├─ services/           content queries · mailer · email templates · cloudinary · passwords
   │  └─ jobs/               scheduled publishing · newsletter worker
   └─ tests/                 unit tests (npm test)
```

## Quick start (Docker)

```bash
cp .env.example .env            # set JWT_SECRET (openssl rand -hex 32) and POSTGRES_PASSWORD
docker compose up --build       # web :3000, API :4000, Postgres; migrations run on boot
docker compose exec api npm run seed:demo    # first admin + categories + sample content
curl "http://localhost:4000/api/home?lang=bn"
# open http://localhost:3000  (site)  ·  http://localhost:4000/api/docs  (API docs)
```

Demo logins (development only — created by `seed:demo`):

| Who | Email | Password |
|---|---|---|
| Admin | `admin@sylheterjanala.local` | `Admin@12345` (or `ADMIN_PASSWORD` if set) |
| Editor | `editor@sylheterjanala.local` | `Staff@12345` |
| Author | `author@sylheterjanala.local` | `Staff@12345` |
| Reader | `reader@example.com` | `Reader@12345` |

## Admin panel (newsroom) — `/admin`

Open <http://localhost:3000/admin> and sign in with a staff account (table above). What each role sees:

| Page | Author | Editor | Admin |
|---|:-:|:-:|:-:|
| Dashboard (counts, 14-day views chart, top stories, recent posts) | own content | all | all |
| Posts · Photo cards · Videos: write, schedule, publish, delete | drafts only, own | all | all |
| Home-page placement (hero / spotlight / featured / slider) | | ✓ | ✓ |
| Media library (upload, captions) | upload | + edit, delete | ✓ |
| Categories & tags | add tags | ✓ | ✓ |
| Comments moderation · Subscribers · Newsletters (draft, test, send) | | ✓ | ✓ |
| Staff accounts · Site settings | | | ✓ |

How it is wired (all under `frontend/src/`):

* `app/admin/**` the pages; `modules/admin/**` the components (rich-text editor = TipTap, image picker, forms).
* **The staff token never reaches page scripts.** `POST /admin-api/login` stores it in an httpOnly cookie; server pages read it (`lib/admin/server.ts`), and the browser calls `/admin-api/*` (`lib/admin/client.ts`), a route handler that adds the cookie as a bearer token and forwards to the API's `/admin/*` routes. It also rejects cross-site writes and refreshes the public pages after every change.
* Image upload needs the `CLOUDINARY_*` variables in the API environment (otherwise the API answers `503 Image uploads are not configured`).
* Newsletter sending needs SMTP settings; without them emails are printed to the API log.
* Added to the API for the panel: `GET /api/admin/stats` (dashboard), `GET /api/admin/newsletters/:id`, and `featuredImageUrl` / `thumbnailUrl` on the admin post and video responses.

## Without Docker

```bash
cd backend
cp .env.example .env            # point DATABASE_URL at your Postgres 14+
npm install
npm run migrate
npm run seed:demo
npm run dev
```

## Scripts (in `backend/`)

| Command | What it does |
|---|---|
| `npm run dev` | API with auto-restart (`node --watch`) |
| `npm start` | API (production) |
| `npm run migrate` | Apply pending migrations |
| `npm run migrate:status` | Show applied / pending |
| `npm run migrate:create add_something` | Create the next numbered `.sql` file |
| `npm run db:reset` | Drop everything (refuses when `NODE_ENV=production`) |
| `npm run seed` | **Essential** data: settings, first admin, bn/en categories. Safe in production, idempotent |
| `npm run seed:demo` | Essential + sample posts, photo cards, videos, comments. Development only |
| `npm test` | Unit tests |
| `npm run docs:validate` | Validate `openapi.yaml` |

## Migrations

* Plain `.sql` files in `backend/src/db/migrations`, applied in filename order (`001_…`, `002_…`).
* Each file runs in its own transaction — don't write `BEGIN/COMMIT` in them.
* Applied files are checksummed. **Never edit an applied migration** — add a new one. The runner errors if you do.
* A Postgres advisory lock makes concurrent starts safe (several containers booting together).
* Set `RUN_MIGRATIONS_ON_START=true` (default in both compose files) to migrate on boot, or run `npm run migrate` as a deploy step instead.
* Forward-only by design (no down files). To undo, write a new migration.

## Seeding

`seed` creates only what a real site needs: `site_settings`, the first admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD` — **required in production**), and the bn/en category pairs. It never overwrites existing rows, so it can run on every deploy.

`seed:demo` adds sample content with placeholder images (`picsum.photos`) and placeholder YouTube ids. Replace or delete it before launch.

## Environment

See `.env.example`. Required: `DATABASE_URL`, `JWT_SECRET` (32+ chars). Everything else has a default or is optional:

* **Cloudinary** (`CLOUDINARY_*`): without it, `POST /api/admin/media` returns 503. Upload limit is 10 MB (also enforced by a DB `CHECK`); JPEG/PNG/WebP/GIF/AVIF only.
* **SMTP** (`SMTP_*`): without it, emails are **printed to the API log** (the confirm link is in there) — handy in development. Any SMTP provider works (Resend, Brevo, SES, Gmail app password).
* `APP_URL` is the frontend (links in emails point there); `API_URL` is this API (one-click unsubscribe header).
* `TRUST_PROXY=1` when behind nginx/Caddy/a load balancer, so rate limits use real client IPs.
* `SITE_TIMEZONE` (default `Asia/Dhaka`) decides what “today” means for the most-popular counters.

## API overview

Full reference with schemas and examples: **Swagger UI at `/api/docs`** (`/api/docs/openapi.yaml` for the spec; see [docs/API.md](docs/API.md)). On by default in development, off in production unless `API_DOCS_ENABLED=true`. Summary:

All responses: `{ "data": … , "meta": … }`. Errors: `{ "error": { "message", "details?" } }`.
Every public list takes `?lang=bn|en`. Auth is `Authorization: Bearer <token>`.

### Public

| Endpoint | Purpose |
|---|---|
| `GET /api/home?lang=` | Whole home page in one call: `hero`, `spotlight` (each has `position` 1–4 so the frontend can vary card layouts), `featured`, `latest`, `otherLanguage` (latest posts of the other language + `portalUrl`), `photoCards` (slider), `editorials`, `videos` |
| `GET /api/posts?lang=&type=&category=&tag=&q=&page=&limit=` | Paged list / search |
| `GET /api/posts/popular?lang=&range=day\|week\|month` | Most popular (falls back to all-time views on a quiet site) |
| `GET /api/posts/:slug?lang=` | Single news page: post, `tags`, `translations` (language switcher), `related`, `popular` |
| `POST /api/posts/:id/view` · `/share` | Counters (call once per visit / click) |
| `GET/POST /api/posts/:id/comments` | Approved comments · add comment (reader login; goes to moderation) |
| `GET /api/photo-cards?lang=&slider=true` · `/:slug` | Slider · photo page with `related` cards |
| `GET /api/videos` · `/:slug` | List · video page with `related` videos (`embedUrl`, `thumbnail` included) |
| `GET /api/categories?lang=` · `/tags?lang=` · `/settings` | Navbar categories, tag cloud, public settings |
| `POST /api/subscribers` | Subscribe (double opt-in) |
| `POST /api/subscribers/confirm` `{token}` | From the email link |
| `POST /api/subscribers/unsubscribe` `{token}` or `?token=` | Also the RFC 8058 one-click endpoint |
| `POST /api/webhooks/email` | Bounce / complaint events (`x-webhook-secret`) |

Slugs may be Bangla (`/api/posts/সিলেটের-খবর?lang=bn`) — URL-encode them in clients.

### Accounts

`POST /api/auth/login` (staff) · `POST /api/auth/reader/register` · `POST /api/auth/reader/login` · `GET /api/auth/me`
Readers: `GET /api/bookmarks` · `PUT|DELETE /api/bookmarks/:postId`.

### Staff (`/api/admin/…`)

| Role | Can |
|---|---|
| **author** | Create/edit **own drafts** of posts, photo cards, videos; upload images; create tags. Cannot publish or set hero/spotlight/featured |
| **editor** | Everything content: publish & schedule, placement flags, categories, comments moderation, subscribers, newsletters, link translations |
| **admin** | Everything + staff accounts (`/users`) + site settings (`/settings`) |

Resources: `posts`, `photo-cards`, `videos` (CRUD, `status`: `draft|scheduled|published|archived`), `media` (multipart upload, field `file`), `categories`, `tags`, `comments`, `subscribers`, `newsletters`, `users`, `settings`.
Scheduled items go live automatically (a job checks every minute).

## Email subscription flow

1. `POST /api/subscribers {email, lang}` → row `pending` + confirmation email (same reply whether or not the address exists; 60 s resend cooldown).
2. Email link → frontend page `/{lang}/subscribe/confirm?token=…` → `POST /api/subscribers/confirm` → `active` (links expire after 48 h). Confirm/unsubscribe are **POST** on purpose: mail scanners “click” GET links.
3. Every newsletter carries an unsubscribe link plus `List-Unsubscribe` / `List-Unsubscribe-Post` headers.
4. `bounced` = the provider reported the address permanently undeliverable; `complaint` = marked as spam. Point your provider's webhook (via a tiny adapter that maps to `{event, email}`) at `/api/webhooks/email`; those addresses are never mailed again.
5. Campaigns: create → `/test` → `/send`. A background worker sends in batches of 20 every 15 s, resumes after restarts, and skips anyone who unsubscribed in the meantime.

## Production

```bash
cp .env.example .env     # real secrets; APP_URL / API_URL / CORS_ORIGINS must be your domains
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api node src/db/seed.js    # first admin (needs ADMIN_PASSWORD)
```

The stack also builds and starts the frontend (`web`, port 3000). Set `NEXT_PUBLIC_API_URL` (the API's public URL incl. `/api`) and `APP_URL` in `.env` first; they are compiled into the site.
Put a TLS reverse proxy in front of the API and the site. Using a managed database (Neon, Supabase, RDS)? Remove the `db` service and set `DATABASE_URL` and `DB_SSL=true`.
The `prod` image runs as a non-root user, has a `/health` healthcheck, and shuts down gracefully on SIGTERM.

## Not included yet

Reader email verification, password reset, “sign in with Google” (the `readers` table already has the columns), refresh tokens, and a CSV export of subscribers.
#   s y l h e t e r _ j a n a l a  
 