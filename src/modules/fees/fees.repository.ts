import { eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  feeInvoiceItems,
  feeInvoices,
  feePaymentAllocations,
  feePayments,
  feeStructureItems,
  feeStructures,
} from '../../db/schema/index.js'
import type { NewFeeInvoice, NewFeeInvoiceItem, NewFeePayment, NewFeePaymentAllocation, NewFeeStructure } from './fees.types.js'

export const feesRepository = {
  findAllStructures: () => db.select().from(feeStructures),
  findStructureById: (id: number) =>
    db.select().from(feeStructures).where(eq(feeStructures.id, id)).then((rows) => rows[0]),
  findStructureItems: (feeStructureId: number) =>
    db.select().from(feeStructureItems).where(eq(feeStructureItems.feeStructureId, feeStructureId)),

  async createStructure(data: NewFeeStructure, items: Omit<NewFeeInvoiceItem, 'invoiceId'>[]) {
    return db.transaction(async (tx) => {
      const [structure] = await tx.insert(feeStructures).values(data).returning()
      await tx.insert(feeStructureItems).values(items.map((item) => ({ ...item, feeStructureId: structure.id })))
      return structure
    })
  },

  findAllInvoices: () => db.select().from(feeInvoices),
  findInvoiceById: (id: number) =>
    db.select().from(feeInvoices).where(eq(feeInvoices.id, id)).then((rows) => rows[0]),
  findInvoicesByStudent: (studentId: number) => db.select().from(feeInvoices).where(eq(feeInvoices.studentId, studentId)),
  findInvoiceItems: (invoiceId: number) =>
    db.select().from(feeInvoiceItems).where(eq(feeInvoiceItems.invoiceId, invoiceId)),

  async createInvoice(data: NewFeeInvoice, items: Omit<NewFeeInvoiceItem, 'invoiceId'>[]) {
    return db.transaction(async (tx) => {
      const [invoice] = await tx.insert(feeInvoices).values(data).returning()
      const insertedItems = await tx
        .insert(feeInvoiceItems)
        .values(items.map((item) => ({ ...item, invoiceId: invoice.id })))
        .returning()
      return { invoice, items: insertedItems }
    })
  },

  attachInvoiceJournalEntry: (id: number, journalEntryId: number) =>
    db.update(feeInvoices).set({ journalEntryId }).where(eq(feeInvoices.id, id)).returning().then((rows) => rows[0]),

  updateInvoiceStatus: (id: number, status: 'open' | 'partially_paid' | 'paid') =>
    db.update(feeInvoices).set({ status }).where(eq(feeInvoices.id, id)).returning().then((rows) => rows[0]),

  async allocatedForItem(invoiceItemId: number) {
    const [row] = await db
      .select({ total: sql<string>`coalesce(sum(${feePaymentAllocations.amountAllocated}), 0)` })
      .from(feePaymentAllocations)
      .where(eq(feePaymentAllocations.invoiceItemId, invoiceItemId))
    return Number(row?.total ?? 0)
  },

  createPayment: (data: NewFeePayment) =>
    db.insert(feePayments).values(data).returning().then((rows) => rows[0]),

  attachPaymentJournalEntry: (id: number, journalEntryId: number) =>
    db.update(feePayments).set({ journalEntryId }).where(eq(feePayments.id, id)).returning().then((rows) => rows[0]),

  createAllocations: (allocations: NewFeePaymentAllocation[]) =>
    db.insert(feePaymentAllocations).values(allocations).returning(),

  findPaymentsByStudent: (studentId: number) => db.select().from(feePayments).where(eq(feePayments.studentId, studentId)),
}
