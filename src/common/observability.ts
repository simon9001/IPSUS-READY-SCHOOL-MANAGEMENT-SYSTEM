import type { Context, Next } from 'hono'
import { randomUUID } from 'node:crypto'
import client from 'prom-client'
import { logger } from './logger.js'

// ---- Prometheus metrics ----
// One registry for everything this process exposes. collectDefaultMetrics
// adds the usual Node.js process metrics (heap, event loop lag, GC, CPU) for
// free, prefixed so they don't collide with the app's own metric names.
export const metricsRegistry = new client.Registry()
client.collectDefaultMetrics({ register: metricsRegistry, prefix: 'school_api_' })

const httpRequestsTotal = new client.Counter({
  name: 'school_api_http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
})

const httpRequestDurationSeconds = new client.Histogram({
  name: 'school_api_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
})

const httpErrorsTotal = new client.Counter({
  name: 'school_api_http_errors_total',
  help: 'Total HTTP responses with status >= 400',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
})

// route() falls back to the raw path if Hono hasn't matched anything (e.g. a
// 404 on a path with no registered handler) — routePath would otherwise be
// empty and every unmatched path would collapse into one confusing label.
function routeLabel(c: Context): string {
  return c.req.routePath || c.req.path
}

// ---- Structured request/error logging ----
// One JSON log line per request (pretty-printed in a dev terminal — see
// logger.ts). Each request gets an id, echoed back as X-Request-Id, so a
// user-reported failure can be matched to its log lines; an incoming
// X-Request-Id from a proxy is reused rather than replaced.
function levelForStatus(status: number): 'error' | 'warn' | 'info' {
  if (status >= 500) return 'error'
  if (status >= 400) return 'warn'
  return 'info'
}

export async function requestLogger(c: Context, next: Next) {
  const start = performance.now()
  const requestId = c.req.header('x-request-id') || randomUUID()
  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)

  // A downstream handler throwing (e.g. requirePermission's 403, or a
  // NotFoundError) rejects this next() call — without the try/catch here,
  // that exception would skip straight past everything below and up to
  // app.onError, meaning every error response would go completely
  // uncounted in metrics and unlogged on the normal request line. Record
  // first, then let the error keep propagating so onError still runs.
  let thrown: unknown
  try {
    await next()
  } catch (err) {
    thrown = err
  }

  const durationMs = performance.now() - start
  const status = thrown ? statusFromError(thrown) : c.res.status
  const user = c.get('user') as { id: number } | undefined

  logger[levelForStatus(status)](
    {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      durationMs: Math.round(durationMs * 10) / 10,
      userId: user?.id ?? null,
    },
    'request completed',
  )

  const route = routeLabel(c)
  const labels = { method: c.req.method, route, status_code: String(status) }
  httpRequestsTotal.inc(labels)
  httpRequestDurationSeconds.observe(labels, durationMs / 1000)
  if (status >= 400) httpErrorsTotal.inc(labels)

  if (thrown) throw thrown
}

function statusFromError(err: unknown): number {
  return err && typeof err === 'object' && 'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500
}

// Called from index.ts's onError handler so every thrown error — expected
// (AppError, e.g. a 403 from requirePermission) or not — leaves a visible
// trace in the logs instead of only the client seeing it. Repeated 403s
// from one IP/user are exactly the kind of pattern this is meant to surface.
// Stack traces are only attached for 5xx; a 4xx is the caller's mistake.
export function logError(c: Context, err: unknown, statusCode: number) {
  const fields = {
    requestId: c.get('requestId') as string | undefined,
    method: c.req.method,
    path: c.req.path,
    status: statusCode,
  }
  if (statusCode >= 500) {
    logger.error({ ...fields, err }, 'unhandled error')
  } else {
    logger.warn({ ...fields, reason: err instanceof Error ? err.message : String(err) }, 'request rejected')
  }
}

export async function metricsHandler(c: Context) {
  c.header('Content-Type', metricsRegistry.contentType)
  return c.body(await metricsRegistry.metrics())
}
