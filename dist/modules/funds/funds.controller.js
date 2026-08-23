import { fundsService } from './funds.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const fundsController = {
    list: async (c) => ok(c, await fundsService.list()),
    getById: async (c) => ok(c, await fundsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await fundsService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await fundsService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
    deactivate: async (c) => ok(c, await fundsService.deactivate(Number(c.req.param('id')))),
};
