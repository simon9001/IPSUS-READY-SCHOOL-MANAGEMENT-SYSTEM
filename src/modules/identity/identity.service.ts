import { identityRepository } from './identity.repository.js'
import { hashPassword } from './password.js'
import { recordAudit } from '../../common/audit.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'
import type { AssignRoleInput, CreateUserInput, ResetPasswordInput, UpdateUserInput } from './identity.schema.js'
import type { RoleWithPermissions, UserWithRoles } from './identity.types.js'

function attachRoles<T extends { id: number }>(users: T[], links: { userId: number; roleId: number; code: string; name: string }[]) {
  return users.map((user) => ({
    ...user,
    roles: links.filter((l) => l.userId === user.id).map((l) => ({ id: l.roleId, code: l.code, name: l.name })),
  })) as (T & { roles: { id: number; code: string; name: string }[] })[]
}

export const identityService = {
  async listUsers(): Promise<UserWithRoles[]> {
    const [users, links] = await Promise.all([identityRepository.findAllUsers(), identityRepository.findAllUserRoleLinks()])
    return attachRoles(users, links)
  },

  async getUserById(id: number): Promise<UserWithRoles> {
    const user = await identityRepository.findUserById(id)
    if (!user) throw new NotFoundError(`User ${id} not found`)
    const links = await identityRepository.findRoleLinksForUser(id)
    return { ...user, roles: links.map((l) => ({ id: l.roleId, code: l.code, name: l.name })) }
  },

  async createUser(input: CreateUserInput, actorUserId: number) {
    const existing = await identityRepository.findUserByEmail(input.email)
    if (existing) throw new ConflictError(`A user with email ${input.email} already exists`)

    const passwordHash = await hashPassword(input.password)
    const user = await identityRepository.createUser({ ...input, passwordHash })
    for (const roleId of input.roleIds) {
      await identityRepository.assignRole(user.id, roleId, actorUserId)
    }

    await recordAudit({
      userId: actorUserId,
      action: 'user.create',
      entityType: 'user',
      entityId: user.id,
      afterData: { email: user.email, fullName: user.fullName, roleIds: input.roleIds },
    })

    return this.getUserById(user.id)
  },

  async updateUser(id: number, input: UpdateUserInput, actorUserId: number) {
    const before = await this.getUserById(id)
    const updated = await identityRepository.updateUser(id, input)
    if (!updated) throw new NotFoundError(`User ${id} not found`)

    await recordAudit({
      userId: actorUserId,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      beforeData: { fullName: before.fullName, phone: before.phone, status: before.status },
      afterData: input,
    })

    return this.getUserById(id)
  },

  async resetPassword(id: number, input: ResetPasswordInput, actorUserId: number) {
    const user = await identityRepository.findUserById(id)
    if (!user) throw new NotFoundError(`User ${id} not found`)

    const passwordHash = await hashPassword(input.newPassword)
    await identityRepository.setPasswordHash(id, passwordHash)

    await recordAudit({ userId: actorUserId, action: 'user.reset_password', entityType: 'user', entityId: id })

    return { success: true }
  },

  async listRoles(): Promise<RoleWithPermissions[]> {
    const roles = await identityRepository.findAllRoles()
    return Promise.all(
      roles.map(async (role) => ({
        ...role,
        permissions: (await identityRepository.findPermissionsForRole(role.id)).map((p) => p.code),
      })),
    )
  },

  /** The permission catalogue as the database actually holds it — what the
   *  Roles page shows alongside each role's grants. Compare against rbac.ts
   *  via the system module's drift check, not here. */
  listPermissions: () => identityRepository.findAllPermissions(),

  async assignRole(userId: number, input: AssignRoleInput, actorUserId: number) {
    const [user, role] = await Promise.all([
      identityRepository.findUserById(userId),
      identityRepository.findRoleById(input.roleId),
    ])
    if (!user) throw new NotFoundError(`User ${userId} not found`)
    if (!role) throw new NotFoundError(`Role ${input.roleId} not found`)

    await identityRepository.assignRole(userId, input.roleId, actorUserId)
    await recordAudit({
      userId: actorUserId,
      action: 'role.assign',
      entityType: 'user',
      entityId: userId,
      afterData: { roleId: input.roleId, roleCode: role.code },
    })

    return this.getUserById(userId)
  },

  async removeRole(userId: number, roleId: number, actorUserId: number) {
    const remainingCount = await identityRepository.countRolesForUser(userId)
    if (remainingCount <= 1) {
      throw new ValidationError('Cannot remove a user\'s last remaining role — assign a replacement first')
    }

    await identityRepository.removeRole(userId, roleId)
    await recordAudit({ userId: actorUserId, action: 'role.remove', entityType: 'user', entityId: userId, afterData: { roleId } })

    return this.getUserById(userId)
  },

  listAuditLog: (limit: number) => identityRepository.findAuditLog(limit),
}
