# Intel View Backend API

This is the primary REST API for Intel View, built with [NestJS](https://github.com/nestjs/nest) and [TypeORM](https://typeorm.io/) on top of [Express](https://expressjs.com/).

---

## Technical Stack & Libraries
- **Framework**: NestJS v11
- **Database**: PostgreSQL (via TypeORM)
- **Pagination**: `nestjs-paginate`
- **Documentation**: Swagger (OpenAPI)

---

## Setup & Running the Server

### 1. Requirements
Ensure you have the PostgreSQL docker container running:
```bash
# From workspace root
docker compose up -d
```

### 2. Run the App
```bash
# From this directory:
npm run dev

# Or from workspace root:
npx turbo run dev --filter=api
```
The server will run on port `4010` (or `process.env.PORT`).

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
- Run test coverage: `npm run test:cov`

*Note: Unit tests must mock all repository tokens and injectable providers (e.g., `getRepositoryToken(Entity)`) to run completely offline from database connections.*
