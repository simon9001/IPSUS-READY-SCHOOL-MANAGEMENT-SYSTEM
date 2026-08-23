import { disciplineService } from './discipline.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const disciplineController = {
    listByStudent: async (c) => ok(c, await disciplineService.listByStudent(Number(c.req.param('studentId')))),
    getById: async (c) => ok(c, await disciplineService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await disciplineService.create(getValidated(c, 'json'))),
};
