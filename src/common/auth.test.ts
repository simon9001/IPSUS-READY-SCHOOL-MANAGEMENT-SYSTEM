import { describe, it, expect } from 'vitest'
import type { Context, Next } from 'hono'
import { requirePermission, requireAuth, requireSelf, type AuthUser } from './auth.js'
import { UnauthorizedError, ForbiddenError } from './errors.js'

// attachUser() swallows an invalid/expired token and simply leaves no user on
// the context, so "no user" is exactly what a stale session looks like here.
function ctx(user: AuthUser | undefined, params: Record<string, string> = {}): Context {
  return {
    get: (key: string) => (key === 'user' ? user : undefined),
    req: { param: (name: string) => params[name] },
  } as unknown as Context
}

const ALICE: AuthUser = { id: 7, permissions: ['fees.view'] }

function spyNext(): Next & { called: boolean } {
  const fn = (async () => {
    fn.called = true
  }) as Next & { called: boolean }
  fn.called = false
  return fn
}

describe('requirePermission', () => {
  it('rejects an unauthenticated caller with 401, not 403', async () => {
    const next = spyNext()
    await expect(requirePermission('fees.view')(ctx(undefined), next)).rejects.toBeInstanceOf(UnauthorizedError)
    expect(next.called).toBe(false)
  })

  it('rejects an authenticated caller missing the permission with 403', async () => {
    const next = spyNext()
    const err = await requirePermission('payroll.process')(ctx(ALICE), next).catch((e) => e)
    expect(err).toBeInstanceOf(ForbiddenError)
    expect(err.statusCode).toBe(403)
    expect(next.called).toBe(false)
  })

  it('lets a permitted caller through', async () => {
    const next = spyNext()
    await requirePermission('fees.view')(ctx(ALICE), next)
    expect(next.called).toBe(true)
  })
})

describe('requireAuth', () => {
  it('rejects an unauthenticated caller with 401', async () => {
    const err = await requireAuth()(ctx(undefined), spyNext()).catch((e) => e)
    expect(err).toBeInstanceOf(UnauthorizedError)
    expect(err.statusCode).toBe(401)
  })

  it('lets any authenticated caller through', async () => {
    const next = spyNext()
    await requireAuth()(ctx(ALICE), next)
    expect(next.called).toBe(true)
  })
})

describe('requireSelf', () => {
  it('rejects an unauthenticated caller with 401', async () => {
    const err = await requireSelf('userId')(ctx(undefined, { userId: '7' }), spyNext()).catch((e) => e)
    expect(err).toBeInstanceOf(UnauthorizedError)
    expect(err.statusCode).toBe(401)
  })

  // Still an authorisation failure, not a session problem: signing this user
  // out because they poked at someone else's URL would be wrong.
  it("rejects someone else's records with 403", async () => {
    const err = await requireSelf('userId')(ctx(ALICE, { userId: '99' }), spyNext()).catch((e) => e)
    expect(err).toBeInstanceOf(ForbiddenError)
    expect(err.statusCode).toBe(403)
  })

  it('lets the owner through', async () => {
    const next = spyNext()
    await requireSelf('userId')(ctx(ALICE, { userId: '7' }), next)
    expect(next.called).toBe(true)
  })
})
