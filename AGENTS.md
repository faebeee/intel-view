# Agent Instructions

## Workspace Architecture & Boundaries
This is an npm-based Turborepo monorepo with the following boundaries:
- `apps/web` (Next.js, Port 3000): Primary web application.
- `apps/api` (NestJS, Port 4010): Primary Backend API application. Uses TypeORM with PostgreSQL.
- `packages/ui`: Shared React primitives (`@repo/ui`).
- `packages/eslint-config` & `packages/typescript-config`: Shared tooling configurations.

## Database & Infrastructure
- A local PostgreSQL database is configured via the root `docker-compose.yml`.
  - Service: `db`
  - Database name: `intel_view`
  - Port: `5432` (User: `postgres`, Password: `postgres`)
- `apps/api` connects via TypeORM. Environment variables override defaults: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.

## Framework Quirks & Gotchas
- **Tailwind CSS v4 & shadcn/ui** (only in `apps/web`):
  - Configured using `@tailwindcss/postcss` and PostCSS (`postcss.config.mjs`).
  - No `tailwind.config.js` or `tailwind.config.ts` exists or should be created.
  - Customize styles, themes, and animation configs exclusively in `apps/web/app/globals.css` using Tailwind v4 `@theme inline` and custom properties.
  - Components are scaffolded in `apps/web/components/ui/` using `@base-ui/react` primitives.
- **Import Aliases**:
  - The path alias `@/*` inside `apps/web` resolves to `./*` (the root of `apps/web`). Components should be imported as `@/components/ui/...`.

## Developer Commands & Verification
Always run verification scripts to ensure work is stable before completion:
- Build entire workspace: `npm run build`
- Run linting: `npm run lint`
- Run typecheck: `npm run check-types`

### Targeting Specific Packages
To target only `apps/web` or `apps/api`, use Turbo filters:
- Build: `npx turbo run build --filter=web` or `--filter=api`
- Lint: `npx turbo run lint --filter=web` or `--filter=api`
- Typecheck: `npx turbo run check-types --filter=web` or `--filter=api`
- Start dev server: `npx turbo run dev --filter=web` or `--filter=api`
