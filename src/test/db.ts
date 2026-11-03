import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '../db/schema/index.js'
import { createScopedDb } from '../db/scoped.js'

// Stands in for src/db/client.ts in end-to-end tests: real Postgres (compiled
// to WASM, running inside the test process), real migrations, no Docker.
export const pg = new PGlite()
const root = drizzle(pg, { schema })
await migrate(root, { migrationsFolder: 'drizzle' })

export const { db, withTransaction } = createScopedDb(root)

export async function checkDatabase(): Promise<void> {
  await pg.query('select 1')
}

export const assertDatabaseConnection = checkDatabase
