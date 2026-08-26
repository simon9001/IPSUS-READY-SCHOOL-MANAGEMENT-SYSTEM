import { z } from 'zod'

export const createLessonPeriodSchema = z.object({
  name: z.string().min(1).max(40),
  startTime: z.string().min(1).max(10),
  endTime: z.string().min(1).max(10),
  sortOrder: z.number().int(),
})

const dayOfWeek = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])

export const createTimetableEntrySchema = z.object({
  classId: z.number().int().positive(),
  streamId: z.number().int().positive().optional(),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
  lessonPeriodId: z.number().int().positive(),
  dayOfWeek,
  periodId: z.number().int().positive(),
})

export type CreateLessonPeriodInput = z.infer<typeof createLessonPeriodSchema>
export type CreateTimetableEntryInput = z.infer<typeof createTimetableEntrySchema>
