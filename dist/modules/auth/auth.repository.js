import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { permissions, rolePermissions, roles, userPermissionOverrides, userRoles, users } from '../../db/schema/index.js';
import { mergePermissions } from '../../common/permissionRules.js';
export const authRepository = {
    findUserByEmail: (email) => db.select().from(users).where(eq(users.email, email)).then((rows) => rows[0]),
    findUserById: (id) => db.select().from(users).where(eq(users.id, id)).then((rows) => rows[0]),
    async findRolesAndPermissions(userId) {
        const roleRows = await db
            .select({ code: roles.code })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));
        const permissionRows = await db
            .select({ code: permissions.code })
            .from(userRoles)
            .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(userRoles.userId, userId));
        // Per-user exceptions. This is the third query on a path that runs for
        // every authenticated request; acceptable at school scale, and caching is
        // deliberately avoided because per-request resolution is what lets a
        // permission change take effect without re-login.
        const overrideRows = await db
            .select({ code: permissions.code, granted: userPermissionOverrides.granted })
            .from(userPermissionOverrides)
            .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
            .where(eq(userPermissionOverrides.userId, userId));
        return {
            roles: roleRows.map((r) => r.code),
            permissions: mergePermissions(permissionRows.map((p) => p.code), overrideRows),
        };
    },
    recordLogin: (userId) => db.update(users).set({ lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId)),
    recordFailedLogin: (userId, failedLoginAttempts, lockedUntil) => db.update(users).set({ failedLoginAttempts, lockedUntil }).where(eq(users.id, userId)),
    updateUser: (userId, data) => db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId)).returning().then((rows) => rows[0]),
    updatePassword: (userId, passwordHash) => db.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, userId)),
};
