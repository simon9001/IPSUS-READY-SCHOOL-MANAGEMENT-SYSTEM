import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError, NotFoundError } from '../../common/errors.js'

const repo = vi.hoisted(() => ({
  findSupplierById: vi.fn(),
  findRequisitionById: vi.fn(),
  updateRequisitionStatus: vi.fn(),
  createPurchaseOrder: vi.fn(),
  findPurchaseOrderById: vi.fn(),
  findPurchaseOrderItems: vi.fn(),
  createGrn: vi.fn(),
  findReceivedItemIdsForPurchaseOrder: vi.fn(),
  updatePurchaseOrderStatus: vi.fn(),
  createSupplierInvoice: vi.fn(),
  attachInvoiceJournalEntry: vi.fn(),
  findSupplierInvoiceById: vi.fn(),
  createSupplierPayment: vi.fn(),
  markInvoicePaid: vi.fn(),
  totalPaidForInvoice: vi.fn(),
  attachPaymentJournalEntry: vi.fn(),
}))
const postSystemEntry = vi.hoisted(() => vi.fn())

vi.mock('./procurement.repository.js', () => ({ procurementRepository: repo }))
vi.mock('../journal/journal.service.js', () => ({ journalService: { postSystemEntry } }))
vi.mock('../../common/events.js', () => ({ broadcastChange: vi.fn() }))

const { procurementService } = await import('./procurement.service.js')

beforeEach(() => {
  vi.resetAllMocks()
  repo.updateRequisitionStatus.mockImplementation(async (id: number, status: string, extra = {}) => ({ id, status, ...extra }))
  repo.createGrn.mockImplementation(async (data: object) => ({ id: 50, ...data }))
  repo.createPurchaseOrder.mockImplementation(async (data: object) => ({ po: { id: 30, ...data }, items: [] }))
  postSystemEntry.mockResolvedValue({ id: 700 })
})

// ---- Requisitions ----
describe('procurementService.approveRequisition', () => {
  it('returns 404 for an unknown requisition', async () => {
    repo.findRequisitionById.mockResolvedValue(undefined)
    await expect(procurementService.approveRequisition(1, { approvedBy: 5 })).rejects.toBeInstanceOf(NotFoundError)
  })

  it.each(['approved', 'rejected', 'converted_to_lpo'])('refuses a requisition that is already %s with 409', async (status) => {
    repo.findRequisitionById.mockResolvedValue({ id: 1, status })
    const err = await procurementService.approveRequisition(1, { approvedBy: 5 }).catch((e) => e)

    expect(err).toBeInstanceOf(ConflictError)
    expect(err.message).toContain(status)
    expect(repo.updateRequisitionStatus).not.toHaveBeenCalled()
  })

  it('approves a submitted requisition, recording who and when', async () => {
    repo.findRequisitionById.mockResolvedValue({ id: 1, status: 'submitted' })
    const approved = await procurementService.approveRequisition(1, { approvedBy: 5 })

    expect(repo.updateRequisitionStatus).toHaveBeenCalledWith(1, 'approved', { approvedBy: 5, approvedAt: expect.any(Date) })
    expect(approved).toMatchObject({ status: 'approved', approvedBy: 5 })
  })
})

describe('procurementService.rejectRequisition', () => {
  it('refuses to reject a requisition that is no longer submitted', async () => {
    repo.findRequisitionById.mockResolvedValue({ id: 1, status: 'approved' })
    await expect(procurementService.rejectRequisition(1)).rejects.toBeInstanceOf(ConflictError)
    expect(repo.updateRequisitionStatus).not.toHaveBeenCalled()
  })

  it('rejects a submitted requisition', async () => {
    repo.findRequisitionById.mockResolvedValue({ id: 1, status: 'submitted' })
    await procurementService.rejectRequisition(1)
    expect(repo.updateRequisitionStatus).toHaveBeenCalledWith(1, 'rejected')
  })
})

