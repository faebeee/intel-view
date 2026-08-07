# syntax=docker/dockerfile:1

# ---- Base ----------------------------------------------------------------
# Build context MUST be the repository root, e.g.:
#   docker build -f apps/api/Dockerfile -t intel-view-api .
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Pin npm to the version required by the workspace's devEngines config.
RUN npm install -g npm@11.9.0

# ---- Dependencies ----------------------------------------------------------
# Installs full workspace dependencies (dev + prod) needed to run the build.
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
RUN npm ci --workspace=api --include-workspace-root

# ---- Build ------------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN npx turbo run build --filter=api

# Prune dev dependencies, keeping only what's needed to run the compiled app.
RUN npm prune --workspace=api --omit=dev

# ---- Runtime ------------------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

USER nestjs
WORKDIR /app/apps/api

EXPOSE 4010
ENV PORT=4010

CMD ["node", "dist/main.js"]
