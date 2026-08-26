import { z } from 'zod'

export const createDormitorySchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['boys', 'girls', 'mixed']),
  capacity: z.number().int().positive(),
  wardenStaffId: z.number().int().positive().optional(),
})

export const allocateBedSchema = z.object({
  studentId: z.number().int().positive(),
  dormitoryId: z.number().int().positive(),
  bedNumber: z.string().min(1).max(20),
  periodId: z.number().int().positive(),
  allocatedDate: z.string().date(),
})

export const vacateBedSchema = z.object({
  vacatedDate: z.string().date(),
})

export const markBoardingAttendanceSchema = z.object({
  studentId: z.number().int().positive(),
  attendanceDate: z.string().date(),
  status: z.enum(['present', 'absent', 'on_leave']),
  remarks: z.string().optional(),
  recordedBy: z.number().int().positive(),
})

export const bulkMarkBoardingAttendanceSchema = z.object({
  records: z.array(markBoardingAttendanceSchema).min(1),
})

export type CreateDormitoryInput = z.infer<typeof createDormitorySchema>
export type AllocateBedInput = z.infer<typeof allocateBedSchema>
export type VacateBedInput = z.infer<typeof vacateBedSchema>
export type MarkBoardingAttendanceInput = z.infer<typeof markBoardingAttendanceSchema>
export type BulkMarkBoardingAttendanceInput = z.infer<typeof bulkMarkBoardingAttendanceSchema>
