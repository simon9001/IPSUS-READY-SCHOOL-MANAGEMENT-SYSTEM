import { pgTable, serial, integer, date, text, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { staff } from './staff.js'
import { users } from './identity.js'

export const staffDisciplineSeverityEnum = pgEnum('staff_discipline_severity', ['verbal_warning', 'written_warning', 'suspension', 'termination'])

export const staffDisciplinaryRecords = pgTable('staff_disciplinary_records', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull().references(() => staff.id),
  incidentDate: date('incident_date').notNull(),
  description: text('description').notNull(),
  actionTaken: text('action_taken'),
  severity: staffDisciplineSeverityEnum('severity').notNull(),
  recordedBy: integer('recorded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
