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
