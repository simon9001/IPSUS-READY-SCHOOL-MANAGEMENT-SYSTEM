import { boardingService } from './boarding.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const boardingController = {
    listDormitories: async (c) => ok(c, await boardingService.listDormitories()),
    getDormitoryById: async (c) => ok(c, await boardingService.getDormitoryById(Number(c.req.param('id')))),
    createDormitory: async (c) => created(c, await boardingService.createDormitory(getValidated(c, 'json'))),
    listAllocationsByDormitory: async (c) => ok(c, await boardingService.listAllocationsByDormitory(Number(c.req.param('dormitoryId')))),
    allocateBed: async (c) => created(c, await boardingService.allocateBed(getValidated(c, 'json'))),
    vacateBed: async (c) => {
        const { vacatedDate } = getValidated(c, 'json');
        return ok(c, await boardingService.vacateBed(Number(c.req.param('id')), vacatedDate));
    },
    listAttendanceByStudent: async (c) => ok(c, await boardingService.listAttendanceByStudent(Number(c.req.param('studentId')))),
    markAttendance: async (c) => created(c, await boardingService.markAttendance(getValidated(c, 'json'))),
    markAttendanceBulk: async (c) => {
        const { records } = getValidated(c, 'json');
        return created(c, await boardingService.markAttendanceBulk(records));
    },
};
