import { Hono } from 'hono'
import { logger } from './logger.js'

// Not to be confused with modules/health (student medical records, mounted
// at /api/health). This is the liveness/readiness probe for load balancers,
// uptime monitors and container orchestrators.

const DEFAULT_TIMEOUT_MS = 2000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * GET / → 200 {status:'ok'} when the database answers a trivial query, 503
 * otherwise. The check is time-boxed: a probe that hangs on a stalled
 * connection pool is worse than one that fails, because orchestrators wait
 * on it before deciding to restart or route around the instance.
 */
export function createHealthRoutes(checkDatabase: () => Promise<unknown>, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const routes = new Hono()

  routes.get('/', async (c) => {
    const startedAt = performance.now()
    try {
      await withTimeout(checkDatabase(), timeoutMs)
      return c.json({
        status: 'ok',
        checks: { database: 'ok' },
        uptimeSeconds: Math.round(process.uptime()),
        latencyMs: Math.round(performance.now() - startedAt),
      })
    } catch (err) {
      logger.error({ err }, 'health check failed: database unreachable')
      // The underlying error (host names, credentials in a connection string)
      // stays in the logs; this endpoint is unauthenticated.
      return c.json({ status: 'error', checks: { database: 'unreachable' } }, 503)
    }
  })

  return routes
}