// ---- Purchase orders ----
describe('procurementService.createPurchaseOrder', () => {
  const base = { supplierId: 3, orderDate: '2026-02-01' }

  it('totals quantity x unit cost across items, accepting numeric strings', async () => {
    await procurementService.createPurchaseOrder({
      ...base,
      items: [
        { description: 'Exercise books', quantity: '100', unitCost: '25.50', accountId: 9 },
        { description: 'Chalk', quantity: 3, unitCost: 1.25, accountId: 9 },
      ],
    })

    expect(repo.createPurchaseOrder.mock.calls[0][0]).toMatchObject({ totalAmount: '2553.75', status: 'issued' })
  })

  it('marks the source requisition converted_to_lpo', async () => {
    await procurementService.createPurchaseOrder({
      ...base,
      requisitionId: 12,
      items: [{ description: 'x', quantity: 1, unitCost: 1, accountId: 9 }],
    })
    expect(repo.updateRequisitionStatus).toHaveBeenCalledWith(12, 'converted_to_lpo')
  })

  it('leaves requisitions alone for a PO raised without one', async () => {
    await procurementService.createPurchaseOrder({ ...base, items: [{ description: 'x', quantity: 1, unitCost: 1, accountId: 9 }] })
    expect(repo.updateRequisitionStatus).not.toHaveBeenCalled()
  })
})

// ---- Goods received notes ----
describe('procurementService.createGrn', () => {
  const grn = (itemIds: number[]) => ({
    purchaseOrderId: 30,
    receivedDate: '2026-02-10',
    receivedBy: 4,
    items: itemIds.map((id) => ({ purchaseOrderItemId: id, quantityReceived: 1 })),
  })

  // PO item ids on every GRN recorded so far, like the grn_items table.
  let receivedSoFar: number[]

  beforeEach(() => {
    receivedSoFar = []
    repo.findPurchaseOrderById.mockResolvedValue({ id: 30, status: 'issued' })
    repo.findPurchaseOrderItems.mockResolvedValue([{ id: 301 }, { id: 302 }, { id: 303 }])
    repo.createGrn.mockImplementation(async (data: object, items: { purchaseOrderItemId: number }[]) => {
      receivedSoFar.push(...items.map((item) => item.purchaseOrderItemId))
      return { id: 50, ...data }
    })
    repo.findReceivedItemIdsForPurchaseOrder.mockImplementation(async () => [...new Set(receivedSoFar)])
  })

  it('returns 404 and records nothing for an unknown purchase order', async () => {
    repo.findPurchaseOrderById.mockResolvedValue(undefined)
    await expect(procurementService.createGrn(grn([301]))).rejects.toBeInstanceOf(NotFoundError)
    expect(repo.createGrn).not.toHaveBeenCalled()
  })

  it('marks the PO received when the GRN covers every item', async () => {
    await procurementService.createGrn(grn([301, 302, 303]))
    expect(repo.updatePurchaseOrderStatus).toHaveBeenCalledWith(30, 'received')
  })

  it('marks the PO partially_received when the GRN covers only some items', async () => {
    await procurementService.createGrn(grn([301, 303]))
    expect(repo.updatePurchaseOrderStatus).toHaveBeenCalledWith(30, 'partially_received')
  })

  it('completes the PO when a delivery is split across several GRNs', async () => {
    await procurementService.createGrn(grn([301]))
    await procurementService.createGrn(grn([302]))
    await procurementService.createGrn(grn([303]))

    expect(repo.updatePurchaseOrderStatus.mock.calls.map((call) => call[1])).toEqual([
      'partially_received',
      'partially_received',
      'received',
    ])
  })

  it('stores received quantities as strings for the numeric column', async () => {
    await procurementService.createGrn({ ...grn([]), items: [{ purchaseOrderItemId: 301, quantityReceived: 7 }] })
    expect(repo.createGrn.mock.calls[0][1]).toEqual([{ purchaseOrderItemId: 301, quantityReceived: '7' }])
  })
})

