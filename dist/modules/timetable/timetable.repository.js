import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { lessonPeriods, timetableEntries } from '../../db/schema/index.js';
export const timetableRepository = {
    findAllLessonPeriods: () => db.select().from(lessonPeriods).orderBy(lessonPeriods.sortOrder),
    createLessonPeriod: (data) => db.insert(lessonPeriods).values(data).returning().then((rows) => rows[0]),
    findByClass: (classId, periodId) => db.select().from(timetableEntries).where(and(eq(timetableEntries.classId, classId), eq(timetableEntries.periodId, periodId))),
    findByTeacher: (teacherId, periodId) => db.select().from(timetableEntries).where(and(eq(timetableEntries.teacherId, teacherId), eq(timetableEntries.periodId, periodId))),
    findClassSlotConflict: (classId, streamId, dayOfWeek, lessonPeriodId, periodId) => db
        .select()
        .from(timetableEntries)
        .where(and(eq(timetableEntries.classId, classId), streamId !== undefined ? eq(timetableEntries.streamId, streamId) : undefined, eq(timetableEntries.dayOfWeek, dayOfWeek), eq(timetableEntries.lessonPeriodId, lessonPeriodId), eq(timetableEntries.periodId, periodId)))
        .then((rows) => rows[0]),
    findTeacherSlotConflict: (teacherId, dayOfWeek, lessonPeriodId, periodId) => db
        .select()
        .from(timetableEntries)
        .where(and(eq(timetableEntries.teacherId, teacherId), eq(timetableEntries.dayOfWeek, dayOfWeek), eq(timetableEntries.lessonPeriodId, lessonPeriodId), eq(timetableEntries.periodId, periodId)))
        .then((rows) => rows[0]),
    create: (data) => db.insert(timetableEntries).values(data).returning().then((rows) => rows[0]),
    findById: (id) => db.select().from(timetableEntries).where(eq(timetableEntries.id, id)).then((rows) => rows[0]),
    delete: (id) => db.delete(timetableEntries).where(eq(timetableEntries.id, id)).returning().then((rows) => rows[0]),
};
