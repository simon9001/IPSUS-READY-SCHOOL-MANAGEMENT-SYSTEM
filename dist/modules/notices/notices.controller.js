import { noticesService } from './notices.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const noticesController = {
    list: async (c) => ok(c, await noticesService.list()),
    getById: async (c) => ok(c, await noticesService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await noticesService.create(getValidated(c, 'json'))),
};
