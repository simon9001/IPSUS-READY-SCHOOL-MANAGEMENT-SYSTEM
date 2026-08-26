import { z } from 'zod'

export const generateReportSchema = z.object({
  reportType: z.enum(['nemis_enrollment', 'tsc_staffing', 'moe_capitation']),
  periodId: z.number().int().positive(),
  generatedBy: z.number().int().positive(),
})

export const submitReportSchema = z.object({
  referenceNumber: z.string().min(1).max(60),
  submittedBy: z.number().int().positive(),
})

export type GenerateReportInput = z.infer<typeof generateReportSchema>
export type SubmitReportInput = z.infer<typeof submitReportSchema>
