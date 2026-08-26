import type { Context } from 'hono'
import { timetableService } from './timetable.service.js'
import { ok, created, noContent } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateLessonPeriodInput, CreateTimetableEntryInput } from './timetable.schema.js'

export const timetableController = {
  listLessonPeriods: async (c: Context) => ok(c, await timetableService.listLessonPeriods()),
  createLessonPeriod: async (c: Context) =>
    created(c, await timetableService.createLessonPeriod(getValidated<CreateLessonPeriodInput>(c, 'json'))),

  getClassTimetable: async (c: Context) =>
    ok(c, await timetableService.getClassTimetable(Number(c.req.param('classId')), Number(c.req.query('periodId')))),
  getTeacherTimetable: async (c: Context) =>
    ok(c, await timetableService.getTeacherTimetable(Number(c.req.param('teacherId')), Number(c.req.query('periodId')))),
  teacherWorkload: async (c: Context) =>
    ok(c, await timetableService.teacherWorkload(Number(c.req.param('teacherId')), Number(c.req.query('periodId')))),

  createEntry: async (c: Context) =>
    created(c, await timetableService.createEntry(getValidated<CreateTimetableEntryInput>(c, 'json'))),
  deleteEntry: async (c: Context) => {
    await timetableService.deleteEntry(Number(c.req.param('id')))
    return noContent(c)
  },
}
