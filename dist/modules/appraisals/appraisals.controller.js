import { appraisalsService } from './appraisals.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const appraisalsController = {
    listByStaff: async (c) => ok(c, await appraisalsService.listByStaff(Number(c.req.param('staffId')))),
    getById: async (c) => ok(c, await appraisalsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await appraisalsService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await appraisalsService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
};
