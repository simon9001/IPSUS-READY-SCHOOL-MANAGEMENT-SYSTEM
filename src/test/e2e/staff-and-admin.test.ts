import { beforeAll, describe, expect, it, vi } from 'vitest'
import { api, ledgerRefs, seedDatabase, superUser, userWithPermissions, userWithRole, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let staff: Actor
let refs: Awaited<ReturnType<typeof ledgerRefs>>
let nextNo = 1

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  staff = await superUser()
})

async function newStaff() {
  const res = await api('POST', '/api/staff', {
    as: staff,
    body: {
      staffNo: `H${nextNo++}`,
      fullName: 'Rose Akinyi',
      category: 'non_teaching',
      employmentBody: 'bom',
      employmentDate: '2024-01-01',
    },
  })
  expect(res.status).toBe(201)
  return res.body.data
}

describe('leave', () => {
  let annualId: number

  beforeAll(async () => {
    const type = await api('POST', '/api/leave/types', { as: staff, body: { name: 'Annual', defaultDaysPerYear: 10 } })
    expect(type.status).toBe(201)
    annualId = type.body.data.id
  })

  const apply = (staffId: number, startDate: string, endDate: string) =>
    api('POST', '/api/leave', { as: staff, body: { staffId, leaveTypeId: annualId, startDate, endDate, recordedBy: 1 } })
  const decide = (id: number, action: 'approve' | 'reject') =>
    api('POST', `/api/leave/${id}/${action}`, { as: staff, body: { approverId: 1 } })
  const balance = async (staffId: number) =>
    (await api('GET', `/api/leave/staff/${staffId}/balance?leaveTypeId=${annualId}&year=2026`, { as: staff })).body.data

  it('counts both the first and last day', async () => {
    const person = await newStaff()
    expect((await apply(person.id, '2026-03-02', '2026-03-04')).body.data.daysRequested).toBe('3.0')
  })

  it('refuses an end date before the start date', async () => {
    const person = await newStaff()
    expect((await apply(person.id, '2026-03-04', '2026-03-02')).status).toBe(400)
  })

  it('takes approved days off the balance, and only approved days', async () => {
    const person = await newStaff()
    const approved = await apply(person.id, '2026-03-02', '2026-03-05')
    const rejected = await apply(person.id, '2026-04-01', '2026-04-02')
    await apply(person.id, '2026-05-01', '2026-05-02')

    await decide(approved.body.data.id, 'approve')
    await decide(rejected.body.data.id, 'reject')

    expect(await balance(person.id)).toMatchObject({ daysAllocated: 10, daysTaken: 4, daysRemaining: 6 })
  })

  it('refuses to approve more days than remain', async () => {
    const person = await newStaff()
    const big = await apply(person.id, '2026-03-02', '2026-03-13')
    const res = await decide(big.body.data.id, 'approve')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/exceeds remaining balance/)
  })

  it('refuses to decide the same request twice', async () => {
    const person = await newStaff()
    const request = await apply(person.id, '2026-03-02', '2026-03-03')
    await decide(request.body.data.id, 'approve')

    expect((await decide(request.body.data.id, 'reject')).status).toBe(409)
    expect((await decide(request.body.data.id, 'approve')).status).toBe(409)
  })

  it('returns 404 for an unknown request or leave type', async () => {
    const person = await newStaff()
    expect((await api('GET', '/api/leave/999999', { as: staff })).status).toBe(404)
    expect((await api('GET', `/api/leave/staff/${person.id}/balance?leaveTypeId=999999&year=2026`, { as: staff })).status).toBe(404)
  })
})

