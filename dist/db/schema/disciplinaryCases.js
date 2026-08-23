import { pgTable, serial, integer, date, text, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { disciplineRecords } from './discipline.js';
import { users } from './identity.js';
export const disciplinaryCaseTypeEnum = pgEnum('disciplinary_case_type', ['suspension', 'expulsion']);
// Mirrors how the admissions module tracks its own multi-step process.
// bom_reviewed is a real step (not just a status label) for expulsion cases
// — the Basic Education Act requires Board of Management sign-off before a
// student can be expelled.
export const disciplinaryCaseStatusEnum = pgEnum('disciplinary_case_status', [
    'opened', 'parent_summoned', 'hearing_held', 'bom_reviewed', 'decided', 'closed',
]);
export const disciplinaryDecisionEnum = pgEnum('disciplinary_decision', ['suspended', 'expelled', 'reinstated', 'dismissed']);
export const disciplinaryCases = pgTable('disciplinary_cases', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    disciplineRecordId: integer('discipline_record_id').references(() => disciplineRecords.id),
    caseType: disciplinaryCaseTypeEnum('case_type').notNull(),
    status: disciplinaryCaseStatusEnum('status').notNull().default('opened'),
    parentSummonsDate: date('parent_summons_date'),
    parentAttended: boolean('parent_attended'),
    hearingDate: date('hearing_date'),
    hearingPanel: text('hearing_panel'),
    hearingNotes: text('hearing_notes'),
    bomReviewDate: date('bom_review_date'),
    bomDecisionNotes: text('bom_decision_notes'),
    decision: disciplinaryDecisionEnum('decision'),
    suspensionStartDate: date('suspension_start_date'),
    suspensionEndDate: date('suspension_end_date'),
    reAdmissionDate: date('re_admission_date'),
    openedBy: integer('opened_by').notNull().references(() => users.id),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    decidedBy: integer('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
});
