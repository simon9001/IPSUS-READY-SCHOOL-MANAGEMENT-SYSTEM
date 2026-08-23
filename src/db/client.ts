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
  debug: process.env.DB_DEBUG === '1' ? (_c: unknown, query: string, params: unknown) => console.log('[sql]', query, params) : undefined,
})
export const db = drizzle(queryClient, { schema })
