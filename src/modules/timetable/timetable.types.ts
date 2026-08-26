import type { lessonPeriods, timetableEntries } from '../../db/schema/index.js'

export type LessonPeriod = typeof lessonPeriods.$inferSelect
export type NewLessonPeriod = typeof lessonPeriods.$inferInsert
export type TimetableEntry = typeof timetableEntries.$inferSelect
export type NewTimetableEntry = typeof timetableEntries.$inferInsert

export interface TeacherWorkload {
  teacherId: number
  periodId: number
  totalPeriodsPerWeek: number
  bySubject: { subjectId: number; periodsPerWeek: number }[]
}
