import { pgTable, serial, varchar, integer, date, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { fiscalPeriods } from './periods.js';
export const routeStatusEnum = pgEnum('route_status', ['active', 'inactive']);
export const busRoutes = pgTable('bus_routes', {
    id: serial('id').primaryKey(),
    routeName: varchar('route_name', { length: 100 }).notNull(),
    vehicleRegistration: varchar('vehicle_registration', { length: 30 }),
    driverName: varchar('driver_name', { length: 150 }),
    driverPhone: varchar('driver_phone', { length: 30 }),
    capacity: integer('capacity'),
    feeAmount: numeric('fee_amount', { precision: 12, scale: 2 }), // informational; actual billing runs through the fees module separately
    status: routeStatusEnum('status').notNull().default('active'),
});
export const routeStops = pgTable('route_stops', {
    id: serial('id').primaryKey(),
    routeId: integer('route_id').notNull().references(() => busRoutes.id),
    stopName: varchar('stop_name', { length: 150 }).notNull(),
    stopOrder: integer('stop_order').notNull(),
    pickupTime: varchar('pickup_time', { length: 20 }), // e.g. "6:30 AM"
});
export const transportAllocationStatusEnum = pgEnum('transport_allocation_status', ['active', 'inactive']);
export const studentTransportAllocations = pgTable('student_transport_allocations', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    routeId: integer('route_id').notNull().references(() => busRoutes.id),
    stopId: integer('stop_id').references(() => routeStops.id),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    status: transportAllocationStatusEnum('status').notNull().default('active'),
});
