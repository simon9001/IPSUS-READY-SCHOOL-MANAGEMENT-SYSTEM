import { z } from 'zod';
export const createBookSchema = z.object({
    isbn: z.string().max(20).optional(),
    title: z.string().min(1).max(200),
    author: z.string().max(150).optional(),
    category: z.string().max(60).optional(),
    totalCopies: z.number().int().positive().default(1),
});
export const borrowBookSchema = z.object({
    bookId: z.number().int().positive(),
    studentId: z.number().int().positive(),
    borrowedDate: z.string().date(),
    dueDate: z.string().date(),
    issuedBy: z.number().int().positive(),
});
export const returnBookSchema = z.object({
    returnedDate: z.string().date(),
    returnedTo: z.number().int().positive(),
    lost: z.boolean().default(false),
});
export const payFineSchema = z.object({
    paidTo: z.number().int().positive(),
});
