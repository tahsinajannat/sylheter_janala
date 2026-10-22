# syntax=docker/dockerfile:1.7
#
# Targets:
#   dev  -> source is bind-mounted by docker-compose, restarts on change (node --watch)
#   prod -> small, non-root image with only production dependencies
#
#   docker build --target prod -t sylheter-janala-api ./backend

ARG NODE_VERSION=22-alpine

# ---------- deps: production dependencies only (cached layer) ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# ---------- dev ----------
FROM node:${NODE_VERSION} AS dev
ENV NODE_ENV=development
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---------- prod ----------
FROM node:${NODE_VERSION} AS prod
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run with `init: true` (compose) or `docker run --init` so signals are forwarded.
# Migrations run on boot when RUN_MIGRATIONS_ON_START=true (safe: advisory lock).
CMD ["node", "src/server.js"]
