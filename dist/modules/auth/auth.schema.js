import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export const updateProfileSchema = z.object({
    fullName: z.string().min(1).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().nullable().optional(),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
});
