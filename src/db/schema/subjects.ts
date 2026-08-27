import { pgTable, serial, varchar, integer, boolean, text, unique } from 'drizzle-orm/pg-core'
import { classes, streams } from './students.js'
import { teachers } from './teachers.js'
import { fiscalPeriods } from './periods.js'

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isCompulsory: boolean('is_compulsory').notNull().default(true),
})

// CBC breaks a learning area (subject) down into strands/sub-strands for
// competency-based assessment — e.g. Mathematics -> "Numbers", "Algebra".
// Optional: an 8-4-4/KCSE-style subject simply has no rows here and is
// assessed at the subject level only, via exam_results.
export const subjectStrands = pgTable('subject_strands', {
  id: serial('id').primaryKey(),
  subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
}, (t) => [unique().on(t.subjectId, t.name)])

// Which subjects a given class (Form 1..4) offers.
export const classSubjects = pgTable('class_subjects', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').notNull().references(() => classes.id),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
}, (t) => [unique().on(t.classId, t.subjectId)])

// Term-scoped: which teacher teaches which subject to which class/stream.
export const teacherAssignments = pgTable('teacher_assignments', {
  id: serial('id').primaryKey(),
  teacherId: integer('teacher_id').notNull().references(() => teachers.id),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  classId: integer('class_id').notNull().references(() => classes.id),
  streamId: integer('stream_id').references(() => streams.id),
  periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
})
