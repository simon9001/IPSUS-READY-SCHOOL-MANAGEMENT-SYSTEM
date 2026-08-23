import { periodsService } from './periods.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const periodsController = {
    list: async (c) => ok(c, await periodsService.list()),
    getById: async (c) => ok(c, await periodsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await periodsService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await periodsService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
    close: async (c) => ok(c, await periodsService.close(Number(c.req.param('id')))),
};
