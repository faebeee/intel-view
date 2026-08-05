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

## Backend (NestJS) Quality Standards

To ensure excellent, enterprise-grade code quality, prevent regressions, and enforce strict type safety, all agents must adhere to the following backend guidelines:

### 1. TypeScript Strictness & Typing
- **Explicit Return Types**: Every function and method MUST have an explicitly declared return type (e.g., `async findAll(...): Promise<Paginated<Note>>`). Do not rely on implicit type inference.
- **Forbidden `any`**: The use of `any` is strictly forbidden in the codebase. Use `unknown`, specific union types, or properly typed generics instead.
- **Type Preferences**: Strongly prefer the `type` keyword over `interface` for defining all data structures, model shapes, type aliases, and unions.

### 2. Request Validation & DTOs
- **Strict Validation Pipe**: NestJS uses a globally configured `ValidationPipe` with options:
  - `whitelist: true`
  - `transform: true`
  - `forbidNonWhitelisted: true`
- **Decorator Requirements**: Every property on request DTOs (e.g., `CreateNoteDto`) MUST have at least one explicit validation decorator from `class-validator` (e.g., `@IsString()`, `@IsOptional()`, `@IsNumber()`).
- **Entity to DTO Mapping**: Controllers MUST NOT return raw TypeORM database entities directly. All returned data must be mapped to dedicated Response DTOs (using mapping functions, classes, or class-transformer) to avoid exposing internal schema structures, relationship IDs, or tracking fields (like `deletedAt`).

### 3. Business Logic, Errors & Transactions
- **Anemic Entities**: Entities should remain anemic (pure data/column definitions). All business logic, computational logic, and domain validations must reside strictly within Services.
- **Exception Strategy**: Services may directly throw NestJS HTTP Exceptions (like `NotFoundException`, `BadRequestException`) to bubble errors up to the controller layer and clients.
- **Database Transactions**: For database operations writing to multiple tables or performing consecutive dependency-bound updates, always utilize TypeORM's built-in transaction manager.
- **Response Envelopes**: Use standard REST responses or the native pagination envelope returned by `nestjs-paginate` (including `data`, `meta`, and `links` fields). Do not wrap responses in arbitrary custom outer envelopes.

### 4. Database Queries & Pagination (`nestjs-paginate`)
- **Query Strategy**: All list/index endpoints must support pagination using `nestjs-paginate`.
- **Soft Deletion Filtering**: Always query active records by filtering with TypeORM's `IsNull()` on `deletedAt` (e.g., `where: { deletedAt: IsNull() }`). Do not use `deletedAt: null` as it raises strict TypeScript compile-time errors in this workspace.
- **Swagger Integration**: Decorate controller list methods with `@ApiPaginationQuery(config)` to generate full-featured sorting, filtering, and searching UI fields in Swagger.
- **Isolated Modules Compatibility (TS1272)**: Because this project builds with `"isolatedModules": true`, interfaces in decorated parameters trigger TS build errors if not imported as types. **Always** import `PaginateQuery` separately using `import type`:
  ```typescript
  import { Paginate, Paginated, ApiPaginationQuery } from 'nestjs-paginate';
  import type { PaginateQuery } from 'nestjs-paginate';
  ```

### 5. Swagger (OpenAPI) Documentation
- **API Expose Route**: Swagger is served at `/docs` (e.g., `http://localhost:4010/docs`).
- **Standard Decorators**: Decorate all controllers with `@ApiTags('<name>')` and endpoints with `@ApiOperation({ summary: '...' })` and appropriate `@ApiResponse(...)` blocks.
- **DTO Decorators**: Every request and response DTO property must include `@ApiProperty()` with accurate descriptions, types, and required/optional flags.

### 6. Tests
- Any addition or modification of controllers, services, or helpers must include/update corresponding NestJS unit test specs (`*.spec.ts`).
- Always mock repository tokens (using `getRepositoryToken(Entity)`) and other injected providers to ensure tests run completely independently of active database connections.

## Framework Quirks & Gotchas (Next.js/Frontend)
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
- Run unit tests: `npm run test` inside relevant package directories

### Targeting Specific Packages
To target only `apps/web` or `apps/api`, use Turbo filters:
- Build: `npx turbo run build --filter=web` or `--filter=api`
- Lint: `npx turbo run lint --filter=web` or `--filter=api`
- Typecheck: `npx turbo run check-types --filter=web` or `--filter=api`
- Start dev server: `npx turbo run dev --filter=web` or `--filter=api`
