import { z } from 'zod'

export const createClassSchema = z.object({
  name: z.string().min(1).max(40),
  level: z.number().int().positive(),
})

export const createStreamSchema = z.object({
  classId: z.number().int().positive(),
  name: z.string().min(1).max(40),
})

export const createStudentSchema = z.object({
  admissionNo: z.string().min(1).max(30),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  otherNames: z.string().max(80).optional(),
  gender: z.string().max(10).optional(),
  dateOfBirth: z.string().date().optional(),
  classId: z.number().int().positive(),
  streamId: z.number().int().positive().optional(),
  boardingStatus: z.enum(['day', 'boarder']).default('day'),
  guardianName: z.string().max(150).optional(),
  guardianPhone: z.string().max(30).optional(),
  guardianEmail: z.string().email().max(150).optional(),
  admissionDate: z.string().date(),
})

export const updateStudentSchema = createStudentSchema.partial()

export type CreateClassInput = z.infer<typeof createClassSchema>
export type CreateStreamInput = z.infer<typeof createStreamSchema>
export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
