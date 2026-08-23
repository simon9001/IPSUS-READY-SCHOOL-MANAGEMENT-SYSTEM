import { pgTable, serial, integer, date, text, varchar, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { staff } from './staff.js';
export const contractTypeEnum = pgEnum('contract_type', ['permanent', 'fixed_term', 'probation']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'expired', 'terminated']);
export const staffContracts = pgTable('staff_contracts', {
    id: serial('id').primaryKey(),
    staffId: integer('staff_id').notNull().references(() => staff.id),
    contractType: contractTypeEnum('contract_type').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    terms: text('terms'),
    documentRef: varchar('document_ref', { length: 150 }),
    status: contractStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
