import { subjectsService } from './subjects.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const subjectsController = {
    list: async (c) => ok(c, await subjectsService.list()),
    getById: async (c) => ok(c, await subjectsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await subjectsService.create(getValidated(c, 'json'))),
    listOfferingsByClass: async (c) => ok(c, await subjectsService.listOfferingsByClass(Number(c.req.param('classId')))),
    offerToClass: async (c) => created(c, await subjectsService.offerToClass(getValidated(c, 'json'))),
    listAssignments: async (c) => ok(c, await subjectsService.listAssignments(Number(c.req.param('classId')), Number(c.req.query('periodId')))),
    assignTeacher: async (c) => created(c, await subjectsService.assignTeacher(getValidated(c, 'json'))),
};
