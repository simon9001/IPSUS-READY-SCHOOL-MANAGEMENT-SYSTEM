import { z } from 'zod'

export const markAttendanceSchema = z.object({
  studentId: z.number().int().positive(),
  attendanceDate: z.string().date(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().optional(),
  recordedBy: z.number().int().positive(),
})

export const bulkMarkAttendanceSchema = z.object({
  records: z.array(markAttendanceSchema).min(1),
})

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>
export type BulkMarkAttendanceInput = z.infer<typeof bulkMarkAttendanceSchema>