describe('staff records', () => {
  it('updates a record and rejects a duplicate staff number', async () => {
    const person = await newStaff()
    const updated = await api('PATCH', `/api/staff/${person.id}`, { as: staff, body: { status: 'on_leave' } })
    expect(updated.body.data.status).toBe('on_leave')

    const duplicate = await api('POST', '/api/staff', {
      as: staff,
      body: { staffNo: person.staffNo, fullName: 'Another', category: 'teaching', employmentBody: 'tsc', employmentDate: '2024-01-01' },
    })
    expect(duplicate.status).toBe(409)
  })

  it('keeps contracts and moves their status', async () => {
    const person = await newStaff()
    const contract = await api('POST', '/api/contracts', {
      as: staff,
      body: { staffId: person.id, contractType: 'fixed_term', startDate: '2026-01-01', endDate: '2026-12-31' },
    })
    expect(contract.status).toBe(201)

    const ended = await api('PATCH', `/api/contracts/${contract.body.data.id}/status`, { as: staff, body: { status: 'terminated' } })
    expect(ended.body.data.status).toBe('terminated')
    expect((await api('GET', `/api/contracts/staff/${person.id}`, { as: staff })).body.data).toHaveLength(1)
    expect((await api('GET', '/api/contracts/999999', { as: staff })).status).toBe(404)
  })

  it('keeps appraisals and lets a draft be completed', async () => {
    const person = await newStaff()
    const draft = await api('POST', '/api/appraisals', {
      as: staff,
      body: { staffId: person.id, periodId: refs.period(1), appraiserId: staff.id, appraisalDate: '2026-03-30' },
    })
    expect(draft.body.data.status).toBe('draft')

    const done = await api('PATCH', `/api/appraisals/${draft.body.data.id}`, {
      as: staff,
      body: { status: 'completed', overallRating: 4.5 },
    })
    expect(done.body.data).toMatchObject({ status: 'completed' })
    expect((await api('GET', `/api/appraisals/staff/${person.id}`, { as: staff })).body.data).toHaveLength(1)
  })

  it('attributes staff disciplinary records to the signed-in user', async () => {
    const person = await newStaff()
    const record = await api('POST', '/api/staff-discipline', {
      as: staff,
      body: { staffId: person.id, incidentDate: '2026-02-01', description: 'Absent', severity: 'verbal_warning', recordedBy: 1 },
    })
    expect(record.body.data.recordedBy).toBe(staff.id)
    expect((await api('GET', `/api/staff-discipline/staff/${person.id}`, { as: staff })).body.data).toHaveLength(1)
    expect((await api('GET', `/api/staff-discipline/${record.body.data.id}`, { as: staff })).status).toBe(200)
  })
})

describe('chart of accounts, funds and periods', () => {
  it('adds an account and rejects a duplicate code', async () => {
    const body = { code: '5950', name: 'Bank Charges', type: 'expense', normalBalance: 'debit' }
    const created = await api('POST', '/api/accounts', { as: staff, body })
    expect(created.status).toBe(201)
    expect((await api('POST', '/api/accounts', { as: staff, body })).status).toBe(409)
    expect((await api('GET', `/api/accounts/${created.body.data.id}`, { as: staff })).body.data.name).toBe('Bank Charges')
    expect((await api('GET', '/api/accounts/999999', { as: staff })).status).toBe(404)
  })

  it('adds a fund', async () => {
    const created = await api('POST', '/api/funds', {
      as: staff,
      body: { code: 'FUND-NEW', name: 'New Fund', restrictionType: 'unrestricted' },
    })
    expect(created.status).toBe(201)
    expect((await api('GET', `/api/funds/${created.body.data.id}`, { as: staff })).body.data.code).toBe('FUND-NEW')
    expect((await api('GET', '/api/funds/999999', { as: staff })).status).toBe(404)
  })

  it('opens and closes a period, which any staff member can read', async () => {
    const created = await api('POST', '/api/periods', {
      as: staff,
      body: { name: '2027 Term 1', fiscalYear: 2027, term: 1, startDate: '2027-01-05', endDate: '2027-04-02' },
    })
    expect(created.status).toBe(201)
    const closed = await api('POST', `/api/periods/${created.body.data.id}/close`, { as: staff, body: {} })
    expect(closed.body.data.status).toBe('closed')

    const teacher = await userWithRole('teacher')
    expect((await api('GET', `/api/periods/${created.body.data.id}`, { as: teacher })).status).toBe(200)
    expect((await api('GET', '/api/periods/999999', { as: teacher })).status).toBe(404)
  })
})

describe('budgets', () => {
  const budgetBody = () => ({
    fiscalYear: 2026,
    name: 'Term budget',
    createdBy: 1,
    lines: [{ accountId: refs.account('5100'), fundId: refs.fund('FUND-TUI'), amount: 50000 }],
  })

  it('adds lines until approved, then freezes', async () => {
    const maker = await userWithPermissions('budget.manage', 'budget.view')
    const checker = await userWithPermissions('budget.approve', 'budget.view')
    const budget = await api('POST', '/api/budgets', { as: maker, body: budgetBody() })
    expect(budget.body.data.createdBy).toBe(maker.id)
    const line = { accountId: refs.account('5200'), fundId: refs.fund('FUND-TUI'), amount: 1000 }

    expect((await api('POST', `/api/budgets/${budget.body.data.id}/lines`, { as: maker, body: line })).status).toBe(201)
    expect(
      (await api('POST', `/api/budgets/${budget.body.data.id}/approve`, { as: checker, body: { approvedBy: 1 } })).body.data.approvedBy,
    ).toBe(checker.id)
    expect((await api('POST', `/api/budgets/${budget.body.data.id}/lines`, { as: maker, body: line })).status).toBe(409)
    expect((await api('POST', `/api/budgets/${budget.body.data.id}/approve`, { as: checker, body: { approvedBy: 1 } })).status).toBe(409)
    expect((await api('GET', `/api/budgets/${budget.body.data.id}`, { as: maker })).body.data.lines).toHaveLength(2)
  })

  it('refuses approval by the budget’s own creator', async () => {
    const both = await userWithPermissions('budget.manage', 'budget.approve')
    const budget = await api('POST', '/api/budgets', { as: both, body: budgetBody() })
    expect((await api('POST', `/api/budgets/${budget.body.data.id}/approve`, { as: both, body: { approvedBy: 999 } })).status).toBe(403)
  })

  it('returns 404 for an unknown budget', async () => {
    expect((await api('GET', '/api/budgets/999999/budget-vs-actual', { as: staff })).status).toBe(404)
  })
})

