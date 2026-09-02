import { config } from 'dotenv'
// Must run before reading process.env below. ES module imports (and their
// full module bodies) evaluate before the importing file's own top-level
// code, so callers doing `config(...)` then `import { db } from './client.js'`
// would otherwise have this module read env vars before the override ran.
config({ override: true })

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema/index.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and set your Supabase connection string.')
}

// Supabase requires TLS; local docker-compose Postgres does not support it.
const isLocalHost = /(localhost|127\.0\.0\.1)/.test(connectionString)

// prepare:false is required against Supabase's Transaction Pooler (port 6543,
// PgBouncer) — it does not support server-side prepared statements, which
// postgres.js uses by default. Safe to keep off for the direct connection too.
const queryClient = postgres(connectionString, {
  ssl: isLocalHost ? false : 'require',
  prepare: false,
  onnotice: () => {}, // Silences routine NOTICE logs (e.g. column already exists)
  debug: process.env.DB_DEBUG === '1' ? (_c: unknown, query: string, params: unknown) => console.log('[sql]', query, params) : undefined,
})
export const db = drizzle(queryClient, { schema })

// postgres.js connects lazily — the client above doesn't actually open a
// socket until the first query runs, so a wrong/unreachable DATABASE_URL
// would otherwise let the server start and accept traffic, only failing
// once a request happened to touch the database. Call this before serve()
// so a bad connection stops the process at startup instead.
export async function assertDatabaseConnection(): Promise<void> {
  await queryClient`select 1`
  await queryClient`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text`
}
