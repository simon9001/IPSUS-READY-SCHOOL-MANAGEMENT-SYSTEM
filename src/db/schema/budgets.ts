import { pgTable, serial, varchar, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'
import { funds } from './funds.js'
import { fiscalPeriods } from './periods.js'
import { users } from './identity.js'

export const budgetStatusEnum = pgEnum('budget_status', ['draft', 'approved', 'revised'])

export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  fiscalYear: integer('fiscal_year').notNull(),
  name: varchar('name', { length: 150 }).notNull(), // e.g. "2026 Annual Budget"
  status: budgetStatusEnum('status').notNull().default('draft'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// One line per account+fund(+optional term). Actuals are computed live from
// posted journal_lines for the same scope — no separate "actuals" table needed.
export const budgetLines = pgTable('budget_lines', {
  id: serial('id').primaryKey(),
  budgetId: integer('budget_id').notNull().references(() => budgets.id, { onDelete: 'cascade' }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  fundId: integer('fund_id').notNull().references(() => funds.id),
  periodId: integer('period_id').references(() => fiscalPeriods.id), // null = whole fiscal year
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
})