// ---- Supplier invoices ----
describe('procurementService.createSupplierInvoice', () => {
  const input = {
    invoiceNo: 'INV-88',
    supplierId: 3,
    invoiceDate: '2026-02-12',
    fundId: 2,
    creditorsAccountId: 2100,
    periodId: 1,
    createdBy: 4,
    lines: [
      { accountId: 5100, amount: '1200.50' },
      { accountId: 5200, amount: 799.5 },
    ],
  }

  it('returns 404 for an unknown supplier without posting anything', async () => {
    repo.findSupplierById.mockResolvedValue(undefined)
    await expect(procurementService.createSupplierInvoice(input)).rejects.toBeInstanceOf(NotFoundError)
    expect(postSystemEntry).not.toHaveBeenCalled()
  })

  it('posts a balanced entry: each expense line debited, creditors credited with the total', async () => {
    repo.findSupplierById.mockResolvedValue({ id: 3, name: 'Kakamega Stationers' })
    repo.createSupplierInvoice.mockResolvedValue({ id: 80 })
    repo.attachInvoiceJournalEntry.mockResolvedValue({ id: 80, journalEntryId: 700, status: 'approved' })

    const result = await procurementService.createSupplierInvoice(input)

    expect(repo.createSupplierInvoice.mock.calls[0][0]).toMatchObject({ amount: '2000.00', status: 'pending' })
    const entry = postSystemEntry.mock.calls[0][0]
    expect(entry.lines).toEqual([
      expect.objectContaining({ accountId: 5100, debit: '1200.50', fundId: 2 }),
      expect.objectContaining({ accountId: 5200, debit: 799.5, fundId: 2 }),
      { accountId: 2100, fundId: 2, credit: 2000 },
    ])
    expect(entry.sourceReference).toBe('supplier-invoice-80')
    expect(repo.attachInvoiceJournalEntry).toHaveBeenCalledWith(80, 700)
    expect(result).toMatchObject({ status: 'approved' })
  })
})

// ---- Supplier payments ----
describe('procurementService.createSupplierPayment', () => {
  const pay = (amount: number | string) => ({
    supplierInvoiceId: 80,
    paymentDate: '2026-03-01',
    amount,
    paymentMethod: 'bank' as const,
    fundId: 2,
    cashAccountId: 1000,
    creditorsAccountId: 2100,
    periodId: 1,
    paidBy: 4,
  })

  // Payments recorded against invoice 80, so the running total behaves like
  // the real supplier_payments table across successive calls.
  let recorded: string[]

  beforeEach(() => {
    recorded = []
    repo.findSupplierInvoiceById.mockResolvedValue({ id: 80, invoiceNo: 'INV-88', amount: '2000.00', status: 'approved' })
    repo.createSupplierPayment.mockImplementation(async (data: { amount: string }) => {
      recorded.push(data.amount)
      return { id: 90 + recorded.length }
    })
    repo.totalPaidForInvoice.mockImplementation(async () => recorded.reduce((sum, amount) => sum + Number(amount), 0))
  })

  it('refuses to pay an invoice that is already paid, posting nothing', async () => {
    repo.findSupplierInvoiceById.mockResolvedValue({ id: 80, invoiceNo: 'INV-88', amount: '2000.00', status: 'paid' })
    await expect(procurementService.createSupplierPayment(pay(10))).rejects.toBeInstanceOf(ConflictError)
    expect(repo.createSupplierPayment).not.toHaveBeenCalled()
    expect(postSystemEntry).not.toHaveBeenCalled()
  })

  it('debits creditors and credits cash for the amount paid', async () => {
    await procurementService.createSupplierPayment(pay(500))
    expect(postSystemEntry.mock.calls[0][0].lines).toEqual([
      { accountId: 2100, fundId: 2, debit: 500 },
      { accountId: 1000, fundId: 2, credit: 500 },
    ])
  })

  it('marks the invoice paid when a single payment covers it in full', async () => {
    await procurementService.createSupplierPayment(pay('2000.00'))
    expect(repo.markInvoicePaid).toHaveBeenCalledWith(80)
  })

  it('leaves the invoice open after a partial payment', async () => {
    await procurementService.createSupplierPayment(pay(500))
    expect(repo.markInvoicePaid).not.toHaveBeenCalled()
  })

  it('marks the invoice paid once instalments add up to the full amount', async () => {
    await procurementService.createSupplierPayment(pay(1200))
    await procurementService.createSupplierPayment(pay('500.00'))
    expect(repo.markInvoicePaid).not.toHaveBeenCalled()

    await procurementService.createSupplierPayment(pay(300))
    expect(repo.markInvoicePaid).toHaveBeenCalledTimes(1)
    expect(repo.markInvoicePaid).toHaveBeenCalledWith(80)
  })
})
