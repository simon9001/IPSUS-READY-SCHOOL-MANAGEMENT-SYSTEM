import { identityRepository } from './identity.repository.js';
import { hashPassword } from './password.js';
import { recordAudit } from '../../common/audit.js';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js';
import { administratorIds, wouldRemoveLastAdministrator } from '../../common/permissionRules.js';
function attachRoles(users, links) {
    return users.map((user) => ({
        ...user,
        roles: links.filter((l) => l.userId === user.id).map((l) => ({ id: l.roleId, code: l.code, name: l.name })),
    }));
}
// The permission whose disappearance locks everyone out of user administration.
const ADMIN_PERMISSION = 'users.manage';
export const identityService = {
    async listUsers() {
        const [users, links] = await Promise.all([identityRepository.findAllUsers(), identityRepository.findAllUserRoleLinks()]);
        return attachRoles(users, links);
    },
    async getUserById(id) {
        const user = await identityRepository.findUserById(id);
        if (!user)
            throw new NotFoundError(`User ${id} not found`);
        const links = await identityRepository.findRoleLinksForUser(id);
        return { ...user, roles: links.map((l) => ({ id: l.roleId, code: l.code, name: l.name })) };
    },
    async createUser(input, actorUserId) {
        const existing = await identityRepository.findUserByEmail(input.email);
        if (existing)
            throw new ConflictError(`A user with email ${input.email} already exists`);
        const passwordHash = await hashPassword(input.password);
        const user = await identityRepository.createUser({ ...input, passwordHash });
        for (const roleId of input.roleIds) {
            await identityRepository.assignRole(user.id, roleId, actorUserId);
        }
        await recordAudit({
            userId: actorUserId,
            action: 'user.create',
            entityType: 'user',
            entityId: user.id,
            afterData: { email: user.email, fullName: user.fullName, roleIds: input.roleIds },
        });
        return this.getUserById(user.id);
    },
    async updateUser(id, input, actorUserId) {
        const before = await this.getUserById(id);
        // The last-administrator guard counts only users whose status is 'active',
        // so suspending or locking the sole administrator is another route to the
        // very lockout that guard exists to prevent.
        if (input.status !== undefined && input.status !== 'active') {
            await this.assertNotLastAdministrator(id);
        }
        const updated = await identityRepository.updateUser(id, input);
        if (!updated)
            throw new NotFoundError(`User ${id} not found`);
        await recordAudit({
            userId: actorUserId,
            action: 'user.update',
            entityType: 'user',
            entityId: id,
            beforeData: { fullName: before.fullName, phone: before.phone, status: before.status },
            afterData: input,
        });
        return this.getUserById(id);
    },
    async resetPassword(id, input, actorUserId) {
        const user = await identityRepository.findUserById(id);
        if (!user)
            throw new NotFoundError(`User ${id} not found`);
        const passwordHash = await hashPassword(input.newPassword);
        await identityRepository.setPasswordHash(id, passwordHash);
        await recordAudit({ userId: actorUserId, action: 'user.reset_password', entityType: 'user', entityId: id });
        return { success: true };
    },
    async listRoles() {
        const roles = await identityRepository.findAllRoles();
        return Promise.all(roles.map(async (role) => ({
            ...role,
            permissions: (await identityRepository.findPermissionsForRole(role.id)).map((p) => p.code),
        })));
    },
    /** The permission catalogue as the database actually holds it — what the
     *  Roles page shows alongside each role's grants. Compare against rbac.ts
     *  via the system module's drift check, not here. */
    listPermissions: () => identityRepository.findAllPermissions(),
    async assignRole(userId, input, actorUserId) {
        const [user, role] = await Promise.all([
            identityRepository.findUserById(userId),
            identityRepository.findRoleById(input.roleId),
        ]);
        if (!user)
            throw new NotFoundError(`User ${userId} not found`);
        if (!role)
            throw new NotFoundError(`Role ${input.roleId} not found`);
        await identityRepository.assignRole(userId, input.roleId, actorUserId);
        await recordAudit({
            userId: actorUserId,
            action: 'role.assign',
            entityType: 'user',
            entityId: userId,
            afterData: { roleId: input.roleId, roleCode: role.code },
        });
        return this.getUserById(userId);
    },
    async removeRole(userId, roleId, actorUserId) {
        const remainingCount = await identityRepository.countRolesForUser(userId);
        if (remainingCount <= 1) {
            throw new ValidationError('Cannot remove a user\'s last remaining role — assign a replacement first');
        }
        // Without this, the override guard is bypassable: an admin could strip the
        // admin role from the last administrator instead of revoking the
        // permission, and lock everyone out through the other door.
        if (!(await this.wouldRetainAdminAfterRoleRemoval(userId, roleId))) {
            await this.assertNotLastAdministrator(userId);
        }
        await identityRepository.removeRole(userId, roleId);
        await recordAudit({ userId: actorUserId, action: 'role.remove', entityType: 'user', entityId: userId, afterData: { roleId } });
        return this.getUserById(userId);
    },
    listAuditLog: (limit) => identityRepository.findAuditLog(limit),
    async listUserPermissions(userId) {
        const user = await this.getUserById(userId);
        const catalogue = await identityRepository.findAllPermissions();
        const fromRoles = new Set();
        for (const role of user.roles) {
            const rows = await identityRepository.findPermissionsForRole(role.id);
            for (const row of rows)
                fromRoles.add(row.code);
        }
        const overrides = await identityRepository.findOverridesForUser(userId);
        const overrideByCode = new Map(overrides.map((o) => [o.code, o.granted]));
        return catalogue.map((permission) => {
            const override = overrideByCode.get(permission.code);
            return {
                id: permission.id,
                code: permission.code,
                module: permission.module,
                description: permission.description,
                source: override === undefined ? 'role' : override ? 'granted' : 'revoked',
                effective: override === undefined ? fromRoles.has(permission.code) : override,
            };
        });
    },
    /** Throws when taking ADMIN_PERMISSION from this user would leave nobody holding it. */
    async assertNotLastAdministrator(userId) {
        const candidates = await identityRepository.findAdministratorCandidates(ADMIN_PERMISSION);
        if (wouldRemoveLastAdministrator(administratorIds(candidates), userId)) {
            throw new ValidationError('This would leave the system with no administrator - grant users.manage to someone else first');
        }
    },
    /**
     * Whether the user would still hold ADMIN_PERMISSION after losing one role.
     * An override outranks every role, so it settles the question on its own.
     */
    async wouldRetainAdminAfterRoleRemoval(userId, roleId) {
        const overrides = await identityRepository.findOverridesForUser(userId);
        const override = overrides.find((o) => o.code === ADMIN_PERMISSION);
        if (override)
            return override.granted;
        const user = await this.getUserById(userId);
        for (const role of user.roles) {
            if (role.id === roleId)
                continue;
            const rows = await identityRepository.findPermissionsForRole(role.id);
            if (rows.some((r) => r.code === ADMIN_PERMISSION))
                return true;
        }
        return false;
    },
    async setPermissionOverride(userId, code, granted, actorUserId) {
        const permission = await identityRepository.findPermissionByCode(code);
        if (!permission)
            throw new NotFoundError(`Unknown permission: ${code}`);
        await this.getUserById(userId);
        if (!granted && code === ADMIN_PERMISSION) {
            await this.assertNotLastAdministrator(userId);
        }
        await identityRepository.upsertOverride(userId, permission.id, granted, actorUserId);
        await recordAudit({
            userId: actorUserId,
            action: granted ? 'permission.grant' : 'permission.revoke',
            entityType: 'user',
            entityId: userId,
            afterData: { permission: code },
        });
        return this.listUserPermissions(userId);
    },
    async clearPermissionOverride(userId, code, actorUserId) {
        const permission = await identityRepository.findPermissionByCode(code);
        if (!permission)
            throw new NotFoundError(`Unknown permission: ${code}`);
        await this.getUserById(userId);
        // Clearing a granted override can itself remove the last administrator,
        // but only if no role would give the permission back.
        if (code === ADMIN_PERMISSION) {
            const candidates = await identityRepository.findAdministratorCandidates(ADMIN_PERMISSION);
            const self = candidates.find((c) => c.userId === userId);
            if (!self?.hasViaRole) {
                await this.assertNotLastAdministrator(userId);
            }
        }
        await identityRepository.deleteOverride(userId, permission.id);
        await recordAudit({
            userId: actorUserId,
            action: 'permission.reset',
            entityType: 'user',
            entityId: userId,
            afterData: { permission: code },
        });
        return this.listUserPermissions(userId);
    },
};
