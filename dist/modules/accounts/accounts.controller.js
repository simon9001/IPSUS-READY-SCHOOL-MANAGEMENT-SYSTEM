import { accountsService } from './accounts.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const accountsController = {
    list: async (c) => ok(c, await accountsService.list()),
    getById: async (c) => ok(c, await accountsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await accountsService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await accountsService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
    deactivate: async (c) => ok(c, await accountsService.deactivate(Number(c.req.param('id')))),
};
