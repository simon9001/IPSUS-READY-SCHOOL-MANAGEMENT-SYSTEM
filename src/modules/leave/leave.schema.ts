import { z } from 'zod'

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  defaultDaysPerYear: z.number().int().positive(),
})

export const createLeaveRequestSchema = z.object({
  staffId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().optional(),
  recordedBy: z.number().int().positive(),
})

export const decideLeaveRequestSchema = z.object({
  approverId: z.number().int().positive(),
  reason: z.string().optional(), // required in practice for rejections, enforced in service
})

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>
export type DecideLeaveRequestInput = z.infer<typeof decideLeaveRequestSchema>
