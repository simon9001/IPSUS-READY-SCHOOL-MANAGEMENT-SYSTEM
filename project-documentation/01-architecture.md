# Architecture

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (Node.js, ESM) | Type safety across the whole stack, including generated DB types |
| Web framework | [Hono](https://hono.dev) | Lightweight, fast, first-class TypeScript support |
| Database | PostgreSQL | Exact decimal arithmetic (`NUMERIC`) for money, free/no licensing cost, strong Node/TS ORM ecosystem, standard choice for Supabase (the intended hosting target) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) | Schema-as-code, generates real SQL migrations, fully typed queries |
| Validation | [Zod](https://zod.dev) via `@hono/zod-validator` | Request validation with inferred TypeScript types |
| Dev runtime | `tsx` | Runs TypeScript directly with hot reload (`tsx watch`) |
| Password hashing | `bcryptjs` | Pure JS, no native build step (avoids Windows build tooling issues) |

Hosting target: **Supabase Postgres**. Locally, a `docker-compose.yml` runs Postgres for development (see [11-setup-and-development.md](11-setup-and-development.md)).

## The layered module pattern

Every feature module lives in `src/modules/<name>/` and follows the same six-file shape:

```
<name>/
├── <name>.routes.ts       — Hono router: wires URL+method to controller functions, attaches Zod validation middleware
├── <name>.controller.ts   — HTTP glue: reads params/validated body, calls the service, wraps the result in a response helper
├── <name>.service.ts      — Business logic: validation beyond shape-checking, orchestration, calls into other modules' services
├── <name>.repository.ts   — Database access only: Drizzle queries, no business logic
├── <name>.schema.ts       — Zod schemas for request validation, plus their inferred TS input types
└── <name>.types.ts        — Domain types, generally `typeof table.$inferSelect` / `$inferInsert` re-exports
```

A few modules deviate deliberately, and the deviation is always noted where it happens:
- **`portal`** has no `repository.ts` — it has no tables of its own; it's a pure aggregation layer over other modules' services, scoped to the requesting guardian's own children.
- **`identity`** (`src/modules/identity/`) is not a routed module — it holds `rbac.ts` (the permission/role catalogue used by the seed script) and `password.ts` (hashing helpers), consumed by other modules rather than exposing its own endpoints.

### Why services call other modules' services (not just their own repository)

Modules are allowed to import another module's `service` (e.g. `fees.service.ts` calls `journalService.postSystemEntry(...)`, `discipline.service.ts` calls `guardiansService.notifyGuardians(...)`). This is how cross-cutting effects are wired — a fee payment posts a journal entry, a discipline incident notifies a parent — without those modules needing to share database tables. A module should **not** import another module's `repository` directly; that would bypass the owning module's business rules.

### The `getValidated` helper (why it exists)

Hono's `c.req.valid('json')` is fully type-safe *if* the validator and the handler are chained inline in the same file. This codebase separates `routes.ts` (where `zValidator` runs) from `controller.ts` (where the validated data is read), which breaks that inline type inference. `src/common/validate.ts` exports `getValidated<T>(c, target)`, a thin typed wrapper around the same runtime call, used consistently across every controller instead of fighting Hono's generic `Context` typing per-handler.

### Standard response shape

All responses go through `src/common/response.ts`:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```
Validation failures additionally include an `issues` array (from Zod). Errors are raised as typed classes from `src/common/errors.ts` (`NotFoundError` → 404, `ConflictError` → 409, `ValidationError` → 400, `ForbiddenError` → 403) and caught by a single `app.onError` handler in `src/index.ts` — individual controllers never need their own try/catch for expected errors.

## The double-entry ledger is the financial spine

Every financial module (fees, payroll, procurement, assets, inventory, banking, grants) posts its transactions through one shared function: `journalService.postSystemEntry(...)` (`src/modules/journal/journal.service.ts`). This guarantees:
- Every posted transaction is a balanced double-entry (debits = credits), enforced before insert
- The Trial Balance report is always reconcilable from `journal_lines`, because nothing writes to the ledger any other way
- Fund-restricted accounting (IPSAS 23) works correctly, because every line carries a `fundId`, and modules that touch multiple funds in one transaction (e.g. a fee invoice spanning Tuition Fund and Trading Fund) split their journal lines per fund rather than posting one blended line

Manual/adjusting entries (as opposed to system-generated ones) go through `journalService.createManualEntry(...)` instead, which enters a maker-checker approval flow (`draft → pending_approval → posted`) rather than posting immediately — see [03-module-financial.md](03-module-financial.md) for details.

## No authentication middleware — deliberately

The user is building their own authentication system. Rather than guess at its shape, every action in this API that needs to know "who did this" takes that actor's user ID as an explicit field in the request (`createdBy`, `recordedBy`, `approvedBy`, `awardedBy`, etc.) instead of reading it from a session. `src/common/auth.ts` defines a `requirePermission(code)` middleware **stub** as the intended integration point — once real auth middleware sets `c.set('user', { id, permissions })`, `requirePermission` can be attached to any route. It is not currently attached to any route, so the API is unauthenticated as it stands; this is intentional, not an oversight, but it means the API must not be exposed publicly until real auth is wired in.

## Project structure

```
Accounts/
├── src/
│   ├── common/              — shared errors, response helpers, Zod validator wrapper, auth stub, {{template}} renderer
│   ├── db/
│   │   ├── schema/          — one Drizzle schema file per domain (accounts.ts, fees.ts, exams.ts, ...)
│   │   ├── client.ts        — Postgres connection (self-configuring .env load, Supabase-pooler-safe settings)
│   │   └── seed.ts          — seeds chart of accounts, funds, periods, RBAC permissions/roles, admin user
│   ├── modules/              — one folder per feature module (see above)
│   └── index.ts              — Hono app, mounts every module's router, global error handler
├── drizzle/                  — generated SQL migrations (numbered, never hand-edited)
├── drizzle.config.ts         — drizzle-kit config (points at src/db/schema/index.ts)
├── docker-compose.yml        — local Postgres for development only
└── project-documentation/    — this folder
```

## Conventions worth knowing before editing code

- **Money fields** are `numeric(14,2)` in Postgres, represented as `string` by Drizzle (not `number`) — services generally accept `string | number` from input and normalize with `String(value)` before insert, to avoid floating-point rounding.
- **IDs referenced across modules are numeric FKs**, never string codes, except where a module explicitly needs a human-facing reference (e.g. `entryNo`, `admissionNo`, `nemisUpi`).
- **Enums are Postgres enums** (`pgEnum`), not free-text columns with app-level validation — extending one (e.g. adding `'suspended'` to `student_status`) generates a real `ALTER TYPE ... ADD VALUE` migration.
- **Computed reports are never stored — with one deliberate exception.** Trial Balance, Budget vs Actual, leave balances, conduct-point scores, and library availability are all computed on read, not cached. `compliance_reports.reportData` is the one exception: a filed government return freezes a JSON snapshot at generation time, because a submitted return is a historical record and must not silently change if the underlying data changes later (see [14-module-cross-cutting.md](14-module-cross-cutting.md)).
- **`common/` holds HTTP-layer plumbing (`errors.ts`, `response.ts`, `validate.ts`, `auth.ts`) plus genuinely shared business logic once a second module needs it** — `template.ts` (the `{{placeholder}}` renderer) started inline in `notifications.service.ts` and was extracted only once `documents` needed the identical logic. Don't pre-extract a helper "just in case"; wait for the second real caller.
