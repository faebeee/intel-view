# `@repo/sdk`

A generated, fully-typed TypeScript client for the Intel View API, built with [`@hey-api/openapi-ts`](https://heyapi.dev/) and [`@hey-api/client-fetch`](https://heyapi.dev/openapi-ts/clients/fetch).

This package is consumed by `apps/web` so the frontend never hand-writes `fetch` calls or duplicates API types — everything is generated directly from the API's live OpenAPI schema.

## Usage

```ts
import { projectControllerFindAll, type ProjectResponseDto } from "@repo/sdk";

const { data } = await projectControllerFindAll();
```

## Regenerating the Client

The client is regenerated from the running API's OpenAPI schema (`${API_URL}/docs-json`). Whenever endpoints or DTOs change in `apps/api`, regenerate the SDK:

```bash
# Ensure the API is running locally first (see apps/api/README.md)
npx turbo run generate --filter=@repo/sdk

# Or from this directory
npm run generate
```

### Environment Variables

Create `packages/sdk/.env`:

| Variable  | Description                                                                     | Example                 |
| --------- | ------------------------------------------------------------------------------- | ----------------------- |
| `API_URL` | Base URL of the running API used to fetch the OpenAPI schema during generation. | `http://localhost:4010` |

## Structure

```
src/
├── generated/       # (if present) intermediate generated output
└── index.ts         # Public entry point, re-exports from ./client
client/
├── index.ts          # Client configuration/instance
├── types.gen.ts       # Generated request/response/DTO types
├── schemas.gen.ts     # Generated JSON schemas
└── services.gen.ts    # Generated typed request functions (one per endpoint)
```

> Files under `client/` are generated — do not hand-edit them. Re-run `generate` instead.

## Scripts

| Script                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `npm run generate`    | Regenerate the client from the API's OpenAPI schema. |
| `npm run build`       | Type-check the package (`tsc --noEmit`).             |
| `npm run check-types` | Type-check the package (`tsc --noEmit`).             |
