import { z } from 'zod';
export const budgetLineSchema = z.object({
    accountId: z.number().int().positive(),
    fundId: z.number().int().positive(),
    periodId: z.number().int().positive().optional(),
    amount: z.union([z.string(), z.number()]),
});
export const createBudgetSchema = z.object({
    fiscalYear: z.number().int(),
    name: z.string().min(1).max(150),
    createdBy: z.number().int().positive(),
    lines: z.array(budgetLineSchema).min(1),
});
export const approveBudgetSchema = z.object({
    approvedBy: z.number().int().positive(),
});
export const addBudgetLineSchema = budgetLineSchema;
