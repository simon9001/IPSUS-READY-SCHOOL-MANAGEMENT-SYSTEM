import { teachersService } from './teachers.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const teachersController = {
    list: async (c) => ok(c, await teachersService.list()),
    getById: async (c) => ok(c, await teachersService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await teachersService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await teachersService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
};
