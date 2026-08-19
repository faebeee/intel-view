# Intel View — Web App

The Intel View frontend: a [TanStack Start](https://tanstack.com/start) single-page application (Vite + React 19 + [TanStack Router](https://tanstack.com/router)) for browsing projects, editing notes, and visualizing them on a map or canvas.

> This app is **not** Next.js. Routing, SSR, and server functions are provided by TanStack Start/Router running on top of Vite, with [Nitro](https://nitro.build/) as the server adapter.

---

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (file-based routing via [TanStack Router](https://tanstack.com/router))
- **Build tool**: [Vite](https://vitejs.dev/) 8
- **UI**: React 19, Tailwind CSS v4, [`@base-ui/react`](https://base-ui.com/) + [shadcn](https://ui.shadcn.com/)-style components in `src/components/ui/`
- **Data fetching**: [TanStack Query](https://tanstack.com/query) + the generated `@repo/sdk` OpenAPI client
- **Map**: [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/)
- **Canvas**: [`@xyflow/react`](https://reactflow.dev/)
- **Rich text editing**: [Tiptap](https://tiptap.dev/) (`tiptap-markdown`)
- **i18n**: [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- **Linting/formatting**: [Biome](https://biomejs.dev/)
- **Server adapter**: [Nitro](https://nitro.build/)

## Getting Started

From the repository root, make sure dependencies are installed and the API is reachable (see the [root README](../../README.md) for full setup, including PostgreSQL via Docker).

```bash
# From this directory
npm run dev

# Or from the workspace root
npx turbo run dev --filter=web
```

The dev server runs on **http://localhost:4000**.

### Environment Variables

Create `apps/web/.env`:

| Variable        | Description                                  | Example                 |
| --------------- | -------------------------------------------- | ----------------------- |
| `NITRO_API_URL` | Base URL of the Intel View API (`apps/api`). | `http://localhost:4010` |

> `apps/web/src/routes/__root.tsx` actually reads `process.env.VITE_API_URL` at request time to configure the SDK client (falling back to `http://localhost:4010` if unset). In local dev only `NITRO_API_URL` is set, so this relies on the fallback matching the API's default port. The Docker image (`apps/web/Dockerfile`) explicitly bridges `NITRO_API_URL` into `VITE_API_URL` for both build and runtime, so this only matters if you run the app outside Docker against a non-default API URL — in that case also export `VITE_API_URL` with the same value.
>
> Separately, `vite.config.ts` reads `process.env.HOST` for the dev server's `allowedHosts` setting (defaults to `localhost`) — this is unrelated to the API URL and only affects which hostnames may reach the local Vite dev server.

## Building for Production

```bash
npm run build
node dist/server/index.mjs
```

The build output is a self-contained Node server (via Nitro). Push the `dist/` directory to any Node-compatible host (Fly.io, Render, a VPS, etc.) and run the command above. For platform-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.), see the [Nitro deployment docs](https://v3.nitro.build/deploy).

## Project Structure

```
src/
├── components/ui/     # Shared shadcn-style UI primitives (Button, Card, Dialog, ...)
├── features/           # Feature-scoped code, one folder per domain area
│   ├── canvas/         # Node-based canvas view (@xyflow/react)
│   ├── map/             # Leaflet map view, markers, connection lines
│   ├── notes/           # Note CRUD, editor, history UI
│   ├── projects/        # Project CRUD and overview
│   └── tags/             # Tag management
├── integrations/        # Third-party integration wiring (TanStack Query providers/devtools)
├── lib/                  # Small shared utilities (API error handling, cn/utils)
├── paraglide/            # Generated i18n runtime and messages — do not hand-edit
├── routes/                # File-based TanStack Router routes
├── routeTree.gen.ts       # Generated route tree — do not hand-edit
└── styles.css             # Tailwind v4 entry point and theme tokens
```

### Import Aliases

Both `#/*` and `@/*` resolve to `./src/*` (see `tsconfig.json`). Prefer `#/*` to match existing imports, e.g.:

```ts
import { Button } from "#/components/ui/button";
```

### Routing

Routes are file-based under `src/routes/`. Adding a file automatically registers a route; `routeTree.gen.ts` is regenerated for you by the dev server or `npm run generate-routes`. See the [TanStack Router docs](https://tanstack.com/router) for loaders, layouts, and navigation patterns.

### Data Fetching

All API calls go through the generated `@repo/sdk` client together with TanStack Query, e.g.:

```ts
import { projectControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

const { data } = useQuery({
  queryKey: ["projects"],
  queryFn: () => projectControllerFindAll(),
});
```

If you change an API endpoint or DTO in `apps/api`, regenerate the SDK from the workspace root:

```bash
npx turbo run generate --filter=@repo/sdk
```

### Styling

This project uses [Tailwind CSS v4](https://tailwindcss.com/) via the `@tailwindcss/vite` plugin (see `vite.config.ts`) — there is no `tailwind.config.js`/`.ts` and no PostCSS config. Theme tokens, custom variants, and animations live in `src/styles.css`.

### i18n

Messages live in `project.inlang/messages`. URLs are localized through the Paraglide Vite plugin and router `rewrite` hooks. Running the dev server or build regenerates the `src/paraglide` outputs — never hand-edit files under `src/paraglide/`.

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) (`biome.json`), not ESLint/Prettier, for its own scripts:

```bash
npm run lint
npm run format
npm run check
```

## Learn More

- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Nitro](https://nitro.build/)