describe('compliance reports', () => {
  it.each(['nemis_enrollment', 'tsc_staffing', 'moe_capitation'])('generates a %s return, submitted once', async (reportType) => {
    const generated = await api('POST', '/api/compliance', { as: staff, body: { reportType, periodId: refs.period(1), generatedBy: 1 } })
    expect(generated.status).toBe(201)
    expect(generated.body.data.generatedBy).toBe(staff.id)

    const submit = () =>
      api('POST', `/api/compliance/${generated.body.data.id}/submit`, { as: staff, body: { referenceNumber: 'REF-1', submittedBy: 1 } })
    expect((await submit()).body.data.status).toBe('submitted')
    expect((await submit()).status).toBe(409)
  })

  it('returns 404 for an unknown period or report', async () => {
    expect(
      (await api('POST', '/api/compliance', { as: staff, body: { reportType: 'nemis_enrollment', periodId: 999999, generatedBy: 1 } }))
        .status,
    ).toBe(404)
    expect((await api('GET', '/api/compliance/999999', { as: staff })).status).toBe(404)
  })
})

describe('user administration', () => {
  it('creates a user who can sign in, resets their password, and records it in the audit log', async () => {
    const admin = await userWithRole('system_admin')
    const roles = await api('GET', '/api/roles', { as: admin })
    const teacherRole = roles.body.data.find((r: { code: string }) => r.code === 'teacher')

    const created = await api('POST', '/api/users', {
      as: admin,
      body: { email: 'new.teacher@school.local', fullName: 'New Teacher', password: 'Initial-Passw0rd', roleIds: [teacherRole.id] },
    })
    expect(created.status).toBe(201)
    expect(created.body.data).not.toHaveProperty('passwordHash')

    const login = (password: string) => api('POST', '/api/auth/login', { body: { email: 'new.teacher@school.local', password } })
    expect((await login('Initial-Passw0rd')).status).toBe(200)

    const reset = await api('POST', `/api/users/${created.body.data.id}/reset-password`, {
      as: admin,
      body: { newPassword: 'Reset-Passw0rd!' },
    })
    expect(reset.status).toBe(200)
    expect((await login('Initial-Passw0rd')).status).toBe(400)
    expect((await login('Reset-Passw0rd!')).status).toBe(200)

    const auditor = await userWithPermissions('audit.view')
    const log = await api('GET', '/api/audit-log', { as: auditor })
    expect(log.body.data.map((e: { entry: { action: string } }) => e.entry.action)).toEqual(
      expect.arrayContaining(['user.create', 'user.reset_password']),
    )
  })

  it('reports system health to an administrator', async () => {
    const admin = await userWithRole('system_admin')
    expect((await api('GET', '/api/system/health', { as: admin })).status).toBe(200)
  })

  it('flags someone granted both maker and checker directly, not only through roles', async () => {
    const admin = await userWithRole('system_admin')
    const both = await userWithPermissions('ledger.journal.create', 'ledger.journal.approve')

    const report = await api('GET', '/api/system/rbac', { as: admin })

    const emails = report.body.data.conflicts.map((c: { email: string }) => c.email)
    expect(emails).toContain(both.email)
  })

  it('stops flagging a conflict once one side has been revoked', async () => {
    const admin = await userWithRole('system_admin')
    const both = await userWithPermissions('ledger.journal.create', 'ledger.journal.approve')
    await api('PUT', `/api/users/${both.id}/permissions/ledger.journal.approve`, { as: admin, body: { granted: false } })

    const report = await api('GET', '/api/system/rbac', { as: admin })

    expect(report.body.data.conflicts.map((c: { email: string }) => c.email)).not.toContain(both.email)
  })
})
