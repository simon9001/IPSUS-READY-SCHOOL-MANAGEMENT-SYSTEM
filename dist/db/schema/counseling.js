import { pgTable, serial, integer, varchar, date, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { users } from './identity.js';
// Deliberately separate from disciplineRecords/disciplinaryCases — this is
// supportive/confidential, not punitive, and is access-gated far more
// tightly (see the RBAC 'counseling.access' permission, not *.view).
export const counselingSessions = pgTable('counseling_sessions', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    counselorId: integer('counselor_id').notNull().references(() => users.id),
    sessionDate: date('session_date').notNull(),
    category: varchar('category', { length: 40 }), // 'academic' | 'behavioral' | 'family' | 'emotional' | 'career' | 'other'
    notes: text('notes'),
    followUpRequired: boolean('follow_up_required').notNull().default(false),
    followUpDate: date('follow_up_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
