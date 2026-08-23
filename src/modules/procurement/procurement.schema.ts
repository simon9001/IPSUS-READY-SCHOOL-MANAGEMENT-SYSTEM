import { z } from 'zod'

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(150),
  kraPin: z.string().max(20).optional(),
  contactPerson: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(150).optional(),
  bankName: z.string().max(100).optional(),
  bankAccountNo: z.string().max(40).optional(),
})

export const requisitionItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.union([z.string(), z.number()]),
  estimatedUnitCost: z.union([z.string(), z.number()]).optional(),
  accountId: z.number().int().positive(),
})

export const createRequisitionSchema = z.object({
  requestedBy: z.number().int().positive(),
  department: z.string().max(80).optional(),
  requestDate: z.string().date(),
  items: z.array(requisitionItemSchema).min(1),
})

export const approveRequisitionSchema = z.object({
  approvedBy: z.number().int().positive(),
})

export const purchaseOrderItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.union([z.string(), z.number()]),
  unitCost: z.union([z.string(), z.number()]),
  accountId: z.number().int().positive(),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.number().int().positive(),
  requisitionId: z.number().int().positive().optional(),
  orderDate: z.string().date(),
  items: z.array(purchaseOrderItemSchema).min(1),
  approvedBy: z.number().int().positive().optional(),
})

export const grnItemSchema = z.object({
  purchaseOrderItemId: z.number().int().positive(),
  quantityReceived: z.union([z.string(), z.number()]),
  condition: z.string().max(100).optional(),
})

export const createGrnSchema = z.object({
  purchaseOrderId: z.number().int().positive(),
  receivedDate: z.string().date(),
  receivedBy: z.number().int().positive(),
  items: z.array(grnItemSchema).min(1),
})

export const createSupplierInvoiceSchema = z.object({
  invoiceNo: z.string().min(1).max(40),
  supplierId: z.number().int().positive(),
  purchaseOrderId: z.number().int().positive().optional(),
  grnId: z.number().int().positive().optional(),
  invoiceDate: z.string().date(),
  dueDate: z.string().date().optional(),
  fundId: z.number().int().positive(),
  creditorsAccountId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  lines: z
    .array(
      z.object({
        accountId: z.number().int().positive(),
        amount: z.union([z.string(), z.number()]),
        description: z.string().optional(),
      }),
    )
    .min(1),
})

export const createSupplierPaymentSchema = z.object({
  supplierInvoiceId: z.number().int().positive(),
  paymentDate: z.string().date(),
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z.enum(['bank', 'cheque', 'mpesa']),
  referenceNo: z.string().max(60).optional(),
  fundId: z.number().int().positive(),
  cashAccountId: z.number().int().positive(),
  creditorsAccountId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  paidBy: z.number().int().positive(),
  approvedBy: z.number().int().positive().optional(),
})

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>
export type ApproveRequisitionInput = z.infer<typeof approveRequisitionSchema>
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>
export type CreateGrnInput = z.infer<typeof createGrnSchema>
export type CreateSupplierInvoiceInput = z.infer<typeof createSupplierInvoiceSchema>
export type CreateSupplierPaymentInput = z.infer<typeof createSupplierPaymentSchema>
