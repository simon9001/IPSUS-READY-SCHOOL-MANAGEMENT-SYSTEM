import { z } from 'zod';
export const openCaseSchema = z.object({
    studentId: z.number().int().positive(),
    disciplineRecordId: z.number().int().positive().optional(),
    caseType: z.enum(['suspension', 'expulsion']),
    openedBy: z.number().int().positive(),
});
export const summonParentSchema = z.object({
    summonsDate: z.string().date(),
});
export const recordParentAttendanceSchema = z.object({
    attended: z.boolean(),
});
export const recordHearingSchema = z.object({
    hearingDate: z.string().date(),
    hearingPanel: z.string().optional(),
    hearingNotes: z.string().optional(),
});
export const bomReviewSchema = z.object({
    bomReviewDate: z.string().date(),
    bomDecisionNotes: z.string().optional(),
});
export const decideCaseSchema = z
    .object({
    decision: z.enum(['suspended', 'expelled', 'dismissed']),
    decidedBy: z.number().int().positive(),
    suspensionStartDate: z.string().date().optional(),
    suspensionEndDate: z.string().date().optional(),
})
    .refine((v) => v.decision !== 'suspended' || (v.suspensionStartDate && v.suspensionEndDate), {
    message: 'suspensionStartDate and suspensionEndDate are required when decision is "suspended"',
});
export const reinstateCaseSchema = z.object({
    reinstatedBy: z.number().int().positive(),
});
