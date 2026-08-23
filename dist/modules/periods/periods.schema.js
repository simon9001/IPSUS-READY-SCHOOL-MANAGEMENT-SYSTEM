import { z } from 'zod';
export const createPeriodSchema = z.object({
    name: z.string().min(1).max(60),
    fiscalYear: z.number().int(),
    term: z.number().int().min(1).max(3).optional(),
    startDate: z.string().date(),
    endDate: z.string().date(),
});
export const updatePeriodSchema = createPeriodSchema.partial();
