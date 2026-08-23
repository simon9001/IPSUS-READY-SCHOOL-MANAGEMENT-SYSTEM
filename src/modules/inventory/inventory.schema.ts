import { z } from 'zod'

export const createItemSchema = z.object({
  itemCode: z.string().min(1).max(30),
  name: z.string().min(1).max(150),
  unit: z.string().min(1).max(20),
  category: z.string().max(60).optional(),
  reorderLevel: z.union([z.string(), z.number()]).optional(),
})

const movementBase = z.object({
  itemId: z.number().int().positive(),
  movementDate: z.string().date(),
  quantity: z.union([z.string(), z.number()]),
  unitCost: z.union([z.string(), z.number()]),
  reference: z.string().max(60).optional(),
  periodId: z.number().int().positive(),
  fundId: z.number().int().positive(),
  inventoryAccountId: z.number().int().positive(),
  recordedBy: z.number().int().positive(),
})

export const receiveStockSchema = movementBase.extend({
  creditAccountId: z.number().int().positive(),
})

export const issueStockSchema = movementBase.extend({
  expenseAccountId: z.number().int().positive(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type ReceiveStockInput = z.infer<typeof receiveStockSchema>
export type IssueStockInput = z.infer<typeof issueStockSchema>
