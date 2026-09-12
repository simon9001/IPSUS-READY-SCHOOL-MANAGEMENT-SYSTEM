import { describe, it, expect } from 'vitest'
import type { Context } from 'hono'
import { authController } from './auth.controller.js'
import { UnauthorizedError } from '../../common/errors.js'

// These three routes are reached with no user on the context whenever the
// bearer token has expired or been revoked — attachUser() swallows the token
// error rather than rejecting the request.
const anonymous = { get: () => undefined } as unknown as Context

describe('authController with no valid session', () => {
  it('me() rejects with 401 so the client knows to sign in again', async () => {
    const err = await authController.me(anonymous).catch((e) => e)
    expect(err).toBeInstanceOf(UnauthorizedError)
    expect(err.statusCode).toBe(401)
  })

  it('updateProfile() rejects with 401', async () => {
    const err = await authController.updateProfile(anonymous).catch((e) => e)
    expect(err).toBeInstanceOf(UnauthorizedError)
    expect(err.statusCode).toBe(401)
  })

  it('changePassword() rejects with 401', async () => {
    const err = await authController.changePassword(anonymous).catch((e) => e)
    expect(err).toBeInstanceOf(UnauthorizedError)
    expect(err.statusCode).toBe(401)
  })
})
