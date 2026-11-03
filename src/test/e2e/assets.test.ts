import { beforeAll, describe, expect, it, vi } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { assets, depreciationEntries } from '../../db/schema/index.js'
import { api, closedPeriod, ledgerRefs, seedDatabase, userWithPermissions, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let refs: Awaited<ReturnType<typeof ledgerRefs>>
let manager: Actor
let categoryId: number
let closedPeriodId: number
let nextTag = 1

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  manager = await userWithPermissions('assets.manage', 'assets.view', 'ledger.journal.view')
  closedPeriodId = await closedPeriod()
  const category = await api('POST', '/api/assets/categories', {
    as: manager,
    body: {
      name: 'Computers',
      defaultUsefulLifeYears: 4,
      assetAccountId: refs.account('1500'),
      depreciationExpenseAccountId: refs.account('5700'),
      accumulatedDepreciationAccountId: refs.account('1510'),
    },
  })
  expect(category.status).toBe(201)
  categoryId = category.body.data.id
})

const acquireBody = (overrides = {}) => ({
  assetTag: `TAG-${nextTag++}`,
  categoryId,
  name: 'Laptop',
  acquisitionDate: '2026-01-20',
  acquisitionCost: 80000,
  fundId: refs.fund('FUND-DEV'),
  periodId: refs.period(1),
  creditAccountId: refs.account('1010'),
  createdBy: manager.id,
  ...overrides,
})

async function acquire(overrides = {}) {
  const res = await api('POST', '/api/assets', { as: manager, body: acquireBody(overrides) })
  expect(res.status).toBe(201)
  return res.body.data
}

const depreciate = (periodId: number) =>
  api('POST', '/api/assets/depreciation-runs', { as: manager, body: { periodId, asOfDate: '2026-04-03', createdBy: manager.id } })

const chargesFor = async (assetId: number) => db.select().from(depreciationEntries).where(eq(depreciationEntries.assetId, assetId))

describe('acquiring an asset', () => {
  it('capitalises the cost and attaches the journal entry', async () => {
    const asset = await acquire()
    expect(asset.journalEntryId).toEqual(expect.any(Number))
    expect(asset.status).toBe('in_use')
  })

  it('leaves no asset behind when the ledger refuses the posting', async () => {
    const before = (await db.select({ n: count() }).from(assets))[0].n
    const res = await api('POST', '/api/assets', { as: manager, body: acquireBody({ periodId: closedPeriodId }) })

    expect(res.status).toBe(409)
    expect((await db.select({ n: count() }).from(assets))[0].n).toBe(before)
  })

  it('returns 404 for an unknown category', async () => {
    const res = await api('POST', '/api/assets', { as: manager, body: acquireBody({ categoryId: 999999 }) })
    expect(res.status).toBe(404)
  })
})

describe('depreciation', () => {
  it('charges cost divided by useful life', async () => {
    const asset = await acquire()
    await depreciate(refs.period(1))

    const charges = await chargesFor(asset.id)
    expect(charges.map((c) => c.amount)).toEqual(['20000.00'])
  })

  it('does not charge twice when a run is repeated for the same period', async () => {
    const asset = await acquire()
    await depreciate(refs.period(2))
    const repeat = await depreciate(refs.period(2))

    expect(repeat.status).toBe(201)
    expect(await chargesFor(asset.id)).toHaveLength(1)
  })

  it('stops at cost, however many periods run', async () => {
    const asset = await acquire({ acquisitionCost: 30000 })
    const periods = await Promise.all(
      [2021, 2022, 2023, 2024, 2025].map((year) => api('POST', '/api/periods', { as: admin(), body: periodBody(year) })),
    )
    for (const period of periods) await depreciate(period.body.data.id)

    const charges = await chargesFor(asset.id)
    const total = charges.reduce((sum, c) => sum + Number(c.amount), 0)
    expect(total).toBe(30000)
  })
})

describe('disposal', () => {
  const disposeBody = (proceeds: number, overrides = {}) => ({
    disposalDate: '2026-06-01',
    periodId: refs.period(2),
    proceeds,
    cashAccountId: refs.account('1010'),
    gainLossAccountId: refs.account('5900'),
    recordedBy: manager.id,
    ...overrides,
  })

  it.each([
    ['at a gain', 100000],
    ['at a loss', 10000],
    ['for nothing', 0],
    ['at exactly book value', 80000],
  ])('posts a balanced entry when sold %s', async (_label, proceeds) => {
    const asset = await acquire()
    const res = await api('POST', `/api/assets/${asset.id}/dispose`, { as: manager, body: disposeBody(proceeds) })

    expect(res.status).toBe(201)
    expect(res.body.data.netBookValueAtDisposal).toBe('80000.00')
    expect((await api('GET', `/api/assets/${asset.id}`, { as: manager })).body.data.status).toBe('disposed')
  })

  it('refuses to dispose of the same asset twice', async () => {
    const asset = await acquire()
    await api('POST', `/api/assets/${asset.id}/dispose`, { as: manager, body: disposeBody(0) })
    const again = await api('POST', `/api/assets/${asset.id}/dispose`, { as: manager, body: disposeBody(0) })

    expect(again.status).toBe(409)
  })

  it('leaves the asset in use when the ledger refuses the posting', async () => {
    const asset = await acquire()
    const res = await api('POST', `/api/assets/${asset.id}/dispose`, { as: manager, body: disposeBody(0, { periodId: closedPeriodId }) })

    expect(res.status).toBe(409)
    expect((await api('GET', `/api/assets/${asset.id}`, { as: manager })).body.data.status).toBe('in_use')
  })
})

// Periods are managed by a separate permission from assets.
let periodManager: Actor
function admin() {
  return periodManager
}
function periodBody(year: number) {
  return { name: `${year} Term 1`, fiscalYear: year, term: 1, startDate: `${year}-01-06`, endDate: `${year}-04-03` }
}
beforeAll(async () => {
  periodManager = await userWithPermissions('ledger.periods.manage')
})
