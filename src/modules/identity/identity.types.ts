import type { auditLog, permissions, roles, users } from '../../db/schema/index.js'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Role = typeof roles.$inferSelect
export type Permission = typeof permissions.$inferSelect
export type AuditLogEntry = typeof auditLog.$inferSelect

// Never send passwordHash to a client — every read path returns this shape.
export type SafeUser = Omit<User, 'passwordHash'>

export interface UserWithRoles extends SafeUser {
  roles: { id: number; code: string; name: string }[]
}

export interface RoleWithPermissions extends Role {
  permissions: string[]
}
