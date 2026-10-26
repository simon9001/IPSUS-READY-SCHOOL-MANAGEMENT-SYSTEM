import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'

// ---- In-memory stand-in for identity.repository ----
// Implements the same queries over plain arrays so the service's guards run
// against consistent state (a role removed here really is gone on the next
// read), which per-call mocks can't give.
interface FakeUser {
  id: number
  email: string
  fullName: string
  phone: string | null
  status: string
  passwordHash: string
}

const ADMIN = 'users.manage'

const state = {
  users: [] as FakeUser[],
  roles: [] as { id: number; code: string; name: string; permissions: string[] }[],
  userRoles: [] as { userId: number; roleId: number }[],
  overrides: [] as { userId: number; code: string; granted: boolean }[],
  permissions: [] as { id: number; code: string; module: string; description: string }[],
}

function linksFor(userId?: number) {
  return state.userRoles
    .filter((l) => userId === undefined || l.userId === userId)
    .map((l) => {
      const role = state.roles.find((r) => r.id === l.roleId)!
      return { userId: l.userId, roleId: role.id, code: role.code, name: role.name }
    })
}

const safe = ({ passwordHash: _passwordHash, ...user }: FakeUser) => user

const fakeRepository = {
  findAllUsers: async () => state.users.map(safe),
  findUserById: async (id: number) => {
    const user = state.users.find((u) => u.id === id)
    return user && safe(user)
  },
  findUserByEmail: async (email: string) => state.users.find((u) => u.email === email),
  findAllUserRoleLinks: async () => linksFor(),
  findRoleLinksForUser: async (userId: number) => linksFor(userId),
  countRolesForUser: async (userId: number) => state.userRoles.filter((l) => l.userId === userId).length,
  createUser: vi.fn(async (input: { email: string; fullName: string; phone?: string; passwordHash: string }) => {
    const user = { id: state.users.length + 100, status: 'active', phone: input.phone ?? null, ...input }
    state.users.push(user)
    return safe(user)
  }),
  updateUser: vi.fn(async (id: number, data: Partial<FakeUser>) => {
    const user = state.users.find((u) => u.id === id)
    if (!user) return undefined
    Object.assign(user, data)
    return safe(user)
  }),
  setPasswordHash: vi.fn(async () => {}),
  assignRole: vi.fn(async (userId: number, roleId: number) => {
    state.userRoles.push({ userId, roleId })
  }),
  removeRole: vi.fn(async (userId: number, roleId: number) => {
    state.userRoles = state.userRoles.filter((l) => !(l.userId === userId && l.roleId === roleId))
  }),
  findAllRoles: async () => state.roles,
  findRoleById: async (id: number) => state.roles.find((r) => r.id === id),
  findAllPermissions: async () => state.permissions,
  findPermissionsForRole: async (roleId: number) => (state.roles.find((r) => r.id === roleId)?.permissions ?? []).map((code) => ({ code })),
  findPermissionByCode: async (code: string) => state.permissions.find((p) => p.code === code),
  findOverridesForUser: async (userId: number) => state.overrides.filter((o) => o.userId === userId),
  upsertOverride: vi.fn(async (userId: number, permissionId: number, granted: boolean) => {
    const code = state.permissions.find((p) => p.id === permissionId)!.code
    state.overrides = state.overrides.filter((o) => !(o.userId === userId && o.code === code))
    state.overrides.push({ userId, code, granted })
  }),
  deleteOverride: vi.fn(async (userId: number, permissionId: number) => {
    const code = state.permissions.find((p) => p.id === permissionId)!.code
    state.overrides = state.overrides.filter((o) => !(o.userId === userId && o.code === code))
  }),
  findAdministratorCandidates: async (code: string) =>
    state.users.map((u) => {
      const override = state.overrides.find((o) => o.userId === u.id && o.code === code)
      return {
        userId: u.id,
        status: u.status,
        hasViaRole: linksFor(u.id).some((l) => state.roles.find((r) => r.id === l.roleId)!.permissions.includes(code)),
        override: override ? override.granted : null,
      }
    }),
  findAuditLog: async () => [],
}

vi.mock('./identity.repository.js', () => ({ identityRepository: fakeRepository }))
vi.mock('../../common/audit.js', () => ({ recordAudit: vi.fn(async () => {}) }))
// bcrypt at 12 rounds costs ~250ms per call; the hash itself isn't under test.
vi.mock('./password.js', () => ({ hashPassword: vi.fn(async (plain: string) => `hashed:${plain}`) }))

