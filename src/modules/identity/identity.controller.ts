import type { Context } from 'hono'
import { identityService } from './identity.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AuthUser } from '../../common/auth.js'
import type { AssignRoleInput, CreateUserInput, ResetPasswordInput, SetPermissionOverrideInput, UpdateUserInput } from './identity.schema.js'

// requirePermission already guarantees c.get('user') is set for every route
// this controller serves.
const actorId = (c: Context) => (c.get('user') as AuthUser).id

export const identityController = {
  listUsers: async (c: Context) => ok(c, await identityService.listUsers()),
  getUserById: async (c: Context) => ok(c, await identityService.getUserById(Number(c.req.param('id')))),
  createUser: async (c: Context) =>
    created(c, await identityService.createUser(getValidated<CreateUserInput>(c, 'json'), actorId(c))),
  updateUser: async (c: Context) =>
    ok(c, await identityService.updateUser(Number(c.req.param('id')), getValidated<UpdateUserInput>(c, 'json'), actorId(c))),
  resetPassword: async (c: Context) =>
    ok(c, await identityService.resetPassword(Number(c.req.param('id')), getValidated<ResetPasswordInput>(c, 'json'), actorId(c))),

  listRoles: async (c: Context) => ok(c, await identityService.listRoles()),
  listPermissions: async (c: Context) => ok(c, await identityService.listPermissions()),

  assignRole: async (c: Context) =>
    ok(c, await identityService.assignRole(Number(c.req.param('userId')), getValidated<AssignRoleInput>(c, 'json'), actorId(c))),
  removeRole: async (c: Context) =>
    ok(c, await identityService.removeRole(Number(c.req.param('userId')), Number(c.req.param('roleId')), actorId(c))),

  listUserPermissions: async (c: Context) =>
    ok(c, await identityService.listUserPermissions(Number(c.req.param('userId')))),
  setPermissionOverride: async (c: Context) =>
    ok(c, await identityService.setPermissionOverride(
      Number(c.req.param('userId')),
      c.req.param('code')!,
      getValidated<SetPermissionOverrideInput>(c, 'json').granted,
      actorId(c),
    )),
  clearPermissionOverride: async (c: Context) =>
    ok(c, await identityService.clearPermissionOverride(
      Number(c.req.param('userId')),
      c.req.param('code')!,
      actorId(c),
    )),

  listAuditLog: async (c: Context) => {
    const limit = Math.min(Number(c.req.query('limit') ?? 100), 500)
    return ok(c, await identityService.listAuditLog(limit))
  },
}
