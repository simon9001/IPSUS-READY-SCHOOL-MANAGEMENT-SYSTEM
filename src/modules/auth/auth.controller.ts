import type { Context } from 'hono'
import { authService } from './auth.service.js'
import { ok } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import { ForbiddenError } from '../../common/errors.js'
import type { ChangePasswordInput, LoginInput, UpdateProfileInput } from './auth.schema.js'

export const authController = {
  login: async (c: Context) => ok(c, await authService.login(getValidated<LoginInput>(c, 'json'))),

  me: async (c: Context) => {
    const user = c.get('user') as { id: number } | undefined
    if (!user) throw new ForbiddenError('Not authenticated')
    return ok(c, await authService.me(user.id))
  },

  updateProfile: async (c: Context) => {
    const user = c.get('user') as { id: number } | undefined
    if (!user) throw new ForbiddenError('Not authenticated')
    return ok(c, await authService.updateProfile(user.id, getValidated<UpdateProfileInput>(c, 'json')))
  },

  changePassword: async (c: Context) => {
    const user = c.get('user') as { id: number } | undefined
    if (!user) throw new ForbiddenError('Not authenticated')
    return ok(c, await authService.changePassword(user.id, getValidated<ChangePasswordInput>(c, 'json')))
  },
}
