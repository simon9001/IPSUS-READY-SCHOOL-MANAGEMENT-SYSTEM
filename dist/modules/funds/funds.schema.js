import { z } from 'zod';
export const createFundSchema = z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(150),
    restrictionType: z.enum(['unrestricted', 'restricted']).default('unrestricted'),
    restrictionNotes: z.string().optional(),
});
export const updateFundSchema = createFundSchema.partial();
