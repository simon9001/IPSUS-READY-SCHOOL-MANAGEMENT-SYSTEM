import { pgTable, serial, varchar, integer, numeric, date, text, boolean, pgEnum, timestamp, unique } from 'drizzle-orm/pg-core';
import { classes } from './students.js';
import { fiscalPeriods } from './periods.js';
import { subjects } from './subjects.js';
import { students } from './students.js';
import { users } from './identity.js';
export const gradingScales = pgTable('grading_scales', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
});
// e.g. 80-100 -> "A" (12 points) for an 8-4-4/KCSE-style scale, or
// 0-25 -> "Below Expectation" for a CBC rubric — same table serves both.
export const gradingBands = pgTable('grading_bands', {
    id: serial('id').primaryKey(),
    gradingScaleId: integer('grading_scale_id').notNull().references(() => gradingScales.id, { onDelete: 'cascade' }),
    minMarks: numeric('min_marks', { precision: 5, scale: 2 }).notNull(),
    maxMarks: numeric('max_marks', { precision: 5, scale: 2 }).notNull(),
    grade: varchar('grade', { length: 30 }).notNull(),
    points: numeric('points', { precision: 4, scale: 2 }),
});
export const examStatusEnum = pgEnum('exam_status', ['scheduled', 'marks_entry', 'completed', 'published']);
export const exams = pgTable('exams', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    classId: integer('class_id').notNull().references(() => classes.id),
    gradingScaleId: integer('grading_scale_id').notNull().references(() => gradingScales.id),
    examDate: date('exam_date').notNull(),
    status: examStatusEnum('status').notNull().default('scheduled'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// A single `exams` row (e.g. "Term 1 Mid-Term") sits across several days,
// one subject examined per sitting — this is the exam timetable itself.
export const examTimetableEntries = pgTable('exam_timetable_entries', {
    id: serial('id').primaryKey(),
    examId: integer('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
    subjectId: integer('subject_id').notNull().references(() => subjects.id),
    examDate: date('exam_date').notNull(),
    startTime: varchar('start_time', { length: 10 }).notNull(),
    endTime: varchar('end_time', { length: 10 }).notNull(),
    venue: varchar('venue', { length: 100 }),
}, (t) => [unique().on(t.examId, t.subjectId)]);
export const examResults = pgTable('exam_results', {
    id: serial('id').primaryKey(),
    examId: integer('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
    studentId: integer('student_id').notNull().references(() => students.id),
    subjectId: integer('subject_id').notNull().references(() => subjects.id),
    marks: numeric('marks', { precision: 5, scale: 2 }).notNull(),
    maxMarks: numeric('max_marks', { precision: 5, scale: 2 }).notNull().default('100'),
    grade: varchar('grade', { length: 30 }),
    points: numeric('points', { precision: 4, scale: 2 }),
    remarks: text('remarks'),
    enteredBy: integer('entered_by').notNull().references(() => users.id),
    enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.examId, t.studentId, t.subjectId)]);
