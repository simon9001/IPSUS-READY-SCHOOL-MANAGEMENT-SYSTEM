import { z } from 'zod'

export const feeStructureItemSchema = z.object({
  accountId: z.number().int().positive(),
  fundId: z.number().int().positive(),
  description: z.string().min(1).max(150),
  amount: z.union([z.string(), z.number()]),
})

export const createFeeStructureSchema = z.object({
  fiscalYear: z.number().int(),
  periodId: z.number().int().positive(),
  classId: z.number().int().positive(),
  boardingStatus: z.enum(['day', 'boarder']),
  items: z.array(feeStructureItemSchema).min(1),
})

export const createInvoiceSchema = z.object({
  studentId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  feeStructureId: z.number().int().positive(),
  invoiceDate: z.string().date(),
  debtorsAccountId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
})

export const createPaymentSchema = z.object({
  studentId: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  paymentDate: z.string().date(),
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z.enum(['cash', 'bank', 'mpesa', 'cheque']),
  referenceNo: z.string().max(60).optional(),
  cashAccountId: z.number().int().positive(),
  debtorsAccountId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  receivedBy: z.number().int().positive(),
})

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
