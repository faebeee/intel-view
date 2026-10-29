# Intel View

Intel View is a self-hostable **project intelligence board**: a place to dump freeform notes about anything you're investigating or tracking, then organize, visually connect, and query them — by hand, or through an AI agent.

The idea: instead of scattering research, evidence, logs, and files across a dozen tools, you keep everything as **notes** inside a **project**. Notes can be nested under one another, tagged, linked by reference, and dragged around a visual canvas to sketch out how they relate. Every change is recorded automatically, so you always have a full history of how your understanding evolved. And because the whole thing is also exposed as an **MCP server**, you (or an AI assistant like Claude) can read and write that same data directly from a chat — asking it to create notes, summarize a project, log an update, or look up what's connected to what.

It's built as a Turborepo monorepo with a decoupled [TanStack Start](https://tanstack.com/start) frontend and a [NestJS](https://nestjs.com/) + [TypeORM](https://typeorm.io/) REST API backed by PostgreSQL.

> **Status:** Early-stage / actively developed. APIs and data models may change without notice.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [User Handbook](#user-handbook)
  - [Dashboard: Projects & Project Groups](#dashboard-projects--project-groups)
  - [Working with Notes](#working-with-notes)
  - [Canvas View](#canvas-view)
  - [Tags](#tags)
  - [Note History](#note-history)
- [AI Agent Integration (MCP)](#ai-agent-integration-mcp)
- [Architecture](#architecture)
- [Getting Started (Self-Hosting / Development)](#getting-started-self-hosting--development)
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

## Core Concepts

A quick glossary before diving into the handbook:

- **Project** — the top-level container for everything else: a set of notes and a project-scoped tag palette. Everything you do in Intel View happens inside a project.
- **Project Group** — an optional, color-coded folder on the dashboard for organizing related projects (e.g. by client, case, or theme). A project belongs to at most one group, or none.
- **Note** — the core content unit. Every note has one of these types:
  - `standard` — freely-editable rich text, edited with a [Tiptap](https://tiptap.dev/)-based markdown editor.
  - `log` — an append-only note: instead of editing shared content, you append timestamped entries that are never edited or removed (good for running status updates / incident logs).
  - `file` — a note holding a single uploaded file (image, PDF, etc.), previewed inline where possible.
- **Nesting (parent/child)** — any note can be linked under one or more parent notes and can have one or more children, forming a graph (not just a strict tree) of related notes.
- **`[[NOTE_ID]]` references** — typing `[[123]]` inside a note's content links it to note `#123` without making it a parent/child — a lightweight, inline cross-reference, shown as a dashed connection on the Canvas view.
- **Tags** — a per-project color-coded palette (name + color) plus a free-text `tags` field on each note, which can reuse a palette name for consistent coloring or be any arbitrary word.
- **Note History** — every note automatically records `created`/`updated` entries with field-level diffs, so you can see exactly what changed and when.

## User Handbook

This section walks through how to actually use the app day-to-day.

### Dashboard: Projects & Project Groups

![Dashboard](./docs/dashboard.png)

The dashboard (home page) is where you land after opening Intel View. From here you can:

- **Create a project** — give it a name, description, and a color. This is your workspace for one investigation/topic.
- **Create a project group** — an optional color-coded folder to visually cluster related projects together on the dashboard. Manage groups from the "Manage Project Groups" dialog on the home page; assign a project to a group (or unassign it) when creating/editing the project.
- Click into a project to open its own dashboard, opening straight into its Canvas view.

### Working with Notes

![Notes](./docs/notes.png)

The **Notes** tab is where content lives. On the left is a tree of every note in the project (respecting parent/child nesting); on the right is the editor for whichever note is selected.

- **Create a note** — pick a type (`standard`, `log`, `url`, `ip`, or `file`) from the "New Note" dialog. Optionally create it as a child of the currently-selected note.
- **Edit content** — `standard` notes use a rich markdown editor with a toolbar (headings, lists, links, and note-reference autocomplete for `[[NOTE_ID]]` links). Changes autosave a moment after you stop typing.
- **Log entries** — on a `log` note, instead of editing shared content you append new timestamped entries; older entries stay immutable.
- **Files** — on a `file` note, upload a single file (stored privately in MinIO and proxied by the API); images preview inline.
- **Nest notes** — drag a note onto another in the tree (or set its parent when creating it) to nest it; a note can have multiple parents. Cycles and self-parenting are rejected automatically.
- **Tag a note** — add tag names in the note's tag field; reuse palette names for consistent coloring across the project.
- **Delete a note** — soft-deletes it (and cascades to its descendants); nothing is destroyed at the database level, so recovery/audit is always possible in principle.

### Canvas View

![Canvas](./docs/canvas.png)

The **Canvas** tab is a free-form, node-based workspace (via [`@xyflow/react`](https://reactflow.dev/)) for visually arranging and linking notes.

- Every note is a draggable node; its position is saved per-note (`canvasX`/`canvasY`), so your layout persists.
- **Drag from one node's handle to another** to create a parent/child connection between them.
- Delete a connection by selecting its edge and pressing delete (only hierarchy connections are deletable this way — `[[NOTE_ID]]` reference edges are read-only here, shown dashed).
- Click a node to select it and open its details panel; click empty canvas space to deselect.

### Tags

The **Tags** page (and the tag fields on notes) let you build a consistent, color-coded vocabulary across a project: define a palette of named, colored tags, then apply them to notes. Notes can also carry ad-hoc free-text tags that aren't in the palette — useful for one-off labels you don't want to formalize.

### Note History

Every note keeps its own automatic audit trail — open a note's history panel to see a chronological list of `created`/`updated` entries with the exact fields that changed. `log`-type notes additionally expose their append-only entry sequence, which is separate from this audit trail (the log entries are the *content*; the history is the *metadata* about edits).

## AI Agent Integration (MCP)

Intel View ships with a built-in [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server, so an AI assistant (Claude Desktop, Claude Code, or any other MCP-compatible client) can read and write your projects, notes, project groups, and tags directly — no copy/pasting context back and forth.

This is useful for things like: *"Summarize everything logged on the Acme incident this week,"* *"Create a new note under project #4 with today's findings,"* *"What notes are tagged `suspicious` across all projects?"*, or *"Append a log entry to the deployment tracker."*

### How it works

- Built with [`@rekog/mcp-nest`](https://www.npmjs.com/package/@rekog/mcp-nest) on top of the official MCP SDK, using the **Streamable HTTP** transport.
- The MCP server rides on the **same host/port as the REST API** — no separate service or port to run.
- Endpoint: `http://<api-host>:4010/mcp` (e.g. `http://localhost:4010/mcp` in local dev).

### Connecting a client

Point your MCP client at the Streamable HTTP endpoint above. The exact configuration keys vary by client/version, but for an HTTP-based remote MCP server (e.g. Claude Desktop/Code), it typically looks like:

```json
{
  "mcpServers": {
    "intel-view": {
      "url": "http://localhost:4010/mcp",
      "transport": "http"
    }
  }
}
```

> **Security note:** There is currently **no authentication** on the MCP endpoint — anything that can reach the API host can call these tools. Don't expose port `4010` (or the MCP path specifically) to an untrusted network without putting it behind your own auth layer (e.g. a reverse proxy requiring a token or client-cert), especially since the tools below include full create/update/delete access.

### Available tools

27 tools are exposed across four domains, mirroring the REST API:

| Domain            | Tools                                                                                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notes**          | `create_note`, `list_notes`, `get_note`, `update_note`, `delete_note`, `add_note_parent`, `remove_note_parent`, `add_note_child`, `remove_note_child`, `get_note_history`, `create_note_log_entry`, `list_note_log_entries` |
| **Projects**       | `create_project`, `list_projects`, `get_project`, `update_project`, `delete_project`                                                                                                                                                        |
| **Project Groups** | `create_project_group`, `list_project_groups`, `get_project_group`, `update_project_group`, `delete_project_group`                                                                                                                          |
| **Tags**           | `create_tag`, `list_tags`, `get_tag`, `update_tag`, `delete_tag`                                                                                                                                                                             |

File upload/download isn't exposed via MCP (binary transfer doesn't map cleanly to a tool call), so `file`-type notes must still be managed from the web UI. Everything else — creating/reading/updating/deleting projects, notes, relations, log entries, and tags — is fully available to an agent.

## Architecture

```
apps/web  (TanStack Start, Vite, React 19)  ───▶  apps/api  (NestJS, TypeORM)  ───▶  PostgreSQL
     │                                                  │
     │                                                  └── exposes ──▶ MCP server (/mcp, Streamable HTTP)
     └── consumes ────────────────────────▶ packages/sdk (generated OpenAPI client)
```

- **`apps/web`** — the user-facing single-page application. Server-rendered via TanStack Start/Vite/Nitro, styled with Tailwind CSS v4 and shadcn-style primitives.
- **`apps/api`** — the REST API. Exposes `/projects`, `/project-groups`, `/projects/:projectId/notes` (plus nested `/history` and `/log-entries` sub-resources), and `/projects/:projectId/tags`, documented via Swagger — plus the `/mcp` endpoint described above.
- **`packages/sdk`** — a typed API client (`@repo/sdk`) generated from the API's OpenAPI schema using [`@hey-api/openapi-ts`](https://heyapi.dev/). The web app never hand-writes fetch calls; it imports generated functions and types from this package.
- **`packages/ui`** — shared, framework-level React primitives (`@repo/ui`) available to any app in the workspace.
- **`packages/eslint-config`** / **`packages/typescript-config`** — shared lint and TypeScript configuration used across all workspaces.

## Getting Started (Self-Hosting / Development)

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) 11.x (this repo uses npm workspaces, not pnpm/yarn)
- [Docker](https://www.docker.com/) (for the local PostgreSQL database and MinIO object storage)

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

This starts a PostgreSQL 15 container (`intel-view-db`) on port `5432` with database `intel_view`, user `postgres`, password `postgres`, and a MinIO container (`intel-view-minio`) with its S3 API on port `9000` and its web console on port `9001` (user/password `minioadmin`).

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
- MCP endpoint: <http://localhost:4010/mcp>

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
| `apps/api`                   | NestJS REST API (+ MCP server) with TypeORM + PostgreSQL, served on port `4010`. |
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
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `apps/api/.env`     | `DATABASE_URL`  | Postgres connection string used by the **TypeORM CLI** (`schema:sync`, migrations, seed script). | `postgresql://postgres:postgres@localhost:5432/intel_view` |
| `apps/api/.env`     | `DB_HOST`       | Postgres host used by the **running NestJS app** (`app.module.ts`). Defaults to `localhost`.     | `localhost`                                                |
| `apps/api/.env`     | `DB_PORT`       | Postgres port used by the running app. Defaults to `5432`.                                       | `5432`                                                     |
| `apps/api/.env`     | `DB_USERNAME`   | Postgres username used by the running app. Defaults to `postgres`.                               | `postgres`                                                 |
| `apps/api/.env`     | `DB_PASSWORD`   | Postgres password used by the running app. Defaults to `postgres`.                               | `postgres`                                                 |
| `apps/api/.env`     | `DB_DATABASE`   | Postgres database name used by the running app. Defaults to `intel_view`.                        | `intel_view`                                               |
| `apps/api/.env`     | `APP_URL`       | Origin allowed by CORS for the web app, in addition to two hardcoded origins in `main.ts` (`http://192.168.50.15:4000` and `http://intel.local:4000`). Defaults to `http://localhost:4000`. | `http://localhost:4000` |
| `apps/api/.env`     | `PORT`          | Port the NestJS server (and the `/mcp` endpoint) listens on. Defaults to `4010`.                 | `4010`                                                     |
| `apps/api/.env`     | `MINIO_ENDPOINT` | Host of the MinIO server backing `file` notes. Defaults to `localhost`.                         | `localhost`                                                |
| `apps/api/.env`     | `MINIO_PORT`    | MinIO API port. Defaults to `9000`.                                                              | `9000`                                                     |
| `apps/api/.env`     | `MINIO_USE_SSL` | Whether to talk to MinIO over HTTPS. Defaults to `false`.                                        | `false`                                                    |
| `apps/api/.env`     | `MINIO_ACCESS_KEY` | MinIO access key. Defaults to `minioadmin`.                                                   | `minioadmin`                                               |
| `apps/api/.env`     | `MINIO_SECRET_KEY` | MinIO secret key. Defaults to `minioadmin`.                                                   | `minioadmin`                                               |
| `apps/api/.env`     | `MINIO_BUCKET`  | Bucket that note files are stored in; created on API startup if missing. Defaults to `intel-view-files`. | `intel-view-files`                              |
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
- `api` — built from `apps/api/Dockerfile`, listens on port `4010` (also serving `/mcp`). CORS accepts the API's `APP_URL` env var plus the hardcoded `http://intel.local:4000` and `http://192.168.50.15:4000` origins (see `apps/api/src/main.ts`) — adjust these if your deployment uses a different hostname.
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
