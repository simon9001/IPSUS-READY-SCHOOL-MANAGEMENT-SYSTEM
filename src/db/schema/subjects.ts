import { pgTable, serial, varchar, integer, boolean, unique } from 'drizzle-orm/pg-core'
import { classes, streams } from './students.js'
import { teachers } from './teachers.js'
import { fiscalPeriods } from './periods.js'

export const subjects = pgTable('subjects', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isCompulsory: boolean('is_compulsory').notNull().default(true),
})

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
