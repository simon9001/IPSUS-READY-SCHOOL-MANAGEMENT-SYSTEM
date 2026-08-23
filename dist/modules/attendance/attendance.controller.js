import { attendanceService } from './attendance.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const attendanceController = {
    listByStudent: async (c) => ok(c, await attendanceService.listByStudent(Number(c.req.param('studentId')))),
    listByClassAndDate: async (c) => ok(c, await attendanceService.listByClassAndDate(Number(c.req.param('classId')), c.req.query('date'))),
    mark: async (c) => created(c, await attendanceService.mark(getValidated(c, 'json'))),
    markBulk: async (c) => {
        const { records } = getValidated(c, 'json');
        return created(c, await attendanceService.markBulk(records));
    },
};
