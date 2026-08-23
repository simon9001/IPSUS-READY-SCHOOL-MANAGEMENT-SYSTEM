import { pgTable, serial, varchar, text, integer, numeric, date, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'
import { funds } from './funds.js'
import { fiscalPeriods } from './periods.js'
import { users } from './identity.js'

// Manual entries go draft -> pending_approval -> posted (maker-checker).
// System-generated entries (fees, payroll, procurement) go straight to posted
// because their originating sub-process already carries its own approval step.
export const journalStatusEnum = pgEnum('journal_status', ['draft', 'pending_approval', 'posted', 'rejected', 'reversed'])

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  entryNo: varchar('entry_no', { length: 30 }).notNull().unique(), // e.g. JE-2026-000123
  periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
  entryDate: date('entry_date').notNull(),
  description: text('description').notNull(),
  sourceModule: varchar('source_module', { length: 40 }).notNull(), // 'manual' | 'fees' | 'payroll' | 'procurement' | 'capitation' | 'assets' | 'inventory' | 'banking'
  sourceReference: varchar('source_reference', { length: 60 }), // id/reference in the originating module
  status: journalStatusEnum('status').notNull().default('draft'),
  reversalOfId: integer('reversal_of_id'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  postedBy: integer('posted_by').references(() => users.id),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const journalLines = pgTable('journal_lines', {
  id: serial('id').primaryKey(),
  journalEntryId: integer('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  lineNo: integer('line_no').notNull(),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  fundId: integer('fund_id').notNull().references(() => funds.id),
  debit: numeric('debit', { precision: 14, scale: 2 }).notNull().default('0'),
  credit: numeric('credit', { precision: 14, scale: 2 }).notNull().default('0'),
  description: text('description'),
})
