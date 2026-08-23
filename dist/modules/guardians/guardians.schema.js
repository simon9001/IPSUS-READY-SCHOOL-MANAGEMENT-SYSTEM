import { z } from 'zod';
export const linkGuardianSchema = z.object({
    userId: z.number().int().positive(),
    studentId: z.number().int().positive(),
    relationship: z.enum(['father', 'mother', 'guardian']),
    isPrimary: z.boolean().default(false),
});
