import { serve } from '@hono/node-server'
import { app } from './app.js'
import { logger } from './common/logger.js'
import { assertDatabaseConnection } from './db/client.js'
import { resolvePort, DEFAULT_PORT } from './common/port.js'

const rawPort = process.env.PORT
if (rawPort !== undefined && rawPort.trim() === '') {
  logger.warn(`PORT is set but empty — falling back to ${DEFAULT_PORT}.`)
}
const port = resolvePort(rawPort)

// Refuse to start listening at all until the database is actually reachable
// — no request should ever be able to hit this server and only then
// discover the DB connection is broken.
try {
  await assertDatabaseConnection()
  logger.info('Database connection OK')
} catch (err) {
  logger.fatal({ err }, 'Failed to connect to the database — server will not start.')
  process.exit(1)
}

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    logger.info({ port: info.port }, `Server is running on port:${info.port}`)
  },
)
