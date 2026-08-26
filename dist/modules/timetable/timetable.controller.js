import { timetableService } from './timetable.service.js';
import { ok, created, noContent } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const timetableController = {
    listLessonPeriods: async (c) => ok(c, await timetableService.listLessonPeriods()),
    createLessonPeriod: async (c) => created(c, await timetableService.createLessonPeriod(getValidated(c, 'json'))),
    getClassTimetable: async (c) => ok(c, await timetableService.getClassTimetable(Number(c.req.param('classId')), Number(c.req.query('periodId')))),
    getTeacherTimetable: async (c) => ok(c, await timetableService.getTeacherTimetable(Number(c.req.param('teacherId')), Number(c.req.query('periodId')))),
    teacherWorkload: async (c) => ok(c, await timetableService.teacherWorkload(Number(c.req.param('teacherId')), Number(c.req.query('periodId')))),
    createEntry: async (c) => created(c, await timetableService.createEntry(getValidated(c, 'json'))),
    deleteEntry: async (c) => {
        await timetableService.deleteEntry(Number(c.req.param('id')));
        return noContent(c);
    },
};
