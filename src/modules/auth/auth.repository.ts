import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { permissions, rolePermissions, roles, userRoles, users } from '../../db/schema/index.js'

export const authRepository = {
  findUserByEmail: (email: string) =>
    db.select().from(users).where(eq(users.email, email)).then((rows) => rows[0]),

  findUserById: (id: number) =>
    db.select().from(users).where(eq(users.id, id)).then((rows) => rows[0]),

  async findRolesAndPermissions(userId: number) {
    const roleRows = await db
      .select({ code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId))

    const permissionRows = await db
      .select({ code: permissions.code })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId))

    return {
      roles: roleRows.map((r) => r.code),
      permissions: [...new Set(permissionRows.map((p) => p.code))],
    }
  },

  recordLogin: (userId: number) =>
    db.update(users).set({ lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId)),

  recordFailedLogin: (userId: number, failedLoginAttempts: number, lockedUntil: Date | null) =>
    db.update(users).set({ failedLoginAttempts, lockedUntil }).where(eq(users.id, userId)),

  updateUser: (userId: number, data: { fullName?: string; phone?: string; avatarUrl?: string | null }) =>
    db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId)).returning().then((rows) => rows[0]),

  updatePassword: (userId: number, passwordHash: string) =>
    db.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, userId)),
}
