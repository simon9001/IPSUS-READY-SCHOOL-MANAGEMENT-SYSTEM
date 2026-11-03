import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../db/schema/index.js'
import { createScopedDb } from '../db/scoped.js'

// Stands in for src/db/client.ts in end-to-end tests: real Postgres (compiled
// to WASM, running inside the test process) with no Docker. Each suite gets its
// own database, started from the migrated copy global-setup.ts prepared.
export const pg = new PGlite({ loadDataDir: new Blob([readFileSync(process.env.PGLITE_SNAPSHOT as string)]) })
await pg.waitReady

export const { db, withTransaction } = createScopedDb(drizzle(pg, { schema }))

export async function checkDatabase(): Promise<void> {
  await pg.query('select 1')
}

export const assertDatabaseConnection = checkDatabase
