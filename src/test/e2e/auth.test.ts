import { beforeAll, describe, expect, it, vi } from 'vitest'
import { api, seedDatabase, TEST_PASSWORD, userWithPermissions, userWithRole } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

beforeAll(seedDatabase)

const login = (email: string, password: string) => api('POST', '/api/auth/login', { body: { email, password } })

describe('login', () => {
  it('signs in the seeded administrator and returns their real permissions', async () => {
    const res = await login('admin@school.local', TEST_PASSWORD)

    expect(res.status).toBe(200)
    expect(res.body.data.token).toEqual(expect.any(String))
    expect(res.body.data.user.permissions).toContain('users.manage')
  })

  it('rejects a wrong password with the same message as an unknown email', async () => {
    const wrongPassword = await login('admin@school.local', 'wrong-password')
    const unknownEmail = await login('nobody@school.local', 'wrong-password')

    expect(wrongPassword.status).toBe(400)
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error)
  })

  it('locks the account after five failed attempts, even for the right password', async () => {
    const { email } = await userWithRole('bursar')
    for (let attempt = 0; attempt < 4; attempt++) {
      expect((await login(email, 'wrong-password')).status).toBe(400)
    }
    expect((await login(email, 'wrong-password')).status).toBe(403)
    expect((await login(email, TEST_PASSWORD)).status).toBe(403)
  })
})

describe('sessions', () => {
  it('returns the signed-in user from /me, without the password hash', async () => {
    const bursar = await userWithRole('bursar')
    const res = await api('GET', '/api/auth/me', { as: bursar })

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(bursar.email)
    expect(res.body.data).not.toHaveProperty('passwordHash')
  })

  it('treats a tampered token as no session at all', async () => {
    expect((await api('GET', '/api/auth/me', { token: 'not.a.token' })).status).toBe(401)
  })
})

describe('permission enforcement over HTTP', () => {
  it('answers 401 with no session and 403 without the permission', async () => {
    const noGrant = await userWithPermissions()

    expect((await api('GET', '/api/journal-entries')).status).toBe(401)
    expect((await api('GET', '/api/journal-entries', { as: noGrant })).status).toBe(403)
  })

  it('lets a role that holds the permission through', async () => {
    const bursar = await userWithRole('bursar')
    expect((await api('GET', '/api/journal-entries', { as: bursar })).status).toBe(200)
  })

  it('a revoking override beats the role that grants the permission', async () => {
    const admin = await userWithRole('system_admin')
    const bursar = await userWithRole('bursar')
    expect((await api('GET', '/api/journal-entries', { as: bursar })).status).toBe(200)

    const revoked = await api('PUT', `/api/users/${bursar.id}/permissions/ledger.journal.view`, { as: admin, body: { granted: false } })
    expect(revoked.status).toBe(200)

    expect((await api('GET', '/api/journal-entries', { as: bursar })).status).toBe(403)
  })
})
