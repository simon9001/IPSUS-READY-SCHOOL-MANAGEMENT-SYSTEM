import { z } from 'zod';
export const createGrantTypeSchema = z.object({
    name: z.string().min(1).max(150),
    fundId: z.number().int().positive(),
    revenueAccountId: z.number().int().positive(),
    conditionsDescription: z.string().optional(),
});
export const recordDisbursementSchema = z.object({
    grantTypeId: z.number().int().positive(),
    periodId: z.number().int().positive(),
    cashAccountId: z.number().int().positive(),
    expectedAmount: z.union([z.string(), z.number()]).optional(),
    amountReceived: z.union([z.string(), z.number()]),
    dateReceived: z.string().date(),
    conditionsMet: z.boolean().default(false),
    notes: z.string().optional(),
    recordedBy: z.number().int().positive(),
});
