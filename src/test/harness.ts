import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { app } from '../app.js'
import { db } from '../db/client.js'
import { accounts, funds, fiscalPeriods, permissions, roles, userPermissionOverrides, userRoles, users } from '../db/schema/index.js'
import { seedBaseData } from '../db/seed-base.js'
import { PERMISSIONS } from '../modules/identity/rbac.js'

// A bcrypt hash of "Passw0rd!2026" at the cost of 4, so creating test users stays fast.
export const TEST_PASSWORD = 'Passw0rd!2026'
const TEST_PASSWORD_HASH = '$2b$04$wfebhNkc72zvMpZq5Xeoge88Cq0gwavotfISFJDQedxu2uBRaUvlW'

export interface Actor {
  id: number
  email: string
  token: string
}

let nextUser = 1

/** Runs the real production seed: chart of accounts, funds, periods, RBAC, admin. */
export async function seedDatabase() {
  await seedBaseData({ adminEmail: 'admin@school.local', adminPassword: TEST_PASSWORD })
}

/** A user holding one of the real roles from rbac.ts, with a signed session token. */
export async function userWithRole(roleCode: string): Promise<Actor> {
  const [role] = await db.select().from(roles).where(eq(roles.code, roleCode))
  if (!role) throw new Error(`No role ${roleCode}: call seedDatabase() first`)
  const actor = await createUser(`${roleCode}-${nextUser++}@school.local`)
  await db.insert(userRoles).values({ userId: actor.id, roleId: role.id })
  return actor
}

/** A user holding exactly these permissions and nothing else. */
export async function userWithPermissions(...codes: string[]): Promise<Actor> {
  const actor = await createUser(`perm-${nextUser++}@school.local`)
  for (const code of codes) {
    const [permission] = await db.select().from(permissions).where(eq(permissions.code, code))
    if (!permission) throw new Error(`Unknown permission ${code}`)
    await db.insert(userPermissionOverrides).values({ userId: actor.id, permissionId: permission.id, granted: true, assignedBy: actor.id })
  }
  return actor
}

/** Holds every permission, for tests about a workflow rather than about who may run it. */
export async function superUser(): Promise<Actor> {
  return userWithPermissions(...PERMISSIONS.map((p) => p.code))
}

async function createUser(email: string): Promise<Actor> {
  const [user] = await db.insert(users).values({ email, fullName: email, passwordHash: TEST_PASSWORD_HASH }).returning()
  return { id: user.id, email, token: jwt.sign({ sub: user.id }, process.env.JWT_SECRET as string, { expiresIn: '1h' }) }
}

// Response bodies are whatever each endpoint returns; tests assert their shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any

export interface ApiResult<T = Json> {
  status: number
  body: { success?: boolean; data: T; error?: string; issues?: unknown[] }
  headers: Headers
}

/** Sends a real HTTP-shaped request through the whole app: middleware, auth, validation, SQL. */
export async function api<T = Json>(
  method: string,
  path: string,
  options: { as?: Actor; body?: unknown; token?: string } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {}
  const token = options.token ?? options.as?.token
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await app.request(path, { method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) })
  const text = await res.text()
  let body: ApiResult<T>['body']
  try {
    body = JSON.parse(text)
  } catch {
    body = { data: text as T }
  }
  return { status: res.status, body, headers: res.headers }
}

/** A fiscal period already closed, for proving that a refused posting leaves nothing behind. */
export async function closedPeriod(): Promise<number> {
  const [period] = await db
    .insert(fiscalPeriods)
    .values({ name: 'Closed term', fiscalYear: 2025, term: 3, startDate: '2025-09-01', endDate: '2025-11-30', status: 'closed' })
    .returning()
  return period.id
}

/** Ids of the seeded reference data, by the code that identifies each row. */
export async function ledgerRefs() {
  const accountRows = await db.select().from(accounts)
  const fundRows = await db.select().from(funds)
  const periodRows = await db.select().from(fiscalPeriods)
  return {
    account: (code: string) => found(accountRows.find((a) => a.code === code)?.id, `account ${code}`),
    fund: (code: string) => found(fundRows.find((f) => f.code === code)?.id, `fund ${code}`),
    period: (term: number) => found(periodRows.find((p) => p.term === term)?.id, `period ${term}`),
  }
}

function found<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Seed has no ${what}`)
  return value
}
