# syntax=docker/dockerfile:1

# ---- Base ----------------------------------------------------------------
# Build context MUST be the repository root, e.g.:
#   docker build -f apps/web/Dockerfile -t intel-view-web .
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Pin npm to the version required by the workspace's devEngines config.
RUN npm install -g npm@11.9.0

# ---- Dependencies ----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/sdk/package.json ./packages/sdk/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
RUN npm ci --workspace=web --include-workspace-root

# ---- Build ------------------------------------------------------------------
# Build-time public env vars (baked into the client bundle) can be passed via
# --build-arg, e.g. --build-arg VITE_API_URL=https://api.example.com
FROM base AS build
ARG HOST
ENV HOST=${HOST}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN npx turbo run build --filter=web

# ---- Runtime ------------------------------------------------------------------
# Nitro's `node-server` preset produces a fully self-contained ".output"
# directory (server + bundled deps + public assets), so the runtime image
# only needs that folder — no node_modules install required.
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nitro -G nodejs

COPY --from=build /app/apps/web/.output ./.output

USER nitro

EXPOSE 4000
ENV PORT=4000
ENV HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
