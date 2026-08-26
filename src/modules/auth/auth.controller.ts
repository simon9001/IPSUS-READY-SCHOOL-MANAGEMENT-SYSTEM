import type { Context } from 'hono'
import { authService } from './auth.service.js'
import { ok } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import { ForbiddenError } from '../../common/errors.js'
import type { LoginInput } from './auth.schema.js'

export const authController = {
  login: async (c: Context) => ok(c, await authService.login(getValidated<LoginInput>(c, 'json'))),

  me: async (c: Context) => {
    const user = c.get('user') as { id: number } | undefined
    if (!user) throw new ForbiddenError('Not authenticated')
    return ok(c, await authService.me(user.id))
  },
}
