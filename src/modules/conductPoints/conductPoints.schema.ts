import { z } from 'zod'

export const createRuleSchema = z.object({
  code: z.string().min(1).max(30),
  description: z.string().min(1).max(200),
  points: z.number().int(), // positive = merit, negative = demerit
})

export const awardPointsSchema = z
  .object({
    studentId: z.number().int().positive(),
    periodId: z.number().int().positive(),
    ruleId: z.number().int().positive().optional(),
    points: z.number().int().optional(), // required if ruleId not given
    reason: z.string().optional(),
    disciplineRecordId: z.number().int().positive().optional(),
    awardedBy: z.number().int().positive(),
  })
  .refine((v) => v.ruleId !== undefined || v.points !== undefined, {
    message: 'Either ruleId or points must be provided',
  })

export type CreateRuleInput = z.infer<typeof createRuleSchema>
export type AwardPointsInput = z.infer<typeof awardPointsSchema>