const { identityService } = await import('./identity.service.js')
const { recordAudit } = await import('../../common/audit.js')

// ---- Fixtures ----
const ADMIN_ROLE = 1
const BURSAR_ROLE = 2
const SECOND_ADMIN_ROLE = 3
const ACTOR = 999

function user(id: number, roleIds: number[], status = 'active') {
  state.users.push({ id, email: `u${id}@school.local`, fullName: `User ${id}`, phone: null, status, passwordHash: 'x' })
  for (const roleId of roleIds) state.userRoles.push({ userId: id, roleId })
}

beforeEach(() => {
  vi.clearAllMocks()
  state.users = []
  state.userRoles = []
  state.overrides = []
  state.roles = [
    { id: ADMIN_ROLE, code: 'system_admin', name: 'System Admin', permissions: [ADMIN, 'fees.view'] },
    { id: BURSAR_ROLE, code: 'bursar', name: 'Bursar', permissions: ['fees.view'] },
    { id: SECOND_ADMIN_ROLE, code: 'principal', name: 'Principal', permissions: [ADMIN] },
  ]
  state.permissions = [
    { id: 10, code: ADMIN, module: 'identity', description: 'Manage users' },
    { id: 11, code: 'fees.view', module: 'fees', description: 'View fees' },
  ]
})

// ---- createUser ----
describe('identityService.createUser', () => {
  const input = { email: 'new@school.local', fullName: 'New Person', password: 'Sup3rSecret!', roleIds: [BURSAR_ROLE] }

  it('rejects a duplicate email with 409 and creates nothing', async () => {
    user(1, [ADMIN_ROLE])
    const err = await identityService.createUser({ ...input, email: 'u1@school.local' }, ACTOR).catch((e) => e)

    expect(err).toBeInstanceOf(ConflictError)
    expect(err.statusCode).toBe(409)
    expect(fakeRepository.createUser).not.toHaveBeenCalled()
    expect(recordAudit).not.toHaveBeenCalled()
  })

  it('stores a hash, never the plain password, and assigns every requested role', async () => {
    const created = await identityService.createUser({ ...input, roleIds: [BURSAR_ROLE, SECOND_ADMIN_ROLE] }, ACTOR)

    expect(fakeRepository.createUser).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hashed:Sup3rSecret!' }))
    expect(created.roles.map((r) => r.id)).toEqual([BURSAR_ROLE, SECOND_ADMIN_ROLE])
    expect(fakeRepository.assignRole).toHaveBeenCalledWith(created.id, BURSAR_ROLE, ACTOR)
  })

  it('audits the creation without the password', async () => {
    await identityService.createUser(input, ACTOR)

    expect(recordAudit).toHaveBeenCalledTimes(1)
    const entry = vi.mocked(recordAudit).mock.calls[0][0]
    expect(entry).toMatchObject({ userId: ACTOR, action: 'user.create', entityType: 'user' })
    expect(JSON.stringify(entry)).not.toContain('Sup3rSecret!')
  })
})

// ---- removeRole ----
describe('identityService.removeRole', () => {
  it("refuses to remove a user's last remaining role", async () => {
    user(1, [ADMIN_ROLE])
    user(2, [BURSAR_ROLE])
    const err = await identityService.removeRole(2, BURSAR_ROLE, ACTOR).catch((e) => e)

    expect(err).toBeInstanceOf(ValidationError)
    expect(err.message).toMatch(/last remaining role/)
    expect(fakeRepository.removeRole).not.toHaveBeenCalled()
  })

  it('refuses to strip the admin role from the only administrator', async () => {
    user(1, [ADMIN_ROLE, BURSAR_ROLE])
    const err = await identityService.removeRole(1, ADMIN_ROLE, ACTOR).catch((e) => e)

    expect(err).toBeInstanceOf(ValidationError)
    expect(err.message).toMatch(/no administrator/)
    expect(fakeRepository.removeRole).not.toHaveBeenCalled()
  })

  it('allows it when another role still grants users.manage to that user', async () => {
    user(1, [ADMIN_ROLE, SECOND_ADMIN_ROLE])
    const result = await identityService.removeRole(1, ADMIN_ROLE, ACTOR)

    expect(result.roles.map((r) => r.id)).toEqual([SECOND_ADMIN_ROLE])
  })

  it('allows it when another active administrator exists', async () => {
    user(1, [ADMIN_ROLE, BURSAR_ROLE])
    user(2, [ADMIN_ROLE])
    const result = await identityService.removeRole(1, ADMIN_ROLE, ACTOR)

    expect(result.roles.map((r) => r.id)).toEqual([BURSAR_ROLE])
  })

  it('does not count a suspended administrator as the other administrator', async () => {
    user(1, [ADMIN_ROLE, BURSAR_ROLE])
    user(2, [ADMIN_ROLE], 'suspended')
    await expect(identityService.removeRole(1, ADMIN_ROLE, ACTOR)).rejects.toBeInstanceOf(ValidationError)
  })

  it('lets a granted override keep the user an administrator after losing the role', async () => {
    user(1, [ADMIN_ROLE, BURSAR_ROLE])
    state.overrides.push({ userId: 1, code: ADMIN, granted: true })
    await expect(identityService.removeRole(1, ADMIN_ROLE, ACTOR)).resolves.toBeDefined()
  })
})

