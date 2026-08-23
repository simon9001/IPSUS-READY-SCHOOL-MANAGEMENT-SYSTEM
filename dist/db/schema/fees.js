import { pgTable, serial, varchar, text, integer, numeric, date, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { funds } from './funds.js';
import { fiscalPeriods } from './periods.js';
import { students, classes, boardingStatusEnum } from './students.js';
import { journalEntries } from './journal.js';
import { users } from './identity.js';
export const feeStructureStatusEnum = pgEnum('fee_structure_status', ['draft', 'active']);
export const feeStructures = pgTable('fee_structures', {
    id: serial('id').primaryKey(),
    fiscalYear: integer('fiscal_year').notNull(),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    classId: integer('class_id').notNull().references(() => classes.id),
    boardingStatus: boardingStatusEnum('boarding_status').notNull(),
    status: feeStructureStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const feeStructureItems = pgTable('fee_structure_items', {
    id: serial('id').primaryKey(),
    feeStructureId: integer('fee_structure_id').notNull().references(() => feeStructures.id, { onDelete: 'cascade' }),
    accountId: integer('account_id').notNull().references(() => accounts.id), // revenue account, e.g. Tuition Fee Income
    fundId: integer('fund_id').notNull().references(() => funds.id),
    description: varchar('description', { length: 150 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
});
export const invoiceStatusEnum = pgEnum('invoice_status', ['open', 'partially_paid', 'paid', 'cancelled']);
export const feeInvoices = pgTable('fee_invoices', {
    id: serial('id').primaryKey(),
    invoiceNo: varchar('invoice_no', { length: 30 }).notNull().unique(),
    studentId: integer('student_id').notNull().references(() => students.id),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    feeStructureId: integer('fee_structure_id').references(() => feeStructures.id),
    invoiceDate: date('invoice_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
    status: invoiceStatusEnum('status').notNull().default('open'),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Fee Debtors / Cr Fee Income
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const feeInvoiceItems = pgTable('fee_invoice_items', {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id').notNull().references(() => feeInvoices.id, { onDelete: 'cascade' }),
    accountId: integer('account_id').notNull().references(() => accounts.id),
    fundId: integer('fund_id').notNull().references(() => funds.id),
    description: varchar('description', { length: 150 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
});
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank', 'mpesa', 'cheque']);
export const feePayments = pgTable('fee_payments', {
    id: serial('id').primaryKey(),
    receiptNo: varchar('receipt_no', { length: 30 }).notNull().unique(),
    studentId: integer('student_id').notNull().references(() => students.id),
    paymentDate: date('payment_date').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    referenceNo: varchar('reference_no', { length: 60 }), // e.g. M-Pesa code
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Cash/Bank / Cr Fee Debtors
    receivedBy: integer('received_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const feePaymentAllocations = pgTable('fee_payment_allocations', {
    id: serial('id').primaryKey(),
    paymentId: integer('payment_id').notNull().references(() => feePayments.id, { onDelete: 'cascade' }),
    invoiceItemId: integer('invoice_item_id').notNull().references(() => feeInvoiceItems.id),
    amountAllocated: numeric('amount_allocated', { precision: 14, scale: 2 }).notNull(),
});
