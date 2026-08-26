import { z } from 'zod'

export const gradingBandSchema = z.object({
  minMarks: z.union([z.string(), z.number()]),
  maxMarks: z.union([z.string(), z.number()]),
  grade: z.string().min(1).max(30),
  points: z.union([z.string(), z.number()]).optional(),
})

export const createGradingScaleSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
  bands: z.array(gradingBandSchema).min(1),
})

export const createExamSchema = z.object({
  name: z.string().min(1).max(150),
  periodId: z.number().int().positive(),
  classId: z.number().int().positive(),
  gradingScaleId: z.number().int().positive(),
  examDate: z.string().date(),
})

export const recordExamResultSchema = z.object({
  examId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  marks: z.union([z.string(), z.number()]),
  maxMarks: z.union([z.string(), z.number()]).default(100),
  remarks: z.string().optional(),
  enteredBy: z.number().int().positive(),
})

export const bulkRecordExamResultsSchema = z.object({
  results: z.array(recordExamResultSchema).min(1),
})

export const addExamTimetableEntrySchema = z.object({
  examId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  examDate: z.string().date(),
  startTime: z.string().min(1).max(10),
  endTime: z.string().min(1).max(10),
  venue: z.string().max(100).optional(),
})

export type CreateGradingScaleInput = z.infer<typeof createGradingScaleSchema>
export type CreateExamInput = z.infer<typeof createExamSchema>
export type RecordExamResultInput = z.infer<typeof recordExamResultSchema>
export type BulkRecordExamResultsInput = z.infer<typeof bulkRecordExamResultsSchema>
export type AddExamTimetableEntryInput = z.infer<typeof addExamTimetableEntrySchema>
