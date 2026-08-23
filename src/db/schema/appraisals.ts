import { pgTable, serial, integer, date, text, numeric, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { staff } from './staff.js'
import { fiscalPeriods } from './periods.js'
import { users } from './identity.js'

export const appraisalStatusEnum = pgEnum('appraisal_status', ['draft', 'completed'])

export const staffAppraisals = pgTable('staff_appraisals', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull().references(() => staff.id),
  periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
  appraiserId: integer('appraiser_id').notNull().references(() => users.id),
  overallRating: numeric('overall_rating', { precision: 3, scale: 1 }), // e.g. 1.0-5.0
  strengths: text('strengths'),
  areasForImprovement: text('areas_for_improvement'),
  goals: text('goals'),
  appraisalDate: date('appraisal_date').notNull(),
  status: appraisalStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
