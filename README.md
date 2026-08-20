# Intel View

Intel View is a self-hostable **project intelligence board**: organize freeform notes into projects, place them on an interactive map, connect them on a visual canvas, tag them, and track their full edit history over time.

It's built as a Turborepo monorepo with a decoupled [TanStack Start](https://tanstack.com/start) frontend and a [NestJS](https://nestjs.com/) + [TypeORM](https://typeorm.io/) REST API backed by PostgreSQL.

> **Status:** Early-stage / actively developed. APIs and data models may change without notice.

![Map Dark](./docs/map-dark.png)
![Map Bright](./docs/map-light.png)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Workspace Layout](#workspace-layout)
- [Development Commands](#development-commands)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

---

## Features

- **Projects** — top-level containers for grouping related notes and tags.
- **Notes** — the core content unit, supporting two note types:
  - `standard` — freely-editable rich text edited with a [Tiptap](https://tiptap.dev/)-based markdown editor.
  - `log` — an append-only note: instead of editing shared content, users append timestamped `NoteLogEntry` records that are never edited or removed.
  - Notes can be nested under a parent note (with cycle/self-parent protection and cascading soft-delete of descendants) and positioned on the canvas (`canvasX`/`canvasY`).
  - Geo-pins aren't a separate field — they're derived automatically by parsing `[[geo:LAT,LNG,LABEL]]` tokens out of a note's markdown content (inserted via a toolbar button in the editor), and re-synced whenever the content changes.
- **Note history** — every note automatically records `created`/`updated` audit entries with field-level diffs. `log` notes additionally have their own append-only `NoteLogEntry` sequence, separate from this audit trail.
- **Map view** — plot every geo-pin from a project's notes on an interactive [Leaflet](https://leafletjs.com/) map, with a choice of base map themes (street / satellite / light / dark / futuristic, independent from the app's own light/dark UI mode), and draw connecting lines between a note's own pins and between parent/child notes.
- **Canvas view** — a node-based visual workspace (via [`@xyflow/react`](https://reactflow.dev/)) for spatially arranging and linking notes.
- **Tags** — two complementary mechanisms: a per-project color-coded `Tag` registry (name + color) for defining a project's palette, and a free-text `tags: string[]` field stored directly on each note (which can reuse registry names for consistent coloring, or be arbitrary strings).
- **Internationalization** — UI strings are localized with [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (English and German out of the box).
- **Typed API client** — the frontend consumes a fully-typed SDK generated from the API's OpenAPI schema, so frontend and backend types never drift apart.

## Architecture

```
apps/web  (TanStack Start, Vite, React 19)  ───▶  apps/api  (NestJS, TypeORM)  ───▶  PostgreSQL
     │                                                  │
     └── consumes ────────────────────────▶ packages/sdk (generated OpenAPI client)
```

- **`apps/web`** — the user-facing single-page application. Server-rendered via TanStack Start/Vite/Nitro, styled with Tailwind CSS v4 and shadcn-style primitives.
- **`apps/api`** — the REST API. Exposes `/projects`, `/projects/:projectId/notes` (plus nested `/history`, `/log-entries`, and `/locations` sub-resources), and `/projects/:projectId/tags`, documented via Swagger.
- **`packages/sdk`** — a typed API client (`@repo/sdk`) generated from the API's OpenAPI schema using [`@hey-api/openapi-ts`](https://heyapi.dev/). The web app never hand-writes fetch calls; it imports generated functions and types from this package.
- **`packages/ui`** — shared, framework-level React primitives (`@repo/ui`) available to any app in the workspace.
- **`packages/eslint-config`** / **`packages/typescript-config`** — shared lint and TypeScript configuration used across all workspaces.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) 11.x (this repo uses npm workspaces, not pnpm/yarn)
- [Docker](https://www.docker.com/) (for the local PostgreSQL database)

### 1. Clone and install dependencies

```bash
git clone https://github.com/faebeee/intel-view.git
cd intel-view
npm install
```

### 2. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 15 container (`intel-view-db`) on port `5432` with database `intel_view`, user `postgres`, password `postgres`.

### 3. Configure environment variables

Create the `.env` files described in [Environment Variables](#environment-variables) below. At minimum, `apps/api/.env` and `apps/web/.env` are required to run the app locally.

### 4. Run the apps

```bash
npm run dev
```

This runs both `apps/web` and `apps/api` in parallel via Turborepo:

- Web app: <http://localhost:4000>
- API: <http://localhost:4010>
- Swagger docs: <http://localhost:4010/docs>

> The API uses `synchronize: true` for its TypeORM connection in development, so the schema is created automatically from entities on first boot — no manual migration step is required to get started.

### 5. (Optional) Seed sample data

```bash
npm run seed --workspace=api
```

## Workspace Layout

This is an npm-based Turborepo monorepo:

| Path                         | Description                                                           |
| ---------------------------- | --------------------------------------------------------------------- |
| `apps/web`                   | TanStack Start (Vite + React 19) frontend, served on port `4000`.     |
| `apps/api`                   | NestJS REST API with TypeORM + PostgreSQL, served on port `4010`.     |
| `packages/sdk`               | Generated, typed OpenAPI client (`@repo/sdk`) consumed by `apps/web`. |
| `packages/ui`                | Shared React primitives (`@repo/ui`).                                 |
| `packages/eslint-config`     | Shared ESLint configurations (`@repo/eslint-config`).                 |
| `packages/typescript-config` | Shared `tsconfig.json` bases (`@repo/typescript-config`).             |

Each app/package has its own README with more detail:

- [`apps/web/README.md`](./apps/web/README.md)
- [`apps/api/README.md`](./apps/api/README.md)
- [`packages/sdk/README.md`](./packages/sdk/README.md)
- [`packages/ui/README.md`](./packages/ui/README.md)

## Development Commands

All commands can be run from the repository root and are orchestrated by [Turborepo](https://turborepo.dev/):

```bash
npm install          # Install all workspace dependencies
npm run dev           # Run all apps in dev/watch mode
npm run build         # Build all apps and packages
npm run lint          # Lint all workspaces
npm run check-types   # Type-check all workspaces
npm run format        # Format the repo with Prettier
```

### Targeting a single workspace

Use Turborepo's `--filter` flag, or npm's `--workspace` flag, to target just one app:

```bash
npx turbo run dev --filter=web
npx turbo run dev --filter=api
npx turbo run build --filter=api
npx turbo run lint --filter=web
npx turbo run check-types --filter=api
```

### Regenerating the API client SDK

Whenever the API's endpoints or DTOs change, regenerate the typed client so the frontend stays in sync:

```bash
npx turbo run generate --filter=@repo/sdk
```

This fetches the live OpenAPI schema from `${VITE_API_URL}/docs-json` (configured via `packages/sdk/.env`), so the API must be running locally first.

## Environment Variables

| File                | Variable        | Description                                                                                      | Example                                                    |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `apps/api/.env`     | `DATABASE_URL`  | Postgres connection string used by the **TypeORM CLI** (`schema:sync`, migrations, seed script). | `postgresql://postgres:postgres@localhost:5432/intel_view` |
| `apps/api/.env`     | `DB_HOST`       | Postgres host used by the **running NestJS app** (`app.module.ts`). Defaults to `localhost`.     | `localhost`                                                |
| `apps/api/.env`     | `DB_PORT`       | Postgres port used by the running app. Defaults to `5432`.                                       | `5432`                                                     |
| `apps/api/.env`     | `DB_USERNAME`   | Postgres username used by the running app. Defaults to `postgres`.                               | `postgres`                                                 |
| `apps/api/.env`     | `DB_PASSWORD`   | Postgres password used by the running app. Defaults to `postgres`.                               | `postgres`                                                 |
| `apps/api/.env`     | `DB_DATABASE`   | Postgres database name used by the running app. Defaults to `intel_view`.                        | `intel_view`                                               |
| `apps/api/.env`     | `APP_URL`       | Origin allowed by CORS for the web app, in addition to two hardcoded origins in `main.ts` (`http://192.168.50.15:4000` and `http://intel.local:4000`). Defaults to `http://localhost:4000`. | `http://localhost:4000` |
| `apps/api/.env`     | `PORT`          | Port the NestJS server listens on. Defaults to `4010`.                                           | `4010`                                                     |
| `apps/web/.env`     | `VITE_API_URL`  | Base URL the web app uses to call the API. Read directly by `apps/web/src/routes/__root.tsx` (no fallback — the app asserts this is set at request time). | `http://localhost:4010` |
| `apps/web/.env`     | `PORT`          | Port the Vite dev server / Nitro server listens on. Defaults to `4000`.                          | `4000`                                                     |
| `packages/sdk/.env` | `VITE_API_URL`  | Base URL used to fetch the OpenAPI schema when regenerating the SDK.                             | `http://localhost:4010`                                    |

> **Why two sets of DB variables?** The running API (`app.module.ts`) connects using the discrete `DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD`/`DB_DATABASE` variables (with sensible defaults matching `docker-compose.yml`), while standalone TypeORM CLI commands (`npm run schema:sync`, `npm run seed`, migrations) use a single `DATABASE_URL` connection string via `src/features/database/datasource.ts`. Keep both in sync when pointing at a non-default database.

> **`VITE_API_URL` is required in `apps/web`.** Unlike earlier versions of this app, there's no hardcoded fallback: `apps/web/src/routes/__root.tsx` asserts `process.env.VITE_API_URL` is defined and throws at request time otherwise. Make sure it's set in `apps/web/.env` for local dev, and passed through for Docker/Podman builds and runtime (see [Docker Deployment](#docker-deployment) below).

None of the `.env` files are committed to git (see `.gitignore`) — create them locally before running the apps.

## Testing

```bash
npm run test --workspace=api   # Run the API's Jest unit tests
```

See [`apps/api/README.md`](./apps/api/README.md#test-suites) for coverage and e2e test commands.

## API Documentation

Once the API is running, interactive Swagger (OpenAPI) documentation is available at:

```
http://localhost:4010/docs
```

## Docker Deployment

Beyond running just the database container for local development, the full stack (API + web + Postgres) can be built and run with Docker Compose (or Podman Compose) using the multi-stage `apps/api/Dockerfile` and `apps/web/Dockerfile` (both expect the **repository root** as their build context):

```bash
VITE_API_URL=https://api.example.com docker compose up -d --build
```

- `db` — PostgreSQL 15, same as local dev.
- `api` — built from `apps/api/Dockerfile`, listens on port `4010`. CORS accepts the API's `APP_URL` env var plus the hardcoded `http://intel.local:4000` and `http://192.168.50.15:4000` origins (see `apps/api/src/main.ts`) — adjust these if your deployment uses a different hostname.
- `web` — built from `apps/web/Dockerfile`; `VITE_API_URL` is passed both as a build arg (baked into the client bundle and the Nitro server bundle via `apps/web/src/routes/__root.tsx`) and a runtime env var, and defaults to `http://intel.local:4010` if unset in `docker-compose.yml`. The build also runs `npx turbo run generate` first, so the API must be reachable at `VITE_API_URL` (or already running) at build time to regenerate `@repo/sdk` from its live OpenAPI schema.

For a from-source build of a single image, build with the repo root as context, e.g.:

```bash
docker build -f apps/api/Dockerfile -t intel-view-api .
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t intel-view-web .
```

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup instructions, coding standards, and the pull request process before opening a PR.

Backend and frontend code quality standards enforced across the project are documented in [`AGENTS.md`](./AGENTS.md).

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## License

Intel View is licensed under the [MIT License](./LICENSE).
