# Contributing

## Setup

Follow the [README](README.md) through step 1 (`pnpm install`). `pnpm test` works with no database. For anything that touches the database, finish the remaining steps.

## Before you push

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build
```

CI runs the same checks (with `format:check`) and will fail the PR otherwise.

## Commits

- **One change per commit.** A feature or fix lands with the tests that pin its behavior, in the same commit. Keep formatting-only or refactor-only changes in their own commits.
- **Message format:** [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `ci:`, `build:`, `style:`, with an optional scope such as `fix(procurement): …`. Explain *why* in the body when it isn't obvious.
- **A bug fix starts with a failing test** that reproduces it.

## Tests

- Tests live next to the code as `*.test.ts`.
- Service tests mock the module's repository (see `src/modules/procurement/procurement.service.test.ts`), or use an in-memory fake when the logic depends on state across calls (see `src/modules/identity/identity.service.test.ts`). They must not need a real database.
- The coverage floor in `vitest.config.ts` only ever goes up. If your change raises coverage, raise the floor in the same PR.

## Module layout

Every module in `src/modules/<name>/` follows the same six-file pattern (routes → controller → service → repository, plus schema and types). See [project-documentation/01-architecture.md](project-documentation/01-architecture.md).

## Database changes

Edit `src/db/schema/*.ts`, run `pnpm db:generate`, and commit the generated SQL in `drizzle/` together with the schema change. Never edit an already-applied migration; add a new one. CI applies every migration to an empty database on each push.
