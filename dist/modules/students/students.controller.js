import { studentsService } from './students.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const studentsController = {
    listClasses: async (c) => ok(c, await studentsService.listClasses()),
    createClass: async (c) => created(c, await studentsService.createClass(getValidated(c, 'json'))),
    listStreams: async (c) => ok(c, await studentsService.listStreams(Number(c.req.param('classId')))),
    createStream: async (c) => created(c, await studentsService.createStream(getValidated(c, 'json'))),
    list: async (c) => ok(c, await studentsService.list()),
    listByClass: async (c) => ok(c, await studentsService.listByClass(Number(c.req.param('classId')))),
    getById: async (c) => ok(c, await studentsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await studentsService.create(getValidated(c, 'json'))),
    update: async (c) => ok(c, await studentsService.update(Number(c.req.param('id')), getValidated(c, 'json'))),
};
