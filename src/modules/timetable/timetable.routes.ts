import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { timetableController } from './timetable.controller.js'
import { createLessonPeriodSchema, createTimetableEntrySchema } from './timetable.schema.js'

export const timetableRoutes = new Hono()

timetableRoutes.get('/lesson-periods', timetableController.listLessonPeriods)
timetableRoutes.post('/lesson-periods', zValidator('json', createLessonPeriodSchema), timetableController.createLessonPeriod)

timetableRoutes.get('/classes/:classId', timetableController.getClassTimetable)
timetableRoutes.get('/teachers/:teacherId', timetableController.getTeacherTimetable)
timetableRoutes.get('/teachers/:teacherId/workload', timetableController.teacherWorkload)

timetableRoutes.post('/entries', zValidator('json', createTimetableEntrySchema), timetableController.createEntry)
timetableRoutes.delete('/entries/:id', timetableController.deleteEntry)
