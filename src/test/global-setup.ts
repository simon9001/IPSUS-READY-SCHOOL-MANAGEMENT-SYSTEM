import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'

// Applying every migration takes tens of seconds under load. Do it once, and let
// each end-to-end suite start from a copy of the result (see db.ts).
export default async function setup() {
  const pg = new PGlite()
  await migrate(drizzle(pg), { migrationsFolder: 'drizzle' })
  const snapshot = await pg.dumpDataDir('none')
  await pg.close()

  const directory = mkdtempSync(join(tmpdir(), 'school-api-pglite-'))
  const file = join(directory, 'migrated.tar')
  writeFileSync(file, Buffer.from(await snapshot.arrayBuffer()))
  process.env.PGLITE_SNAPSHOT = file

  return () => rmSync(directory, { recursive: true, force: true })
}
