import { count, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { permissions, rolePermissions, roles, userRoles, users } from '../../db/schema/index.js';
export const systemRepository = {
    /** One round trip for every account counter the admin dashboard shows —
     *  counted in Postgres rather than by pulling every user row into JS. */
    async userStats() {
        const [row] = await db
            .select({
            total: count(),
            active: sql `count(*) filter (where ${users.status} = 'active')`.mapWith(Number),
            suspended: sql `count(*) filter (where ${users.status} = 'suspended')`.mapWith(Number),
            locked: sql `count(*) filter (where ${users.status} = 'locked')`.mapWith(Number),
            lockedOut: sql `count(*) filter (where ${users.lockedUntil} > now())`.mapWith(Number),
            mustChangePassword: sql `count(*) filter (where ${users.mustChangePassword})`.mapWith(Number),
            neverLoggedIn: sql `count(*) filter (where ${users.lastLoginAt} is null)`.mapWith(Number),
            withFailedAttempts: sql `count(*) filter (where ${users.failedLoginAttempts} > 0)`.mapWith(Number),
        })
            .from(users);
        return row;
    },
    /** Accounts currently inside the 15-minute lockout window applied by
     *  authService after MAX_FAILED_LOGIN_ATTEMPTS — these are the people who
     *  cannot log in right now. */
    lockedOutUsers: () => db
        .select({ id: users.id, email: users.email, fullName: users.fullName, lockedUntil: users.lockedUntil, failedLoginAttempts: users.failedLoginAttempts })
        .from(users)
        .where(gt(users.lockedUntil, new Date())),
    /** A user with no role holds no permissions at all — they can log in and
     *  then hit a 403 on every route. Always an unfinished setup, never intended. */
    usersWithoutRoles: () => db
        .select({ id: users.id, email: users.email, fullName: users.fullName })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .where(isNull(userRoles.userId)),
    neverLoggedInUsers: () => db
        .select({ id: users.id, email: users.email, fullName: users.fullName, createdAt: users.createdAt })
        .from(users)
        .where(isNull(users.lastLoginAt)),
    roleUsage: () => db
        .select({ roleId: roles.id, code: roles.code, name: roles.name, userCount: count(userRoles.userId) })
        .from(roles)
        .leftJoin(userRoles, eq(roles.id, userRoles.roleId))
        .groupBy(roles.id, roles.code, roles.name)
        .orderBy(roles.name),
    permissionCodes: () => db.select({ code: permissions.code }).from(permissions),
    roleCodes: () => db.select({ code: roles.code }).from(roles),
    rolePermissionPairs: () => db
        .select({ roleCode: roles.code, permissionCode: permissions.code })
        .from(rolePermissions)
        .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)),
    /** Every (user, permission) pair implied by their role assignments. Bounded
     *  by staff count x permissions-per-role, so it stays small for a single
     *  school — if this ever grows, push the pair-matching down into SQL. */
    userPermissionPairs: () => db
        .select({ userId: users.id, email: users.email, fullName: users.fullName, code: permissions.code })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)),
    /** Round-trips a trivial query so the dashboard reports real connectivity
     *  rather than assuming the pool that started at boot is still healthy. */
    async ping() {
        const start = performance.now();
        await db.execute(sql `select 1`);
        return Math.round((performance.now() - start) * 10) / 10;
    },
};
