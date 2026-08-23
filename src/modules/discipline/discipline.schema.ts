import { z } from 'zod'

export const createDisciplineRecordSchema = z.object({
  studentId: z.number().int().positive(),
  incidentDate: z.string().date(),
  description: z.string().min(1),
  actionTaken: z.string().optional(),
  severity: z.enum(['minor', 'moderate', 'major']).default('minor'),
  recordedBy: z.number().int().positive(),
})

export type CreateDisciplineRecordInput = z.infer<typeof createDisciplineRecordSchema>
