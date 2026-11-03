import { beforeAll, describe, expect, it, vi } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { grantDisbursements, payslips, stockMovements } from '../../db/schema/index.js'
import { api, closedPeriod, ledgerRefs, seedDatabase, userWithPermissions, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let refs: Awaited<ReturnType<typeof ledgerRefs>>
let closedPeriodId: number

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  closedPeriodId = await closedPeriod()
})

describe('stores', () => {
  let keeper: Actor
  let nextCode = 1

  beforeAll(async () => {
    keeper = await userWithPermissions('inventory.manage', 'inventory.view', 'ledger.journal.view')
  })

  async function newItem() {
    const res = await api('POST', '/api/inventory/items', {
      as: keeper,
      body: { itemCode: `ITEM-${nextCode++}`, name: 'Maize flour', unit: 'bag', reorderLevel: 5 },
    })
    expect(res.status).toBe(201)
    return res.body.data
  }

  const movement = (itemId: number, quantity: number, overrides = {}) => ({
    itemId,
    movementDate: '2026-02-01',
    quantity,
    unitCost: 3000,
    periodId: refs.period(1),
    fundId: refs.fund('FUND-BRD'),
    inventoryAccountId: refs.account('1200'),
    recordedBy: keeper.id,
    ...overrides,
  })
  const receive = (itemId: number, quantity: number, overrides = {}) =>
    api('POST', '/api/inventory/movements/receive', {
      as: keeper,
      body: { ...movement(itemId, quantity, overrides), creditAccountId: refs.account('2000') },
    })
  const issue = (itemId: number, quantity: number, overrides = {}) =>
    api('POST', '/api/inventory/movements/issue', {
      as: keeper,
      body: { ...movement(itemId, quantity, overrides), expenseAccountId: refs.account('5200') },
    })

  it('receives and issues stock, posting each movement to the ledger', async () => {
    const item = await newItem()

    expect((await receive(item.id, 10)).status).toBe(201)
    const issued = await issue(item.id, 4)

    expect(issued.status).toBe(201)
    expect(issued.body.data.journalEntryId).toEqual(expect.any(Number))
    expect((await api('GET', `/api/inventory/items/${item.id}/movements`, { as: keeper })).body.data).toHaveLength(2)
  })

  it('refuses to issue more than is in stock', async () => {
    const item = await newItem()
    await receive(item.id, 3)

    const res = await issue(item.id, 4)

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/in stock/)
  })

  it('counts earlier issues when checking what is left', async () => {
    const item = await newItem()
    await receive(item.id, 5)
    await issue(item.id, 3)

    expect((await issue(item.id, 3)).status).toBe(400)
    expect((await issue(item.id, 2)).status).toBe(201)
  })

  it('records no movement when the ledger refuses the posting', async () => {
    const item = await newItem()
    const res = await receive(item.id, 5, { periodId: closedPeriodId })

    expect(res.status).toBe(409)
    expect((await db.select({ n: count() }).from(stockMovements).where(eq(stockMovements.itemId, item.id)))[0].n).toBe(0)
  })

  it('returns 404 for an unknown item', async () => {
    expect((await issue(999999, 1)).status).toBe(404)
  })
})

