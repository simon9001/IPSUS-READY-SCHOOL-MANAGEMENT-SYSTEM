import { z } from 'zod'

export const createAssetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  defaultUsefulLifeYears: z.number().int().positive(),
  depreciationMethod: z.enum(['straight_line', 'reducing_balance']).default('straight_line'),
  assetAccountId: z.number().int().positive(),
  depreciationExpenseAccountId: z.number().int().positive(),
  accumulatedDepreciationAccountId: z.number().int().positive(),
})

export const acquireAssetSchema = z.object({
  assetTag: z.string().min(1).max(30),
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  acquisitionDate: z.string().date(),
  acquisitionCost: z.union([z.string(), z.number()]),
  fundId: z.number().int().positive(),
  location: z.string().optional(),
  periodId: z.number().int().positive(),
  creditAccountId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
})

export const runDepreciationSchema = z.object({
  periodId: z.number().int().positive(),
  asOfDate: z.string().date(),
  createdBy: z.number().int().positive(),
})

export const disposeAssetSchema = z.object({
  disposalDate: z.string().date(),
  periodId: z.number().int().positive(),
  proceeds: z.union([z.string(), z.number()]).default(0),
  cashAccountId: z.number().int().positive(),
  gainLossAccountId: z.number().int().positive(),
  recordedBy: z.number().int().positive(),
})

export type CreateAssetCategoryInput = z.infer<typeof createAssetCategorySchema>
export type AcquireAssetInput = z.infer<typeof acquireAssetSchema>
export type RunDepreciationInput = z.infer<typeof runDepreciationSchema>
export type DisposeAssetInput = z.infer<typeof disposeAssetSchema>
