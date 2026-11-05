# Tech Debt Remediation Tracker

> **Resume protocol.** Start a session by reading [§2 Progress Dashboard](#2-progress-dashboard)
> and the last entry in [§6 Session Log](#6-session-log). Pick the lowest-numbered `[ ]` task
> in the lowest-numbered incomplete phase.
>
> **Do not skip phases.** Phase 1 restores the CI/typecheck/test safety net. Until it is done,
> every later fix can regress silently — that is precisely how this debt accumulated.
>
> **On finishing a task:** flip the checkbox, run its `Verify` command, append a row to §6.
> **On finishing a phase:** update the §2 counts and re-measure the §2 metrics table.
>
> **Task IDs are permanent.** Never renumber. New work gets the next free ID in its phase.
> Dropped work stays in the doc as `[-]` with a reason.

**Status legend**

| Mark | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done and verified |
| `[-]` | Dropped — must state why |
| `[!]` | Blocked — must link to an entry in [§4 Open Decisions](#4-open-decisions) |

**Audit date:** 2026-11-05 · **Baseline commit:** `4cd887a` · **Total tasks:** 105

### Completed so far

| Task | Phase | Landed | One-line outcome |
|---|---|---|---|
| **TD-0.1** | 0 | `d20e2ef` | `execFile` + argv array — unauthenticated RCE closed, proven by reproducing the old behaviour. |
| **TD-0.2** | 0 | `d20e2ef` | `getCommand(): string[]`, `execute(argv)`, `formatCommand()` for display. |
| **TD-0.3** | 0 | `d20e2ef` | `assertExecutableNote` rejects non-IP content — stops nmap flag injection. |
| **TD-0.4** | 0 | `d20e2ef` | `command-container.service.spec.ts` + validator and nmap plugin specs. |
| **TD-0.6** | 0 | `7a5d5ab` | `synchronize` off in production; `DB_SYNCHRONIZE` opt-in until TD-4.1. |
| **TD-0.7** | 0 | working tree | Upload size/MIME limits **and** the download-side stored XSS they depended on. |
| **TD-1.3** | 1 | `d20e2ef` | Plugin registry spec rewritten — the only 5 API TS errors. |
| **TD-1.7** | 1 | `d20e2ef` | The only 6 failing API tests, both causes in those same specs. |

Net effect on the gates: **API TS errors 5 → 0**, **API failing tests 6 → 0**,
**API ESLint errors 46 → 0**. Phase 0 is not yet closed — its gate also requires
`npm audit` clean (**TD-0.14**, untouched).

Two Phase 0 items are not startable or not fixed: **TD-0.5** is blocked on
[OD-1](#od-1--container-socket-access-for-the-plugin-runner-open), and **TD-0.15** was
raised during TD-0.7.

---

## 2. Progress Dashboard

| Phase | Theme | Done | Est. | Status |
|---|---|---|---|---|
| [0](#phase-0--stop-the-bleeding) | Stop the bleeding | 6/15 | 1–2d | `[~]` |
| [1](#phase-1--restore-the-safety-net) | Restore the safety net | 2/19 | 2–3d | `[~]` |
| [2](#phase-2--fix-what-users-see) | Fix what users see | 0/9 | 2–3d | `[ ]` |
| [3](#phase-3--auth) | Auth | 0/10 | 3d | `[ ]` |
| [4](#phase-4--data-integrity) | Data integrity | 0/13 | 3–4d | `[ ]` |
| [5](#phase-5--cleanup) | Cleanup | 0/18 | 2–3d | `[ ]` |
| [6](#phase-6--refactor) | Refactor | 0/21 | ongoing | `[ ]` |
| | **Total** | **8/105** | **4–6w** | |

### Tracked metrics

Re-measure at the end of each phase. Commands run from the repo root unless noted.

**Last measured:** 2026-11-05, after TD-0.7.

| Metric | Baseline | Current | Target | Command |
|---|---|---|---|---|
| npm critical vulns | 11 | 11 | 0 | `npm audit` |
| npm high vulns | 25 | 25 | 0 | `npm audit` |
| API TS errors | 5 | **0** | 0 | `npx tsc --noEmit -p apps/api/tsconfig.json` |
| Web TS errors | 6 | 2 ⚠ | 0 | `npx tsc --noEmit -p apps/web/tsconfig.json` |
| API failing tests | 6 | **0** | 0 | `npm test --workspace=api` |
| API ESLint errors | 46 | **0** | 0 | `cd apps/api && npx eslint "src/**/*.ts"` |
| Web Biome diagnostics | 87 | 87 | <10 | `cd apps/web && npx biome lint src` |
| Packages with `check-types` | 1/5 | 1/5 | 5/5 | `npx turbo run check-types --dry=json` |
| Dead `components/ui` files | 49/66 | 49/66 | 0 | see **TD-5.1** |
| Hardcoded UI strings | ~228 | ~228 | 0 | see **TD-6.12** |
| Web LOC (excl. generated) | 17016 | 17016 | ~10800 | `find apps/web/src -name '*.ts*' \| grep -v paraglide \| grep -v routeTree.gen \| xargs wc -l` |
| API LOC | 8751 | 10388 ⚠ | ~7500 | `find apps/api/src -name '*.ts' \| xargs wc -l` |

**⚠ Web TS errors — do not trust this number.** It dropped 6 → 2 without anyone fixing the
source. `packages/sdk/client/` is gitignored and was regenerated locally on 2026-11-05,
which silently resolved **TD-1.4** and **TD-1.6**; a fresh clone still fails. This metric is
only meaningful once [D-2](#3-locked-decisions) is implemented (commit an `openapi.json`
snapshot, generate from it). The 2 remaining are TD-1.5 and a new unused-variable error in
`NotePluginsPanel.tsx:128`.

**⚠ API LOC — expect this to rise before it falls.** 8751 → 10388 is 5423 → 5881 non-test
(+458, the Phase 0 hardening) and 3328 → 4507 test (+1179). The ~7500 target is a Phase 5/6
outcome; adding the missing test coverage that Phase 0/1 demands moves it the other way
first. Tracking the split avoids reading this as a regression.

**Commands corrected 2026-11-05:** the ESLint and Biome rows previously specified
repo-root invocations that do not work — `npx eslint` from the root fails with
"couldn't find eslint.config", and `npx biome lint apps/web/src` fails with "nested root
configuration". Both now run from their workspace.

---

## 3. Locked Decisions

Settled 2026-11-05. Do not re-litigate without recording a new entry in §6.

| # | Area | Decision |
|---|---|---|
| D-1 | Scope | All six phases, worked in sequence. |
| D-2 | SDK distribution | Commit a generated `openapi.json` snapshot; generate `packages/sdk/client/` at build time from that file, not from a live API. |
| D-3 | Plugin / Kali | Harden, do not remove. `execFile` + argv array + IP validation. |
| D-4 | Formatter | Biome everywhere. Prettier removed from root and `apps/api`. |
| D-5 | Auth model | Single-tenant login gate via `better-auth`. No `User`-per-record ownership, no multi-tenancy. |
| D-6 | `/mcp` | Disabled for now. Controllers stay in-tree, unregistered. |
| D-7 | i18n | Full Paraglide migration; keep and complete the German locale. |

---

## 4. Open Decisions

### OD-1 — Container socket access for the plugin runner `[open]`

**Blocks:** **TD-0.5**

The plugin feature shells into a sibling container. The API container has no container
runtime binary and no socket mounted, so the feature cannot work under `docker-compose`
today. Mounting `/var/run/docker.sock` into the API grants it host-root equivalence —
replacing an RCE with a privilege-escalation path is not obviously an improvement.

Options:
- **(a)** Mount the socket, accept the risk, document it loudly.
- **(b)** Separate privileged worker service that owns the socket; API talks to it over a
  narrow, allowlisted RPC.
- **(c)** Drop container exec entirely; run `nmap` in-process in the API container.

*Raised 2026-11-05 during audit. Owner: Fabs.*

---

## Phase 0 — Stop the bleeding

**Goal:** nothing remotely exploitable remains.
**Gate:** `npm audit` reports zero critical/high, and a test proves the shell injection is closed.

### TD-0.1 — Replace `exec` with `execFile` in the command container `[x]`

- **File:** `apps/api/src/features/plugin/command-container.service.ts:11`
- **Why:** `` execPromise(`podman exec intel-view-kali ${command}`) `` spawns `/bin/sh -c`.
  `command` originates from `` `nmap -sV -p- ${note.content}` `` and `note.content` is
  fully user-controlled via `POST /projects/:id/notes`. This is unauthenticated RCE.
- **Do:** `execFile(runtime, ['exec', 'intel-view-kali', ...argv])` — no shell, no interpolation.
- **Verify:** a note with content `1.1.1.1; touch /tmp/pwned` does not create `/tmp/pwned`.
- **Done (2026-11-05):** `execFile(CONTAINER_RUNTIME, ['exec', CONTAINER_NAME, ...argv], …)` in
  callback form (keeps it mockable without `promisify.custom`). Also added `timeout` and a
  16 MiB `maxBuffer` — Node's 1 MiB default truncates a full-port scan — an empty-argv guard,
  and an `ENOENT` → `ServiceUnavailableException` branch, since under `docker-compose` the API
  container has no `podman` binary. Verified against the old code side by side: `exec` with
  interpolation creates `/tmp/pwned`, `execFile` with argv does not.

### TD-0.2 — Change `NotePlugin.getCommand()` to return `string[]` `[x]`

- **Files:** `apps/api/src/features/plugin/plugin.interface.ts:25`,
  `plugins/nmap-service-scan/nmap-service-scan.plugin.ts:22`,
  `plugin.controller.ts:106-110,136-140` (uses the command string as the note title)
- **Why:** required by TD-0.1. The interface doc comment already says implementations
  "MUST sanitize" — no implementation does.
- **Verify:** `npx tsc --noEmit -p apps/api/tsconfig.json`
- **Done (2026-11-05):** `getCommand(note): string[]` and `execute(argv: string[])`. Added
  `formatCommand(argv)` in `plugin.interface.ts` for display-only rendering (shell-quoting
  unsafe elements) plus `PluginRegistryService.getCommandString()`; note titles and the
  `command` response use that. `PluginCommandResponseDto.command` deliberately stays a
  `string` — the web app never reads it (`pluginControllerGetCommand` has zero call sites),
  so there is no wire-format break and no SDK regeneration needed.
  `NmapServiceScanPlugin.preview()` is now derived from `getCommand()` so the previewed and
  executed commands cannot drift.

### TD-0.3 — Validate note content as an IP before plugin execution `[x]`

- **File:** `apps/api/src/features/plugin/plugin.controller.ts`
- **Do:** `node:net.isIP()` guard; reject with `BadRequestException` on failure.
- **Why:** defence in depth behind TD-0.1 — the argv array stops shell metacharacters,
  this stops nmap flag injection (`--script`, `-oN /etc/cron.d/x`).
- **Done (2026-11-05):** extracted to `executable-note.validator.ts` and called from
  `executeAndCreate`. Keyed on `note.type === 'ip'` rather than on the plugin: the controller
  is generic and cannot know a given plugin wants an IP, while every current plugin declares
  `noteTypes: ['ip']`. Note types without a registered validator pass through.

### TD-0.4 — Add `command-container.service.spec.ts` `[x]`

- **Why:** the single most dangerous file in the repo has no test.
- **Cover:** metacharacter injection, flag injection, non-zero exit, empty output.
- **Done (2026-11-05):** `command-container.service.spec.ts` (argv-not-string, `;`/`$()`/
  backticks/pipe/newline/`&&` passed verbatim, no `shell` option, timeout + maxBuffer,
  stdout/stderr/empty fallbacks, non-zero exit, `ENOENT`, empty argv). Flag injection is
  asserted where the guard actually lives: `executable-note.validator.spec.ts` and the
  400-response cases in `plugin.controller.spec.ts`. Also added
  `nmap-service-scan.plugin.spec.ts`, since `execute()` is newly live code.

### TD-0.5 — Switch `podman` → `docker` behind `CONTAINER_RUNTIME` env `[!]`

- **File:** `apps/api/src/features/plugin/command-container.service.ts:11`
- **Blocked by:** [OD-1](#od-1--container-socket-access-for-the-plugin-runner-open)
- **Why:** `podman` is hardcoded while `docker-compose.yml` is Docker-based.

### TD-0.6 — Gate `synchronize` on `NODE_ENV` `[x]`

- **File:** `apps/api/src/app.module.ts:40`
- **Why:** `synchronize: true` is unconditional and `apps/api/Dockerfile` sets
  `NODE_ENV=production`. Production auto-alters the schema on every boot.
  `features/database/datasource.ts:13` already correctly sets `false` — the two
  connection mechanisms contradict each other.
- **Do:** `synchronize: process.env.NODE_ENV !== 'production'` plus `migrationsRun: true`.
- **Done (2026-11-05), partially — `migrationsRun` deliberately NOT enabled.** Extracted
  `buildTypeOrmOptions()` / `shouldSynchronize()` into
  `features/database/typeorm.config.ts` (unit-tested) and reduced `app.module.ts` to
  `TypeOrmModule.forRoot(buildTypeOrmOptions())`. `synchronize` now defaults to
  `NODE_ENV !== 'production'`.
- **Why `migrationsRun: true` was dropped from this task:** it would take production down
  rather than protect it. The five existing migrations are decorative `ALTER`s that assume
  the base tables already exist (TD-4.1), so on boot they fail against a fresh database
  (no `note` table), *and* against an existing `synchronize`-built one —
  `RenameProjectGroupToProjectFolder` renames `project_group`, which never exists in a
  schema that `synchronize` built from today's entities. The `migrations` glob *is* now
  configured, so TD-4.1 only has to flip the flag.
- **`DB_SYNCHRONIZE` escape hatch:** turning sync off in production with no baseline
  migration means a fresh production database gets no schema at all. `DB_SYNCHRONIZE`
  (explicit `true`/`false`, anything else ignored so a typo cannot silently disable it)
  lets an operator opt back in deliberately. `docker-compose.yml` sets it to `'true'` with
  a comment, since the API image runs `NODE_ENV=production` and the stack would otherwise
  come up against empty tables. **Remove both once TD-4.1 lands.**
- **Follow-up for TD-0.12:** `DB_SYNCHRONIZE` must be documented in the `.env.example` files.

### TD-0.7 — Add upload size limit and MIME allowlist `[x]`

- **File:** `apps/api/src/features/note/note.controller.ts:295`
- **Why:** `FileInterceptor('file')` has no `limits`. Multer buffers the entire file in
  memory (`note.service.ts:70-75`), and `note.entity.ts:148` uses `bigint` for file size
  explicitly so ">2 GB is representable". Trivial OOM DoS.
- **Do:** `FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } })`, env-driven.
- **Done (2026-11-05):** `features/note/upload.config.ts` — `MAX_UPLOAD_BYTES` (default
  25 MiB) and `UPLOAD_MIME_ALLOWLIST` (comma-separated, supports `type/*`, and `*` as an
  explicit opt-out). Also caps `limits.files`/`limits.fields` so a multipart body cannot
  smuggle in unbounded extra parts. Unparseable env values fall back to the default rather
  than to "unlimited". Verified over real HTTP in
  `note.upload.integration.spec.ts`: **413** for an oversized upload, **415** for a
  non-allowlisted type, and in both cases `NoteService.uploadFile` is never reached, so
  nothing is buffered.
- **Default allowlist:** tuned for pentest evidence (images, reports, text, archives,
  pcaps, `application/octet-stream`) and deliberately omits `text/html`, `image/svg+xml`,
  `application/xhtml+xml` and the JavaScript types.
- **Scope extended — the allowlist alone was not a fix.** `file.mimetype` is just the
  client's `Content-Type` header, so an allowlist on it is advisory. What made the type
  dangerous was the *download* side: `GET /:id/file` served the stored type with
  `disposition: inline`, so uploading `evil.html` as `text/html` was **stored XSS on the
  API origin**. `features/note/download.config.ts` now serves `attachment` for everything
  except raster images (SVG excluded), and the route sets
  `X-Content-Type-Options: nosniff`. Images stay `inline` because `NoteFileEditorPane`
  renders them in an `<img>` tag.
- **Also fixed here:** the `Content-Disposition` filename was interpolated raw, so a
  filename containing CR/LF could inject response headers. It is now sanitised for the
  quoted `filename` and percent-encoded into an RFC 5987 `filename*`.
- **Follow-up for TD-0.12:** `MAX_UPLOAD_BYTES` and `UPLOAD_MIME_ALLOWLIST` need
  documenting in the `.env.example` files.

### TD-0.8 — Remove hardcoded LAN IP from the CORS allowlist `[ ]`

- **File:** `apps/api/src/main.ts:20-26`
- **Why:** `'http://192.168.50.15:4000'` (a developer's LAN machine) and `'http://intel.local:4000'`
  are permanently allowlisted with `credentials: true`.
- **Do:** derive from `APP_URL`, comma-separated.

### TD-0.9 — Require secrets in compose; unpublish DB and MinIO console ports `[ ]`

- **File:** `docker-compose.yml`
- **Why:** `postgres:postgres` and `minioadmin:minioadmin` are hardcoded, and
  `5432:5432` / `9001:9001` are published to the host.
- **Do:** `${POSTGRES_PASSWORD:?}` style required vars; `expose:` instead of `ports:` for `db`
  and the MinIO console.

### TD-0.10 — Fix trailing-space bug in compose build args `[ ]`

- **File:** `docker-compose.yml`
- **Why:** `VITE_API_URL: http://intel.local:4010 ` and `VITE_SDK_URL: http://api:4010 ` have
  a trailing space baked into the URL string. Live bug, not cosmetic.

### TD-0.11 — Pin Kali image by digest; add `user:` and resource limits `[ ]`

- **Files:** `docker/kali/Dockerfile`, `docker-compose.yml`
- **Why:** `FROM kalilinux/kali-rolling` is completely unpinned (no tag, no digest) on a
  rolling distro, runs as root, has `cap_add: [NET_RAW]`, `restart: always`, no resource
  limits, and shares a network with `db` and `minio`.
- **Do:** digest-pin, add `USER`, `apt-get` + `--no-install-recommends` + cache cleanup,
  add `mem_limit`/`pids_limit`, move to an isolated network.

### TD-0.12 — Add root `.env.example`; complete `apps/api/.env.example` `[ ]`

- **Why:** `apps/api/.env.example` omits `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`,
  `DB_DATABASE`, `APP_URL`, `PORT` — all read by `app.module.ts`/`main.ts`. No root example
  exists despite compose needing one.
- **Also:** change `intel.local` → `localhost` in `apps/api/.env.example`,
  `apps/web/.env.example`, `packages/sdk/.env.example`.

### TD-0.13 — Disable the `/mcp` transport `[ ]`

- **Files:** `apps/api/src/main.ts:38-41`, `apps/api/src/app.module.ts:25-29`
- **Why:** exposes 20 unauthenticated CRUD tools. See [D-6](#3-locked-decisions).
- **Do:** unregister the transport and module only. Leave the four MCP controllers in-tree.
  Re-enable decision deferred to **TD-6.5**.

### TD-0.14 — Resolve 11 critical and 25 high vulnerabilities `[ ]`

- **Why:** the entire `@tanstack/react-start*` server runtime, `vite` (arbitrary command
  execution via `launch-editor`, path traversal), `zod` (memory exhaustion, both apps),
  `tar`, `shell-quote`, `handlebars`, `proxy-addr`, and three MCP packages.
- **Note:** TanStack majors will break. Budget time; do not rush this one.
- **Verify:** `npm audit --audit-level=high` exits 0.

### TD-0.15 — Sanitise the file extension used to build the storage key `[ ]`

- **File:** `apps/api/src/features/storage/storage.service.ts:65-74`
- **Why:** `buildNoteFileKey` derives the object key's extension with
  `fileName.split('.').pop()` and does not validate it, so an upload named
  `a.foo/../../evil` yields the key `projects/1/notes/1/<ts>.foo/../../evil` — the
  attacker controls the key's path segments, not just its suffix. The filename itself is
  never used as a path segment, which is why this is contained, but the extension should be
  constrained to something like `[A-Za-z0-9]{1,10}` and dropped otherwise.
- **Found:** 2026-11-05 while doing TD-0.7. Not fixed there — out of that task's scope.

---

## Phase 1 — Restore the safety net

**Goal:** a clean clone can be type-checked, tested, and built with no services running,
and CI enforces it.
**Gate:** CI green on a fresh clone.

### TD-1.1 — Add `check-types` script to `apps/api` `[ ]`

- **File:** `apps/api/package.json`
- **Why:** no script exists, so `turbo run check-types` silently skips the API entirely.
  `tsconfig.build.json` also excludes `**/*spec.ts`, so `nest build` can never catch
  errors in tests.
- **Do:** `"check-types": "tsc --noEmit"`

### TD-1.2 — Add `check-types` script to `apps/web` `[ ]`

- **File:** `apps/web/package.json`
- **Why:** same — the root `npm run check-types` currently validates only
  `packages/sdk/src/index.ts`, about 15 lines of re-exports, and exits 0.

### TD-1.3 — Fix 5 TS errors in `plugin-registry.service.spec.ts` `[x]`

- **File:** `apps/api/src/features/plugin/plugin-registry.service.spec.ts:12,18,74,81,88`
- **Why:** mock objects are missing `noteType`/`executable`/`execute`/`getCommand` (TS2739);
  calls use the old `preview(id, note)` signature instead of `preview(plugin, note)` (TS2345).
- **Done (2026-11-05), out of order.** Pulled forward from Phase 1 because TD-0.2 rewrites the
  very interface this spec mocks, which would have made it worse, and TD-0.2's own `Verify`
  command is meaningless while it fails. The spec's `NotFoundException` assertions moved to
  `plugin.controller.spec.ts`, which is where plugin resolution now happens. Also removed the
  unused `NoteService` injection from `PluginRegistryService` — it was the reason the spec's
  testing module failed to resolve at runtime.

### TD-1.4 — Fix `ProjectPhase` missing `"completed"` `[ ]`

- **File:** `apps/web/src/features/projects/phases.ts:52,72`
- **Why:** TS2322/TS2353. The API added a `completed` phase (commit `006012e`); the SDK
  and frontend union were never updated.
- **Status check 2026-11-05: no longer reproduces locally, but NOT fixed.**
  `packages/sdk/client/types.gen.ts` was regenerated on 2026-11-05 and now contains
  `'completed'` in the `phase` union, so `tsc` passes here. That artifact is gitignored,
  so a fresh clone regenerates against whatever the API is at that moment — the error
  comes back if the API is not running, or is stale. Leave this open until
  [D-2](#3-locked-decisions) / **TD-1.10** make SDK output reproducible.

### TD-1.5 — Fix `CreateInlineNotePayload.title` mismatch `[ ]`

- **File:** `apps/web/src/features/canvas/components/CanvasViewContent.tsx:347` (TS2353)

### TD-1.6 — Fix broken plugin SDK imports in the web app `[ ]`

- **Files:** `apps/web/src/features/notes/hooks/useCreateNotePlugin.ts:1` (TS2724,
  no export `pluginControllerCreate`), `components/NotePluginsPanel.tsx:249` (TS2339,
  `executable` not on `PluginResponseDto`), `:128` (TS6133, unused `result`)
- **Depends on:** TD-1.10 (SDK regeneration)
- **Why:** the plugin "Create Note" and "Execute & Create" buttons are dead code paths today.
- **Status check 2026-11-05: partially stale, same caveat as TD-1.4.** After the local SDK
  regeneration, `pluginControllerCreate` and `PluginResponseDto.executable` both exist, so
  the TS2724 and TS2339 errors are gone. **The TS6133 unused `result` at
  `NotePluginsPanel.tsx:128` is still live** — the component awaits
  `executeAndCreateNote.mutateAsync(...)` and discards the created note. Keep open.

### TD-1.7 — Fix 6 failing API tests `[x]`

- **Files:** `plugin-registry.service.spec.ts:49` (DI fails — `NoteService` not provided to
  the testing module), `plugin.controller.spec.ts:13-16,90` (mock lacks `getPlugin`, which
  `plugin.controller.ts:174` calls)
- **Verify:** `npm test --workspace=api`
- **Done (2026-11-05), out of order, as a side effect of TD-1.3/TD-0.2.** Both root causes
  were in the two plugin specs that the Phase 0 work rewrote: the `NoteService` DI failure
  was fixed by deleting that injection from `PluginRegistryService` (it was never used),
  and `getPlugin` was added to the controller spec's mock. Confirmed by stashing the Phase 0
  changes and re-running: the baseline 6 failures were *all* in these two files.
  `npm test --workspace=api` now reports 24 suites / 326 tests, 0 failing.

### TD-1.8 — Delete the stock `app.e2e-spec.ts` `[ ]`

- **File:** `apps/api/test/app.e2e-spec.ts:19-24`
- **Why:** scaffold test asserting `GET /` returns `'Hello World!'`. There is no root
  controller; it returns 404. It is the only e2e test in the repo and it cannot pass.

### TD-1.9 — Add a `test` task to `turbo.json` and a root `test` script `[ ]`

- **Why:** `turbo.json` has no `test` task and the root `package.json` has no `test` script,
  so `npm run test` from the root fails with "Missing script". 17 API specs and 2 web tests
  are never run by the pipeline.

### TD-1.10 — Emit and commit an `openapi.json` snapshot `[ ]`

- **Do:** add an `apps/api` script using `SwaggerModule.createDocument()` in standalone mode
  (no HTTP server needed); commit the output.
- **Why:** implements [D-2](#3-locked-decisions). `packages/sdk/client` is gitignored and
  `packages/sdk/src/index.ts` is `export * from "../client/"` — so a clean clone cannot
  typecheck or build without first standing up Postgres, MinIO, and the API.

### TD-1.11 — Point the SDK generator at the committed snapshot `[ ]`

- **File:** `packages/sdk/openapi-ts.config.ts`
- **Also:** convert to pure ESM — it currently mixes `import { defineConfig }` with
  `require('dotenv').config()` on line 2.

### TD-1.12 — Add a CI check that `openapi.json` is in sync `[ ]`

- **Do:** regenerate in CI, fail on a non-empty diff.
- **Why:** the local SDK client was generated `Nov 3 15:56` while 10+ API source files are
  newer. Drift is already real, not hypothetical.

### TD-1.13 — Write the missing `scripts/build-web.sh` `[ ]`

- **Why:** referenced by `apps/web/Dockerfile:33,37` and `.gitignore:31`, but **there is no
  `scripts/` directory in the repo**. `docker compose up --build` fails from a clean clone.
- **Note:** TD-1.10/1.11 may make this script trivial or unnecessary — if so, remove the
  Dockerfile guard instead and mark this `[-]`.

### TD-1.14 — Fix `turbo.json` trailing commas `[ ]`

- **File:** `turbo.json` (end of the `generate` and `dev` task blocks)
- **Why:** `JSON.parse` fails. Turbo tolerates JSONC, but the declared
  `"$schema": "https://turborepo.dev/schema.json"` can never validate, and any JSON-based
  tooling or editor strict mode breaks.

### TD-1.15 — Fix `turbo.json` build outputs `[ ]`

- **File:** `turbo.json` — `outputs: [".next/**", "!.next/cache/**", "!.next/dev/**"]`
- **Why:** this is a Vite/Nitro + NestJS repo. `.next/` does not and will never exist.
  Confirmed via `turbo run build --dry=json`: every package including `@repo/sdk` gets
  `.next/**`. **Build caching is silently broken** — a cache HIT restores nothing, so
  `turbo run build` can report HIT while `dist/` and `.output/` are absent.
- **Do:** per-package `dist/**` (api) and `.output/**` (web).

### TD-1.16 — Declare build-time env vars in `turbo.json` `[ ]`

- **File:** `turbo.json`
- **Why:** `globalEnv` is only `["HOST"]`. `VITE_API_URL` is baked into the web bundle at
  build time but is not in the `build` task `env`, so **Turbo will serve a cached bundle
  built against a different API URL**. Real cache-poisoning bug in Docker builds.
- **Also:** `generate` declares `env: ["API_URL", ...]` but `API_URL` is used nowhere —
  the config reads `VITE_SDK_URL`. Remove it. Add `globalDependencies` for
  `package-lock.json` and shared tsconfigs.

### TD-1.17 — Add `.github/workflows/ci.yml` `[ ]`

- **Why:** `.github/` contains only issue templates. Zero automation. Meanwhile
  `CONTRIBUTING.md:97` and `pull_request_template.md` both instruct contributors to confirm
  commands that currently validate nothing.
- **Do:** `install → check-types → lint → test → build → audit`, plus a Docker build job.

### TD-1.18 — Remove `--fix` from the API lint script `[ ]`

- **File:** `apps/api/package.json` — `"lint": "eslint ... --fix"`
- **Why:** in CI this mutates the working tree and reports green. Add a separate
  `lint:fix` for local use.

### TD-1.19 — Clear 46 ESLint errors in `apps/api` `[ ]`

- **Files:** `note/entities/note.entity.ts:9-61` (41 errors — stray leading spaces),
  `plugin-registry.service.ts:18`, `plugin.controller.ts:22`, `plugin.module.ts:28`,
  `nmap-service-scan.plugin.ts:14` (spacing), `:34` (unused `command` param)
- **Note:** 45 are auto-fixable. Do this *after* TD-1.18 so the fix is an explicit commit.

---

## Phase 2 — Fix what users see

**Goal:** failures become visible, and no failure silently destroys data.

### TD-2.1 — Mount `<Toaster />` in the root route `[ ]`

- **File:** `apps/web/src/routes/__root.tsx:70-102`
- **Why:** `components/ui/sonner.tsx:40` exports `Toaster` and **zero files import it**.
  26 `toast.*` call sites across 15 files — including the shared `lib/api-error.ts:19`
  handler — are silently dropped. One-line fix, largest UX payoff in the doc.

### TD-2.2 — Enable `throwOnError` globally on the SDK client `[ ]`

- **File:** `apps/web/src/routes/__root.tsx:63`
- **Why:** `@hey-api/client-fetch` returns `{ data, error }` and does **not** throw by default.
  Exactly one call site opts in (`ApiHealthGate.tsx:25`). Consequences: a 500 on a list query
  renders an empty state; a failed mutation resolves, so React Query runs `onSuccess` and
  toasts "…created successfully".

### TD-2.3 — Delete the ~24 `res.data as T` response casts `[ ]`

- **Files:** all 10 query hooks and ~14 mutation call sites — see
  `useAllNotesQuery.ts:23`, `useCanvasNotesQuery.ts:24`, `useAllTagsQuery.ts:17`,
  `useAllProjectFoldersQuery.ts:18`, `useProjectsByFolderQuery.ts:23`, `useProjectQuery.ts:12`,
  `useProjectFolderQuery.ts:12`, `useNoteHistoryQuery.ts:19`, `useNoteLogEntriesQuery.ts:19`,
  `useNotePluginsQuery.ts:19`, `ProjectModal.tsx:66-69`, `TagModal.tsx:70`,
  `ProjectFolderModal.tsx:70`, `useCreateNote.ts:43`, `useUpdateNote.ts:37`,
  `useDeleteNote.ts:14`, `useNoteRelationMutations.ts:48,63,79,94`, `useUpdateProject.ts:15`,
  `NoteIpEditorPane.tsx:76`, `NoteUrlEditorPane.tsx:80`
- **Depends on:** TD-2.2

### TD-2.4 — Fix autosave marking failed saves as saved `[ ]`

- **File:** `apps/web/src/features/notes/hooks/useNoteDraftAutosave.ts:49,121-123`
- **Why:** sets `saveStatus = "saved"` and advances `savedRef` regardless of outcome.
  Combined with TD-2.2, this is **silent data loss** on every failed note save.
- **Depends on:** TD-2.2

### TD-2.5 — Add `errorComponent` and `pendingComponent` to all routes `[ ]`

- **Files:** `__root.tsx`, `index.tsx`, `tags.tsx`, `folders/$folderId.tsx`,
  `folders/ungrouped.tsx`, `projects/$projectId.tsx`, `projects/$projectId/index.tsx`
- **Why:** `errorComponent`/`pendingComponent`/`notFoundComponent`/`ErrorBoundary`/`CatchBoundary`
  have **zero matches** across the app. Any render throw white-screens the SSR'd app.

### TD-2.6 — Add `isError` branches to the 10 query call sites `[ ]`

- **Why:** `isError` is referenced exactly once in the entire codebase
  (`ApiHealthGate.tsx:22`). `folders/$folderId.tsx:83` and `projects/$projectId/index.tsx:117`
  currently show "not found" when the API actually errored.

### TD-2.7 — Sanitize `dangerouslySetInnerHTML` on note content `[ ]`

- **File:** `apps/web/src/components/ui/markdown.tsx:60-61`
- **Why:** stored XSS. The `biome-ignore` claims "safe use of parsed markdown content from
  trust database", but `@tanstack/markdown` is not a sanitizer and note content is fully
  user-controlled via `NoteContentEditor`. Raw `<img onerror>` executes.
- **Do:** DOMPurify or an allowlist renderer; remove the incorrect justification comment.

### TD-2.8 — Fix unconditional `prose-invert` `[ ]`

- **Files:** `apps/web/src/components/ui/markdown.tsx:51`, `markdown-editor.tsx:292`
- **Why:** the comment at `markdown.tsx:48-51` asserts "no `.dark` class is ever toggled on
  the document". That is **false** — `theme-provider.tsx:51` toggles it and `__root.tsx:69`
  sets it server-side. Result: light text on light background in light mode.
- **Do:** `dark:prose-invert`; delete the stale comment.

### TD-2.9 — Set `QueryClient` defaults; delete the empty provider `[ ]`

- **File:** `apps/web/src/integrations/tanstack-query/root-provider.tsx:3-10`
- **Why:** `getContext()` returns a bare `new QueryClient()` — no `staleTime` (every mount
  refetches), no `retry` policy, no `gcTime`, no global `onError`. Same file exports an
  empty `TanstackQueryProvider() {}` component that nothing imports.

---

## Phase 3 — Auth

**Goal:** the API is not open to the internet. Implements [D-5](#3-locked-decisions).

**Context:** there is no `User` entity, no auth tables, and `better-auth` is not installed
on the frontend. `apps/api/src/features/auth/auth.module.ts` is a 4-line empty stub that is
not imported into `AppModule`. `main.ts:31` calls `.addBearerAuth()` on the Swagger builder,
documenting a scheme that does not exist. This is a from-scratch build.

### TD-3.1 — Wire `@thallesp/nestjs-better-auth` into `AuthModule` `[ ]`

- **File:** `apps/api/src/features/auth/auth.module.ts`
- **Note:** the package is already in `apps/api/package.json:41` and entirely unused.

### TD-3.2 — Add `User` + better-auth session tables via migration `[ ]`

- **Why:** must be a real migration, not `synchronize`. Coordinate with **TD-4.1**.

### TD-3.3 — Add a global `APP_GUARD` and a `@Public()` decorator `[ ]`

- **Why:** `rg 'UseGuards|AuthGuard'` across `apps/api/src` returns nothing. Every REST
  endpoint — projects, notes, tags, folders, file upload/download, plugins — is open.
- **Public:** `/health` and the auth routes only.

### TD-3.4 — Add `@nestjs/throttler` `[ ]`
### TD-3.5 — Add `helmet` `[ ]`
### TD-3.6 — Gate `/docs` behind auth in production `[ ]`

- **Why:** compose currently healthchecks via `wget` on `/docs-json`, which forces Swagger
  to be publicly served in production just to stay healthy.

### TD-3.7 — Point the compose healthcheck at `/health` `[ ]`

- **Why:** `apps/api/src/features/health/` already exists and is unused by compose.
- **Depends on:** TD-3.6

### TD-3.8 — Add a login route to the web app `[ ]`
### TD-3.9 — Add a 401 interceptor that redirects to login `[ ]`
### TD-3.10 — Add logout to `AppRail` `[ ]`

---

## Phase 4 — Data integrity

**Goal:** partial failures cannot leave the database inconsistent, and the UI cannot
silently hide records.

### TD-4.1 — Write a baseline migration for all 7 tables `[ ]`

- **Why:** the 5 existing migrations are decorative — **none of them create base tables**.
  Missing entirely: `project`, `project_folder`, `note`, `tag`, `note_relation`,
  `note_history_entry`, `note_log_entry`, plus `note.canvasX`/`canvasY` and all four
  `file*` columns (`note.entity.ts:122-166`). A fresh DB can only be stood up via
  `synchronize`.
- **Depends on:** TD-0.6 — **now the blocker for undoing TD-0.6's workarounds.** Until this
  lands, `synchronize` is the only way to create a schema, so `docker-compose.yml` sets
  `DB_SYNCHRONIZE: 'true'` and `migrationsRun` stays `false` in
  `features/database/typeorm.config.ts`. When writing the baseline, it must be safe to
  apply to an existing `synchronize`-built database (mark it as already applied, or guard
  every `CREATE TABLE` with `IF NOT EXISTS`), and the four decorative migrations that
  predate it must be ordered/guarded so they do not re-run against it.

### TD-4.2 — Wrap `NoteService.create` in a transaction `[ ]`

- **File:** `apps/api/src/features/note/note.service.ts:415-435`
- **Writes:** `note` + `note_relation` + `note_history_entry`
- **Pattern:** `ProjectService.remove` (`project.service.ts:91-97`) already does this
  correctly — mirror it. `NoteService` never injects `DataSource`.

### TD-4.3 — Transaction for `addRelation` `[ ]` — `note.service.ts:249-268`
### TD-4.4 — Transaction for `removeRelation` `[ ]` — `note.service.ts:303-320`
### TD-4.5 — Transaction for `update` `[ ]` — `note.service.ts:744-753`
### TD-4.6 — Transaction for `remove` `[ ]` — `note.service.ts:773-778`
### TD-4.7 — Transaction for `uploadFile` `[ ]` — `note.service.ts:547-576`
### TD-4.8 — Transaction for `removeFile` `[ ]` — `note.service.ts:625-641`

### TD-4.9 — Paginate `/history` and `/log-entries` `[ ]`

- **Files:** `note.controller.ts:237-246`, `:283-292`; service `note.service.ts:476-479`,
  `:672-675`
- **Why:** both return the entire table as a raw array via unbounded `find()`. Log notes are
  explicitly append-only and designed to grow. Violates the `AGENTS.md` pagination rule.

### TD-4.10 — Move `ProjectTable` to server-side paging/filter/sort `[ ]`

- **Files:** `apps/web/src/features/projects/components/ProjectTable.tsx:33,89,374`;
  hooks `useAllNotesQuery.ts:18` (`limit: 1000`), `useCanvasNotesQuery.ts:19` (`1000`),
  `useAllTagsQuery.ts:12` (`100`), `useAllProjectFoldersQuery.ts:12` (`100`),
  `useProjectsByFolderQuery.ts:17` (`100`)
- **Why:** hardcoded caps, then **client-side** "Load more" over the capped set. Project #101
  simply does not exist to the UI. The pagination is an illusion.

### TD-4.11 — Fix `Object.assign` null-wipe in three services `[ ]`

- **Files:** `project.service.ts:75`, `project-folder.service.ts:110`, `tag.service.ts:80`
- **Why:** `note.service.ts:729-741` carries a 10-line comment explaining exactly why naive
  `Object.assign(entity, dto)` wipes unspecified fields to `NULL`, and implements a guard.
  The same hazard is unfixed in the other three.

### TD-4.12 — Replace `getDescendantIds` with a recursive CTE `[ ]`

- **File:** `apps/api/src/features/note/note.service.ts:154-168`
- **Why:** loads **every** active note ID in the project into a `Set`, then runs
  `In([...ids])` over all relations — on every single `addRelation` call. Also
  `create()` at `:404-413` awaits sequentially inside a `for` loop over `parentIds`.

### TD-4.13 — Log the swallowed errors `[ ]`

- **Files:** `note.service.ts:652-658` (empty `catch {}` — orphaned MinIO objects accumulate
  invisibly), `health.controller.ts:40` (bare `catch {}` discards the DB error, so a 503 is
  undebuggable), `plugin-registry.service.ts:50-55` (catches failure and **returns it as a
  success-path string** that becomes note content, with HTTP 201)
- **Also:** add a global exception filter. `storage.service.ts:22` is the only `Logger`
  instance in the entire codebase.

---

## Phase 5 — Cleanup

**Goal:** the lint signal is trustworthy and the dependency tree is reproducible.

### TD-5.1 — Delete 49 unreachable `components/ui` files `[ ]`

- **Why:** only **17 of 66** files are reachable from outside `components/ui/`. The rest are
  dead, either directly or transitively (imported only by other dead files). **6,192 LOC,
  ~36% of the web codebase**, producing ~60 of the 87 Biome diagnostics — your lint signal is
  dominated by code you do not ship. Largest: `sidebar.tsx` (726, the biggest file in the app),
  `chart.tsx` (374), `menubar.tsx` (276), `dropdown-menu.tsx` (257), `field.tsx` (246),
  `carousel.tsx` (241), `calendar.tsx` (218), `data-table.tsx` (208).
- **Keep — the 17 reachable roots:** `alert-dialog`, `button`, `collapsible`, `combobox`,
  `context-menu`, `dialog`, `form-field`, `input`, `loading-state`, `markdown`,
  `markdown-editor`, `native-select`, `radio-group`, `resizable`, `tag-chip`, `textarea`,
  `tooltip`.
- **Also keep `sonner.tsx`** — currently unreachable, but
  **TD-2.1** mounts it. Do that first.
- **Verify:** re-run the reachability script in [§7](#7-appendix); dead count should be 0
  (or 1 if TD-2.1 is still pending).
- **Note:** delete iteratively — removing a file can orphan others. Re-run the script until
  it stabilises.

### TD-5.2 — Remove Prettier from the root `[ ]`

- **File:** root `package.json` — `"format": "prettier --write \"**/*.{ts,tsx,md}\""`
- **Why:** no root `.prettierrc` and no `.prettierignore`, so it reformats `apps/web/src`
  (which Biome formats with **tabs**) using Prettier defaults (**2 spaces**), guaranteeing
  a diff war. It also rewrites `routeTree.gen.ts`, `src/paraglide/`, and the SDK client —
  all marked "do not hand-edit" in `AGENTS.md`.

### TD-5.3 — Remove Prettier from `apps/api` `[ ]`

- **Files:** `apps/api/.prettierrc`, `apps/api/eslint.config.mjs` (`eslint-plugin-prettier`,
  `eslint-config-prettier`)
- **Note:** root is `prettier@^3.7.4`, api is `^3.4.2` — two versions with differing output.

### TD-5.4 — Extend Biome to the whole repo `[ ]`

- **File:** `apps/web/biome.json` → move to root
- **Why:** `files.includes` is currently `["**/src/**/*", "**/.vscode/**/*", "**/index.html",
  "**/vite.config.ts"]`, so config files, test setup, and everything outside `src/` go unlinted.
  `vcs.enabled: false` means `.gitignore` is ignored. Nobody lints `packages/` at all.
- **Also:** run `biome check` (not just `biome lint`) in the lint script so the formatter and
  `organizeImports` assist are actually enforced.

### TD-5.5 — Fix the Biome schema version mismatch `[ ]`

- **File:** `apps/web/biome.json:2` declares schema `2.2.4`; `package.json:67` pins
  `@biomejs/biome` at `2.4.5`.

### TD-5.6 — One mechanical reformat commit for `apps/api` `[ ]`

- **Do:** keep it isolated — no logic changes in the same commit.
- **Depends on:** TD-5.3, TD-5.4

### TD-5.7 — Add `.editorconfig`; wire `format`/`check` through turbo `[ ]`

- **Why:** `turbo.json` has no `format` or `check` task. `apps/web` has a `check` script
  that nothing invokes.

### TD-5.8 — Delete `packages/eslint-config` `[ ]`

- **Why:** **zero consumers** — no workspace depends on it. It ships
  `@next/eslint-plugin-next@^16.3.0` for a repo with no Next.js, a `react-internal.js` for the
  nonexistent `@repo/ui`, and has no `lint`/`check-types` script. ~10 devDependencies serving
  nothing.

### TD-5.9 — Trim `packages/typescript-config`; make both apps extend `base.json` `[ ]`

- **Why:** only `packages/sdk` extends it. `nextjs.json` has `"plugins": [{ "name": "next" }]`
  for a repo with no Next.js; `react-library.json` is unused. It declares
  `publishConfig.access: public` while being `private: true`.
- **Payoff:** `apps/web` currently loses `noUncheckedIndexedAccess` by not extending base.

### TD-5.10 — Enable `strict` in `apps/api/tsconfig.json` `[ ]`

- **File:** `apps/api/tsconfig.json:19-21`
- **Why:** `strict` is **never set**, and `"noImplicitAny": false` directly contradicts
  `AGENTS.md` §1 "Forbidden `any`". Also disabled: `strictBindCallApply`,
  `noFallthroughCasesInSwitch`; and by omission `strictFunctionTypes`,
  `strictPropertyInitialization`, `useUnknownInCatchVariables`, `noImplicitThis`.
- **Credit:** there are currently **zero explicit `any`** in non-spec API source. Discipline
  is holding; this just makes it enforceable.

### TD-5.11 — Re-enable `no-explicit-any` in the API ESLint config `[ ]`

- **File:** `apps/api/eslint.config.mjs:28-29` — `no-explicit-any: 'off'`,
  `no-unsafe-argument: 'warn'`, `no-floating-promises: 'warn'`

### TD-5.12 — Pin the 11 `"latest"` dependency specifiers `[ ]`

- **File:** `apps/web/package.json`
- **Affected:** `@tanstack/match-sorter-utils`, `react-devtools`, `react-form`, `react-query`,
  `react-query-devtools`, `react-router`, `react-router-devtools`, `react-router-ssr-query`,
  `react-start`, `devtools-vite`
- **Why:** `"latest"` is non-reproducible — any `npm install` silently jumps majors.

### TD-5.13 — Unify TypeScript across workspaces `[ ]`

- **Why:** `apps/web` resolves its own nested `typescript@6.0.3` while root, `apps/api`, and
  `packages/sdk` use `5.9.2`. **Two different compilers compile the same monorepo.**
- **Also:** `@types/node` is `^24` in api and `^22` in web; `globals` is `^17` vs `^16`.

### TD-5.14 — Move dev-only packages out of `dependencies` `[ ]`

- **File:** `apps/web/package.json`
- **Affected:** `@faker-js/faker` (mock-data lib shipped to production), and the three
  devtools packages registered unconditionally in `vite.config.ts` with no `NODE_ENV` guard.

### TD-5.15 — Drop unused and overlapping dependencies `[ ]`

- `apps/api`: `sqlite3@^6.0.1` — the app is Postgres-only; it drags deprecated
  `prebuild-install` and native compilation into every `npm ci` and Docker build.
- `apps/web`: pick one of `@base-ui/react` / `radix-ui` / `@shadcn/react`. `AGENTS.md` says
  `@base-ui/react`.
- `apps/web`: remove the leftover `"pnpm": { "onlyBuiltDependencies": [...] }` block —
  meaningless in an npm workspace.
- `packages/sdk`: `@hey-api/client-fetch` is deprecated (bundled into `openapi-ts` since v0.73).

### TD-5.16 — Set `engines.node: ">=20"` and add `.nvmrc` `[ ]`

- **Why:** root says `>=18`, Dockerfiles use `node:24-alpine`, and Vite 8 / Nitro 3 require ≥20.

### TD-5.17 — Delete dead code `[ ]`

- `apps/api`: `dto/plugin-execute-request.dto.ts` (never imported);
  `features/database/database.module.ts` + `datasource.providers.ts` — exports a
  `'DATA_SOURCE'` provider **nothing injects**, yet it is imported in `app.module.ts:43`,
  so the app opens a **second redundant Postgres pool** at boot;
  `PluginRegistryService.listAllPlugins()` (`:27-29`); `main.ts:8` commented-out `//bodyParser`.
- `apps/web`: `NotePluginsPanel.tsx:1` (`"use client"` — a Next.js leftover), `:34` (unused
  `hideLabel` prop), `:57` (unused `createNoteMutation`, still in a dep array at `:142`),
  `:115-117` and `:135-137` (two empty `catch` blocks); duplicate named+default exports in
  `CanvasView.tsx`, `NoteNode.tsx`, `ColorPickerField.tsx`.
- Root: `.cursorrules` (competes with `AGENTS.md`); `packages/sdk/openapi-ts-error-*.log` ×2.

### TD-5.18 — Fix `.gitignore` `[ ]`

- **Add:** `.output/`, `.nitro/`, `.vite/` — Nitro's output dir is currently **not ignored**
  and `apps/web/.output` exists on disk.
- **Remove:** `.next/`, `out/`, `.pnp`, `.pnp.js`, `.vercel` — Next.js/Vercel/Yarn-PnP leftovers.
- **Fix:** `dist` and `build` are bare unanchored patterns without trailing slashes, so they
  also match any *file* of that name.
- **Decide:** one policy for generated sources. `routeTree.gen.ts` and `src/paraglide/` are
  tracked while `packages/sdk/client` is ignored, despite all three being "do not hand-edit".

---

## Phase 6 — Refactor

**Goal:** reduce the surface area that future debt can attach to. No hard gate; work through
opportunistically once Phases 0–5 are complete.

### TD-6.1 — Split `NoteService` `[ ]`

- **File:** `apps/api/src/features/note/note.service.ts` — 781 lines, 4 repositories,
  2 services, ~20 methods
- **Extract:** `NoteRelationService` (DAG + cycle detection, ~190 lines),
  `NoteHistoryService`, `NoteFileService`.

### TD-6.2 — Add a shared `mapPaginated<T, R>()` helper `[ ]`

- **Files:** `note.controller.ts:77-80`, `project.controller.ts:55-58`,
  `tag.controller.ts:50-53`, `project-folder.controller.ts:64-72`
- **Why:** four identical blocks, each using the same `as unknown as` escape hatch — a
  symptom of the missing helper.

### TD-6.3 — Move plugin orchestration out of `PluginController` `[ ]`

- **Files:** `plugin.controller.ts:60-73,86-98,119-131,160-172` (the same 4-line preamble ×4,
  with **inconsistent** 404 messages: `'Plugin not found'` at `:71` vs
  `` `Plugin ${pluginId} not found` `` elsewhere), and `:106-110,136-140` where the controller
  decides note `type`, `title`, and `parentIds`.
- **Also:** `executeAndCreate` and `create` are near-identical 22-line blocks carrying the
  **same `@ApiOperation` summary** — indistinguishable in Swagger.

### TD-6.4 — Return `NoteResponseDto` from plugin endpoints `[ ]`

- **Files:** `plugin.controller.ts:86-110`, `:119-140`
- **Why:** both return raw `Note` entities, leaking `deletedAt` and `fileKey` — which
  `note.entity.ts:125` documents as "Internal — never exposed through the API's response
  DTOs". Both also have `@ApiResponse` with no `type:`, so the SDK generates `any`.

### TD-6.5 — Decide the fate of the MCP controller layer `[ ]`

- **Files:** `note-mcp.controller.ts` (309), `project-mcp.controller.ts` (155),
  `project-folder-mcp.controller.ts` (128), `tag-mcp.controller.ts` (115)
- **Why:** ~700 lines duplicating the REST layer 1:1, including a re-declared note-type slug
  regex and its 400-word description in both `create-note.dto.ts:12,22` and
  `note-mcp.controller.ts:23,28`. These will drift.
- **Depends on:** **TD-0.13** — currently disabled.

### TD-6.6 — Add `@ApiResponse` types to the 4 paginated `findAll` endpoints `[ ]`

- **Files:** `note.controller.ts:68-71`, `project.controller.ts:45-48`,
  `tag.controller.ts:42-45`, `project-folder.controller.ts:54-57`
- **Also:** `health.controller.ts:11-13` (`HealthResponseDto` is a bare `type`, not a
  decorated class) and `note-history-entry-response.dto.ts:30` (`type: [Object]`).
- **Why:** the paginated envelope is untyped in the generated SDK across the entire API.

### TD-6.7 — Extract `createPaginatedQuery<T>()` `[ ]`

- **Files:** `useAllNotesQuery.ts`, `useCanvasNotesQuery.ts`, `useAllTagsQuery.ts`,
  `useAllProjectFoldersQuery.ts`, `useProjectsByFolderQuery.ts` — 5 copies, ~95% identical

### TD-6.8 — Extract a generic `<EntityFormModal>` `[ ]`

- **Files:** `ProjectModal.tsx` (255), `ProjectFolderModal.tsx` (244), `TagModal.tsx` (181)
  — ~80% overlap: same `isEditing` derivation, same reset-on-open effect, same empty-name
  toast guard, same DialogContent classes.

### TD-6.9 — Unify the IP and URL editor panes `[ ]`

- **Files:** `NoteIpEditorPane.tsx` (169), `NoteUrlEditorPane.tsx` (179) — ~85% identical;
  the diff is 40 lines.

### TD-6.10 — Merge the two folder detail routes `[ ]`

- **Files:** `folders/$folderId.tsx` (204), `folders/ungrouped.tsx` (122) — ~85% identical

### TD-6.11 — Collapse the 4 inline copies of `toastApiError` `[ ]`

- **Files:** `useDeleteNote.ts:23-29`, `useUpdateNote.ts:45-51`, `useCreateInlineNote.ts:37`,
  `useNoteRelationMutations.ts:29-37`
- **Why:** `lib/api-error.ts` already exports this. 4 of the 7 stray `console.error` calls
  are inside these copies.

### TD-6.12 — Migrate ~228 hardcoded strings to Paraglide `[ ]`

- **Why:** only 3 of 149 files import `#/paraglide/messages`. The German locale is 100%
  key-complete but unreachable for 97% of the UI. Implements [D-7](#3-locked-decisions).
- **Worst:** `NoteDetailsPanel.tsx` (21), `routes/tags.tsx` (20), `ProjectTable.tsx` (18),
  `NoteSettingsPanel.tsx` (15), `folders/$folderId.tsx` (15), `ZoomControls.tsx` (13).
- **Also:** delete 6 dead scaffolding keys (`about_page`, `home_page`, `learn_router`,
  `example_message`, `current_locale`, `language_label`) × 2 locales.

### TD-6.13 — Unify on the `mc-*` design system `[ ]`

- **Why:** two competing systems — `mc-*` + `McButton` + `PageShell` (25 files) vs legacy
  `sea-ink`/`surface-strong`/`border-line`/`palm` + shadcn `Button` (20 files, all modals),
  kept alive only by aliases at `styles.css:148-158`.
- **Do:** migrate the 20 legacy files, delete the aliases, retire one of the two Button
  components.

### TD-6.14 — Rewrite `useNoteDraftAutosave` to drop derived-state-in-effect `[ ]`

- **File:** `apps/web/src/features/notes/hooks/useNoteDraftAutosave.ts:74-96`
- **Why:** a 23-line effect syncing `note` → four pieces of state, guarded by
  `initializedNoteId === note.id`. Classic "adjust state when prop changes" anti-pattern.
  The adjacent effect at `:98-134` carries a `biome-ignore useExhaustiveDependencies`.
- **Do:** `key`-remount in `NoteEditModal`.

### TD-6.15 — Replace the 6 reset-on-open effects with `key` remounts `[ ]`

- **Files:** `ProjectModal.tsx:69-81`, `ProjectFolderModal.tsx:61-72`, `TagModal.tsx:49-57`,
  `CreateNoteModal.tsx:125-131`, `NoteIpEditorPane.tsx:64`, `NoteUrlEditorPane.tsx:68`
- **Also:** `CanvasView.tsx:16-20` hand-rolls a `mounted` flag that TanStack Start's
  `<ClientOnly>` already provides; `theme-provider.tsx:79-84` calls `window.matchMedia`
  **during render** (non-deterministic across SSR/hydration).

### TD-6.16 — Replace the counter-prop imperative channel `[ ]`

- **Files:** `CanvasViewContent.tsx:131-143,296-300` (ref-guard effects),
  `$projectId/index.tsx:54,86,99,183` (`useState` counters)
- **Why:** `revealRequest`/`addNoteRequest` are incrementing-integer props used to trigger
  imperative canvas actions. Should be a ref / imperative handle.

### TD-6.17 — Introduce a `ProjectContext`; reduce prop drilling `[ ]`

- **Why:** no React Context exists in feature code — `theme-provider.tsx` is the only provider.
  `projectId` is threaded manually into ~20 hooks and ~12 components.
- **Worst:** `NoteSettingsPanel.tsx:31-45` takes **13 props**, including 6 relation callbacks
  that `NoteEditModal.tsx:62-90` merely re-wraps around mutations it already owns.
  `NoteTree` drills 9 props across 3 levels into an unbounded recursion.

### TD-6.18 — Fix `NoteTree` accessibility `[ ]`

- **File:** `apps/web/src/features/notes/components/NoteTree.tsx`
- `:286-303` — the expand/collapse `<button>` has no accessible name and no `aria-expanded`;
  when `!chevron` it is `invisible` but **still focusable** (keyboard tab trap on every leaf).
- `:321` — row actions are `hidden group-hover:flex`, i.e. `display:none` until mouse hover.
  **Unreachable by keyboard and screen readers.** Needs `group-focus-within:flex`.
- `:90-174` — plain nested `<div>`s; no `role="tree"`/`treeitem`/`aria-level`.
- **Also:** `CanvasViewContent.tsx:369-378` — double-click-to-create has no keyboard equivalent.

### TD-6.19 — Raise test coverage on high-risk pure logic `[ ]`

- **Web** (currently 10 tests, ~0.4% of source, all in one feature): `useNoteTree` cycle
  detection (`useInvalidParentIds`/`useInvalidChildIds`, ~180 lines of graph logic),
  `slugifyNoteType`, the IP/URL validators (`NoteIpEditorPane.tsx:32`,
  `NoteUrlEditorPane.tsx:31`), `lib/format.ts`, `ProjectTable` filter/sort.
- **API:** the two pure-stub controller specs (`project.controller.spec.ts`,
  `project-folder.controller.spec.ts` — 1 assertion each); the missing `email validation`
  describe in `note.service.spec.ts` despite `assertValidEmailContent` existing at
  `note.service.ts:374-386` and being wired into both `create()` and `update()`;
  `findAll`/`findOne`/`update`/`remove` in `note.controller.spec.ts`; and the 5 untested DTO
  mappers plus `note-relations.util.ts`.

### TD-6.20 — Correct the stale documentation `[ ]`

| Location | Problem |
|---|---|
| `README.md:152,213,~222`, `AGENTS.md:10`, `packages/eslint-config/README.md:19,22` | `packages/ui` / `@repo/ui` **does not exist**; the README link to `./packages/ui/README.md` is broken |
| `README.md` Docker section | Claims the build runs `turbo run generate` first; `apps/web/Dockerfile:37` does the **opposite** — it asserts the client already exists and errors out |
| `README.md` Docker section | Omits the `minio` and `kali` services entirely |
| `README.md` env table, `packages/sdk/README.md` | Documents `VITE_API_URL`; the code and `.env.example` use `VITE_SDK_URL` |
| `README.md` | Note types listed as `standard, log, url, ip, file` in one section and `standard, log, file` in another; `command` is undocumented |
| `README.md` | Claims `synchronize: true` applies "in development"; it is unconditional |
| `README.md` Testing | Omits the `apps/web` Vitest suite entirely |
| `packages/sdk/README.md` | Documents a `src/generated/` directory that does not exist |
| `apps/web/AGENTS.md:31-33` | Contains a "migrate-from-nextjs" recipe; the migration is done |
| everywhere | **The plugin system and Kali container are entirely undocumented** — a shell-exec feature with zero docs |

### TD-6.21 — Add missing repo infrastructure `[ ]`

- No git hooks (`husky`/`lefthook`) or `lint-staged`
- No `SECURITY.md` — notable for a project that ships an nmap execution feature
- No `CODEOWNERS`, no `dependabot.yml`/`renovate.json`
- No `CHANGELOG.md` or release tooling; all packages stuck at `0.0.0`/`0.0.1`
- `docs/` contains **zero `.md` files** — just 559 KB of PNGs re-committed on every UI change

---

## 6. Session Log

Append one row per session. Keep it terse; the checkboxes carry the detail.

| Date | Session focus | Tasks touched | Notes |
|---|---|---|---|
| 2026-11-05 | Full tech-debt audit | — | Audited api/web/infra. 7 decisions locked (§3), 1 open (§4). Tracker created. **No code changed.** |
| 2026-11-05 | Close the shell injection | TD-0.1, TD-0.2, TD-0.3, TD-0.4, TD-1.3 | `execFile` + argv end to end. Injection proven closed (old `exec` path creates `/tmp/pwned`, new one does not). `NmapServiceScanPlugin.execute()` was a dead `throw` — wired to `CommandContainer`, so this change *creates* the live path and had to land hardened. TD-1.3 pulled forward: those 5 TS errors were all in the spec this work rewrites, and were the only API TS errors **and** the only 6 failing API tests. Metrics: API TS errors 5→0, API failing tests 6→0, API ESLint 46→41. `podman` still hardcoded (TD-0.5 blocked on OD-1). |
| 2026-11-05 | Stop prod schema rewrites | TD-0.6 | `synchronize` now defaults off in production, via a tested `buildTypeOrmOptions()`. `migrationsRun: true` **not** enabled — the existing migrations assume base tables and would fail on boot against both a fresh and a `synchronize`-built schema, turning a data-loss risk into an outage. Added a `DB_SYNCHRONIZE` opt-in (set in `docker-compose.yml`) so a fresh database can still be created until TD-4.1. |
| 2026-11-05 | Bound and neuter uploads | TD-0.7 | Size limit + MIME allowlist, both env-driven; 413/415 proven over real HTTP. Scope extended to the download side after finding that `GET /:id/file` served the client-declared type `inline` — uploading `text/html` was stored XSS on the API origin. Now `attachment` + `nosniff` for everything except raster images, plus `Content-Disposition` header-injection fixed. New task TD-0.15 raised (unsanitised storage-key extension). `eslint --fix` also cleaned 41 pre-existing formatting errors in `note.entity.ts`: API ESLint 41→0. |
| 2026-11-05 | Tracker reconciliation | TD-1.7 | Re-measured every §2 metric against the repo rather than trusting prior edits. Marked TD-1.7 done (closed as a side effect of TD-1.3). Corrected the Phase 0 denominator for TD-0.15, and the ESLint/Biome metric commands, which did not run from the repo root. Flagged two metrics as untrustworthy: Web TS errors (fell 6→2 only because the gitignored SDK was regenerated — TD-1.4/TD-1.6 are *not* fixed) and API LOC (rising because Phase 0 adds tests; now tracked as a test/non-test split). **No source changed.** |

---

## 7. Appendix

### Verification cheatsheet

```bash
# Typecheck (after TD-1.1 / TD-1.2 these become meaningful)
npx tsc --noEmit -p apps/api/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
npx turbo run check-types

# Tests
npm test --workspace=api
npm test --workspace=web

# Lint
npx eslint "apps/api/src/**/*.ts"        # until TD-5.3
npx biome lint apps/web/src

# Security
npm audit
npm audit --audit-level=high

# Turbo sanity — confirms task wiring and cache outputs
npx turbo run build --dry=json | jq '.tasks[] | {package, command, outputs}'
npx turbo run check-types --dry=json | jq '.tasks[] | {package, command}'

# Validate turbo.json is real JSON (fails until TD-1.14)
node -e "JSON.parse(require('fs').readFileSync('turbo.json','utf8'))"

# Dead-file reachability scan for TD-5.1
# Direct grep over-counts: a dead file importing another keeps it looking alive.
# This walks from real roots (ui modules imported from OUTSIDE components/ui)
# and follows ui-internal relative imports transitively.
cd apps/web/src && python3 - <<'PY'
import os, re, glob, subprocess
ui = [os.path.basename(f)[:-4] for f in glob.glob('components/ui/*.tsx')]
roots = set()
for dirpath, _, files in os.walk('.'):
    if dirpath.startswith('./components/ui'):
        continue
    for fn in files:
        if not fn.endswith(('.ts', '.tsx')):
            continue
        for m in re.finditer(r'ui/([a-zA-Z0-9-]+)(?:\.tsx?)?["\']',
                             open(os.path.join(dirpath, fn)).read()):
            if m.group(1) in ui:
                roots.add(m.group(1))
seen, stack = set(), list(roots)
while stack:
    c = stack.pop()
    if c in seen:
        continue
    seen.add(c)
    try:
        t = open(f'components/ui/{c}.tsx').read()
    except OSError:
        continue
    for m in re.finditer(r'["\']\./([a-zA-Z0-9-]+)(?:\.tsx?)?["\']', t):
        if m.group(1) in ui and m.group(1) not in seen:
            stack.append(m.group(1))
dead = sorted(set(ui) - seen)
loc = sum(int(subprocess.run(['wc', '-l', f'components/ui/{d}.tsx'],
          capture_output=True, text=True).stdout.split()[0]) for d in dead)
print(f"total {len(ui)}  reachable {len(seen)}  dead {len(dead)}  dead LOC {loc}")
print("dead:", " ".join(dead))
PY
```

### Findings index

| Area | Phases | Headline |
|---|---|---|
| Security | 0, 3 | Unauthenticated RCE; zero auth on the entire API; 11 critical CVEs |
| Build & CI | 1, 5 | No CI; `check-types` validates 15 lines; `turbo.json` invalid JSON; caching broken |
| Data integrity | 4 | No transactions on 7 multi-table writes; no baseline migration; `synchronize: true` in prod |
| Frontend correctness | 2 | Toasts never mounted; errors swallowed app-wide; autosave data loss; stored XSS |
| Code volume | 5, 6 | 6,192 LOC dead UI; ~700 LOC duplicated MCP layer; 781-line god service |
| Consistency | 5, 6 | Two formatters fighting; two design systems; two TS compilers; i18n 97% bypassed |
| Docs | 6 | ~14 stale claims; the newest feature has zero documentation |
