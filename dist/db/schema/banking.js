import { pgTable, serial, varchar, text, integer, numeric, date, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { accounts } from './accounts.js';
import { funds } from './funds.js';
import { fiscalPeriods } from './periods.js';
import { journalEntries } from './journal.js';
import { users } from './identity.js';
export const bankAccounts = pgTable('bank_accounts', {
    id: serial('id').primaryKey(),
    accountId: integer('account_id').notNull().references(() => accounts.id), // linked Cash/Bank GL account
    fundId: integer('fund_id').references(() => funds.id), // set if this account is dedicated to one fund (e.g. Capitation)
    bankName: varchar('bank_name', { length: 100 }).notNull(),
    accountNumber: varchar('account_number', { length: 40 }).notNull(),
    branch: varchar('branch', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
});
export const reconciliationStatusEnum = pgEnum('reconciliation_status', ['draft', 'reconciled']);
export const bankReconciliations = pgTable('bank_reconciliations', {
    id: serial('id').primaryKey(),
    bankAccountId: integer('bank_account_id').notNull().references(() => bankAccounts.id),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    statementDate: date('statement_date').notNull(),
    statementBalance: numeric('statement_balance', { precision: 14, scale: 2 }).notNull(),
    bookBalance: numeric('book_balance', { precision: 14, scale: 2 }).notNull(),
    status: reconciliationStatusEnum('status').notNull().default('draft'),
    reconciledBy: integer('reconciled_by').references(() => users.id),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
});
export const reconciliationItemTypeEnum = pgEnum('reconciliation_item_type', ['outstanding_cheque', 'deposit_in_transit', 'bank_charge', 'other']);
export const bankReconciliationItems = pgTable('bank_reconciliation_items', {
    id: serial('id').primaryKey(),
    reconciliationId: integer('reconciliation_id').notNull().references(() => bankReconciliations.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 200 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    itemType: reconciliationItemTypeEnum('item_type').notNull(),
});
export const imprestStatusEnum = pgEnum('imprest_status', ['requested', 'issued', 'retired', 'overdue']);
export const imprestRequests = pgTable('imprest_requests', {
    id: serial('id').primaryKey(),
    requestNo: varchar('request_no', { length: 30 }).notNull().unique(),
    requestedBy: integer('requested_by').notNull().references(() => users.id),
    purpose: text('purpose').notNull(),
    amountRequested: numeric('amount_requested', { precision: 14, scale: 2 }).notNull(),
    dateIssued: date('date_issued'),
    status: imprestStatusEnum('status').notNull().default('requested'),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Imprest Debtor / Cr Cash
});
export const imprestRetirements = pgTable('imprest_retirements', {
    id: serial('id').primaryKey(),
    imprestRequestId: integer('imprest_request_id').notNull().references(() => imprestRequests.id),
    retirementDate: date('retirement_date').notNull(),
    amountSpent: numeric('amount_spent', { precision: 14, scale: 2 }).notNull(),
    balanceReturned: numeric('balance_returned', { precision: 14, scale: 2 }).notNull().default('0'),
    receiptsAttached: boolean('receipts_attached').notNull().default(false),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Expenses (+ Cr Imprest Debtor)
});
