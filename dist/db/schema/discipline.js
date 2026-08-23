import { pgTable, serial, integer, date, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { users } from './identity.js';
export const disciplineSeverityEnum = pgEnum('discipline_severity', ['minor', 'moderate', 'major']);
export const disciplineRecords = pgTable('discipline_records', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    incidentDate: date('incident_date').notNull(),
    description: text('description').notNull(),
    actionTaken: text('action_taken'),
    severity: disciplineSeverityEnum('severity').notNull().default('minor'),
    recordedBy: integer('recorded_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
