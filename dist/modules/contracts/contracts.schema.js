import { z } from 'zod';
export const createContractSchema = z.object({
    staffId: z.number().int().positive(),
    contractType: z.enum(['permanent', 'fixed_term', 'probation']),
    startDate: z.string().date(),
    endDate: z.string().date().optional(),
    terms: z.string().optional(),
    documentRef: z.string().max(150).optional(),
});
export const updateContractStatusSchema = z.object({
    status: z.enum(['active', 'expired', 'terminated']),
});
