import { z } from 'zod';
export const createUserSchema = z.object({
    email: z.string().email().max(150),
    fullName: z.string().min(1).max(150),
    phone: z.string().max(30).optional(),
    password: z.string().min(8).max(200),
    roleIds: z.array(z.number().int().positive()).min(1, 'At least one role is required'),
});
export const updateUserSchema = z.object({
    fullName: z.string().min(1).max(150).optional(),
    phone: z.string().max(30).optional(),
    status: z.enum(['active', 'suspended', 'locked']).optional(),
});
export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8).max(200),
});
export const assignRoleSchema = z.object({
    roleId: z.number().int().positive(),
});
