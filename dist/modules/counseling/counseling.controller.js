import { counselingService } from './counseling.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const counselingController = {
    listByStudent: async (c) => ok(c, await counselingService.listByStudent(Number(c.req.param('studentId')))),
    getById: async (c) => ok(c, await counselingService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await counselingService.create(getValidated(c, 'json'))),
};
