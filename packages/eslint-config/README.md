# `@repo/eslint-config`

Collection of shared ESLint configurations used across the Intel View monorepo.

## Usage

Each config is exported as a subpath and can be spread into a flat ESLint config:

```js
// eslint.config.mjs
import { config } from "@repo/eslint-config/base";

export default config;
```

| Export                               | Use case                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `@repo/eslint-config/base`           | Base rules shared by all packages (TypeScript, Prettier, Turbo).            |
| `@repo/eslint-config/react-internal` | Adds React/React Hooks rules for internal React packages (e.g. `@repo/ui`). |
| `@repo/eslint-config/next-js`        | Adds `@next/eslint-plugin-next` rules for Next.js-based apps.               |

> Note: `apps/api` uses its own ESLint setup (see `apps/api/eslint.config.mjs`), and `apps/web` uses [Biome](https://biomejs.dev/) instead of ESLint — this shared config currently applies to internal packages like `@repo/ui`.
