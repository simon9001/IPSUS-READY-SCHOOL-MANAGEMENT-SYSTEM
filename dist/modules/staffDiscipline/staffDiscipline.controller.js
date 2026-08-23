import { staffDisciplineService } from './staffDiscipline.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const staffDisciplineController = {
    listByStaff: async (c) => ok(c, await staffDisciplineService.listByStaff(Number(c.req.param('staffId')))),
    getById: async (c) => ok(c, await staffDisciplineService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await staffDisciplineService.create(getValidated(c, 'json'))),
};
