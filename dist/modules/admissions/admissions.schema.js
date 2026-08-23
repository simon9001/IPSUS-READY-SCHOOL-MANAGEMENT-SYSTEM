import { z } from 'zod';
const applicantBioSchema = z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    otherNames: z.string().max(80).optional(),
    gender: z.string().max(10).optional(),
    dateOfBirth: z.string().date().optional(),
    guardianName: z.string().max(150).optional(),
    guardianPhone: z.string().max(30).optional(),
    guardianEmail: z.string().email().max(150).optional(),
    targetClassId: z.number().int().positive(),
    boardingStatus: z.enum(['day', 'boarder']).default('day'),
    recordedBy: z.number().int().positive(),
});
// Government JSS/Senior School placement — no interview, decided already.
export const capturePlacementSchema = applicantBioSchema.extend({
    nemisUpi: z.string().min(1).max(30),
    placementLetterRef: z.string().min(1).max(60),
    kcpeKpseaIndexNo: z.string().max(30).optional(),
    previousInstitutionCode: z.string().max(30).optional(),
});
// Inter-school transfer — also no interview, continuity via NEMIS UPI.
export const captureTransferSchema = applicantBioSchema.extend({
    nemisUpi: z.string().min(1).max(30),
    previousSchoolName: z.string().min(1).max(150),
    previousSchoolCode: z.string().max(30).optional(),
    transferReason: z.string().optional(),
    transferCertificateRef: z.string().max(60).optional(),
});
// Direct/local admission — the only pathway that goes through interview.
export const applyDirectSchema = applicantBioSchema;
export const scheduleInterviewSchema = z.object({
    interviewDate: z.string().date(),
    interviewerId: z.number().int().positive(),
});
export const recordInterviewResultSchema = z.object({
    interviewScore: z.union([z.string(), z.number()]).optional(),
    interviewNotes: z.string().optional(),
});
export const decideAdmissionSchema = z
    .object({
    decision: z.enum(['admitted', 'waitlisted', 'rejected']),
    decidedBy: z.number().int().positive(),
    rejectionReason: z.string().optional(),
})
    .refine((v) => v.decision !== 'rejected' || !!v.rejectionReason, {
    message: 'rejectionReason is required when decision is "rejected"',
});
export const enrollAdmissionSchema = z.object({
    admissionNo: z.string().min(1).max(30),
    admissionDate: z.string().date(),
    streamId: z.number().int().positive().optional(),
});