// ---- updateUser status guard ----
describe('identityService.updateUser', () => {
  it('refuses to suspend the only administrator', async () => {
    user(1, [ADMIN_ROLE])
    await expect(identityService.updateUser(1, { status: 'suspended' }, ACTOR)).rejects.toBeInstanceOf(ValidationError)
    expect(fakeRepository.updateUser).not.toHaveBeenCalled()
  })

  it('refuses to lock the only administrator', async () => {
    user(1, [ADMIN_ROLE])
    await expect(identityService.updateUser(1, { status: 'locked' }, ACTOR)).rejects.toBeInstanceOf(ValidationError)
  })

  it('allows editing the only administrator when status is not changing', async () => {
    user(1, [ADMIN_ROLE])
    const updated = await identityService.updateUser(1, { fullName: 'Renamed' }, ACTOR)
    expect(updated.fullName).toBe('Renamed')
  })

  it('allows suspending an administrator when another one remains', async () => {
    user(1, [ADMIN_ROLE])
    user(2, [ADMIN_ROLE])
    const updated = await identityService.updateUser(1, { status: 'suspended' }, ACTOR)
    expect(updated.status).toBe('suspended')
  })

  it('returns 404 for an unknown user', async () => {
    await expect(identityService.updateUser(42, { fullName: 'x' }, ACTOR)).rejects.toBeInstanceOf(NotFoundError)
  })
})

// ---- permission overrides ----
describe('identityService.setPermissionOverride', () => {
  it('refuses to revoke users.manage from the only administrator', async () => {
    user(1, [ADMIN_ROLE])
    await expect(identityService.setPermissionOverride(1, ADMIN, false, ACTOR)).rejects.toBeInstanceOf(ValidationError)
    expect(fakeRepository.upsertOverride).not.toHaveBeenCalled()
  })

  it('reports a granted override as effective even without a role granting it', async () => {
    user(1, [ADMIN_ROLE])
    user(2, [BURSAR_ROLE])
    const permissions = await identityService.setPermissionOverride(2, ADMIN, true, ACTOR)

    expect(permissions.find((p) => p.code === ADMIN)).toMatchObject({ source: 'granted', effective: true })
  })

  it('rejects an unknown permission code with 404', async () => {
    user(1, [ADMIN_ROLE])
    await expect(identityService.setPermissionOverride(1, 'no.such.permission', true, ACTOR)).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('identityService.clearPermissionOverride', () => {
  it('refuses to clear the grant that makes someone the only administrator', async () => {
    user(1, [ADMIN_ROLE])
    user(2, [BURSAR_ROLE])
    state.userRoles = state.userRoles.filter((l) => l.userId !== 1)
    state.userRoles.push({ userId: 1, roleId: BURSAR_ROLE })
    state.overrides.push({ userId: 1, code: ADMIN, granted: true })

    await expect(identityService.clearPermissionOverride(1, ADMIN, ACTOR)).rejects.toBeInstanceOf(ValidationError)
    expect(fakeRepository.deleteOverride).not.toHaveBeenCalled()
  })

  it('allows clearing it when a role would give the permission back', async () => {
    user(1, [ADMIN_ROLE])
    state.overrides.push({ userId: 1, code: ADMIN, granted: true })

    const permissions = await identityService.clearPermissionOverride(1, ADMIN, ACTOR)
    expect(permissions.find((p) => p.code === ADMIN)).toMatchObject({ source: 'role', effective: true })
  })
})
