import { beforeAll, describe, expect, it, vi } from 'vitest'
import { count } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { supplierInvoices, supplierPayments } from '../../db/schema/index.js'
import { api, closedPeriod, ledgerRefs, seedDatabase, superUser, userWithPermissions, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let refs: Awaited<ReturnType<typeof ledgerRefs>>
let officer: Actor
let principal: Actor
let supplierId: number
let closedPeriodId: number
let nextInvoice = 1

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  closedPeriodId = await closedPeriod()
  officer = await superUser()
  principal = await userWithPermissions('procurement.requisition.approve', 'procurement.view')
  supplierId = (
    await api('POST', '/api/procurement/suppliers', { as: officer, body: { name: 'Kakamega Stationers', kraPin: 'P051234567X' } })
  ).body.data.id
})

const requisitionBody = () => ({
  requestedBy: 1,
  department: 'Science',
  requestDate: '2026-02-01',
  items: [{ description: 'Beakers', quantity: 10, estimatedUnitCost: 500, accountId: refs.account('5100') }],
})

const newRequisition = async () => (await api('POST', '/api/procurement/requisitions', { as: officer, body: requisitionBody() })).body.data

async function newOrder(requisitionId?: number) {
  const res = await api('POST', '/api/procurement/purchase-orders', {
    as: officer,
    body: {
      supplierId,
      requisitionId,
      orderDate: '2026-02-03',
      items: [
        { description: 'Beakers', quantity: 10, unitCost: 500, accountId: refs.account('5100') },
        { description: 'Flasks', quantity: 5, unitCost: '200.50', accountId: refs.account('5100') },
      ],
    },
  })
  expect(res.status).toBe(201)
  return res.body.data
}

const invoiceBody = (overrides = {}) => ({
  invoiceNo: `SUP-${nextInvoice++}`,
  supplierId,
  invoiceDate: '2026-02-12',
  fundId: refs.fund('FUND-TUI'),
  creditorsAccountId: refs.account('2000'),
  periodId: refs.period(1),
  createdBy: 1,
  lines: [{ accountId: refs.account('5100'), amount: 2000 }],
  ...overrides,
})

const paymentBody = (supplierInvoiceId: number, amount: number, overrides = {}) => ({
  supplierInvoiceId,
  paymentDate: '2026-03-01',
  amount,
  paymentMethod: 'bank',
  fundId: refs.fund('FUND-TUI'),
  cashAccountId: refs.account('1010'),
  creditorsAccountId: refs.account('2000'),
  periodId: refs.period(1),
  paidBy: 1,
  ...overrides,
})

const newInvoice = async () => (await api('POST', '/api/procurement/invoices', { as: officer, body: invoiceBody() })).body.data
const countOf = async (table: typeof supplierInvoices | typeof supplierPayments) => (await db.select({ n: count() }).from(table))[0].n

describe('requisitions', () => {
  it('records the signed-in user as the requester, whoever the body names', async () => {
    expect((await newRequisition()).requestedBy).toBe(officer.id)
  })

  it('moves from submitted to approved by someone else, and only once', async () => {
    const requisition = await newRequisition()
    const approve = () => api('POST', `/api/procurement/requisitions/${requisition.id}/approve`, { as: principal, body: { approvedBy: 1 } })

    const approved = await approve()
    expect(approved.status).toBe(200)
    expect(approved.body.data).toMatchObject({ status: 'approved', approvedBy: principal.id })
    expect((await approve()).status).toBe(409)
  })

  it('cannot be approved by its own requester, however the request is worded', async () => {
    const requisition = await newRequisition()
    const res = await api('POST', `/api/procurement/requisitions/${requisition.id}/approve`, {
      as: officer,
      body: { approvedBy: principal.id },
    })
    expect(res.status).toBe(403)
  })

  it('can be rejected, after which it cannot be approved', async () => {
    const requisition = await newRequisition()
    expect(
      (await api('POST', `/api/procurement/requisitions/${requisition.id}/reject`, { as: principal, body: {} })).body.data.status,
    ).toBe('rejected')
    expect(
      (await api('POST', `/api/procurement/requisitions/${requisition.id}/approve`, { as: principal, body: { approvedBy: 1 } })).status,
    ).toBe(409)
  })

  it('returns its items, and 404 when unknown', async () => {
    const requisition = await newRequisition()
    expect((await api('GET', `/api/procurement/requisitions/${requisition.id}`, { as: officer })).body.data.items).toHaveLength(1)
    expect((await api('GET', '/api/procurement/requisitions/999999', { as: officer })).status).toBe(404)
  })
})

