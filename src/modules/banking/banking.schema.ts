import { z } from 'zod'

export const createBankAccountSchema = z.object({
  accountId: z.number().int().positive(),
  fundId: z.number().int().positive().optional(),
  bankName: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(40),
  branch: z.string().max(100).optional(),
})

export const reconciliationItemSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.union([z.string(), z.number()]),
  itemType: z.enum(['outstanding_cheque', 'deposit_in_transit', 'bank_charge', 'other']),
})

export const createReconciliationSchema = z.object({
  bankAccountId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  statementDate: z.string().date(),
  statementBalance: z.union([z.string(), z.number()]),
  bookBalance: z.union([z.string(), z.number()]),
  items: z.array(reconciliationItemSchema).default([]),
})

export const reconcileSchema = z.object({
  reconciledBy: z.number().int().positive(),
})

export const issueImprestSchema = z.object({
  requestedBy: z.number().int().positive(),
  purpose: z.string().min(1),
  amountRequested: z.union([z.string(), z.number()]),
  dateIssued: z.string().date(),
  periodId: z.number().int().positive(),
  fundId: z.number().int().positive(),
  cashAccountId: z.number().int().positive(),
  imprestControlAccountId: z.number().int().positive(),
})

export const retireImprestSchema = z.object({
  retirementDate: z.string().date(),
  periodId: z.number().int().positive(),
  fundId: z.number().int().positive(),
  imprestControlAccountId: z.number().int().positive(),
  cashAccountId: z.number().int().positive().optional(),
  receiptsAttached: z.boolean().default(false),
  balanceReturned: z.union([z.string(), z.number()]).default(0),
  expenseLines: z
    .array(
      z.object({
        accountId: z.number().int().positive(),
        amount: z.union([z.string(), z.number()]),
        description: z.string().optional(),
      }),
    )
    .min(1),
  recordedBy: z.number().int().positive(),
})

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>
export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>
export type ReconcileInput = z.infer<typeof reconcileSchema>
export type IssueImprestInput = z.infer<typeof issueImprestSchema>
export type RetireImprestInput = z.infer<typeof retireImprestSchema>
