import { pgTable, serial, integer, date, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { classes, students } from './students.js';
import { users } from './identity.js';
export const promotionOutcomeEnum = pgEnum('promotion_outcome', ['promoted', 'repeated', 'transferred', 'graduated', 'withdrawn']);
export const promotions = pgTable('promotions', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    fromClassId: integer('from_class_id').notNull().references(() => classes.id),
    toClassId: integer('to_class_id').references(() => classes.id),
    academicYear: integer('academic_year').notNull(),
    outcome: promotionOutcomeEnum('outcome').notNull(),
    decisionDate: date('decision_date').notNull(),
    notes: text('notes'),
    recordedBy: integer('recorded_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
