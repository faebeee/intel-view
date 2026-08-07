# Contributing to Intel View

Thanks for your interest in contributing! This document explains how to set up the project locally, the standards we hold code to, and how to submit changes.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## Getting Started

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/intel-view.git
   cd intel-view
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local database:
   ```bash
   docker compose up -d
   ```
4. Create the required `.env` files as described in the [root README](./README.md#environment-variables).
5. Start the apps:
   ```bash
   npm run dev
   ```

See the [root README](./README.md) and the app-specific READMEs ([`apps/web`](./apps/web/README.md), [`apps/api`](./apps/api/README.md)) for more detail.

## Project Structure

This is an npm-based Turborepo monorepo:

- `apps/web` — TanStack Start (Vite + React) frontend
- `apps/api` — NestJS REST API (TypeORM + PostgreSQL)
- `packages/sdk` — generated, typed OpenAPI client consumed by `apps/web`
- `packages/ui` — shared React primitives
- `packages/eslint-config`, `packages/typescript-config` — shared tooling configs

## Development Workflow

Before opening a pull request, run the full verification suite from the repository root:

```bash
npm run build
npm run lint
npm run check-types
npm run test --workspace=api
```

You can also target a single workspace with Turborepo filters, e.g. `npx turbo run lint --filter=web`.

If you change any endpoint or DTO in `apps/api`, regenerate the frontend's typed client:

```bash
npx turbo run generate --filter=@repo/sdk
```

## Coding Standards

The full set of enforced conventions — TypeScript strictness, NestJS architecture rules, validation/DTO requirements, pagination, Swagger documentation, and frontend framework conventions — is documented in [`AGENTS.md`](./AGENTS.md). Highlights:

- **No `any`** anywhere in the codebase; prefer `unknown`, specific unions, or generics.
- **Explicit return types** on every function/method.
- Prefer `type` over `interface` for data shapes.
- NestJS controllers must **never** return raw TypeORM entities — always map to a response DTO.
- Every DTO property needs a `class-validator` decorator and a `@ApiProperty()`.
- List endpoints use `nestjs-paginate` with `@ApiPaginationQuery(config)`.
- Soft-deleted records are filtered with `where: { deletedAt: IsNull() }` — never `deletedAt: null`.
- New/changed controllers, services, or helpers must include or update matching `*.spec.ts` unit tests, mocking repository tokens (`getRepositoryToken(Entity)`) so tests never touch a real database.
- `apps/web` uses [Biome](https://biomejs.dev/) (not ESLint/Prettier) for its own lint/format checks.

## Commit Messages

Write clear, concise commit messages in the imperative mood (e.g. `Add tag color validation`, not `Added` or `Adds`). Keep the summary line under ~72 characters; add a body if the change needs more explanation.

## Submitting a Pull Request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/short-description
   ```
2. Make your changes, following the coding standards above.
3. Ensure `npm run build`, `npm run lint`, `npm run check-types`, and relevant tests all pass.
4. Push your branch and open a pull request against `main`.
5. Describe **what** changed and **why** in the PR description, and link any related issues.
6. Be responsive to review feedback — small, focused PRs are easier to review and merge quickly.

## Reporting Bugs & Requesting Features

Please use [GitHub Issues](https://github.com/faebeee/intel-view/issues) to report bugs or propose features. When filing a bug report, include:

- Steps to reproduce
- Expected vs. actual behavior
- Relevant logs, screenshots, or error messages
- Your environment (OS, Node version, browser, etc.)
