import { and, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { lessonPeriods, timetableEntries } from '../../db/schema/index.js'
import type { NewLessonPeriod, NewTimetableEntry } from './timetable.types.js'

export const timetableRepository = {
  findAllLessonPeriods: () => db.select().from(lessonPeriods).orderBy(lessonPeriods.sortOrder),
  createLessonPeriod: (data: NewLessonPeriod) => db.insert(lessonPeriods).values(data).returning().then((rows) => rows[0]),

  findByClass: (classId: number, periodId: number) =>
    db.select().from(timetableEntries).where(and(eq(timetableEntries.classId, classId), eq(timetableEntries.periodId, periodId))),

  findByTeacher: (teacherId: number, periodId: number) =>
    db.select().from(timetableEntries).where(and(eq(timetableEntries.teacherId, teacherId), eq(timetableEntries.periodId, periodId))),

  findClassSlotConflict: (classId: number, streamId: number | undefined, dayOfWeek: string, lessonPeriodId: number, periodId: number) =>
    db
      .select()
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.classId, classId),
          streamId !== undefined ? eq(timetableEntries.streamId, streamId) : undefined,
          eq(timetableEntries.dayOfWeek, dayOfWeek as never),
          eq(timetableEntries.lessonPeriodId, lessonPeriodId),
          eq(timetableEntries.periodId, periodId),
        ),
      )
      .then((rows) => rows[0]),

  findTeacherSlotConflict: (teacherId: number, dayOfWeek: string, lessonPeriodId: number, periodId: number) =>
    db
      .select()
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.teacherId, teacherId),
          eq(timetableEntries.dayOfWeek, dayOfWeek as never),
          eq(timetableEntries.lessonPeriodId, lessonPeriodId),
          eq(timetableEntries.periodId, periodId),
        ),
      )
      .then((rows) => rows[0]),

  create: (data: NewTimetableEntry) => db.insert(timetableEntries).values(data).returning().then((rows) => rows[0]),

  findById: (id: number) =>
    db.select().from(timetableEntries).where(eq(timetableEntries.id, id)).then((rows) => rows[0]),
  delete: (id: number) => db.delete(timetableEntries).where(eq(timetableEntries.id, id)).returning().then((rows) => rows[0]),
}
