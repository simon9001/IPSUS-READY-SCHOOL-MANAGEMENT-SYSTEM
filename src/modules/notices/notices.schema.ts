import { z } from 'zod'

export const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  audience: z.enum(['all', 'parents', 'staff', 'class']).default('all'),
  classId: z.number().int().positive().optional(),
  publishedBy: z.number().int().positive(),
  publishNow: z.boolean().default(false),
  expiresAt: z.string().date().optional(),
})

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
