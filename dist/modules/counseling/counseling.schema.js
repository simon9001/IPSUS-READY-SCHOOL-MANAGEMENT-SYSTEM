import { z } from 'zod';
export const createCounselingSessionSchema = z.object({
    studentId: z.number().int().positive(),
    counselorId: z.number().int().positive(),
    sessionDate: z.string().date(),
    category: z.enum(['academic', 'behavioral', 'family', 'emotional', 'career', 'other']).optional(),
    notes: z.string().optional(),
    followUpRequired: z.boolean().default(false),
    followUpDate: z.string().date().optional(),
});
