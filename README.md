# Intel View Monorepo

Intel View is an enterprise-grade Turborepo monorepo designed with a decoupled Next.js web application frontend and a robust, highly-typed NestJS REST API backend.

## Workspace Architecture & Boundaries

The codebase is organized into local services and shared tooling packages under an npm workspace setup:

- **`apps/web`** (Next.js, Port 3000): The main user interface, styled with Tailwind CSS v4 and built on Next.js 16.
- **`apps/api`** (NestJS, Port 4010): The high-performance backend REST API, utilizing TypeORM connecting to PostgreSQL.
- **`packages/ui`**: Shared React primitives and reusable component boundaries (`@repo/ui`).
- **`packages/eslint-config`**: Standardized configurations for ESLint.
- **`packages/typescript-config`**: Shared tsconfig patterns across all packages.

---

## Database & Infrastructure

A local PostgreSQL database is defined and running in Docker:

- **Container service**: `db`
- **Port**: `5432`
- **Default Database**: `intel_view`
- **Default Credentials**: User `postgres` / Password `postgres`

To spin up the database, run:
```bash
docker compose up -d
```

The NestJS server will automatically resolve connection parameters through default overrides or system environment variables (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`).

---

## Code Quality Standards & Guidelines

We enforce strict quality boundaries, type checking, and design principles across this repository:

### 1. TypeScript Strictness
- **Explicit Return Types**: All methods and functions MUST declare explicit return types. Implicit inference is forbidden.
- **No `any`**: The `any` keyword is completely prohibited. Use typed generics, specific union types, or `unknown` where applicable.
- **Type Aliases over Interfaces**: Strictly favor the `type` keyword for all data models, shape aliases, and interface/union structures.

### 2. NestJS Backend Architecture
- **Request Validation**: Configured globally with strict `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`). All DTO properties require validation decorators from `class-validator`.
- **Response Mapping**: Database entities are anemic (pure schema structures) and MUST NEVER be returned directly from Controllers. They must be explicitly mapped to dedicated Response DTOs before responding.
- **Pagination**: Use `nestjs-paginate` for all list and search endpoints. Provide proper configuration via `@ApiPaginationQuery(config)`.
- **Exceptions**: Throw standard NestJS HTTP exceptions directly from Services to bubble errors up naturally.
- **Database Transactions**: Utilize TypeORM's built-in transaction manager for multi-table updates.

### 3. Swagger (OpenAPI) Documentation
- Exposed at `/docs` (e.g. `http://localhost:4010/docs`).
- Full endpoint and DTO property decorator coverage required (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`).

---

## Development & Build Commands

Always run verification scripts before proposing changes:

- **Install Dependencies**: `npm install`
- **Start All Apps (Dev)**: `npm run dev`
- **Build Entire Workspace**: `npm run build`
- **Lint All Files**: `npm run lint`
- **Run All Typechecks**: `npm run check-types`
- **Run Tests**: `npm run test`

### Targeting specific apps (via Turborepo filters)
- **Build NestJS API**: `npx turbo run build --filter=api`
- **Build NextJS Web**: `npx turbo run build --filter=web`
- **Lint API Only**: `npx turbo run lint --filter=api`

---

## LLM/Agent Instructions
AI-based coding assistants and code-generation agents MUST strictly adhere to the guidelines detailed in [AGENTS.md](./AGENTS.md).
