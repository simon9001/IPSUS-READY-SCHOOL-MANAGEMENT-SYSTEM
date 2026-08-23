import { z } from 'zod';
export const journalLineSchema = z.object({
    accountId: z.number().int().positive(),
    fundId: z.number().int().positive(),
    debit: z.union([z.string(), z.number()]).optional(),
    credit: z.union([z.string(), z.number()]).optional(),
    description: z.string().optional(),
});
export const createJournalEntrySchema = z.object({
    periodId: z.number().int().positive(),
    entryDate: z.string().date(),
    description: z.string().min(1),
    sourceModule: z.string().min(1).max(40),
    sourceReference: z.string().max(60).optional(),
    createdBy: z.number().int().positive(),
    lines: z.array(journalLineSchema).min(2),
});
export const approveJournalEntrySchema = z.object({
    approverId: z.number().int().positive(),
});
export const rejectJournalEntrySchema = z.object({
    approverId: z.number().int().positive(),
    reason: z.string().min(1),
});
export const trialBalanceQuerySchema = z.object({
    asOfDate: z.string().date().optional(),
    fundId: z.coerce.number().int().positive().optional(),
});
