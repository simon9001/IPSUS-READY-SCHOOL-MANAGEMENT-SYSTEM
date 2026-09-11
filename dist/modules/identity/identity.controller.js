import { identityService } from './identity.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
// requirePermission already guarantees c.get('user') is set for every route
// this controller serves.
const actorId = (c) => c.get('user').id;
export const identityController = {
    listUsers: async (c) => ok(c, await identityService.listUsers()),
    getUserById: async (c) => ok(c, await identityService.getUserById(Number(c.req.param('id')))),
    createUser: async (c) => created(c, await identityService.createUser(getValidated(c, 'json'), actorId(c))),
    updateUser: async (c) => ok(c, await identityService.updateUser(Number(c.req.param('id')), getValidated(c, 'json'), actorId(c))),
    resetPassword: async (c) => ok(c, await identityService.resetPassword(Number(c.req.param('id')), getValidated(c, 'json'), actorId(c))),
    listRoles: async (c) => ok(c, await identityService.listRoles()),
    listPermissions: async (c) => ok(c, await identityService.listPermissions()),
    assignRole: async (c) => ok(c, await identityService.assignRole(Number(c.req.param('userId')), getValidated(c, 'json'), actorId(c))),
    removeRole: async (c) => ok(c, await identityService.removeRole(Number(c.req.param('userId')), Number(c.req.param('roleId')), actorId(c))),
    listUserPermissions: async (c) => ok(c, await identityService.listUserPermissions(Number(c.req.param('userId')))),
    setPermissionOverride: async (c) => ok(c, await identityService.setPermissionOverride(Number(c.req.param('userId')), c.req.param('code'), getValidated(c, 'json').granted, actorId(c))),
    clearPermissionOverride: async (c) => ok(c, await identityService.clearPermissionOverride(Number(c.req.param('userId')), c.req.param('code'), actorId(c))),
    listAuditLog: async (c) => {
        const limit = Math.min(Number(c.req.query('limit') ?? 100), 500);
        return ok(c, await identityService.listAuditLog(limit));
    },
};
