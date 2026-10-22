# সিলেটের জানালা — Frontend

Next.js 16 (App Router, `src/` dir) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · **no axios** — one `fetch`-based API client.

```bash
cp .env.example .env.local      # API URLs (defaults work with the backend on :4000)
npm install
npm run dev                     # http://localhost:3000  (redirects to /bn or /en)
```

Backend + frontend together: `docker compose up --build` in the repo root (see root README).

| Script | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js. `start` is `next start`; with the Docker image the server is `node server.js` (standalone output) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run api:types` | Regenerate `src/lib/api/schema.d.ts` from `../backend/src/docs/openapi.yaml` |

## Admin panel

`/admin` (login at `/admin/login`) is a separate root layout in `src/app/admin`, outside the `[lang]` tree and excluded from the language proxy. See the root README for roles and the request flow. Staff calls go browser -> `/admin-api/*` (route handler, adds the httpOnly cookie) -> API `/admin/*`; the browser never holds the token.

## Environment

| Variable | Used by | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | browser (build time) | Public API URL incl. `/api` |
| `API_INTERNAL_URL` | server rendering (runtime) | API URL on the internal network, e.g. `http://api:4000/api`. Falls back to `NEXT_PUBLIC_API_URL` |
| `NEXT_PUBLIC_SITE_URL` | canonical links, Open Graph, share links | This site's public URL |

`NEXT_PUBLIC_*` values are compiled into the browser bundle, so in Docker they are build args.

## Architecture: layers

Dependencies point **downwards only**.

```
src/
├─ app/[lang]/…            routes: thin. Fetch data, pick a module component, set metadata. No markup of their own.
├─ modules/<feature>/      feature layer: layout · home · news · photo-cards · videos · subscribe · auth
│                          each has an index.ts (its public surface); modules may import other modules' index only
├─ components/common/      SECOND layer: shared, domain-aware building blocks composed from ui
│                          Logo, StoryCard (6 variants), SmartImage, SectionHeading, Pagination, YouTubePlayer…
├─ components/ui/          FIRST layer: shadcn/ui primitives (Button, Badge, Input, Card, Sheet…). No app knowledge.
├─ lib/                    api/ (the client), i18n/, seo, routes, params, utils
├─ hooks/                  use-reader (session), use-scrolled
└─ styles/fonts.css        self-hosted font imports
```

Rules of thumb
* A **page** never contains layout markup: it calls `api.*`, then renders a module component.
* A **module** component that needs data and no interactivity is a server component; interactive leaves (`'use client'`) are small and live beside it (`share-buttons.tsx`, `comments-section.tsx`).
* Anything used by ≥ 2 modules moves to `components/common`.
* `components/ui` files are shadcn-style; add more with `npx shadcn@latest add <name>` (config in `components.json`).

## Single point of API integration

Everything goes through `src/lib/api/client.ts` → `apiRequest()`:

```
component / page ──▶ api.posts.get(...)         lib/api/endpoints/*.ts   typed wrappers, one line each
                          └──▶ apiRequest(...)  lib/api/client.ts        THE only place that calls fetch()
```

* Native `fetch`, no HTTP library.
* Server code uses `API_INTERNAL_URL`, the browser `NEXT_PUBLIC_API_URL`.
* Unwraps the `{data, meta}` envelope, sends the bearer token, turns failures into `ApiError(status, message, details)`, and exposes Next.js caching (`revalidate`, `tags`). Public GETs are cached (60 s default); requests with a token or body are never cached.
* Types come from the OpenAPI spec (`schema.d.ts`, generated) and are re-exported by `lib/api/types.ts` — a backend contract change becomes a compile error here.

To add an endpoint: add a function in the matching `endpoints/*.ts` file (and the path to `openapi.yaml`, then `npm run api:types`).

## Languages (bn / en)

* Path-based: `/bn/...` and `/en/...`. `src/proxy.ts` (Next 16's middleware) sends `/` and unprefixed paths to the right language: cookie `sj_lang` → `Accept-Language` → Bangla.
* UI strings: `src/lib/i18n/dictionaries/{bn,en}.ts` (the Bangla file is type-checked against the English shape, so a missing key fails the build). Server components: `await getDictionary(lang)`; client components: `useI18n()`.
* Content language comes from the API (`?lang=`). A story in one language links to its translation (language switcher + `hreflang`), and the home page shows the other edition's latest stories with a link to its portal.
* Dates/numbers use `Intl` with the `bn-BD` / `en-GB` locale (Bangla digits on Bangla pages), time zone Asia/Dhaka.

## Fonts

Self-hosted through Fontsource (no calls to Google at runtime), only the needed subsets and weights:

| Role | Bangla pages | English pages |
|---|---|---|
| UI / headings | Hind Siliguri | Inter |
| Article body | Noto Serif Bengali | Source Serif 4 |

`globals.css` switches the `--ui-font` / `--article-font` variables on `html[lang]`; the other family stays in each stack so mixed-script text still renders. Bangla gets extra line-height.

## Design system

Brand colours come from the logo: navy `#2e3047` (`secondary`, `--navy`) and red `#d62325` (`primary`). They are shadcn CSS variables in `globals.css`, so every primitive follows them. The logo is a text component (`components/common/logo.tsx`) so it stays sharp and shrinks in the scrolled navbar; the square logo image lives in `public/brand/` and is used for the favicon / apple icon.

* **Navbar** has two states: at the top (utility bar, large logo, category row) and scrolled (utility bar collapses, compact logo and links share one row).
* **Spotlight** gives each of its four slots a different card structure (overlay / large / compact / text) using the `position` the API returns.
* **Photo cards**: scroll-snap slider → `/photo-cards/<slug>` with related cards.
* **Videos**: click-to-load YouTube embed (no iframe until played) → `/videos/<slug>` with related videos.

## Routes

`/` · `/{lang}` · `/news` · `/news/[slug]` · `/category/[slug]` · `/tag/[slug]` · `/editorials` · `/search?q=` · `/photo-cards` · `/photo-cards/[slug]` · `/videos` · `/videos/[slug]` · `/login` · `/register` · `/bookmarks` · `/subscribe/confirm?token=` · `/subscribe/unsubscribe?token=` · `/robots.txt`

Pages render on demand (the build needs no API); unknown URLs and missing stories return a real 404.

## Reader session

Readers (comments, saved stories) get a JWT that is kept in `localStorage` (`hooks/use-reader.ts`). Trade-off: any script on the page can read it, so keep third-party scripts off the site; the token cannot do staff actions. To move it to an httpOnly cookie, change only that hook and add a Route Handler that forwards to the API.

## Docker

`Dockerfile` targets: `dev` (hot reload, used by compose) and `prod` (standalone output, non-root, health check).

```bash
docker build --target prod \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com -t sj-web .
docker run -p 3000:3000 -e API_INTERNAL_URL=https://api.example.com/api sj-web
```

## Not included yet

Admin dashboard UI (the API is ready), sitemap.xml, dark mode, reader email verification / password reset, tests.
