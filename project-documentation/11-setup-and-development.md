# Setup & Development

## Running locally

```bash
pnpm install
docker compose up -d        # local Postgres for development only
pnpm db:generate             # generate SQL migration from schema changes (only needed after editing src/db/schema/)
node -e "..."                 # apply the generated migration (see note below on why not drizzle-kit push)
pnpm db:seed                  # chart of accounts, funds, periods, RBAC permissions/roles, admin user
pnpm dev                      # tsx watch src/index.ts
```

Server runs on `http://localhost:$PORT` (default 4100 in this project's `.env` — changed from Hono's default 3000 because another unrelated project on this machine already occupies port 3000).

## Environment variables

See `.env.example`. Key ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. For **Supabase**: use the Transaction Pooler URL (port 6543) at runtime, the direct connection (port 5432) for migrations. For **local Docker**: `postgres://accounts:accounts_dev_password@127.0.0.1:5432/school_accounts` |
| `PORT` | API server port |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Only used by `db:seed` to create the first `system_admin` login |
| `DB_DEBUG` | Set to `1` to log every SQL query the app sends |

## Deploying to Supabase

1. Set `DATABASE_URL` to the Supabase Transaction Pooler URL for the running app.
2. `src/db/client.ts` already sets `prepare: false` — **required** for the Transaction Pooler (PgBouncer in transaction mode doesn't support server-side prepared statements, which `postgres.js` uses by default). Don't remove this.
3. SSL is applied automatically for any non-localhost `DATABASE_URL` (`ssl: 'require'`).
4. Apply migrations from `drizzle/*.sql` in order against the **direct** connection (port 5432), not the pooler.

## Known local-dev quirks (already fixed, documented so they aren't re-discovered)

### Migrations weren't applied via `drizzle-kit push`
`pnpm db:push` hung/failed unreliably against the local Docker Postgres on this Windows machine. The generated SQL files in `drizzle/*.sql` were applied directly instead, via a small Node script using the `postgres` package (`sql.unsafe(migrationFileContents)`). This is arguably the more correct approach anyway — it's the exact same SQL that will run against Supabase, rather than drizzle-kit's introspection-based push.

### A stray machine-level `DATABASE_URL` environment variable
This Windows machine has a **persistent User-level environment variable** `DATABASE_URL` pointing at an unrelated project's database (a leftover from another project, not touched or removed). Node's `dotenv` package does **not** override existing `process.env` values by default, so without a fix, this project's own `.env` file would be silently ignored and the app would try to connect to the wrong database entirely.

Fixed by making `src/db/client.ts` self-configuring: it calls `dotenv.config({ override: true })` **at its own top**, before reading `process.env.DATABASE_URL`. This matters because of an ES module subtlety — if a caller does `import { config } from 'dotenv'; config({ override: true })` *then* `import { db } from './client.js'`, the `client.js` module body still executes **before** the caller's own `config()` call runs, because ES modules fully evaluate all imported modules before continuing the importing module's own top-level code, regardless of the textual order of `import` vs other statements. `client.ts` no longer depends on any caller doing this correctly — it configures itself.

If you ever see the app connecting to an unexpected database, check for a machine-level `DATABASE_URL` env var first (`echo $env:DATABASE_URL` in PowerShell) before assuming it's a code bug.

### Long auto-generated FK constraint names
Two constraint names in the schema exceed Postgres's 63-character identifier limit (`asset_categories_accumulated_depreciation_account_id_accounts_id_fk` and `bank_reconciliation_items_reconciliation_id_bank_reconciliations_id_fk`) and get silently truncated by Postgres, producing a `NOTICE` (not an error) on migration apply. Cosmetic only — the constraints still work correctly and remain unique.

### Docker Desktop networking flakiness (Windows)
Occasional intermittent connection stalls were observed against the local Docker Postgres container during heavy testing sessions — not reproducible against a raw `postgres.js` connection in isolation, and not something that should affect a real network connection to Supabase. If local dev queries seem to hang for no reason, check `docker compose ps` and consider restarting Docker Desktop before assuming it's an application bug.

## Verifying the system after a fresh migration apply

Every module in this system was verified against a live database during development — not just type-checked. If you make schema or service changes, the fastest way to confirm nothing broke is the same approach used throughout: start the dev server, exercise the affected endpoints with `curl`, and check both the HTTP response and (for anything that posts to the ledger) `GET /api/reports/trial-balance` to confirm `isBalanced: true`.
