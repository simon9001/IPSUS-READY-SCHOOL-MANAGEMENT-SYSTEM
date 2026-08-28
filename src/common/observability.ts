import type { Context, Next } from 'hono'
import client from 'prom-client'

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

// ---- Terminal request/error logging ----
// ANSI color codes, no extra dependency — green/yellow/red by status class,
// matching the convention most HTTP loggers use so the pattern is
// recognizable at a glance in a scrolling terminal.
const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
function colorForStatus(status: number): string {
  if (status >= 500) return '\x1b[31m' // red
  if (status >= 400) return '\x1b[33m' // yellow
  if (status >= 300) return '\x1b[36m' // cyan
  return '\x1b[32m' // green
}

export async function requestLogger(c: Context, next: Next) {
  const start = performance.now()
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
  const color = colorForStatus(status)
  const actor = user ? `user#${user.id}` : 'anon'

  console.log(
    `${DIM}${new Date().toISOString()}${RESET} ${color}${status}${RESET} ${c.req.method} ${c.req.path} ${DIM}${durationMs.toFixed(1)}ms ${actor}${RESET}`,
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
// trace in the terminal instead of only the client seeing it. Repeated 403s
// from one IP/user are exactly the kind of pattern this is meant to surface.
export function logError(c: Context, err: unknown, statusCode: number) {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error && statusCode >= 500 ? `\n${err.stack}` : ''
  console.error(
    `${DIM}${new Date().toISOString()}${RESET} \x1b[31m${statusCode}${RESET} ${c.req.method} ${c.req.path} — ${message}${stack}`,
  )
}

export async function metricsHandler(c: Context) {
  c.header('Content-Type', metricsRegistry.contentType)
  return c.body(await metricsRegistry.metrics())
}
