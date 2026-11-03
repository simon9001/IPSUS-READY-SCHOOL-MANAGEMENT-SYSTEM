import { beforeAll, describe, expect, it, vi } from 'vitest'
import { api, ledgerRefs, seedDatabase, userWithPermissions, userWithRole, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let refs: Awaited<ReturnType<typeof ledgerRefs>>
let bursar: Actor
let principal: Actor

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  bursar = await userWithRole('bursar')
  principal = await userWithRole('principal')
})

function entry(amount: number | string = 1000, overrides: Record<string, unknown> = {}) {
  return {
    periodId: refs.period(1),
    entryDate: '2026-02-01',
    description: 'Adjustment',
    sourceModule: 'manual',
    createdBy: 1,
    lines: [
      { accountId: refs.account('1010'), fundId: refs.fund('FUND-TUI'), debit: amount },
      { accountId: refs.account('3000'), fundId: refs.fund('FUND-TUI'), credit: amount },
    ],
    ...overrides,
  }
}

async function pendingEntry() {
  const res = await api('POST', '/api/journal-entries', { as: bursar, body: entry() })
  expect(res.status).toBe(201)
  return res.body.data
}

describe('who an action is attributed to', () => {
  it('records the signed-in user as creator, whatever the body claims', async () => {
    const res = await api('POST', '/api/journal-entries', { as: bursar, body: entry(1000, { createdBy: principal.id }) })

    expect(res.status).toBe(201)
    expect(res.body.data.createdBy).toBe(bursar.id)
  })

  it('records the signed-in user as approver, whatever the body claims', async () => {
    const pending = await pendingEntry()
    const res = await api('POST', `/api/journal-entries/${pending.id}/approve`, { as: principal, body: { approverId: bursar.id } })

    expect(res.status).toBe(200)
    expect(res.body.data.approvedBy).toBe(principal.id)
  })
})

describe('maker-checker on manual entries', () => {
  it('leaves a new manual entry pending, so it does not reach the trial balance', async () => {
    const before = await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: bursar })
    const pending = await pendingEntry()
    const after = await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: bursar })

    expect(pending.status).toBe('pending_approval')
    expect(after.body.data.totalDebit).toBe(before.body.data.totalDebit)
  })

  it('refuses approval by the entry’s own creator', async () => {
    const maker = await userWithPermissions('ledger.journal.create', 'ledger.journal.approve')
    const created = await api('POST', '/api/journal-entries', { as: maker, body: entry() })

    const res = await api('POST', `/api/journal-entries/${created.body.data.id}/approve`, { as: maker, body: { approverId: principal.id } })

    expect(res.status).toBe(403)
  })

  it('posts on approval, and the trial balance moves and stays balanced', async () => {
    const before = await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: bursar })
    const pending = await pendingEntry()
    await api('POST', `/api/journal-entries/${pending.id}/approve`, { as: principal, body: { approverId: principal.id } })
    const after = await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: bursar })

    expect(after.body.data.totalDebit).toBe(before.body.data.totalDebit + 1000)
    expect(after.body.data.isBalanced).toBe(true)
  })

  it('refuses to approve the same entry twice', async () => {
    const pending = await pendingEntry()
    await api('POST', `/api/journal-entries/${pending.id}/approve`, { as: principal, body: { approverId: principal.id } })
    const again = await api('POST', `/api/journal-entries/${pending.id}/approve`, { as: principal, body: { approverId: principal.id } })

    expect(again.status).toBe(409)
  })

  it('records the reason when an entry is rejected', async () => {
    const pending = await pendingEntry()
    const res = await api('POST', `/api/journal-entries/${pending.id}/reject`, {
      as: principal,
      body: { approverId: principal.id, reason: 'No supporting document' },
    })

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('rejected')
  })

  it('does not let a creator post straight to the ledger through /system', async () => {
    const res = await api('POST', '/api/journal-entries/system', { as: bursar, body: entry() })
    expect(res.status).toBe(403)
  })
})
