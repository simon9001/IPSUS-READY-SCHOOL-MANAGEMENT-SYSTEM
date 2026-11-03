import { z } from 'zod'
import { zAmount } from '../../common/validate.js'

export const createAppraisalSchema = z.object({
  staffId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  appraiserId: z.number().int().positive(),
  overallRating: zAmount.optional(),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  goals: z.string().optional(),
  appraisalDate: z.string().date(),
  status: z.enum(['draft', 'completed']).default('draft'),
})

export const updateAppraisalSchema = createAppraisalSchema.partial().omit({ staffId: true, periodId: true, appraiserId: true })

export type CreateAppraisalInput = z.infer<typeof createAppraisalSchema>
export type UpdateAppraisalInput = z.infer<typeof updateAppraisalSchema>
