import { pgTable, serial, varchar, integer, date, pgEnum, timestamp } from 'drizzle-orm/pg-core'

export const periodStatusEnum = pgEnum('period_status', ['open', 'closed'])

export const fiscalPeriods = pgTable('fiscal_periods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 60 }).notNull(), // e.g. "2026 Term 1"
  fiscalYear: integer('fiscal_year').notNull(),
  term: integer('term'), // 1, 2, 3 — null for a full-year period
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: periodStatusEnum('status').notNull().default('open'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
