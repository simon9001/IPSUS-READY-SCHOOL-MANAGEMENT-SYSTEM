import { z } from 'zod';
export const accountTypeSchema = z.enum(['asset', 'liability', 'net_assets', 'revenue', 'expense']);
export const normalBalanceSchema = z.enum(['debit', 'credit']);
export const createAccountSchema = z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(150),
    type: accountTypeSchema,
    normalBalance: normalBalanceSchema,
    parentId: z.number().int().positive().optional(),
    description: z.string().optional(),
});
export const updateAccountSchema = createAccountSchema.partial();
export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
