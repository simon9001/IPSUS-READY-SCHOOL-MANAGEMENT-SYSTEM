import { z } from 'zod';
export const recordPromotionSchema = z.object({
    studentId: z.number().int().positive(),
    fromClassId: z.number().int().positive(),
    toClassId: z.number().int().positive().optional(),
    academicYear: z.number().int(),
    outcome: z.enum(['promoted', 'repeated', 'transferred', 'graduated', 'withdrawn']),
    decisionDate: z.string().date(),
    notes: z.string().optional(),
    recordedBy: z.number().int().positive(),
});
