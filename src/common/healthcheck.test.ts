import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHealthRoutes } from './healthcheck.js'
import { logger } from './logger.js'

afterEach(() => vi.restoreAllMocks())

describe('GET /health', () => {
  it('returns 200 with status ok when the database answers', async () => {
    const res = await createHealthRoutes(async () => {}).request('/')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ status: 'ok', checks: { database: 'ok' } })
    expect(typeof body.uptimeSeconds).toBe('number')
  })

  it('returns 503 when the database query fails, without leaking the error', async () => {
    const logged = vi.spyOn(logger, 'error')
    const res = await createHealthRoutes(async () => {
      throw new Error('password authentication failed for user "accounts"')
    }).request('/')

    expect(res.status).toBe(503)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ status: 'error', checks: { database: 'unreachable' } })
    expect(text).not.toContain('password')
    expect(logged).toHaveBeenCalledTimes(1)
  })

  it('returns 503 instead of hanging when the database never answers', async () => {
    vi.spyOn(logger, 'error')
    const neverResolves = () => new Promise<void>(() => {})
    const res = await createHealthRoutes(neverResolves, 20).request('/')

    expect(res.status).toBe(503)
  })
})
