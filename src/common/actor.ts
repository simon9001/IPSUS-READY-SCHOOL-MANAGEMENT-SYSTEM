import type { Context } from 'hono'
import type { AuthUser } from './auth.js'

/** The signed-in user making the request, for audit entries. Only call this
 *  behind requirePermission or requireAuth, which guarantee c.get('user'). */
export const actorId = (c: Context) => (c.get('user') as AuthUser).id
