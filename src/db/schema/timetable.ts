import { pgTable, serial, varchar, integer, pgEnum, unique } from 'drizzle-orm/pg-core'
import { classes, streams } from './students.js'
import { subjects } from './subjects.js'
import { teachers } from './teachers.js'
import { fiscalPeriods } from './periods.js'

// Fixed daily period times (e.g. "Period 1" = 8:00-8:40 every day) —
// separate from the day+period combination, which is what an actual
// timetable entry pins down.
export const lessonPeriods = pgTable('lesson_periods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 40 }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // "08:00"
  endTime: varchar('end_time', { length: 10 }).notNull(),
  sortOrder: integer('sort_order').notNull(),
})

export const dayOfWeekEnum = pgEnum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])

// Term-scoped (periodId = fiscal period/term) since class timetables change
// each term as teacher assignments and subject offerings change.
export const timetableEntries = pgTable('timetable_entries', {
  id: serial('id').primaryKey(),
  classId: integer('class_id').notNull().references(() => classes.id),
  streamId: integer('stream_id').references(() => streams.id),
  subjectId: integer('subject_id').notNull().references(() => subjects.id),
  teacherId: integer('teacher_id').notNull().references(() => teachers.id),
  lessonPeriodId: integer('lesson_period_id').notNull().references(() => lessonPeriods.id),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
})
