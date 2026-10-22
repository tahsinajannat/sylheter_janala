# API documentation

* **Interactive (Swagger UI):** `http://localhost:4000/api/docs` — try requests, use **Authorize** with a token from `POST /api/auth/login`.
* **Machine-readable:** `/api/docs/openapi.json` and `/api/docs/openapi.yaml`.
* **Source of truth:** [`backend/src/docs/openapi.yaml`](../backend/src/docs/openapi.yaml) (OpenAPI 3.0.3). The frontend generates its TypeScript types from it (`npm run api:types` in `frontend/`).

Swagger UI is on by default in development and **off in production**; set `API_DOCS_ENABLED=true` to expose it there.

## Conventions

| | |
|---|---|
| Success | `{ "data": …, "meta"?: { page, limit, total, totalPages } }` |
| Error | `{ "error": { "message", "details"? } }` — 400 validation, 401 auth, 403 role, 404, 409 conflict, 429 rate limit |
| Language | every public read needs `?lang=bn\|en` |
| Auth | `Authorization: Bearer <jwt>`; staff and reader tokens are not interchangeable |
| Slugs | unique per language, may be Bangla — URL-encode |

## Quick tour

```bash
curl "localhost:4000/api/home?lang=bn"
curl "localhost:4000/api/posts?lang=en&category=sylhet&limit=5"

TOKEN=$(curl -s localhost:4000/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"admin@sylheterjanala.local","password":"Admin@12345"}' | jq -r .data.token)
curl localhost:4000/api/admin/posts -H "authorization: Bearer $TOKEN"
```

## Keeping the spec honest

After changing a route or its zod schema, update `openapi.yaml` and validate:

```bash
cd backend && npm run docs:validate
```
