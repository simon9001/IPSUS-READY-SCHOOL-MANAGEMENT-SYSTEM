import { pgTable, serial, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { fiscalPeriods } from './periods.js';
import { users } from './identity.js';
import { disciplineRecords } from './discipline.js';
export const conductPointRules = pgTable('conduct_point_rules', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 30 }).notNull().unique(),
    description: varchar('description', { length: 200 }).notNull(),
    points: integer('points').notNull(), // positive = merit, negative = demerit
});
// A running ledger, not a stored balance — the conduct score for a term is
// computed by summing this table, same pattern as leave balances and the
// trial balance.
export const conductPoints = pgTable('conduct_points', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    ruleId: integer('rule_id').references(() => conductPointRules.id),
    points: integer('points').notNull(),
    reason: text('reason'),
    disciplineRecordId: integer('discipline_record_id').references(() => disciplineRecords.id),
    awardedBy: integer('awarded_by').notNull().references(() => users.id),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
});
