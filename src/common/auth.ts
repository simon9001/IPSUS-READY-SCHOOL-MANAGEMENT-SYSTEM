import type { Context, Next } from 'hono'
import { ForbiddenError } from './errors.js'

// Extension point for your own auth. Once you have a login/session
// middleware that does c.set('user', { id, permissions: string[] }),
// attach requirePermission(code) to any route that needs it, e.g.:
//   accountsRoutes.post('/', requirePermission('ledger.accounts.manage'), zValidator(...), accountsController.create)
export interface AuthUser {
  id: number
  permissions: string[]
}

export function requirePermission(code: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined
    if (!user || !user.permissions.includes(code)) {
      throw new ForbiddenError(`Missing required permission: ${code}`)
    }
    await next()
  }
}

// For the handful of routes meant to be readable by any logged-in staff
// member (e.g. school notices) where no dedicated `.view` permission exists
// in the catalog — still blocks unauthenticated requests, unlike leaving the
// route ungated entirely.
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser | undefined
    if (!user) throw new ForbiddenError('Authentication required')
    await next()
  }
}
