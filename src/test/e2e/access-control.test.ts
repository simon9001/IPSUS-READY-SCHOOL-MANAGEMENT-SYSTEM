import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { app } from '../../app.js'
import { api, seedDatabase, TEST_PASSWORD, userWithPermissions, userWithRole, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

beforeAll(seedDatabase)
afterEach(() => vi.unstubAllEnvs())

// Reachable with no session on purpose. Everything else under /api must refuse.
const PUBLIC_ROUTES = new Set(['POST /api/auth/login', 'GET /api/search'])

function apiRoutes() {
  const seen = new Set<string>()
  return app.routes
    .filter((route) => route.path.startsWith('/api/') && route.method !== 'ALL')
    .map((route) => ({ method: route.method, path: route.path }))
    .filter(({ method, path }) => {
      const key = `${method} ${path}`
      if (seen.has(key) || PUBLIC_ROUTES.has(key)) return false
      seen.add(key)
      return true
    })
}

const concrete = (path: string) => path.replace(/:[A-Za-z]+/g, '1')

describe('every API route', () => {
  it('finds the routes it is meant to be checking', () => {
    expect(apiRoutes().length).toBeGreaterThan(150)
  })

  it.each(apiRoutes().map((r) => [r.method, r.path] as const))('%s %s refuses an anonymous caller', async (method, path) => {
    const res = await app.request(concrete(path), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : '{}',
    })
    expect(res.status).toBe(401)
  })
})

describe('session tokens', () => {
  let user: Actor

  beforeAll(async () => {
    user = await userWithRole('bursar')
  })

  it('stop working the moment their owner is suspended', async () => {
    const admin = await userWithRole('system_admin')
    const person = await userWithRole('bursar')
    expect((await api('GET', '/api/auth/me', { as: person })).status).toBe(200)

    await api('PATCH', `/api/users/${person.id}`, { as: admin, body: { status: 'suspended' } })

    expect((await api('GET', '/api/auth/me', { as: person })).status).toBe(401)
  })

  it('are not accepted in the query string on ordinary routes', async () => {
    const res = await app.request(`/api/auth/me?token=${user.token}`)
    expect(res.status).toBe(401)
  })

  it('are accepted in the query string on the event stream, which cannot set headers', async () => {
    const res = await app.request(`/api/realtime/events?token=${user.token}`)
    expect(res.status).toBe(200)
    await res.body?.cancel()
  })
})

describe('login', () => {
  const login = (email: string, password: string) => api('POST', '/api/auth/login', { body: { email, password } })

  it("doesn't reveal a suspended account to someone without the password", async () => {
    const admin = await userWithRole('system_admin')
    const user = await userWithRole('bursar')
    await api('PATCH', `/api/users/${user.id}`, { as: admin, body: { status: 'suspended' } })

    const guess = await login(user.email, 'wrong-password')
    expect(guess.status).toBe(400)
    expect(guess.body.error).toBe('Invalid email or password')

    const owner = await login(user.email, TEST_PASSWORD)
    expect(owner.status).toBe(403)
    expect(owner.body.error).toMatch(/suspended/)
  })

  it('refuses a new password shorter than an admin-set one may be', async () => {
    const user = await userWithRole('teacher')
    const res = await api('PUT', '/api/auth/change-password', {
      as: user,
      body: { currentPassword: TEST_PASSWORD, newPassword: 'short12' },
    })
    expect(res.status).toBe(400)
  })

  it('changes a password so the old one stops working', async () => {
    const user = await userWithRole('teacher')
    const changed = await api('PUT', '/api/auth/change-password', {
      as: user,
      body: { currentPassword: TEST_PASSWORD, newPassword: 'An0ther-Passw0rd!' },
    })

    expect(changed.status).toBe(200)
    expect((await login(user.email, TEST_PASSWORD)).status).toBe(400)
    expect((await login(user.email, 'An0ther-Passw0rd!')).status).toBe(200)
  })

  it('gives a fresh count of attempts once a lockout has expired', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const { email } = await userWithRole('bursar')
      for (let attempt = 0; attempt < 5; attempt++) await login(email, 'wrong-password')
      expect((await login(email, TEST_PASSWORD)).status).toBe(403)

      vi.setSystemTime(Date.now() + 16 * 60 * 1000)

      // One typo after the lock ends must not lock the account again immediately.
      expect((await login(email, 'wrong-password')).status).toBe(400)
      expect((await login(email, TEST_PASSWORD)).status).toBe(200)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('transport', () => {
  it('sends security headers', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('strict-transport-security')).toBeTruthy()
  })

  it('refuses an oversized body with 413 before reading it', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(11 * 1024 * 1024) }),
    })
    expect(res.status).toBe(413)
  })
})

describe('/metrics', () => {
  it('is open in development for a local scraper', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('METRICS_TOKEN', '')
    expect((await app.request('/metrics')).status).toBe(200)
  })

  it('does not exist in production unless a token is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('METRICS_TOKEN', '')
    expect((await app.request('/metrics')).status).toBe(404)
  })

  it('needs the bearer token once one is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('METRICS_TOKEN', 'scrape-secret')

    expect((await app.request('/metrics')).status).toBe(401)
    expect((await app.request('/metrics', { headers: { Authorization: 'Bearer wrong' } })).status).toBe(401)
    expect((await app.request('/metrics', { headers: { Authorization: 'Bearer scrape-secret' } })).status).toBe(200)
  })
})

describe('search', () => {
  let everyone: Actor

  beforeAll(async () => {
    everyone = await userWithPermissions('students.manage', 'students.view')
    const created = await api('POST', '/api/students/classes', { as: everyone, body: { name: 'Form 2', level: 2 } })
    await api('POST', '/api/students', {
      as: everyone,
      body: { admissionNo: 'S-777', firstName: 'Wanjiru', lastName: 'Kamau', classId: created.body.data.id, admissionDate: '2026-01-06' },
    })
  })

  const search = (q: string, as?: Actor) => api('GET', `/api/search?q=${encodeURIComponent(q)}`, { as })

  it('finds a student for someone allowed to see students', async () => {
    const res = await search('Wanjiru', everyone)
    expect(res.body.data.map((r: { title: string }) => r.title)).toEqual(['Wanjiru Kamau (S-777)'])
  })

  it('only returns categories the caller holds the permission for', async () => {
    const financeOnly = await userWithPermissions('fees.view')
    expect((await search('Wanjiru', financeOnly)).body.data).toEqual([])
  })

  it('returns nothing to an anonymous caller', async () => {
    expect((await search('Wanjiru')).body.data).toEqual([])
  })

  it('ignores a query too short to mean anything', async () => {
    expect((await search('W', everyone)).body.data).toEqual([])
  })

  it('treats LIKE wildcards as ordinary characters, so % cannot list everything', async () => {
    expect((await search('%%', everyone)).body.data).toEqual([])
    expect((await search('W_njiru', everyone)).body.data).toEqual([])
  })
})
