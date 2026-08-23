import { z } from 'zod';
export const createStaffDisciplineRecordSchema = z.object({
    staffId: z.number().int().positive(),
    incidentDate: z.string().date(),
    description: z.string().min(1),
    actionTaken: z.string().optional(),
    severity: z.enum(['verbal_warning', 'written_warning', 'suspension', 'termination']),
    recordedBy: z.number().int().positive(),
});
