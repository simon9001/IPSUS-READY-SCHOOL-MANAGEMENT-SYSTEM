import { pgTable, serial, varchar, text, integer, numeric, date, boolean, timestamp } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'
import { funds } from './funds.js'
import { fiscalPeriods } from './periods.js'
import { journalEntries } from './journal.js'
import { users } from './identity.js'

// e.g. FDSE Capitation, NG-CDF Bursary, Development Fund donation.
export const grantTypes = pgTable('grant_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  fundId: integer('fund_id').notNull().references(() => funds.id),
  revenueAccountId: integer('revenue_account_id').notNull().references(() => accounts.id),
  conditionsDescription: text('conditions_description'),
})

// Non-exchange revenue is recognized when conditions are met (IPSAS 23/47),
// not simply on cash receipt — conditionsMet gates recognition vs. deferral.
export const grantDisbursements = pgTable('grant_disbursements', {
  id: serial('id').primaryKey(),
  grantTypeId: integer('grant_type_id').notNull().references(() => grantTypes.id),
  periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
  expectedAmount: numeric('expected_amount', { precision: 14, scale: 2 }),
  amountReceived: numeric('amount_received', { precision: 14, scale: 2 }).notNull(),
  dateReceived: date('date_received').notNull(),
  conditionsMet: boolean('conditions_met').notNull().default(false),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id),
  notes: text('notes'),
  recordedBy: integer('recorded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