describe('purchase orders and deliveries', () => {
  it('totals the order and converts its requisition', async () => {
    const requisition = await newRequisition()
    const order = await newOrder(requisition.id)

    expect(order.totalAmount).toBe('6002.50')
    expect((await api('GET', `/api/procurement/requisitions/${requisition.id}`, { as: officer })).body.data.status).toBe('converted_to_lpo')
  })

  it('does not take an approval from whoever raises the order', async () => {
    const res = await api('POST', '/api/procurement/purchase-orders', {
      as: officer,
      body: {
        supplierId,
        orderDate: '2026-02-03',
        approvedBy: principal.id,
        items: [{ description: 'Pens', quantity: 1, unitCost: 10, accountId: refs.account('5100') }],
      },
    })
    expect(res.body.data.approvedBy).toBeNull()
  })

  it('is partially received until a later delivery brings the rest', async () => {
    const order = await newOrder()
    const { items } = (await api('GET', `/api/procurement/purchase-orders/${order.id}`, { as: officer })).body.data
    const deliver = (itemId: number) =>
      api('POST', '/api/procurement/goods-received-notes', {
        as: officer,
        body: {
          purchaseOrderId: order.id,
          receivedDate: '2026-02-10',
          receivedBy: 1,
          items: [{ purchaseOrderItemId: itemId, quantityReceived: 1 }],
        },
      })
    const status = async () => (await api('GET', `/api/procurement/purchase-orders/${order.id}`, { as: officer })).body.data.status

    expect((await deliver(items[0].id)).status).toBe(201)
    expect(await status()).toBe('partially_received')

    await deliver(items[1].id)
    expect(await status()).toBe('received')
  })
})

describe('supplier invoices and payments', () => {
  it('rejects a supplier that does not exist, and an invoice number used twice', async () => {
    expect((await api('POST', '/api/procurement/invoices', { as: officer, body: invoiceBody({ supplierId: 999999 }) })).status).toBe(404)

    const body = invoiceBody()
    expect((await api('POST', '/api/procurement/invoices', { as: officer, body })).status).toBe(201)
    expect((await api('POST', '/api/procurement/invoices', { as: officer, body })).status).toBe(409)
  })

  it('leaves no invoice behind when the ledger refuses the posting', async () => {
    const before = await countOf(supplierInvoices)
    const res = await api('POST', '/api/procurement/invoices', { as: officer, body: invoiceBody({ periodId: closedPeriodId }) })

    expect(res.status).toBe(409)
    expect(await countOf(supplierInvoices)).toBe(before)
  })

  it('settles an invoice over instalments, then refuses more', async () => {
    const invoice = await newInvoice()
    const pay = (amount: number) => api('POST', '/api/procurement/payments', { as: officer, body: paymentBody(invoice.id, amount) })
    const status = async () => (await api('GET', `/api/procurement/invoices/${invoice.id}`, { as: officer })).body.data.status

    expect((await pay(1500)).status).toBe(201)
    expect(await status()).toBe('approved')
    expect((await pay(500.01)).status).toBe(400)

    expect((await pay(500)).status).toBe(201)
    expect(await status()).toBe('paid')
    expect((await pay(1)).status).toBe(409)
  })

  it('leaves no payment behind when the ledger refuses the posting', async () => {
    const invoice = await newInvoice()
    const before = await countOf(supplierPayments)
    const res = await api('POST', '/api/procurement/payments', {
      as: officer,
      body: paymentBody(invoice.id, 100, { periodId: closedPeriodId }),
    })

    expect(res.status).toBe(409)
    expect(await countOf(supplierPayments)).toBe(before)
  })

  it('does not take an approval from whoever raises the payment', async () => {
    const invoice = await newInvoice()
    const res = await api('POST', '/api/procurement/payments', {
      as: officer,
      body: paymentBody(invoice.id, 100, { approvedBy: principal.id }),
    })

    expect(res.body.data).toMatchObject({ paidBy: officer.id, approvedBy: null })
  })

  it('keeps the ledger balanced through the whole chain', async () => {
    const tb = await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: officer })
    expect(tb.body.data.isBalanced).toBe(true)
    expect(tb.body.data.totalDebit).toBeGreaterThan(0)
  })
})
