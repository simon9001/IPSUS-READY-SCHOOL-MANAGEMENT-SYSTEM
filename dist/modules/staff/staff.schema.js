import { z } from 'zod';
export const createStaffSchema = z.object({
    staffNo: z.string().min(1).max(30),
    fullName: z.string().min(1).max(150),
    category: z.enum(['teaching', 'non_teaching']),
    employmentBody: z.enum(['tsc', 'bom']),
    employeeId: z.number().int().positive().optional(),
    teacherId: z.number().int().positive().optional(),
    idNumber: z.string().max(20).optional(),
    phone: z.string().max(30).optional(),
    email: z.string().email().max(150).optional(),
    dateOfBirth: z.string().date().optional(),
    employmentDate: z.string().date(),
});
export const updateStaffSchema = createStaffSchema.partial().extend({
    status: z.enum(['active', 'on_leave', 'suspended', 'left']).optional(),
});