describe('payroll', () => {
  let officer: Actor
  let nextStaff = 1

  beforeAll(async () => {
    officer = await userWithPermissions('payroll.manage', 'payroll.process', 'payroll.view')
  })

  async function employee(components: { componentType: string; name: string; amount: number | string; isPercentageOfBasic?: boolean }[]) {
    const res = await api('POST', '/api/payroll/employees', {
      as: officer,
      body: { staffNo: `S${nextStaff++}`, fullName: 'Grace Wafula', employmentDate: '2025-01-01' },
    })
    expect(res.status).toBe(201)
    for (const component of components) {
      const added = await api('POST', `/api/payroll/employees/${res.body.data.id}/components`, { as: officer, body: component })
      expect(added.status).toBe(201)
    }
    return res.body.data
  }

  const processBody = (overrides = {}) => ({
    fundId: refs.fund('FUND-TUI'),
    salariesExpenseAccountId: refs.account('5000'),
    payeAccountId: refs.account('2100'),
    nssfAccountId: refs.account('2110'),
    shifAccountId: refs.account('2120'),
    netPayAccountId: refs.account('2000'),
    otherDeductionsAccountId: refs.account('2000'),
    entryDate: '2026-03-31',
    processedBy: officer.id,
    ...overrides,
  })

  async function draftRun(monthYear: string, periodId = refs.period(1)) {
    const res = await api('POST', '/api/payroll/runs', { as: officer, body: { periodId, monthYear } })
    expect(res.status).toBe(201)
    return res.body.data
  }

  it('computes a payslip from basic, percentage allowance and deduction', async () => {
    const worker = await employee([
      { componentType: 'basic', name: 'Basic', amount: 40000 },
      { componentType: 'allowance', name: 'House', amount: 10, isPercentageOfBasic: true },
      { componentType: 'deduction', name: 'SACCO', amount: 1000 },
    ])
    const run = await draftRun('2026-01')

    const res = await api('POST', `/api/payroll/runs/${run.id}/process`, { as: officer, body: processBody() })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('posted')
    const [slip] = await db.select().from(payslips).where(eq(payslips.employeeId, worker.id))
    // gross 44000 → PAYE 2400 + 25% of 20000 = 7400, NSSF 6% of 18000 = 1080, SHIF 2.75% = 1210
    expect(slip).toMatchObject({
      grossPay: '44000.00',
      paye: '7400.00',
      nssf: '1080.00',
      shif: '1210.00',
      otherDeductions: '1000.00',
      netPay: '33310.00',
    })
  })

  it('refuses to process a run twice', async () => {
    await employee([{ componentType: 'basic', name: 'Basic', amount: 20000 }])
    const run = await draftRun('2026-02')
    await api('POST', `/api/payroll/runs/${run.id}/process`, { as: officer, body: processBody() })

    const again = await api('POST', `/api/payroll/runs/${run.id}/process`, { as: officer, body: processBody() })

    expect(again.status).toBe(409)
  })

  it('writes no payslips when a required deductions account is missing', async () => {
    await employee([
      { componentType: 'basic', name: 'Basic', amount: 20000 },
      { componentType: 'deduction', name: 'Loan', amount: 500 },
    ])
    const run = await draftRun('2026-03')

    const res = await api('POST', `/api/payroll/runs/${run.id}/process`, {
      as: officer,
      body: processBody({ otherDeductionsAccountId: undefined }),
    })

    expect(res.status).toBe(409)
    expect((await db.select({ n: count() }).from(payslips).where(eq(payslips.payrollRunId, run.id)))[0].n).toBe(0)
  })

  it('writes no payslips when the ledger refuses the posting', async () => {
    const run = await draftRun('2025-11', closedPeriodId)

    const res = await api('POST', `/api/payroll/runs/${run.id}/process`, { as: officer, body: processBody() })

    expect(res.status).toBe(409)
    expect((await db.select({ n: count() }).from(payslips).where(eq(payslips.payrollRunId, run.id)))[0].n).toBe(0)
    expect((await api('GET', `/api/payroll/runs/${run.id}`, { as: officer })).body.data.status).toBe('draft')
  })
})

describe('grants', () => {
  let recorder: Actor
  let grantTypeId: number

  beforeAll(async () => {
    recorder = await userWithPermissions('grants.record', 'grants.view', 'ledger.journal.view')
    const type = await api('POST', '/api/grants/types', {
      as: recorder,
      body: { name: 'FDSE Capitation', fundId: refs.fund('FUND-CAP'), revenueAccountId: refs.account('4100') },
    })
    expect(type.status).toBe(201)
    grantTypeId = type.body.data.id
  })

  const disbursementBody = (conditionsMet: boolean, overrides = {}) => ({
    grantTypeId,
    periodId: refs.period(1),
    cashAccountId: refs.account('1020'),
    amountReceived: 500000,
    dateReceived: '2026-02-05',
    conditionsMet,
    recordedBy: recorder.id,
    ...overrides,
  })

  it('recognises income only once conditions are met (IPSAS 23)', async () => {
    const unmet = await api('POST', '/api/grants/disbursements', { as: recorder, body: disbursementBody(false) })
    const met = await api('POST', '/api/grants/disbursements', { as: recorder, body: disbursementBody(true) })

    expect(unmet.status).toBe(201)
    expect(unmet.body.data.journalEntryId).toBeNull()
    expect(met.body.data.journalEntryId).toEqual(expect.any(Number))
  })

  it('leaves no disbursement behind when the ledger refuses the posting', async () => {
    const before = (await db.select({ n: count() }).from(grantDisbursements))[0].n
    const res = await api('POST', '/api/grants/disbursements', { as: recorder, body: disbursementBody(true, { periodId: closedPeriodId }) })

    expect(res.status).toBe(409)
    expect((await db.select({ n: count() }).from(grantDisbursements))[0].n).toBe(before)
  })

  it('returns 404 for an unknown grant type', async () => {
    const res = await api('POST', '/api/grants/disbursements', { as: recorder, body: disbursementBody(true, { grantTypeId: 999999 }) })
    expect(res.status).toBe(404)
  })
})
