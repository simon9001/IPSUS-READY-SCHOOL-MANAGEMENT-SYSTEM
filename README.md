# Kenyan Secondary School Management System

IPSAS-compliant financial system plus academic, communication, HR, admissions, and student-conduct modules for a Kenyan secondary school. Node.js/TypeScript, Hono, Drizzle ORM, PostgreSQL.

Full documentation — architecture, database schema, module-by-module design notes, RBAC, IPSAS mapping — lives in [`project-documentation/`](project-documentation/README.md). This README only covers getting it running.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) (`npm install -g pnpm` if you don't have it)
- Either:
  - **Docker Desktop** (for local Postgres), or
  - A **Supabase** account (free tier is fine) with a project already created

## 1. Install dependencies

```bash
pnpm install
```

## 2. Set up the database — pick one

### Option A: Local Postgres (Docker)

```bash
docker compose up -d
```

This starts Postgres 16 on `localhost:5432` with the credentials already baked into `docker-compose.yml` (user `accounts`, password `accounts_dev_password`, database `school_accounts`).

Copy the env file and use the local connection string:

```bash
cp .env.example .env
```

Then edit `.env` and set:

```
DATABASE_URL=postgres://accounts:accounts_dev_password@127.0.0.1:5432/school_accounts
```

(Use `127.0.0.1`, not `localhost` — avoids an IPv6/IPv4 resolution issue on some Windows setups.)

### Option B: Supabase

1. In your Supabase project: **Project Settings → Database → Connection string → URI**.
2. Copy the env file:
   ```bash
   cp .env.example .env
   ```
3. In `.env`, set `DATABASE_URL` to the **Transaction Pooler** connection string (port `6543`) — this is what the running app should use:
   ```
   DATABASE_URL=postgres://postgres.xxxxxxxxxxxx:YOUR_DB_PASSWORD@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
4. For running migrations in the next step, temporarily switch `DATABASE_URL` to the **direct connection** (port `5432`) instead — the pooler doesn't support the DDL operations migrations need. Switch it back to the pooler URL (port 6543) once migrations are applied, for actually running the app.

No local Postgres/Docker needed for this option.

## 3. Apply the database schema

```bash
pnpm db:migrate
```

This applies every SQL file in `drizzle/` in order, creating all 76 tables.

> If this hangs or fails against a **local Docker** Postgres specifically, it's a known local-networking quirk, not a schema problem — see [project-documentation/11-setup-and-development.md](project-documentation/11-setup-and-development.md#migrations-werent-applied-via-drizzle-kit-push) for the manual fallback. Against Supabase this should just work.

## 4. Seed starting data

```bash
pnpm db:seed
```

Creates the Chart of Accounts, funds/voteheads, 2026 term periods, all RBAC permissions/roles, and one `system_admin` login. The admin email/password come from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `.env` (defaults: `admin@school.local` / `ChangeMe123!` — **change this before using the system for real**).

## 5. Run it

```bash
pnpm dev
```

Starts the API with hot reload at `http://localhost:$PORT` (`PORT` is set in `.env`; defaults to `3000` if unset — this project's own `.env` uses `4100` to avoid clashing with another local project). Confirm it's up:

```bash
curl http://localhost:4100/
# "Kenyan High School Accounting System API"

curl http://localhost:4100/api/accounts
# {"success":true,"data":[... seeded chart of accounts ...]}
```

## Other useful commands

| Command | Does |
|---|---|
| `pnpm build` | Type-check + compile (`tsc`) |
| `pnpm db:generate` | Generate a new migration after editing `src/db/schema/*.ts` |
| `pnpm db:studio` | Drizzle Studio — a GUI to browse/edit the database |

## Switching between local Postgres and Supabase later

Just change `DATABASE_URL` in `.env` and restart `pnpm dev` — nothing else in the codebase is environment-specific. `src/db/client.ts` automatically adjusts SSL (off for `localhost`/`127.0.0.1`, required otherwise) and disables prepared statements (`prepare: false`), which is required for Supabase's Transaction Pooler regardless of which database you're pointed at.

## Where to go next

- New to the codebase? Start with [project-documentation/01-architecture.md](project-documentation/01-architecture.md) — every module follows the same six-file pattern, so understanding it once explains the whole codebase.
- Looking for a specific module? [project-documentation/README.md](project-documentation/README.md) has the full index.
