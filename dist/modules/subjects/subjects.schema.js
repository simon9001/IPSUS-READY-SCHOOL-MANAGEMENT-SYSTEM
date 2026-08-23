import { z } from 'zod';
export const createSubjectSchema = z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    isCompulsory: z.boolean().default(true),
});
export const offerSubjectToClassSchema = z.object({
    classId: z.number().int().positive(),
    subjectId: z.number().int().positive(),
});
export const assignTeacherSchema = z.object({
    teacherId: z.number().int().positive(),
    subjectId: z.number().int().positive(),
    classId: z.number().int().positive(),
    streamId: z.number().int().positive().optional(),
    periodId: z.number().int().positive(),
});
