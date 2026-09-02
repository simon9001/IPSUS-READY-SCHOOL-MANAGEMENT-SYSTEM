import type { Context, Next } from 'hono'
import { authService } from './auth.service.js'

/**
 * Decodes a Bearer token if present and attaches the user's id+permissions
 * to the request context — this is what makes common/auth.ts's
 * requirePermission() actually functional. Never blocks the request itself
 * (no token / an invalid token just means c.get('user') stays undefined);
 * routes that need to require a permission attach requirePermission(code)
 * themselves, same as always.
 */
export async function attachUser(c: Context, next: Next) {
  const header = c.req.header('Authorization')
  const queryToken = c.req.query('token')
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : queryToken

  if (token) {
    try {
      const payload = authService.verifyToken(token)
      const user = await authService.me(payload.sub)
      c.set('user', { id: user.id, permissions: user.permissions })
    } catch {
      // invalid/expired token — treated as unauthenticated, not an error
    }
  }
  await next()
}
