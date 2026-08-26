import { z } from 'zod';
export const createRouteSchema = z.object({
    routeName: z.string().min(1).max(100),
    vehicleRegistration: z.string().max(30).optional(),
    driverName: z.string().max(150).optional(),
    driverPhone: z.string().max(30).optional(),
    capacity: z.number().int().positive().optional(),
    feeAmount: z.union([z.string(), z.number()]).optional(),
});
export const addStopSchema = z.object({
    routeId: z.number().int().positive(),
    stopName: z.string().min(1).max(150),
    stopOrder: z.number().int().nonnegative(),
    pickupTime: z.string().max(20).optional(),
});
export const allocateTransportSchema = z.object({
    studentId: z.number().int().positive(),
    routeId: z.number().int().positive(),
    stopId: z.number().int().positive().optional(),
    periodId: z.number().int().positive(),
    startDate: z.string().date(),
});
export const endAllocationSchema = z.object({
    endDate: z.string().date(),
});
