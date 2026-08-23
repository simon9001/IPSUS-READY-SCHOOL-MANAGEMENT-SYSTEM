import { z } from 'zod';
export const createTeacherSchema = z.object({
    staffNo: z.string().min(1).max(30),
    fullName: z.string().min(1).max(150),
    tscNumber: z.string().max(30).optional(),
    employeeId: z.number().int().positive().optional(),
    email: z.string().email().max(150).optional(),
    phone: z.string().max(30).optional(),
});
export const updateTeacherSchema = createTeacherSchema.partial().extend({
    status: z.enum(['active', 'on_leave', 'left']).optional(),
});
