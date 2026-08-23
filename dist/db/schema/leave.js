import { pgTable, serial, varchar, integer, date, numeric, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { staff } from './staff.js';
import { users } from './identity.js';
export const leaveTypes = pgTable('leave_types', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    defaultDaysPerYear: integer('default_days_per_year').notNull(),
});
export const leaveRequestStatusEnum = pgEnum('leave_request_status', ['pending', 'approved', 'rejected']);
export const leaveRequests = pgTable('leave_requests', {
    id: serial('id').primaryKey(),
    staffId: integer('staff_id').notNull().references(() => staff.id),
    leaveTypeId: integer('leave_type_id').notNull().references(() => leaveTypes.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    daysRequested: numeric('days_requested', { precision: 5, scale: 1 }).notNull(),
    reason: text('reason'),
    status: leaveRequestStatusEnum('status').notNull().default('pending'),
    approvedBy: integer('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    recordedBy: integer('recorded_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
