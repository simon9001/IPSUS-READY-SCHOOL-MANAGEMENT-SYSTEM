import { z } from 'zod';
export const createMedicalConditionSchema = z.object({
    studentId: z.number().int().positive(),
    condition: z.string().min(1).max(150),
    severity: z.enum(['mild', 'moderate', 'severe']).default('mild'),
    diagnosedDate: z.string().date().optional(),
    notes: z.string().optional(),
    recordedBy: z.number().int().positive(),
});
export const createClinicVisitSchema = z.object({
    studentId: z.number().int().positive(),
    visitDate: z.string().date(),
    presentingComplaint: z.string().min(1),
    diagnosis: z.string().optional(),
    treatmentGiven: z.string().optional(),
    referredToHospital: z.boolean().default(false),
    referralNotes: z.string().optional(),
    attendedBy: z.number().int().positive(),
});
export const recordMedicationSchema = z.object({
    studentId: z.number().int().positive(),
    clinicVisitId: z.number().int().positive().optional(),
    medicalConditionId: z.number().int().positive().optional(),
    medicationName: z.string().min(1).max(150),
    dosage: z.string().max(100).optional(),
    administeredBy: z.number().int().positive(),
    notes: z.string().optional(),
});
