import { afterEach, describe, expect, it, vi } from 'vitest'
import { Hono, type Context } from 'hono'
import { requestLogger, logError } from './observability.js'
import { logger } from './logger.js'
import { NotFoundError } from './errors.js'

function appWith(handler: (c: Context) => Response | Promise<Response>) {
  const app = new Hono()
  app.use('*', requestLogger)
  app.get('/thing', handler)
  app.onError((err, c) => {
    const status = err instanceof NotFoundError ? 404 : 500
    logError(c, err, status)
    return c.json({ success: false }, status)
  })
  return app
}

afterEach(() => vi.restoreAllMocks())

describe('requestLogger', () => {
  it('logs one structured line per request with method, path, status and duration', async () => {
    const info = vi.spyOn(logger, 'info')
    const res = await appWith((c) => c.text('ok')).request('/thing')

    expect(res.status).toBe(200)
    expect(info).toHaveBeenCalledTimes(1)
    const [fields, msg] = info.mock.calls[0] as unknown as [Record<string, unknown>, string]
    expect(msg).toBe('request completed')
    expect(fields).toMatchObject({ method: 'GET', path: '/thing', status: 200, userId: null })
    expect(typeof fields.durationMs).toBe('number')
  })

  it('generates a request id and echoes it in X-Request-Id', async () => {
    const info = vi.spyOn(logger, 'info')
    const res = await appWith((c) => c.text('ok')).request('/thing')

    const id = res.headers.get('x-request-id')
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect((info.mock.calls[0][0] as unknown as { requestId: string }).requestId).toBe(id)
  })

  it('reuses an incoming X-Request-Id from an upstream proxy', async () => {
    vi.spyOn(logger, 'info')
    const res = await appWith((c) => c.text('ok')).request('/thing', { headers: { 'X-Request-Id': 'abc-123' } })
    expect(res.headers.get('x-request-id')).toBe('abc-123')
  })

  it('logs a thrown 4xx at warn with its status and still lets onError respond', async () => {
    const warn = vi.spyOn(logger, 'warn')
    const res = await appWith(() => {
      throw new NotFoundError('Student 9 not found')
    }).request('/thing')

    expect(res.status).toBe(404)
    const statuses = warn.mock.calls.map((call) => (call[0] as unknown as { status: number }).status)
    expect(statuses).toEqual([404, 404]) // logError's line + the request line
  })

  it('logs an unexpected error at error level with the error attached', async () => {
    const error = vi.spyOn(logger, 'error')
    const boom = new Error('db exploded')
    const res = await appWith(() => {
      throw boom
    }).request('/thing')

    expect(res.status).toBe(500)
    expect(error.mock.calls.some((call) => (call[0] as unknown as { err?: unknown }).err === boom)).toBe(true)
  })
})
