import { writeFileSync } from 'node:fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { pg } from '../db.js'
import { api, seedDatabase, TEST_PASSWORD, userWithRole, type Actor } from '../harness.js'
import { logger } from '../../common/logger.js'
import { ROLES } from '../../modules/identity/rbac.js'
import { seedDemoUsers } from '../../db/seed/demo-users.js'
import { seedSchoolData } from '../../db/seed/school.js'

vi.mock('../../db/client.js', () => import('../db.js'))

// One full year of a realistic school, built through the real services. Slow to
// build, so one instance is shared; these tests only read from it.
let balanced: boolean

beforeAll(async () => {
  const quiet = vi.spyOn(console, 'log').mockImplementation(() => {})
  await seedDatabase()
  await seedDemoUsers(TEST_PASSWORD)
  ;({ balanced } = await seedSchoolData())
  quiet.mockRestore()
}, 600_000)

/** Row count of every table, plus ledger totals: what the seed produced, in one comparable value. */
async function fingerprint() {
  const tables = await pg.query<{ tablename: string }>("select tablename from pg_tables where schemaname = 'public' order by tablename")
  const counts: Record<string, number> = {}
  for (const { tablename } of tables.rows) {
    const { rows } = await pg.query<{ n: number }>(`select count(*)::int as n from "${tablename}"`)
    counts[tablename] = rows[0].n
  }
  const { rows } = await pg.query<{ debit: string; credit: string }>('select sum(debit) as debit, sum(credit) as credit from journal_lines')
  return { counts, ledger: rows[0] }
}

describe('a full year of school data', () => {
  it('leaves the ledger balanced', async () => {
    expect(balanced).toBe(true)
    const print = await fingerprint()
    if (process.env.SEED_FINGERPRINT_FILE) writeFileSync(process.env.SEED_FINGERPRINT_FILE, JSON.stringify(print, null, 2))
    expect(print.ledger.debit).toBe(print.ledger.credit)
    expect(Number(print.ledger.debit)).toBeGreaterThan(0)
  })

  it('produced records in the main areas of the school', async () => {
    const { counts } = await fingerprint()
    for (const table of ['students', 'fee_invoices', 'fee_payments', 'payslips', 'journal_entries', 'exam_results', 'attendance_records']) {
      expect(counts[table], table).toBeGreaterThan(0)
    }
  })

  it('refuses to seed on top of existing data, which would double every invoice', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    await expect(seedSchoolData()).rejects.toThrow(/Seeding stopped/)
    quiet.mockRestore()
    log.mockRestore()
  })
})

describe('dashboard', () => {
  it.each(ROLES.map((role) => role.code))('builds every widget for %s without one failing', async (roleCode) => {
    const failed = vi.spyOn(logger, 'error')
    const actor = await userWithRole(roleCode)

    const res = await api('GET', '/api/dashboard/summary?asOfDate=2026-09-30', { as: actor })

    if (res.status === 403) return // Roles without dashboard.view are covered by the route test.
    expect(res.status).toBe(200)
    expect(failed).not.toHaveBeenCalled()
    failed.mockRestore()
  })

  it('shows a principal real figures, in the sections they are entitled to', async () => {
    const principal = await userWithRole('principal')
    const res = await api('GET', '/api/dashboard/summary?asOfDate=2026-09-30', { as: principal })

    const widgets = res.body.data.sections.flatMap((s: { widgets: { id: string }[] }) => s.widgets)
    const health = widgets.find((w: { id: string }) => w.id === 'financial-health')
    expect(health.stats[0]).toMatchObject({ label: 'Trial Balance', value: 'Balanced' })
    expect(widgets.length).toBeGreaterThan(5)
  })

  it('does not show a parent the school’s finances', async () => {
    const parent = await userWithRole('parent')
    const res = await api('GET', '/api/dashboard/summary?asOfDate=2026-09-30', { as: parent })

    const body = JSON.stringify(res.body)
    expect(body).not.toContain('financial-health')
    expect(body).not.toContain('Total Debit')
  })
})

describe('reports over the school year', () => {
  let bursar: Actor

  beforeAll(async () => {
    bursar = await userWithRole('bursar')
  })

  it('produces a balanced trial balance for each fund', async () => {
    const funds = await api('GET', '/api/funds', { as: bursar })
    expect(funds.body.data.length).toBeGreaterThan(3)
    for (const fund of funds.body.data) {
      const tb = await api('GET', `/api/reports/trial-balance?asOfDate=2026-12-31&fundId=${fund.id}`, { as: bursar })
      expect(tb.body.data.isBalanced, fund.code).toBe(true)
    }
  })

  it('reports budget against actual for the approved budget', async () => {
    const budgets = await api('GET', '/api/budgets', { as: bursar })
    const [budget] = budgets.body.data
    expect(budget.status).toBe('approved')

    const res = await api('GET', `/api/budgets/${budget.id}/budget-vs-actual`, { as: bursar })

    expect(res.status).toBe(200)
    for (const row of res.body.data) expect(row.variance).toBeCloseTo(row.budgeted - row.actual)
    expect(res.body.data.some((row: { actual: number }) => row.actual > 0)).toBe(true)
  })

  it('finds records across categories through search', async () => {
    const principal = await userWithRole('principal')
    const res = await api('GET', '/api/search?q=INV', { as: principal })
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('reports no RBAC drift between rbac.ts and the seeded database', async () => {
    const admin = await userWithRole('system_admin')
    const res = await api('GET', '/api/system/rbac', { as: admin })

    expect(res.status).toBe(200)
    expect(res.body.data.drift).toMatchObject({ missingPermissions: [], missingRoles: [], orphanPermissions: [], orphanRoles: [] })
  })
})
