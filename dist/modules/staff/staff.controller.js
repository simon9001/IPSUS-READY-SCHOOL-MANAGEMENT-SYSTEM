import { staffService } from './staff.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const staffController = {
    list: async (c) => ok(c, await staffService.list()),
    getById: async (c) => ok(c, await staffService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await staffService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await staffService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
};
