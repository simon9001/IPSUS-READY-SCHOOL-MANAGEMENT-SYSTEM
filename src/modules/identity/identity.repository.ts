import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { auditLog, permissions, rolePermissions, roles, userPermissionOverrides, userRoles, users } from '../../db/schema/index.js'
import type { CreateUserInput, UpdateUserInput } from './identity.schema.js'
import type { AdministratorCandidate } from '../../common/permissionRules.js'

// Every read path selects these columns explicitly rather than `select *` —
// passwordHash must never leave this module.
const safeUserColumns = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  phone: users.phone,
  avatarUrl: users.avatarUrl,
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

  findPermissionByCode: (code: string) =>
    db.select().from(permissions).where(eq(permissions.code, code)).then((rows) => rows[0]),

  findOverridesForUser: (userId: number) =>
    db
      .select({ code: permissions.code, granted: userPermissionOverrides.granted })
      .from(userPermissionOverrides)
      .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
      .where(eq(userPermissionOverrides.userId, userId)),

  upsertOverride: (userId: number, permissionId: number, granted: boolean, assignedBy: number) =>
    db
      .insert(userPermissionOverrides)
      .values({ userId, permissionId, granted, assignedBy })
      .onConflictDoUpdate({
        target: [userPermissionOverrides.userId, userPermissionOverrides.permissionId],
        set: { granted, assignedBy, assignedAt: new Date() },
      }),

  deleteOverride: (userId: number, permissionId: number) =>
    db
      .delete(userPermissionOverrides)
      .where(and(
        eq(userPermissionOverrides.userId, userId),
        eq(userPermissionOverrides.permissionId, permissionId),
      )),

  /**
   * Every user with the raw material the guard needs: whether a role grants
   * the permission, and whether an override overrules that. Assembled in three
   * simple queries rather than one clever join — this runs only on the guard
   * path, not per request.
   */
  async findAdministratorCandidates(permissionCode: string): Promise<AdministratorCandidate[]> {
    const allUsers = await db.select({ userId: users.id, status: users.status }).from(users)

    const viaRole = await db
      .selectDistinct({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(permissions.code, permissionCode))

    const overrides = await db
      .select({ userId: userPermissionOverrides.userId, granted: userPermissionOverrides.granted })
      .from(userPermissionOverrides)
      .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
      .where(eq(permissions.code, permissionCode))

    const roleHolders = new Set(viaRole.map((r) => r.userId))
    const overrideByUser = new Map(overrides.map((o) => [o.userId, o.granted]))

    return allUsers.map((u) => ({
      userId: u.userId,
      status: u.status as string,
      hasViaRole: roleHolders.has(u.userId),
      override: overrideByUser.get(u.userId) ?? null,
    }))
  },

  findAuditLog: (limit: number) =>
    db
      .select({ entry: auditLog, actorEmail: users.email, actorName: users.fullName })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit),
}
