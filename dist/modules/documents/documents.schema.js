import { z } from 'zod';
export const createTemplateSchema = z.object({
    code: z.string().min(1).max(60),
    documentType: z.enum(['leaving_certificate', 'transcript', 'admission_letter', 'fee_clearance_letter', 'conduct_certificate', 'custom_letter']),
    bodyTemplate: z.string().min(1),
    isActive: z.boolean().default(true),
});
export const renderLetterSchema = z.object({
    templateCode: z.string().min(1),
    studentId: z.number().int().positive().optional(),
    templateData: z.record(z.string(), z.string()).default({}),
    issuedBy: z.number().int().positive(),
});
export const generateTranscriptSchema = z.object({
    studentId: z.number().int().positive(),
    issuedBy: z.number().int().positive(),
});
export const generateFeeClearanceSchema = z.object({
    studentId: z.number().int().positive(),
    issuedBy: z.number().int().positive(),
});
