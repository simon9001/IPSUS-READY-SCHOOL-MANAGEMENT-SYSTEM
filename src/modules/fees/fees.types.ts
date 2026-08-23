import type {
  feeStructures,
  feeStructureItems,
  feeInvoices,
  feeInvoiceItems,
  feePayments,
  feePaymentAllocations,
} from '../../db/schema/index.js'

export type FeeStructure = typeof feeStructures.$inferSelect
export type NewFeeStructure = typeof feeStructures.$inferInsert
export type FeeStructureItem = typeof feeStructureItems.$inferSelect
export type NewFeeStructureItem = typeof feeStructureItems.$inferInsert
export type FeeInvoice = typeof feeInvoices.$inferSelect
export type NewFeeInvoice = typeof feeInvoices.$inferInsert
export type FeeInvoiceItem = typeof feeInvoiceItems.$inferSelect
export type NewFeeInvoiceItem = typeof feeInvoiceItems.$inferInsert
export type FeePayment = typeof feePayments.$inferSelect
export type NewFeePayment = typeof feePayments.$inferInsert
export type FeePaymentAllocation = typeof feePaymentAllocations.$inferSelect
export type NewFeePaymentAllocation = typeof feePaymentAllocations.$inferInsert
