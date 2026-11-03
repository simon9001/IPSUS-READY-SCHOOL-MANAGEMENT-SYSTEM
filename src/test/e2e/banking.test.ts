import { beforeAll, describe, expect, it, vi } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { imprestRequests, imprestRetirements } from '../../db/schema/index.js'
import { api, closedPeriod, ledgerRefs, seedDatabase, userWithPermissions, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let refs: Awaited<ReturnType<typeof ledgerRefs>>
let bursar: Actor
let closedPeriodId: number

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  bursar = await userWithPermissions('banking.manage', 'banking.reconcile', 'imprest.issue', 'imprest.retire', 'ledger.journal.view')
  closedPeriodId = await closedPeriod()
})

const imprestBody = (overrides = {}) => ({
  requestedBy: bursar.id,
  purpose: 'Sports day transport',
  amountRequested: 5000,
  dateIssued: '2026-02-01',
  periodId: refs.period(1),
  fundId: refs.fund('FUND-TUI'),
  cashAccountId: refs.account('1010'),
  imprestControlAccountId: refs.account('1030'),
  ...overrides,
})

const retireBody = (overrides = {}) => ({
  retirementDate: '2026-02-10',
  periodId: refs.period(1),
  fundId: refs.fund('FUND-TUI'),
  imprestControlAccountId: refs.account('1030'),
  cashAccountId: refs.account('1010'),
  receiptsAttached: true,
  balanceReturned: 1000,
  expenseLines: [{ accountId: refs.account('5500'), amount: 4000, description: 'Bus hire' }],
  recordedBy: bursar.id,
  ...overrides,
})

async function issue() {
  const res = await api('POST', '/api/banking/imprest', { as: bursar, body: imprestBody() })
  expect(res.status).toBe(201)
  return res.body.data
}

const retirementCount = async () => (await db.select({ n: count() }).from(imprestRetirements))[0].n
const imprestStatus = async (id: number) => (await db.select().from(imprestRequests).where(eq(imprestRequests.id, id)))[0].status

describe('imprest', () => {
  it('issues cash against the imprest control account, keeping the ledger balanced', async () => {
    const imprest = await issue()
    const tb = await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: bursar })

    expect(imprest.status).toBe('issued')
    expect(imprest.requestNo).toMatch(/^IMP-/)
    expect(tb.body.data.isBalanced).toBe(true)
  })

  it('leaves no imprest behind when the ledger refuses the posting', async () => {
    const before = (await db.select({ n: count() }).from(imprestRequests))[0].n
    const res = await api('POST', '/api/banking/imprest', { as: bursar, body: imprestBody({ periodId: closedPeriodId }) })

    expect(res.status).toBe(409)
    expect((await db.select({ n: count() }).from(imprestRequests))[0].n).toBe(before)
  })

  it('retires an imprest with receipts and the balance returned', async () => {
    const imprest = await issue()
    const res = await api('POST', `/api/banking/imprest/${imprest.id}/retire`, { as: bursar, body: retireBody() })

    expect(res.status).toBe(201)
    expect(await imprestStatus(imprest.id)).toBe('retired')
    expect(res.body.data.retirement.amountSpent).toBe('4000.00')
  })

  it('refuses to retire the same imprest twice', async () => {
    const imprest = await issue()
    await api('POST', `/api/banking/imprest/${imprest.id}/retire`, { as: bursar, body: retireBody() })
    const again = await api('POST', `/api/banking/imprest/${imprest.id}/retire`, { as: bursar, body: retireBody() })

    expect(again.status).toBe(409)
  })

  it('refuses to clear more than was issued', async () => {
    const imprest = await issue()
    const res = await api('POST', `/api/banking/imprest/${imprest.id}/retire`, {
      as: bursar,
      body: retireBody({ balanceReturned: 1000.01 }),
    })

    expect(res.status).toBe(400)
    expect(await imprestStatus(imprest.id)).toBe('issued')
  })

  it('needs to know where returned cash went, and says so clearly', async () => {
    const imprest = await issue()
    const before = await retirementCount()
    const res = await api('POST', `/api/banking/imprest/${imprest.id}/retire`, {
      as: bursar,
      body: retireBody({ cashAccountId: undefined }),
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/cashAccountId/)
    expect(await retirementCount()).toBe(before)
  })

  it('leaves the imprest open when the ledger refuses the retirement', async () => {
    const imprest = await issue()
    const before = await retirementCount()
    const res = await api('POST', `/api/banking/imprest/${imprest.id}/retire`, {
      as: bursar,
      body: retireBody({ periodId: closedPeriodId }),
    })

    expect(res.status).toBe(409)
    expect(await retirementCount()).toBe(before)
    expect(await imprestStatus(imprest.id)).toBe('issued')
  })
})

describe('bank accounts and reconciliation', () => {
  it('keeps an overdrawn statement balance, and marks a reconciliation done by the signed-in user', async () => {
    const account = await api('POST', '/api/banking/accounts', {
      as: bursar,
      body: { accountId: refs.account('1010'), bankName: 'KCB', accountNumber: '1100223344' },
    })
    expect(account.status).toBe(201)

    const reconciliation = await api('POST', '/api/banking/reconciliations', {
      as: bursar,
      body: {
        bankAccountId: account.body.data.id,
        periodId: refs.period(1),
        statementDate: '2026-03-31',
        statementBalance: -250.75,
        bookBalance: 100,
        items: [{ description: 'Cheque 991', amount: 350.75, itemType: 'outstanding_cheque' }],
      },
    })
    expect(reconciliation.status).toBe(201)

    const done = await api('POST', `/api/banking/reconciliations/${reconciliation.body.data.id}/reconcile`, {
      as: bursar,
      body: { reconciledBy: 1 },
    })
    expect(done.status).toBe(200)
    expect(done.body.data.reconciledBy).toBe(bursar.id)

    const list = await api('GET', `/api/banking/accounts/${account.body.data.id}/reconciliations`, { as: bursar })
    expect(list.body.data).toHaveLength(1)
  })

  it('returns 404 for an unknown bank account or imprest', async () => {
    expect((await api('GET', '/api/banking/accounts/999999', { as: bursar })).status).toBe(404)
    expect((await api('GET', '/api/banking/imprest/999999', { as: bursar })).status).toBe(404)
  })
})
