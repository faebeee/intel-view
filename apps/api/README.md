# Intel View Backend API

This is the primary REST API for Intel View, built with [NestJS](https://github.com/nestjs/nest) and [TypeORM](https://typeorm.io/) on top of [Express](https://expressjs.com/).

---

## Technical Stack & Libraries

- **Framework**: NestJS v11
- **Database**: PostgreSQL (via TypeORM)
- **Pagination**: `nestjs-paginate`
- **Documentation**: Swagger (OpenAPI)

---

## Domain Model

| Entity             | Description                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Project`          | Top-level container for notes and tags. Has a `mapStyle` (`dark`/`light`/`street`/`satellite`) used by the web app's map view.                                                             |
| `Note`             | The core content unit. Has a `type` (`markdown`/`iframe`/`log`), optional geolocation (`lat`/`lng`), optional canvas position (`canvasX`/`canvasY`), and can be nested under a `parentId`. |
| `NoteHistoryEntry` | Immutable audit-trail record of changes to a `Note` (`created`, `updated`, or freeform `manual` entries for `log` notes). Created automatically by `NoteService`.                          |
| `Tag`              | A color-coded label scoped to a `Project`.                                                                                                                                                 |

All entities extend `BaseEntity` (`id`, `createdAt`, `updatedAt`, `deletedAt`) and use **soft deletion** — see [Code Quality Standards](#code-quality-standards) below.

---

## Setup & Running the Server

### 1. Requirements

Ensure you have the PostgreSQL docker container running:

```bash
# From workspace root
docker compose up -d
```

### 2. Configure environment variables

Create `apps/api/.env`. This service uses **two separate DB connection mechanisms** — keep both in sync when pointing at a non-default database:

- **The running NestJS app** (`src/app.module.ts`, `TypeOrmModule.forRoot`) connects using discrete variables, each defaulting to the `docker-compose.yml` values:
  - `DB_HOST` (default `localhost`)
  - `DB_PORT` (default `5432`)
  - `DB_USERNAME` (default `postgres`)
  - `DB_PASSWORD` (default `postgres`)
  - `DB_DATABASE` (default `intel_view`)
- **Standalone TypeORM CLI commands** (`schema:sync`, `seed`, migrations) use `src/features/database/datasource.ts`, which requires a single connection string and throws at startup if missing:
  - `DATABASE_URL` — e.g. `postgresql://postgres:postgres@localhost:5432/intel_view`

Additional variables:

- `APP_URL` — origin allowed by CORS for the web app (default `http://localhost:4000`)
- `PORT` — port the server listens on (default `4010`)

### 3. Run the App

```bash
# From this directory:
npm run dev

# Or from workspace root:
npx turbo run dev --filter=api
```

The server will run on port `4010` (or `process.env.PORT`).

> In development, `TypeOrmModule.forRoot` is configured with `synchronize: true`, so the database schema is created/updated automatically from entity definitions — no manual migration is required to get started. Use `schema:sync` explicitly, or write proper migrations, before relying on this in production.

### 4. Seed sample data (optional)

```bash
npm run seed
```

---

## API Documentation (Swagger)

We provide comprehensive Swagger documentation generated automatically.

- **Swagger UI**: Access at `/docs` (e.g. `http://localhost:4010/docs`).
- **Standard Decorators**:
  - Controllers must be decorated with `@ApiTags('<feature>')`.
  - Endpoints must be decorated with `@ApiOperation({ summary: '...' })` and appropriate `@ApiResponse(...)` blocks.
  - All request and response DTO properties must utilize `@ApiProperty({ ... })`.

---

## Code Quality Standards

Future edits to this service must respect the following standards:

1. **TypeScript Typing**:
   - Explicit return types are required on all functions and methods.
   - Use of `any` is forbidden.
   - Prefer `type` over `interface`.

2. **Request Validation**:
   - Handled globally via `ValidationPipe` with options: `{ whitelist: true, transform: true, forbidNonWhitelisted: true }`.
   - Every DTO must use `class-validator` decorators.

3. **Data Serialization**:
   - Never return TypeORM database entities directly. Always map database objects to dedicated response DTOs to hide internal details, relationship tables, or fields (like `deletedAt`).

4. **Pagination (`nestjs-paginate`)**:
   - List endpoints must use `nestjs-paginate` for sorting, filtering, and searching.
   - Decorate pagination lists with `@ApiPaginationQuery(config)`.
   - Use `import type { PaginateQuery }` to prevent TS1272 build issues.

5. **Soft Deletion**:
   - Entities use soft deletion. Always filter active records with `where: { deletedAt: IsNull() }` (do NOT use `deletedAt: null`).

6. **Error Handling**:
   - Throw NestJS HTTP Exceptions directly from Services to cleanly bubble errors to client.

---

## Test Suites

Unit tests are implemented using Jest:

- Run tests: `npm run test`
- Run tests in watch mode: `npm run test:watch`
- Run test coverage: `npm run test:cov`
- Run end-to-end tests: `npm run test:e2e`
- Debug tests: `npm run test:debug`

_Note: Unit tests must mock all repository tokens and injectable providers (e.g., `getRepositoryToken(Entity)`) to run completely offline from database connections._

---

## Useful Scripts

| Script                | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `npm run dev`         | Start the server in watch mode on port `4010`.                              |
| `npm run build`       | Compile the NestJS app with `nest build`.                                   |
| `npm run start:prod`  | Run the compiled app from `dist/main`.                                      |
| `npm run schema:sync` | Sync the database schema from entities using the `DATABASE_URL` datasource. |
| `npm run seed`        | Populate the database with sample projects/notes/tags.                      |
| `npm run lint`        | Lint and auto-fix with ESLint.                                              |
