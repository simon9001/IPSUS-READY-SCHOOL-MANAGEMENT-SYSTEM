import { feesRepository } from './fees.repository.js'
import { journalService } from '../journal/journal.service.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'
import { broadcastChange } from '../../common/events.js'
import type { CreateFeeStructureInput, CreateInvoiceInput, CreatePaymentInput } from './fees.schema.js'
import type { JournalLineInput } from '../journal/journal.schema.js'

export const feesService = {
  listStructures: () => feesRepository.findAllStructures(),

  async getStructureById(id: number) {
    const structure = await feesRepository.findStructureById(id)
    if (!structure) throw new NotFoundError(`Fee structure ${id} not found`)
    const items = await feesRepository.findStructureItems(id)
    return { ...structure, items }
  },

  createStructure: async (input: CreateFeeStructureInput) => {
    const { items, ...structure } = input
    const created = await feesRepository.createStructure(structure, items.map((item) => ({ ...item, amount: String(item.amount) })))
    broadcastChange('fees', 'structure_created')
    broadcastChange('dashboard', 'updated')
    return created
  },

  listInvoices: () => feesRepository.findAllInvoices(),

  async getInvoiceById(id: number) {
    const invoice = await feesRepository.findInvoiceById(id)
    if (!invoice) throw new NotFoundError(`Invoice ${id} not found`)
    const items = await feesRepository.findInvoiceItems(id)
    return { ...invoice, items }
  },

  listInvoicesByStudent: (studentId: number) => feesRepository.findInvoicesByStudent(studentId),

  async createInvoice(input: CreateInvoiceInput) {
    const structureItems = await feesRepository.findStructureItems(input.feeStructureId)
    if (structureItems.length === 0) throw new NotFoundError(`Fee structure ${input.feeStructureId} has no items`)

    const totalAmount = structureItems.reduce((sum, item) => sum + Number(item.amount), 0)

    const { invoice, items } = await feesRepository.createInvoice(
      {
        invoiceNo: `INV-${input.studentId}-${Date.now()}`,
        studentId: input.studentId,
        periodId: input.periodId,
        feeStructureId: input.feeStructureId,
        invoiceDate: input.invoiceDate,
        totalAmount: totalAmount.toFixed(2),
        status: 'open',
      },
      structureItems.map((item) => ({
        accountId: item.accountId,
        fundId: item.fundId,
        description: item.description,
        amount: item.amount,
      })),
    )

    const fundTotals = new Map<number, number>()
    for (const item of items) fundTotals.set(item.fundId, (fundTotals.get(item.fundId) ?? 0) + Number(item.amount))

    const lines: JournalLineInput[] = [
      ...[...fundTotals.entries()].map(([fundId, amount]) => ({ accountId: input.debtorsAccountId, fundId, debit: amount })),
      ...items.map((item) => ({ accountId: item.accountId, fundId: item.fundId, credit: Number(item.amount), description: item.description ?? undefined })),
    ]

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.invoiceDate,
      description: `Fee invoice ${invoice.invoiceNo}`,
      sourceModule: 'fees',
      sourceReference: `invoice-${invoice.id}`,
      createdBy: input.createdBy,
      lines,
    })

    const attached = await feesRepository.attachInvoiceJournalEntry(invoice.id, entry.id)
    broadcastChange('fees', 'invoice_created')
    broadcastChange('dashboard', 'updated')
    return attached
  },

  async recordPayment(input: CreatePaymentInput) {
    const invoice = await feesRepository.findInvoiceById(input.invoiceId)
    if (!invoice) throw new NotFoundError(`Invoice ${input.invoiceId} not found`)
    if (invoice.status === 'paid') throw new ConflictError(`Invoice ${input.invoiceId} is already fully paid`)

    const items = await feesRepository.findInvoiceItems(input.invoiceId)
    let remaining = Number(input.amount)
    const allocations: { invoiceItemId: number; fundId: number; amount: number }[] = []

    for (const item of items) {
      if (remaining <= 0) break
      const alreadyAllocated = await feesRepository.allocatedForItem(item.id)
      const outstanding = Number(item.amount) - alreadyAllocated
      if (outstanding <= 0) continue
      const toAllocate = Math.min(outstanding, remaining)
      allocations.push({ invoiceItemId: item.id, fundId: item.fundId, amount: toAllocate })
      remaining -= toAllocate
    }

    if (allocations.length === 0) throw new ValidationError('Invoice has no outstanding balance to allocate this payment against')

    const payment = await feesRepository.createPayment({
      receiptNo: `RCT-${input.studentId}-${Date.now()}`,
      studentId: input.studentId,
      paymentDate: input.paymentDate,
      amount: String(input.amount),
      paymentMethod: input.paymentMethod,
      referenceNo: input.referenceNo,
      receivedBy: input.receivedBy,
    })

    await feesRepository.createAllocations(
      allocations.map((a) => ({ paymentId: payment.id, invoiceItemId: a.invoiceItemId, amountAllocated: a.amount.toFixed(2) })),
    )

    const fundTotals = new Map<number, number>()
    for (const a of allocations) fundTotals.set(a.fundId, (fundTotals.get(a.fundId) ?? 0) + a.amount)

    const lines: JournalLineInput[] = [...fundTotals.entries()].flatMap(([fundId, amount]) => [
      { accountId: input.cashAccountId, fundId, debit: amount },
      { accountId: input.debtorsAccountId, fundId, credit: amount },
    ])

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.paymentDate,
      description: `Fee payment - receipt ${payment.receiptNo}`,
      sourceModule: 'fees',
      sourceReference: `payment-${payment.id}`,
      createdBy: input.receivedBy,
      lines,
    })

    const totalAllocatedSoFar = await Promise.all(items.map((item) => feesRepository.allocatedForItem(item.id))).then((amounts) =>
      amounts.reduce((sum, a) => sum + a, 0),
    )
    const newStatus = totalAllocatedSoFar >= Number(invoice.totalAmount) ? 'paid' : 'partially_paid'
    await feesRepository.updateInvoiceStatus(invoice.id, newStatus)

    const attachedPayment = await feesRepository.attachPaymentJournalEntry(payment.id, entry.id)
    broadcastChange('fees', 'payment_recorded')
    broadcastChange('dashboard', 'updated')
    return attachedPayment
  },

  listPaymentsByStudent: (studentId: number) => feesRepository.findPaymentsByStudent(studentId),
}
