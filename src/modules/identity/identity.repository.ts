import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { auditLog, permissions, rolePermissions, roles, userRoles, users } from '../../db/schema/index.js'
import type { CreateUserInput, UpdateUserInput } from './identity.schema.js'

// Every read path selects these columns explicitly rather than `select *` —
// passwordHash must never leave this module.
const safeUserColumns = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  phone: users.phone,
  status: users.status,
  mustChangePassword: users.mustChangePassword,
  failedLoginAttempts: users.failedLoginAttempts,
  lockedUntil: users.lockedUntil,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

export const identityRepository = {
  findAllUsers: () => db.select(safeUserColumns).from(users).orderBy(users.id),

  findUserById: (id: number) =>
    db.select(safeUserColumns).from(users).where(eq(users.id, id)).then((rows) => rows[0]),

  findUserByEmail: (email: string) => db.select().from(users).where(eq(users.email, email)).then((rows) => rows[0]),

  findAllUserRoleLinks: () =>
    db
      .select({ userId: userRoles.userId, roleId: roles.id, code: roles.code, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id)),

  findRoleLinksForUser: (userId: number) =>
    db
      .select({ userId: userRoles.userId, roleId: roles.id, code: roles.code, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId)),

  countRolesForUser: (userId: number) =>
    db.select({ roleId: userRoles.roleId }).from(userRoles).where(eq(userRoles.userId, userId)).then((rows) => rows.length),

  async createUser(input: CreateUserInput & { passwordHash: string }) {
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        fullName: input.fullName,
        phone: input.phone,
        passwordHash: input.passwordHash,
        mustChangePassword: true,
      })
      .returning(safeUserColumns)
    return user
  },

  updateUser: (id: number, data: UpdateUserInput) =>
    db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning(safeUserColumns).then((rows) => rows[0]),

  setPasswordHash: (id: number, passwordHash: string) =>
    db.update(users).set({ passwordHash, mustChangePassword: true, updatedAt: new Date() }).where(eq(users.id, id)),

  assignRole: (userId: number, roleId: number, assignedBy: number) =>
    db.insert(userRoles).values({ userId, roleId, assignedBy }).onConflictDoNothing(),

  removeRole: (userId: number, roleId: number) =>
    db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))),

  findAllRoles: () => db.select().from(roles).orderBy(roles.name),

  findRoleById: (id: number) => db.select().from(roles).where(eq(roles.id, id)).then((rows) => rows[0]),

  findAllPermissions: () => db.select().from(permissions).orderBy(permissions.module, permissions.code),

  findPermissionsForRole: (roleId: number) =>
    db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId)),

  findAuditLog: (limit: number) =>
    db
      .select({ entry: auditLog, actorEmail: users.email, actorName: users.fullName })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit),
}
