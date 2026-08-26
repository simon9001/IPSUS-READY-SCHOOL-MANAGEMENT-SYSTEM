import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { permissions, rolePermissions, roles, userRoles, users } from '../../db/schema/index.js';
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
        return {
            roles: roleRows.map((r) => r.code),
            permissions: [...new Set(permissionRows.map((p) => p.code))],
        };
    },
    recordLogin: (userId) => db.update(users).set({ lastLoginAt: new Date(), failedLoginAttempts: 0 }).where(eq(users.id, userId)),
};
